CREATE TYPE "OrderStatus" AS ENUM ('PAID', 'CANCELED', 'REFUNDED');

CREATE TABLE "orders" (
  "id" TEXT NOT NULL,
  "buyer_id" TEXT NOT NULL,
  "status" "OrderStatus" NOT NULL DEFAULT 'PAID',
  "currency" TEXT NOT NULL DEFAULT 'TRY',
  "subtotal" DECIMAL(12,2) NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "order_items" (
  "id" TEXT NOT NULL,
  "order_id" TEXT NOT NULL,
  "buyer_id" TEXT NOT NULL,
  "product_listing_id" TEXT NOT NULL,
  "supplier_id" TEXT NOT NULL,
  "quantity" INTEGER NOT NULL,
  "unit_price" DECIMAL(12,2) NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'TRY',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "order_items_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "product_reviews" (
  "id" TEXT NOT NULL,
  "product_listing_id" TEXT NOT NULL,
  "buyer_id" TEXT NOT NULL,
  "rating" INTEGER NOT NULL,
  "comment" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "product_reviews_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "orders_buyer_id_idx" ON "orders"("buyer_id");
CREATE INDEX "orders_status_idx" ON "orders"("status");
CREATE INDEX "orders_created_at_idx" ON "orders"("created_at");
CREATE INDEX "order_items_order_id_idx" ON "order_items"("order_id");
CREATE INDEX "order_items_buyer_id_product_listing_id_idx" ON "order_items"("buyer_id", "product_listing_id");
CREATE INDEX "order_items_supplier_id_idx" ON "order_items"("supplier_id");
CREATE UNIQUE INDEX "product_reviews_product_listing_id_buyer_id_key" ON "product_reviews"("product_listing_id", "buyer_id");
CREATE INDEX "product_reviews_product_listing_id_created_at_idx" ON "product_reviews"("product_listing_id", "created_at");
CREATE INDEX "product_reviews_buyer_id_idx" ON "product_reviews"("buyer_id");

ALTER TABLE "orders" ADD CONSTRAINT "orders_buyer_id_fkey" FOREIGN KEY ("buyer_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_product_listing_id_fkey" FOREIGN KEY ("product_listing_id") REFERENCES "product_listings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "product_reviews" ADD CONSTRAINT "product_reviews_product_listing_id_fkey" FOREIGN KEY ("product_listing_id") REFERENCES "product_listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "product_reviews" ADD CONSTRAINT "product_reviews_buyer_id_fkey" FOREIGN KEY ("buyer_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
