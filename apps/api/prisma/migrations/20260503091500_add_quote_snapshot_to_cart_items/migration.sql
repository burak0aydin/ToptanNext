ALTER TABLE "cart_items"
  ADD COLUMN IF NOT EXISTS "quote_id" TEXT,
  ADD COLUMN IF NOT EXISTS "quoted_unit_price" DECIMAL(12,2),
  ADD COLUMN IF NOT EXISTS "quoted_logistics_fee" DECIMAL(12,2),
  ADD COLUMN IF NOT EXISTS "quoted_currency" TEXT,
  ADD COLUMN IF NOT EXISTS "quote_notes" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "cart_items_quote_id_key" ON "cart_items"("quote_id");
CREATE INDEX IF NOT EXISTS "cart_items_quote_id_idx" ON "cart_items"("quote_id");