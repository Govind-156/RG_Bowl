-- Manual migration for Coupon support (run in Supabase SQL Editor)
-- Use when "npx prisma db push" is stuck or fails.

-- 1. Create enum for coupon type (skip if already exists)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'CouponType') THEN
    CREATE TYPE "CouponType" AS ENUM ('PERCENT_DISCOUNT', 'FREE_DELIVERY', 'FIXED_OFF');
  END IF;
END
$$;

-- 2. Create coupons table (skip if already exists)
CREATE TABLE IF NOT EXISTS "coupons" (
  "id" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "type" "CouponType" NOT NULL,
  "value" INTEGER NOT NULL,
  "minOrderValue" INTEGER DEFAULT 0,
  "firstOrderOnly" BOOLEAN NOT NULL DEFAULT false,
  "maxDiscount" INTEGER,
  "validFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "validTo" TIMESTAMP(3) NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "coupons_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "coupons_code_key" UNIQUE ("code")
);

-- 3. Add coupon columns to orders (safe to run multiple times)
ALTER TABLE "orders"
  ADD COLUMN IF NOT EXISTS "couponId" TEXT,
  ADD COLUMN IF NOT EXISTS "couponDiscountAmount" INTEGER NOT NULL DEFAULT 0;

-- 4. Add foreign key from orders to coupons (only if column exists and constraint doesn't)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'orders' AND constraint_name = 'orders_couponId_fkey'
  ) THEN
    ALTER TABLE "orders"
      ADD CONSTRAINT "orders_couponId_fkey"
      FOREIGN KEY ("couponId") REFERENCES "coupons"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END
$$;

-- 5. Create index on coupon code for fast lookups (optional)
CREATE INDEX IF NOT EXISTS "coupons_code_idx" ON "coupons"("code");
