-- FIX SARAH JOHNSON (owner1@demo.com)
-- User ID from error: ced5fabf-1d32-4de5-8ca2-29c6046e1f77

-- Link this specific user to an owner with RVs
UPDATE owners
SET user_id = 'ced5fabf-1d32-4de5-8ca2-29c6046e1f77'
WHERE id = (
    SELECT o.id
    FROM owners o
    LEFT JOIN assets a ON a.owner_id = o.id
    WHERE o.user_id IS NULL
    GROUP BY o.id
    HAVING COUNT(a.id) > 0
    ORDER BY COUNT(a.id) DESC
    LIMIT 1
);

-- Verify it worked - should show Sarah Johnson linked to an owner business
SELECT
    o.business_name,
    p.full_name as owner_name,
    p.email,
    COUNT(a.id) as rv_count
FROM owners o
LEFT JOIN profiles p ON p.id = o.user_id
LEFT JOIN assets a ON a.owner_id = o.id
WHERE o.user_id = 'ced5fabf-1d32-4de5-8ca2-29c6046e1f77'
GROUP BY o.business_name, p.full_name, p.email;
