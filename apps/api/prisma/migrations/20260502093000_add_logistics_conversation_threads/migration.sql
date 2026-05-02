DO $$
BEGIN
  CREATE TYPE "ConversationType" AS ENUM ('PRODUCT', 'LOGISTICS');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "conversations"
  ADD COLUMN IF NOT EXISTS "conversation_type" "ConversationType" NOT NULL DEFAULT 'PRODUCT',
  ADD COLUMN IF NOT EXISTS "logistics_request_id" TEXT;

CREATE INDEX IF NOT EXISTS "conversations_conversation_type_idx" ON "conversations"("conversation_type");
CREATE INDEX IF NOT EXISTS "conversations_logistics_request_id_idx" ON "conversations"("logistics_request_id");

DO $$
BEGIN
  ALTER TABLE "conversations"
    ADD CONSTRAINT "conversations_logistics_request_id_fkey"
    FOREIGN KEY ("logistics_request_id") REFERENCES "logistics_requests"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
