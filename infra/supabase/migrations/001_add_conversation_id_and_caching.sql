-- Migration: Add conversation_id column and optimize caching
-- Date: 2025-10-01
-- Purpose: Enable analysis result caching to avoid redundant GPT API calls

-- ============================================================================
-- ADD CONVERSATION_ID TO SESSIONS
-- ============================================================================

-- Add conversation_id column to salesai_sessions if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'salesai_sessions'
    AND column_name = 'conversation_id'
  ) THEN
    ALTER TABLE salesai_sessions
    ADD COLUMN conversation_id VARCHAR(255) UNIQUE;

    -- Add index for fast lookups
    CREATE INDEX IF NOT EXISTS idx_salesai_sessions_conversation
    ON salesai_sessions (conversation_id);

    RAISE NOTICE 'Added conversation_id column to salesai_sessions';
  ELSE
    RAISE NOTICE 'conversation_id column already exists in salesai_sessions';
  END IF;
END $$;

-- ============================================================================
-- OPTIMIZE ANALYSIS RESULTS TABLE
-- ============================================================================

-- Add unique constraint on session_id if it doesn't exist
-- This ensures one analysis result per session for better caching
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'salesai_analysis_results_session_id_key'
    AND table_name = 'salesai_analysis_results'
  ) THEN
    -- First, remove any duplicate analysis results (keep the most recent)
    DELETE FROM salesai_analysis_results
    WHERE id NOT IN (
      SELECT DISTINCT ON (session_id) id
      FROM salesai_analysis_results
      ORDER BY session_id, created_at DESC
    );

    -- Add unique constraint
    ALTER TABLE salesai_analysis_results
    ADD CONSTRAINT salesai_analysis_results_session_id_key UNIQUE (session_id);

    RAISE NOTICE 'Added unique constraint to salesai_analysis_results.session_id';
  ELSE
    RAISE NOTICE 'Unique constraint already exists on salesai_analysis_results.session_id';
  END IF;
END $$;

-- ============================================================================
-- VERIFY MIGRATION
-- ============================================================================

-- Show migration results
SELECT 'Migration completed successfully!' as status;

-- Verify conversation_id column exists
SELECT
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'salesai_sessions'
AND column_name = 'conversation_id';

-- Verify unique constraint exists
SELECT
  constraint_name,
  table_name
FROM information_schema.table_constraints
WHERE table_name IN ('salesai_sessions', 'salesai_analysis_results')
AND constraint_type = 'UNIQUE';
