ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "stripe_mailbox_basic_price_id" TEXT;
ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "stripe_mailbox_premium_price_id" TEXT;
