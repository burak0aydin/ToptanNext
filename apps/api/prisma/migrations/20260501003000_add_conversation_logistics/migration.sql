ALTER TYPE "MessageType" ADD VALUE IF NOT EXISTS 'LOGISTICS_REQUEST';
ALTER TYPE "MessageType" ADD VALUE IF NOT EXISTS 'LOGISTICS_OFFER';

DO $$
BEGIN
  CREATE TYPE "LogisticsRequestStatus" AS ENUM ('PENDING', 'COLLECTING', 'CLOSED', 'CANCELED');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE "LogisticsOfferStatus" AS ENUM ('OFFERED', 'SELECTED', 'REJECTED');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "logistics_requests" (
  "id" TEXT NOT NULL,
  "conversation_id" TEXT NOT NULL,
  "requester_id" TEXT NOT NULL,
  "from_city" TEXT NOT NULL,
  "to_city" TEXT NOT NULL,
  "pallet_count" INTEGER,
  "item_count" INTEGER,
  "status" "LogisticsRequestStatus" NOT NULL DEFAULT 'PENDING',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "logistics_requests_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "logistics_offers" (
  "id" TEXT NOT NULL,
  "request_id" TEXT NOT NULL,
  "partner_id" TEXT NOT NULL,
  "price" DECIMAL(12, 2) NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'TRY',
  "estimated_days" INTEGER NOT NULL,
  "is_insured" BOOLEAN NOT NULL DEFAULT false,
  "notes" TEXT,
  "status" "LogisticsOfferStatus" NOT NULL DEFAULT 'OFFERED',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "logistics_offers_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "logistics_requests_conversation_id_idx" ON "logistics_requests"("conversation_id");
CREATE INDEX IF NOT EXISTS "logistics_requests_status_created_at_idx" ON "logistics_requests"("status", "created_at");
CREATE UNIQUE INDEX IF NOT EXISTS "logistics_offers_request_id_partner_id_key" ON "logistics_offers"("request_id", "partner_id");
CREATE INDEX IF NOT EXISTS "logistics_offers_request_id_idx" ON "logistics_offers"("request_id");
CREATE INDEX IF NOT EXISTS "logistics_offers_status_idx" ON "logistics_offers"("status");

DO $$
BEGIN
  ALTER TABLE "logistics_requests"
    ADD CONSTRAINT "logistics_requests_conversation_id_fkey"
    FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE "logistics_requests"
    ADD CONSTRAINT "logistics_requests_requester_id_fkey"
    FOREIGN KEY ("requester_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE "logistics_offers"
    ADD CONSTRAINT "logistics_offers_request_id_fkey"
    FOREIGN KEY ("request_id") REFERENCES "logistics_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE "logistics_offers"
    ADD CONSTRAINT "logistics_offers_partner_id_fkey"
    FOREIGN KEY ("partner_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
