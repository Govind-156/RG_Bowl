-- Manual migration for ContactSubmission complaint support (run in Supabase SQL Editor)

-- 1) Add columns type and imageUrl if they do not exist yet
ALTER TABLE "contact_submissions"
  ADD COLUMN IF NOT EXISTS "type" TEXT NOT NULL DEFAULT 'GENERAL',
  ADD COLUMN IF NOT EXISTS "imageUrl" TEXT;

-- 2) (Optional) If you want to enforce enum-like values at DB level, you can later
--    create a CHECK constraint or a dedicated enum type. For now we keep it flexible.

