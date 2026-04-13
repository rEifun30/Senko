-- SENKO v3: Add struggling label and updated_at to cards
-- Run this in your Supabase SQL Editor

-- Add is_struggling column to card_progress (tracks per-card struggling)
ALTER TABLE card_progress ADD COLUMN IF NOT EXISTS is_struggling BOOLEAN DEFAULT FALSE;

-- Add updated_at column
ALTER TABLE card_progress ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- SENKO v4: Add FSRS fields for label lifecycle system
ALTER TABLE card_progress ADD COLUMN IF NOT EXISTS stability FLOAT DEFAULT 0.5;
ALTER TABLE card_progress ADD COLUMN IF NOT EXISTS difficulty FLOAT DEFAULT 5.0;
ALTER TABLE card_progress ADD COLUMN IF NOT EXISTS last_reviewed TIMESTAMPTZ;
ALTER TABLE card_progress ADD COLUMN IF NOT EXISTS label TEXT DEFAULT 'new';

-- Update RLS policies to allow updates to is_struggling
-- (Already covered by "Users can manage own card progress" policy)
