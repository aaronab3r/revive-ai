-- =====================================================
-- REVIVE AI - COMPLETE DATABASE SETUP
-- =====================================================
-- Run this ONCE in your Supabase SQL Editor to set up
-- all required tables for a fresh installation.
-- =====================================================

-- =====================================================
-- TABLE 1: SETTINGS (User configuration)
-- =====================================================
-- Stores per-user settings including Vapi keys, business
-- details, and calendar configuration.

CREATE TABLE IF NOT EXISTS settings (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Vapi Voice Agent Configuration
  vapi_private_key TEXT,
  vapi_public_key TEXT,
  vapi_assistant_id TEXT,
  vapi_phone_number_id TEXT,
  
  -- Google Calendar
  calendar_email TEXT,
  
  -- Business Identity
  business_name TEXT DEFAULT 'My Business',
  business_industry TEXT DEFAULT 'General',
  agent_name TEXT DEFAULT 'Sarah',
  agent_role TEXT DEFAULT 'Assistant',
  
  -- Business Settings
  business_hours_start TEXT DEFAULT '09:00',
  business_hours_end TEXT DEFAULT '17:00',
  timezone TEXT DEFAULT 'America/New_York',
  avg_appointment_value INTEGER DEFAULT 150,
  cancellation_policy TEXT DEFAULT 'Please provide 24 hours notice for cancellations.',
  custom_knowledge TEXT DEFAULT '',
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- TABLE 2: LEADS (Customer contacts)
-- =====================================================
-- Stores leads/contacts for each user with call status.

CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Contact Info
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  interest TEXT,
  notes TEXT,
  
  -- Call Status
  status TEXT DEFAULT 'Pending' CHECK (status IN ('Pending', 'Calling', 'Contacted', 'Booked', 'Voicemail', 'Failed')),
  last_contacted TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Each user can only have one lead per phone number
  CONSTRAINT leads_phone_user_unique UNIQUE (phone, user_id)
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS leads_user_id_idx ON leads(user_id);
CREATE INDEX IF NOT EXISTS leads_status_idx ON leads(status);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================
-- Ensures users can only access their own data.

-- Enable RLS
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- Settings Policies
DROP POLICY IF EXISTS "Users can view own settings" ON settings;
DROP POLICY IF EXISTS "Users can insert own settings" ON settings;
DROP POLICY IF EXISTS "Users can update own settings" ON settings;
DROP POLICY IF EXISTS "Users can delete own settings" ON settings;

CREATE POLICY "Users can view own settings" ON settings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own settings" ON settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own settings" ON settings
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own settings" ON settings
  FOR DELETE USING (auth.uid() = user_id);

-- Leads Policies
DROP POLICY IF EXISTS "Users can view own leads" ON leads;
DROP POLICY IF EXISTS "Users can insert own leads" ON leads;
DROP POLICY IF EXISTS "Users can update own leads" ON leads;
DROP POLICY IF EXISTS "Users can delete own leads" ON leads;

CREATE POLICY "Users can view own leads" ON leads
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own leads" ON leads
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own leads" ON leads
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own leads" ON leads
  FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- SERVICE ROLE BYPASS (Required for server actions)
-- =====================================================
-- The service role key bypasses RLS, which is needed for
-- server-side operations like webhook updates.

DROP POLICY IF EXISTS "Service role has full access to settings" ON settings;
DROP POLICY IF EXISTS "Service role has full access to leads" ON leads;

CREATE POLICY "Service role has full access to settings" ON settings
  FOR ALL USING (auth.jwt()->>'role' = 'service_role');

CREATE POLICY "Service role has full access to leads" ON leads
  FOR ALL USING (auth.jwt()->>'role' = 'service_role');

-- =====================================================
-- SETUP COMPLETE!
-- =====================================================
-- Your database is now ready for Revive AI.
-- 
-- Next steps:
-- 1. Copy your Supabase URL and keys to .env.local
-- 2. Run `npm run dev` to start the application
-- 3. Create an account and configure your settings
-- =====================================================
