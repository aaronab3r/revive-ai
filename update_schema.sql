-- Add business settings columns
ALTER TABLE settings 
ADD COLUMN IF NOT EXISTS business_hours_start TEXT DEFAULT '09:00',
ADD COLUMN IF NOT EXISTS business_hours_end TEXT DEFAULT '17:00',
ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'America/New_York',
ADD COLUMN IF NOT EXISTS avg_appointment_value INTEGER DEFAULT 150,
ADD COLUMN IF NOT EXISTS cancellation_policy TEXT DEFAULT 'Please provide 24 hours notice for cancellations.',
ADD COLUMN IF NOT EXISTS custom_knowledge TEXT DEFAULT '';
