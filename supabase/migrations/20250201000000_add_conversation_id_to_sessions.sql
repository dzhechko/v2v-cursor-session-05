-- Add conversation_id field to salesai_sessions to store ElevenLabs conversation ID
ALTER TABLE salesai_sessions
ADD COLUMN IF NOT EXISTS conversation_id VARCHAR(255);

-- Create index for faster lookups by conversation_id
CREATE INDEX IF NOT EXISTS idx_sessions_conversation_id
ON salesai_sessions(conversation_id);

-- Add comment to explain field purpose
COMMENT ON COLUMN salesai_sessions.conversation_id IS 'ElevenLabs conversation ID for fetching audio and transcript data';
