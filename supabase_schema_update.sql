-- Add new columns for Vapi Public Key and Calendar Email (if they match the new schema requirements)
-- Note: 'calendar_email' already exists based on previous code, but we will ensure it's there.
-- We are adding 'vapi_public_key'.

ALTER TABLE settings 
ADD COLUMN IF NOT EXISTS vapi_public_key TEXT;

-- Verify columns exist
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'settings';
