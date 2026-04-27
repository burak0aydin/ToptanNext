-- CreateEnum
CREATE TYPE "LogisticsAuthorizationDocumentType" AS ENUM ('K1', 'K3', 'R1', 'R2', 'L1', 'DIGER');

-- CreateEnum
CREATE TYPE "LogisticsMainServiceType" AS ENUM ('PARSIYEL_TASIMA', 'KOMPLE_ARAC_FTL', 'SOGUK_ZINCIR', 'KONTEYNER_GUMRUK', 'AGIR_YUK', 'DEPOLAMA');

-- CreateEnum
CREATE TYPE "LogisticsServiceRegion" AS ENUM ('TUM_TURKIYE', 'BELIRLI_BOLGELER_SEHIRLER', 'ULUSLARARASI');

-- CreateEnum
CREATE TYPE "LogisticsFleetCapacity" AS ENUM ('ONE_TO_FIVE', 'SIX_TO_TWENTY', 'TWENTY_ONE_TO_FIFTY', 'FIFTY_PLUS');

-- CreateEnum
CREATE TYPE "LogisticsApplicationReviewStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "LogisticsApplicationDocumentType" AS ENUM ('TAX_CERTIFICATE', 'SIGNATURE_CIRCULAR', 'TRADE_REGISTRY_GAZETTE', 'ACTIVITY_CERTIFICATE', 'TRANSPORT_LICENSE');

-- AlterTable
ALTER TABLE "users" ADD COLUMN "is_logistics_partner" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "logistics_applications" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "company_name" TEXT NOT NULL,
    "company_type" "SupplierCompanyType" NOT NULL,
    "vkn_or_tckn" TEXT NOT NULL,
    "tax_office" TEXT NOT NULL,
    "mersis_no" TEXT NOT NULL,
    "trade_registry_no" TEXT,
    "city" TEXT NOT NULL,
    "district" TEXT NOT NULL,
    "reference_code" TEXT,
    "logistics_authorization_document_type" "LogisticsAuthorizationDocumentType" NOT NULL,
    "main_service_types" "LogisticsMainServiceType"[] DEFAULT ARRAY[]::"LogisticsMainServiceType"[],
    "company_iban" TEXT,
    "kep_address" TEXT,
    "is_e_invoice_taxpayer" BOOLEAN,
    "business_phone" TEXT,
    "headquarters_address" TEXT,
    "service_regions" "LogisticsServiceRegion"[] DEFAULT ARRAY[]::"LogisticsServiceRegion"[],
    "fleet_capacity" "LogisticsFleetCapacity",
    "contact_first_name" TEXT,
    "contact_last_name" TEXT,
    "contact_role" TEXT,
    "contact_phone" TEXT,
    "contact_email" TEXT,
    "review_status" "LogisticsApplicationReviewStatus" NOT NULL DEFAULT 'PENDING',
    "review_note" TEXT,
    "reviewed_at" TIMESTAMP(3),
    "approved_commercial_message" BOOLEAN NOT NULL DEFAULT false,
    "approved_kvkk_agreement" BOOLEAN NOT NULL DEFAULT false,
    "approved_supplier_agreement" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "logistics_applications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "logistics_application_documents" (
    "id" TEXT NOT NULL,
    "logistics_application_id" TEXT NOT NULL,
    "document_type" "LogisticsApplicationDocumentType" NOT NULL,
    "original_name" TEXT NOT NULL,
    "file_path" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "file_size" INTEGER NOT NULL,
    "uploaded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "logistics_application_documents_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "logistics_applications_user_id_key" ON "logistics_applications"("user_id");

-- CreateIndex
CREATE INDEX "logistics_applications_company_type_idx" ON "logistics_applications"("company_type");

-- CreateIndex
CREATE INDEX "logistics_applications_review_status_idx" ON "logistics_applications"("review_status");

-- CreateIndex
CREATE INDEX "logistics_applications_logistics_authorization_document_type_idx" ON "logistics_applications"("logistics_authorization_document_type");

-- CreateIndex
CREATE UNIQUE INDEX "logistics_application_documents_logistics_application_id_docu_key" ON "logistics_application_documents"("logistics_application_id", "document_type");

-- CreateIndex
CREATE INDEX "logistics_application_documents_document_type_idx" ON "logistics_application_documents"("document_type");

-- AddForeignKey
ALTER TABLE "logistics_applications" ADD CONSTRAINT "logistics_applications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "logistics_application_documents" ADD CONSTRAINT "logistics_application_documents_logistics_application_id_fkey" FOREIGN KEY ("logistics_application_id") REFERENCES "logistics_applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;
