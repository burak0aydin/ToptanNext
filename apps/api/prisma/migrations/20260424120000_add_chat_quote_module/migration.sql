-- Chat + Quotation domain
ALTER TABLE "users"
  ADD COLUMN "company_name" TEXT,
  ADD COLUMN "avatar_url" TEXT;

CREATE TYPE "ConversationStatus" AS ENUM ('ACTIVE', 'ARCHIVED', 'BLOCKED');
CREATE TYPE "MessageType" AS ENUM (
  'TEXT',
  'IMAGE',
  'FILE',
  'QUOTE_REQUEST',
  'QUOTE_OFFER',
  'QUOTE_ACCEPTED',
  'QUOTE_REJECTED',
  'COUNTER_OFFER'
);
CREATE TYPE "QuoteStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED', 'COUNTERED', 'EXPIRED');

CREATE TABLE "conversations" (
  "id" TEXT NOT NULL,
  "product_listing_id" TEXT,
  "last_message_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "status" "ConversationStatus" NOT NULL DEFAULT 'ACTIVE',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "conversations_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "conversation_participants" (
  "conversation_id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "unread_count" INTEGER NOT NULL DEFAULT 0,
  "last_read_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "conversation_participants_pkey" PRIMARY KEY ("conversation_id", "user_id")
);

CREATE TABLE "messages" (
  "id" TEXT NOT NULL,
  "conversation_id" TEXT NOT NULL,
  "sender_id" TEXT NOT NULL,
  "type" "MessageType" NOT NULL,
  "body" TEXT,
  "is_edited" BOOLEAN NOT NULL DEFAULT false,
  "deleted_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "attachments" (
  "id" TEXT NOT NULL,
  "message_id" TEXT NOT NULL,
  "file_name" TEXT NOT NULL,
  "file_url" TEXT NOT NULL,
  "file_size" INTEGER NOT NULL,
  "mime_type" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "attachments_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "quotes" (
  "id" TEXT NOT NULL,
  "message_id" TEXT NOT NULL,
  "product_listing_id" TEXT NOT NULL,
  "quantity" INTEGER NOT NULL,
  "unit_price" DECIMAL(12,2) NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'TRY',
  "notes" TEXT,
  "status" "QuoteStatus" NOT NULL DEFAULT 'PENDING',
  "expires_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP + interval '24 hours',
  "counter_quote_id" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "quotes_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "quotes_message_id_key" ON "quotes"("message_id");

CREATE INDEX "conversations_last_message_at_idx" ON "conversations"("last_message_at");
CREATE INDEX "conversations_status_idx" ON "conversations"("status");
CREATE INDEX "conversations_product_listing_id_idx" ON "conversations"("product_listing_id");
CREATE INDEX "conversation_participants_user_id_unread_count_idx" ON "conversation_participants"("user_id", "unread_count");
CREATE INDEX "messages_conversation_id_created_at_idx" ON "messages"("conversation_id", "created_at");
CREATE INDEX "messages_sender_id_idx" ON "messages"("sender_id");
CREATE INDEX "messages_deleted_at_idx" ON "messages"("deleted_at");
CREATE INDEX "attachments_message_id_idx" ON "attachments"("message_id");
CREATE INDEX "quotes_status_expires_at_idx" ON "quotes"("status", "expires_at");
CREATE INDEX "quotes_product_listing_id_idx" ON "quotes"("product_listing_id");
CREATE INDEX "quotes_counter_quote_id_idx" ON "quotes"("counter_quote_id");

ALTER TABLE "conversations"
  ADD CONSTRAINT "conversations_product_listing_id_fkey"
  FOREIGN KEY ("product_listing_id") REFERENCES "product_listings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "conversation_participants"
  ADD CONSTRAINT "conversation_participants_conversation_id_fkey"
  FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "conversation_participants"
  ADD CONSTRAINT "conversation_participants_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "messages"
  ADD CONSTRAINT "messages_conversation_id_fkey"
  FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "messages"
  ADD CONSTRAINT "messages_sender_id_fkey"
  FOREIGN KEY ("sender_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "attachments"
  ADD CONSTRAINT "attachments_message_id_fkey"
  FOREIGN KEY ("message_id") REFERENCES "messages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "quotes"
  ADD CONSTRAINT "quotes_message_id_fkey"
  FOREIGN KEY ("message_id") REFERENCES "messages"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "quotes"
  ADD CONSTRAINT "quotes_product_listing_id_fkey"
  FOREIGN KEY ("product_listing_id") REFERENCES "product_listings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "quotes"
  ADD CONSTRAINT "quotes_counter_quote_id_fkey"
  FOREIGN KEY ("counter_quote_id") REFERENCES "quotes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
