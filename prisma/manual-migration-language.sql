-- Manual migration for preferred delivery language (run in Supabase SQL Editor)

ALTER TABLE "orders"
  ADD COLUMN IF NOT EXISTS "preferredLanguage" TEXT;

