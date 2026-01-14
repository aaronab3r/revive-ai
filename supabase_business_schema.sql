ALTER TABLE settings 
ADD COLUMN IF NOT EXISTS business_name TEXT DEFAULT 'My Business';

ALTER TABLE settings 
ADD COLUMN IF NOT EXISTS business_industry TEXT DEFAULT 'General';

ALTER TABLE settings 
ADD COLUMN IF NOT EXISTS agent_name TEXT DEFAULT 'Sarah';

ALTER TABLE settings 
ADD COLUMN IF NOT EXISTS agent_role TEXT DEFAULT 'Assistant';

-- Verify the columns were added
SELECT column_name, data_type, column_default
FROM information_schema.columns 
WHERE table_name = 'settings'
ORDER BY ordinal_position;