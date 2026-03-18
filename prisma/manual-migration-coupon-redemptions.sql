-- Manual migration for coupon redemptions (run in Supabase SQL Editor)
-- Ensures coupons can be limited to "once per user".

CREATE TABLE IF NOT EXISTS "coupon_redemptions" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "couponId" TEXT NOT NULL,
  "orderId" TEXT,
  "redeemedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "coupon_redemptions_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "coupon_redemptions_orderId_key" UNIQUE ("orderId"),
  CONSTRAINT "coupon_redemptions_userId_couponId_key" UNIQUE ("userId", "couponId")
);

-- Foreign keys (safe-guarded)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'coupon_redemptions' AND constraint_name = 'coupon_redemptions_userId_fkey'
  ) THEN
    ALTER TABLE "coupon_redemptions"
      ADD CONSTRAINT "coupon_redemptions_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'coupon_redemptions' AND constraint_name = 'coupon_redemptions_couponId_fkey'
  ) THEN
    ALTER TABLE "coupon_redemptions"
      ADD CONSTRAINT "coupon_redemptions_couponId_fkey"
      FOREIGN KEY ("couponId") REFERENCES "coupons"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'coupon_redemptions' AND constraint_name = 'coupon_redemptions_orderId_fkey'
  ) THEN
    ALTER TABLE "coupon_redemptions"
      ADD CONSTRAINT "coupon_redemptions_orderId_fkey"
      FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END
$$;

