-- CreateEnum
CREATE TYPE "SupplierApplicationDocumentType" AS ENUM ('TAX_CERTIFICATE', 'SIGNATURE_CIRCULAR', 'TRADE_REGISTRY_GAZETTE', 'ACTIVITY_CERTIFICATE');

-- AlterTable
ALTER TABLE "supplier_applications" ADD COLUMN     "approved_commercial_message" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "approved_kvkk_agreement" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "approved_supplier_agreement" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "supplier_application_documents" (
    "id" TEXT NOT NULL,
    "supplier_application_id" TEXT NOT NULL,
    "document_type" "SupplierApplicationDocumentType" NOT NULL,
    "original_name" TEXT NOT NULL,
    "file_path" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "file_size" INTEGER NOT NULL,
    "uploaded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "supplier_application_documents_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "supplier_application_documents_document_type_idx" ON "supplier_application_documents"("document_type");

-- CreateIndex
CREATE UNIQUE INDEX "supplier_application_documents_supplier_application_id_docu_key" ON "supplier_application_documents"("supplier_application_id", "document_type");

-- AddForeignKey
ALTER TABLE "supplier_application_documents" ADD CONSTRAINT "supplier_application_documents_supplier_application_id_fkey" FOREIGN KEY ("supplier_application_id") REFERENCES "supplier_applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;
