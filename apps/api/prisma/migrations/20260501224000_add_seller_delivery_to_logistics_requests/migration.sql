ALTER TABLE "logistics_requests"
  ADD COLUMN IF NOT EXISTS "is_seller_delivery" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "seller_delivery_fee" DECIMAL(12, 2);
