CREATE TYPE "ProductListingPackageType" AS ENUM ('BOX', 'PALLET', 'SACK', 'OTHER');

CREATE TYPE "ProductListingShippingTime" AS ENUM ('ONE_TO_THREE_DAYS', 'THREE_TO_FIVE_DAYS', 'ONE_WEEK', 'CUSTOM_PRODUCTION');

CREATE TYPE "ProductListingDeliveryMethod" AS ENUM ('CONTRACTED_CARGO', 'FREIGHT_FORWARDER', 'BUYER_PICKUP', 'OWN_VEHICLE');

ALTER TABLE "product_listings"
ADD COLUMN "package_type" "ProductListingPackageType",
ADD COLUMN "shipping_time" "ProductListingShippingTime",
ADD COLUMN "delivery_methods" "ProductListingDeliveryMethod"[] NOT NULL DEFAULT ARRAY[]::"ProductListingDeliveryMethod"[],
ADD COLUMN "dynamic_freight_agreement" BOOLEAN NOT NULL DEFAULT false;
