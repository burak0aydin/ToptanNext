INSERT INTO "conversation_participants" (
  "conversation_id",
  "user_id",
  "unread_count",
  "last_read_at",
  "created_at",
  "updated_at"
)
SELECT DISTINCT
  lr."conversation_id",
  lo."partner_id",
  0,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM "logistics_offers" lo
JOIN "logistics_requests" lr ON lr."id" = lo."request_id"
ON CONFLICT ("conversation_id", "user_id") DO NOTHING;
