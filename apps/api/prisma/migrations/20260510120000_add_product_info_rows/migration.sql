ALTER TABLE "product_listings"
ADD COLUMN "product_info_rows" JSONB NOT NULL DEFAULT '[]';
