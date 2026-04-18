-- 1) For categories root: duplicate sort_order where parent_id is null
SELECT 'Category Root duplicates:' as check_type;
SELECT parent_id, sort_order, COUNT(*)
FROM categories
WHERE parent_id IS NULL
GROUP BY parent_id, sort_order
HAVING COUNT(*) > 1;

-- 2) For categories children: duplicate (parent_id, sort_order) where parent_id is not null
SELECT 'Category Children duplicates:' as check_type;
SELECT parent_id, sort_order, COUNT(*)
FROM categories
WHERE parent_id IS NOT NULL
GROUP BY parent_id, sort_order
HAVING COUNT(*) > 1;

-- 3) For sectors: duplicate sort_order
SELECT 'Sector duplicates:' as check_type;
SELECT sort_order, COUNT(*)
FROM sectors
GROUP BY sort_order
HAVING COUNT(*) > 1;
