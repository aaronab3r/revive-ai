-- =====================================================
-- SUPABASE MULTI-TENANT MIGRATION
-- Run this in your Supabase SQL Editor
-- =====================================================

-- =====================================================
-- STEP 1: Add user_id column to settings table
-- =====================================================

-- Drop the old primary key (boolean id)
ALTER TABLE settings DROP CONSTRAINT IF EXISTS settings_pkey;

-- Drop the old id column
ALTER TABLE settings DROP COLUMN IF EXISTS id;

-- Add user_id column as the new primary key
ALTER TABLE settings ADD COLUMN IF NOT EXISTS user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE;

-- =====================================================
-- STEP 2: Add user_id column to leads table
-- =====================================================

-- Add user_id column
ALTER TABLE leads ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Create a unique constraint on phone + user_id (so each user can have leads with the same phone)
-- First drop the old unique constraint on phone if it exists
ALTER TABLE leads DROP CONSTRAINT IF EXISTS leads_phone_key;

-- Create new composite unique constraint
ALTER TABLE leads ADD CONSTRAINT leads_phone_user_unique UNIQUE (phone, user_id);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS leads_user_id_idx ON leads(user_id);

-- =====================================================
-- STEP 3: Enable Row Level Security (RLS)
-- =====================================================

-- Enable RLS on settings
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Enable RLS on leads
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- STEP 4: Create RLS Policies for settings
-- =====================================================

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can view own settings" ON settings;
DROP POLICY IF EXISTS "Users can insert own settings" ON settings;
DROP POLICY IF EXISTS "Users can update own settings" ON settings;
DROP POLICY IF EXISTS "Users can delete own settings" ON settings;

-- Users can only view their own settings
CREATE POLICY "Users can view own settings" ON settings
  FOR SELECT USING (auth.uid() = user_id);

-- Users can only insert their own settings
CREATE POLICY "Users can insert own settings" ON settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can only update their own settings
CREATE POLICY "Users can update own settings" ON settings
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can only delete their own settings
CREATE POLICY "Users can delete own settings" ON settings
  FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- STEP 5: Create RLS Policies for leads
-- =====================================================

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can view own leads" ON leads;
DROP POLICY IF EXISTS "Users can insert own leads" ON leads;
DROP POLICY IF EXISTS "Users can update own leads" ON leads;
DROP POLICY IF EXISTS "Users can delete own leads" ON leads;

-- Users can only view their own leads
CREATE POLICY "Users can view own leads" ON leads
  FOR SELECT USING (auth.uid() = user_id);

-- Users can only insert their own leads
CREATE POLICY "Users can insert own leads" ON leads
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can only update their own leads
CREATE POLICY "Users can update own leads" ON leads
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can only delete their own leads
CREATE POLICY "Users can delete own leads" ON leads
  FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- STEP 6: Allow service role to bypass RLS
-- (Needed for webhooks and server-side operations)
-- =====================================================
-- The service_role key automatically bypasses RLS, so no additional policy needed.

-- =====================================================
-- DONE!
-- =====================================================
-- After running this:
-- 1. Go to Authentication > Providers in Supabase dashboard
-- 2. Enable "Email" provider (should be on by default)
-- 3. Enable "Google" provider:
--    - Create OAuth credentials at https://console.cloud.google.com/
--    - Add your Supabase callback URL: https://YOUR-PROJECT.supabase.co/auth/v1/callback
--    - Add the Client ID and Client Secret to Supabase
-- 4. Under Authentication > URL Configuration:
--    - Set Site URL to your production URL (https://revive-ai-three.vercel.app)
--    - Add redirect URLs:
--      - https://revive-ai-three.vercel.app/auth/callback
--      - http://localhost:3000/auth/callback (for local dev)
