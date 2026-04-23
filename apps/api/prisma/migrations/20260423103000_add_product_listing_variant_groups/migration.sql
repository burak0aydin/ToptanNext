ALTER TABLE "product_listings"
ADD COLUMN "variant_groups" JSONB NOT NULL DEFAULT '[]'::jsonb;
