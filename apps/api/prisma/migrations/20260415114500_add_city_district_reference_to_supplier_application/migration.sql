-- AlterTable
ALTER TABLE "supplier_applications"
ADD COLUMN "city" TEXT,
ADD COLUMN "district" TEXT,
ADD COLUMN "reference_code" TEXT;

-- Backfill existing rows with placeholder values to satisfy NOT NULL conversion.
UPDATE "supplier_applications"
SET
  "city" = COALESCE(NULLIF(TRIM("city"), ''), 'Belirtilmedi'),
  "district" = COALESCE(NULLIF(TRIM("district"), ''), 'Belirtilmedi');

-- Enforce required columns.
ALTER TABLE "supplier_applications"
ALTER COLUMN "city" SET NOT NULL,
ALTER COLUMN "district" SET NOT NULL;

-- Add indexes for filter/read use-cases.
CREATE INDEX "supplier_applications_city_idx" ON "supplier_applications"("city");
CREATE INDEX "supplier_applications_district_idx" ON "supplier_applications"("district");
