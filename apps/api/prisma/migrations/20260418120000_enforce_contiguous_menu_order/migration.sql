-- Ensure existing category sort orders are gapless and deterministic per sibling group.
WITH ranked_categories AS (
  SELECT
    id,
    ROW_NUMBER() OVER (
      PARTITION BY parent_id
      ORDER BY is_active DESC, sort_order ASC, name ASC, id ASC
    ) - 1 AS next_sort_order
  FROM categories
)
UPDATE categories AS category
SET sort_order = ranked.next_sort_order
FROM ranked_categories AS ranked
WHERE category.id = ranked.id
  AND category.sort_order <> ranked.next_sort_order;

-- Ensure existing sector sort orders are gapless and deterministic.
WITH ranked_sectors AS (
  SELECT
    id,
    ROW_NUMBER() OVER (
      ORDER BY is_active DESC, sort_order ASC, name ASC, id ASC
    ) - 1 AS next_sort_order
  FROM sectors
)
UPDATE sectors AS sector
SET sort_order = ranked.next_sort_order
FROM ranked_sectors AS ranked
WHERE sector.id = ranked.id
  AND sector.sort_order <> ranked.next_sort_order;

-- Enforce unique menu order for categories by sibling group.
-- Root categories need a separate partial index because parent_id is NULL.
CREATE UNIQUE INDEX IF NOT EXISTS categories_root_sort_order_unique
  ON categories (sort_order)
  WHERE parent_id IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS categories_parent_sort_order_unique
  ON categories (parent_id, sort_order)
  WHERE parent_id IS NOT NULL;

-- Enforce unique menu order for sectors.
CREATE UNIQUE INDEX IF NOT EXISTS sectors_sort_order_unique
  ON sectors (sort_order);
