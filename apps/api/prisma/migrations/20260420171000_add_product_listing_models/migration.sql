-- CreateEnum
CREATE TYPE "ProductListingStatus" AS ENUM ('DRAFT', 'PENDING_REVIEW', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "ProductListingMediaType" AS ENUM ('IMAGE', 'VIDEO');

-- CreateTable
CREATE TABLE "product_listings" (
    "id" TEXT NOT NULL,
    "supplier_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category_id" TEXT NOT NULL,
    "status" "ProductListingStatus" NOT NULL DEFAULT 'DRAFT',
    "featured_features" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "is_customizable" BOOLEAN NOT NULL DEFAULT false,
    "customization_note" TEXT,
    "base_price" DECIMAL(12,2),
    "currency" TEXT NOT NULL DEFAULT 'TRY',
    "min_order_quantity" INTEGER,
    "stock" INTEGER,
    "lead_time_days" INTEGER,
    "package_length_cm" DECIMAL(8,2),
    "package_width_cm" DECIMAL(8,2),
    "package_height_cm" DECIMAL(8,2),
    "package_weight_kg" DECIMAL(8,3),
    "submitted_at" TIMESTAMP(3),
    "review_note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "product_listings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_listing_sectors" (
    "id" TEXT NOT NULL,
    "product_listing_id" TEXT NOT NULL,
    "sector_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "product_listing_sectors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_listing_media" (
    "id" TEXT NOT NULL,
    "product_listing_id" TEXT NOT NULL,
    "media_type" "ProductListingMediaType" NOT NULL DEFAULT 'IMAGE',
    "file_path" TEXT NOT NULL,
    "original_name" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "file_size" INTEGER NOT NULL,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_listing_media_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "product_listings_supplier_id_sku_key" ON "product_listings"("supplier_id", "sku");

-- CreateIndex
CREATE UNIQUE INDEX "product_listings_supplier_id_slug_key" ON "product_listings"("supplier_id", "slug");

-- CreateIndex
CREATE INDEX "product_listings_supplier_id_idx" ON "product_listings"("supplier_id");

-- CreateIndex
CREATE INDEX "product_listings_status_idx" ON "product_listings"("status");

-- CreateIndex
CREATE INDEX "product_listings_category_id_idx" ON "product_listings"("category_id");

-- CreateIndex
CREATE INDEX "product_listings_created_at_idx" ON "product_listings"("created_at");

-- CreateIndex
CREATE INDEX "product_listings_deleted_at_idx" ON "product_listings"("deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "product_listing_sectors_product_listing_id_sector_id_key" ON "product_listing_sectors"("product_listing_id", "sector_id");

-- CreateIndex
CREATE INDEX "product_listing_sectors_sector_id_idx" ON "product_listing_sectors"("sector_id");

-- CreateIndex
CREATE INDEX "product_listing_media_product_listing_id_display_order_idx" ON "product_listing_media"("product_listing_id", "display_order");

-- AddCheckConstraint
ALTER TABLE "product_listings"
ADD CONSTRAINT "product_listings_min_order_quantity_check"
CHECK ("min_order_quantity" IS NULL OR "min_order_quantity" >= 1);

-- AddCheckConstraint
ALTER TABLE "product_listings"
ADD CONSTRAINT "product_listings_stock_check"
CHECK ("stock" IS NULL OR "stock" >= 0);

-- AddCheckConstraint
ALTER TABLE "product_listings"
ADD CONSTRAINT "product_listings_lead_time_days_check"
CHECK ("lead_time_days" IS NULL OR "lead_time_days" >= 0);

-- AddCheckConstraint
ALTER TABLE "product_listings"
ADD CONSTRAINT "product_listings_package_length_cm_check"
CHECK ("package_length_cm" IS NULL OR "package_length_cm" > 0);

-- AddCheckConstraint
ALTER TABLE "product_listings"
ADD CONSTRAINT "product_listings_package_width_cm_check"
CHECK ("package_width_cm" IS NULL OR "package_width_cm" > 0);

-- AddCheckConstraint
ALTER TABLE "product_listings"
ADD CONSTRAINT "product_listings_package_height_cm_check"
CHECK ("package_height_cm" IS NULL OR "package_height_cm" > 0);

-- AddCheckConstraint
ALTER TABLE "product_listings"
ADD CONSTRAINT "product_listings_package_weight_kg_check"
CHECK ("package_weight_kg" IS NULL OR "package_weight_kg" > 0);

-- AddCheckConstraint
ALTER TABLE "product_listing_media"
ADD CONSTRAINT "product_listing_media_file_size_check"
CHECK ("file_size" > 0);

-- AddCheckConstraint
ALTER TABLE "product_listing_media"
ADD CONSTRAINT "product_listing_media_display_order_check"
CHECK ("display_order" >= 0);

-- AddForeignKey
ALTER TABLE "product_listings"
ADD CONSTRAINT "product_listings_supplier_id_fkey"
FOREIGN KEY ("supplier_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_listings"
ADD CONSTRAINT "product_listings_category_id_fkey"
FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_listing_sectors"
ADD CONSTRAINT "product_listing_sectors_product_listing_id_fkey"
FOREIGN KEY ("product_listing_id") REFERENCES "product_listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_listing_sectors"
ADD CONSTRAINT "product_listing_sectors_sector_id_fkey"
FOREIGN KEY ("sector_id") REFERENCES "sectors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_listing_media"
ADD CONSTRAINT "product_listing_media_product_listing_id_fkey"
FOREIGN KEY ("product_listing_id") REFERENCES "product_listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
