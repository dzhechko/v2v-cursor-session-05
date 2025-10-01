# Database Migrations

This directory contains database migration scripts for the Sales AI Trainer application.

## Migration Files

### 001_add_conversation_id_and_caching.sql

**Date:** 2025-10-01

**Purpose:** Enable conversation analysis caching to prevent redundant GPT API calls

**Changes:**
1. Adds `conversation_id` column to `salesai_sessions` table
2. Adds unique constraint to `salesai_analysis_results.session_id`
3. Creates index on `conversation_id` for fast lookups
4. Removes duplicate analysis results (keeps most recent per session)

**Why This Matters:**
- **Cost Savings:** Prevents redundant OpenAI API calls by caching analysis results
- **Performance:** Instant analysis retrieval for previously analyzed conversations
- **User Experience:** No waiting time when viewing cached conversation analysis

## How to Apply Migrations

### For New Databases
1. Run `infra/supabase/setup.sql` first (includes all migrations)
2. Run `infra/supabase/policies.sql` to set up RLS policies

### For Existing Databases
1. Apply migration files in order: `001_*.sql`, `002_*.sql`, etc.
2. Execute in Supabase Dashboard SQL Editor

### Example
```sql
-- In Supabase SQL Editor, run:
\i infra/supabase/migrations/001_add_conversation_id_and_caching.sql
```

## Testing Migrations

After applying migration 001:

1. **Verify Schema:**
   ```sql
   SELECT column_name, data_type, is_nullable
   FROM information_schema.columns
   WHERE table_name = 'salesai_sessions' AND column_name = 'conversation_id';
   ```

2. **Verify Constraints:**
   ```sql
   SELECT constraint_name, table_name
   FROM information_schema.table_constraints
   WHERE table_name IN ('salesai_sessions', 'salesai_analysis_results')
   AND constraint_type = 'UNIQUE';
   ```

3. **Test Caching:**
   - Analyze a conversation (should call OpenAI API)
   - View same conversation again (should return cached result instantly)
   - Check logs for "Found cached analysis in database" message

## Rollback

If you need to rollback migration 001:

```sql
-- Remove unique constraint
ALTER TABLE salesai_analysis_results DROP CONSTRAINT IF EXISTS salesai_analysis_results_session_id_key;

-- Remove conversation_id column
ALTER TABLE salesai_sessions DROP COLUMN IF EXISTS conversation_id;

-- Remove index
DROP INDEX IF EXISTS idx_salesai_sessions_conversation;
```

## Migration Best Practices

1. **Backup First:** Always backup your database before applying migrations
2. **Test in Staging:** Test migrations in a staging environment first
3. **Read Migration:** Review the SQL before executing
4. **Monitor Logs:** Check application logs after migration
5. **Verify Data:** Ensure data integrity after migration
