ALTER TABLE "product_listings"
ADD COLUMN "is_negotiation_enabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "negotiation_threshold" INTEGER,
ADD COLUMN "pricing_tiers" JSONB NOT NULL DEFAULT '[]'::jsonb;
