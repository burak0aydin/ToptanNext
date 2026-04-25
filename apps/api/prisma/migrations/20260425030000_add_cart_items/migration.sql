CREATE TABLE "cart_items" (
    "id" TEXT NOT NULL,
    "buyer_id" TEXT NOT NULL,
    "product_listing_id" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cart_items_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "cart_items_buyer_id_product_listing_id_key" ON "cart_items"("buyer_id", "product_listing_id");
CREATE INDEX "cart_items_buyer_id_idx" ON "cart_items"("buyer_id");
CREATE INDEX "cart_items_product_listing_id_idx" ON "cart_items"("product_listing_id");

ALTER TABLE "cart_items"
ADD CONSTRAINT "cart_items_buyer_id_fkey"
FOREIGN KEY ("buyer_id") REFERENCES "users"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "cart_items"
ADD CONSTRAINT "cart_items_product_listing_id_fkey"
FOREIGN KEY ("product_listing_id") REFERENCES "product_listings"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
