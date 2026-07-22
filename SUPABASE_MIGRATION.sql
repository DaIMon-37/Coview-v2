-- CoView Database Migration
-- Run this in your Supabase SQL Editor: https://supabase.com/dashboard/project/yhspemwbrnovdmzdptmc/sql

-- Add missing columns to parties table
ALTER TABLE parties
  ADD COLUMN IF NOT EXISTS title TEXT NOT NULL DEFAULT 'Watch Party',
  ADD COLUMN IF NOT EXISTS privacy TEXT NOT NULL DEFAULT 'public',
  ADD COLUMN IF NOT EXISTS video_url TEXT,
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS language TEXT DEFAULT 'English',
  ADD COLUMN IF NOT EXISTS chat_enabled BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS allow_links BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS playback_perm TEXT DEFAULT 'everyone';

-- Add username column to users if missing (it exists, but just in case)
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- Add username to chat_messages for denormalized fast lookup (optional but useful)
-- The join already works via FK, so this is optional

-- Verify the schema
SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'parties' ORDER BY ordinal_position;
