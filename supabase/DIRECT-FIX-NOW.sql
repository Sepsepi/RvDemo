-- DIRECT FIX - Links Sarah Johnson to an owner business NOW

-- First, find an owner business with RVs
SELECT id, business_name, user_id
FROM owners
WHERE id IN (
    SELECT DISTINCT owner_id
    FROM assets
    WHERE owner_id IS NOT NULL
    LIMIT 1
);

-- Use the ID from above and run this:
-- This forces the link regardless of existing user_id
UPDATE owners
SET user_id = 'ced5fabf-1d32-4de5-8ca2-29c6046e1f77'
WHERE id = (
    SELECT DISTINCT owner_id
    FROM assets
    WHERE owner_id IS NOT NULL
    LIMIT 1
);

-- Verify it worked
SELECT
    o.business_name,
    p.full_name,
    p.email,
    COUNT(a.id) as rv_count
FROM owners o
JOIN profiles p ON p.id = o.user_id
LEFT JOIN assets a ON a.owner_id = o.id
WHERE o.user_id = 'ced5fabf-1d32-4de5-8ca2-29c6046e1f77'
GROUP BY o.business_name, p.full_name, p.email;
