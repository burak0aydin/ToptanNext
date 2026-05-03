-- AlterTable
ALTER TABLE "quotes" ALTER COLUMN "expires_at" SET DEFAULT (now() + interval '24 hours');

-- CreateTable
CREATE TABLE "addresses" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "phone_number" TEXT NOT NULL,
    "province" TEXT NOT NULL,
    "district" TEXT NOT NULL,
    "neighborhood" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "postal_code" TEXT NOT NULL,
    "is_selected" BOOLEAN NOT NULL DEFAULT false,
    "invoice_type" TEXT NOT NULL DEFAULT 'individual',
    "tax_id" TEXT,
    "tax_office" TEXT,
    "company_name" TEXT,
    "is_e_tax_payer" BOOLEAN DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "addresses_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "addresses_user_id_idx" ON "addresses"("user_id");

-- CreateIndex
CREATE INDEX "addresses_is_selected_idx" ON "addresses"("is_selected");

-- AddForeignKey
ALTER TABLE "addresses" ADD CONSTRAINT "addresses_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- RenameIndex
ALTER INDEX "logistics_application_documents_logistics_application_id_docu_k" RENAME TO "logistics_application_documents_logistics_application_id_do_key";

-- RenameIndex
ALTER INDEX "logistics_applications_logistics_authorization_document_type_id" RENAME TO "logistics_applications_logistics_authorization_document_typ_idx";
