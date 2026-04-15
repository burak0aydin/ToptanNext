-- CreateEnum
CREATE TYPE "SupplierApplicationReviewStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- DropIndex
DROP INDEX "supplier_applications_city_idx";

-- DropIndex
DROP INDEX "supplier_applications_district_idx";

-- AlterTable
ALTER TABLE "supplier_applications" ADD COLUMN     "business_phone" TEXT,
ADD COLUMN     "company_iban" TEXT,
ADD COLUMN     "contact_email" TEXT,
ADD COLUMN     "contact_first_name" TEXT,
ADD COLUMN     "contact_last_name" TEXT,
ADD COLUMN     "contact_phone" TEXT,
ADD COLUMN     "contact_role" TEXT,
ADD COLUMN     "headquarters_address" TEXT,
ADD COLUMN     "is_e_invoice_taxpayer" BOOLEAN,
ADD COLUMN     "kep_address" TEXT,
ADD COLUMN     "review_note" TEXT,
ADD COLUMN     "review_status" "SupplierApplicationReviewStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "reviewed_at" TIMESTAMP(3),
ADD COLUMN     "warehouse_address" TEXT,
ADD COLUMN     "warehouse_same_as_headquarters" BOOLEAN;

-- CreateIndex
CREATE INDEX "supplier_applications_review_status_idx" ON "supplier_applications"("review_status");
