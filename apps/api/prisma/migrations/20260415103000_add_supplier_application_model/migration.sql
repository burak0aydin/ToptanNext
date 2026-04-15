-- CreateEnum
CREATE TYPE "SupplierCompanyType" AS ENUM ('SAHIS', 'LIMITED', 'ANONIM');

-- CreateTable
CREATE TABLE "supplier_applications" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "company_name" TEXT NOT NULL,
    "company_type" "SupplierCompanyType" NOT NULL,
    "vkn_or_tckn" TEXT NOT NULL,
    "tax_office" TEXT NOT NULL,
    "mersis_no" TEXT NOT NULL,
    "trade_registry_no" TEXT,
    "activity_sector" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "supplier_applications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "supplier_applications_user_id_key" ON "supplier_applications"("user_id");

-- CreateIndex
CREATE INDEX "supplier_applications_company_type_idx" ON "supplier_applications"("company_type");

-- CreateIndex
CREATE INDEX "supplier_applications_activity_sector_idx" ON "supplier_applications"("activity_sector");

-- AddForeignKey
ALTER TABLE "supplier_applications" ADD CONSTRAINT "supplier_applications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
