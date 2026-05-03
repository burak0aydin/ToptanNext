CREATE TABLE "payment_cards" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "card_holder_name" TEXT NOT NULL,
    "brand" TEXT NOT NULL,
    "last_four" TEXT NOT NULL,
    "masked_number" TEXT NOT NULL,
    "expiry_month" TEXT NOT NULL,
    "expiry_year" TEXT NOT NULL,
    "fingerprint" TEXT NOT NULL,
    "is_selected" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payment_cards_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "payment_cards_user_id_idx" ON "payment_cards"("user_id");
CREATE INDEX "payment_cards_is_selected_idx" ON "payment_cards"("is_selected");
CREATE UNIQUE INDEX "payment_cards_user_id_fingerprint_key" ON "payment_cards"("user_id", "fingerprint");

ALTER TABLE "payment_cards" ADD CONSTRAINT "payment_cards_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
