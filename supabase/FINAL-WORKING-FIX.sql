-- FINAL WORKING FIX
-- Copy and paste this ENTIRE thing into Supabase SQL Editor and click RUN

-- This updates the FIRST owner with RVs to link to Sarah Johnson
WITH first_owner_with_rvs AS (
    SELECT o.id
    FROM owners o
    INNER JOIN assets a ON a.owner_id = o.id
    GROUP BY o.id
    HAVING COUNT(a.id) > 0
    LIMIT 1
)
UPDATE owners
SET user_id = 'ced5fabf-1d32-4de5-8ca2-29c6046e1f77'
WHERE id = (SELECT id FROM first_owner_with_rvs);

-- Verify it worked - should show 1 row with Sarah Johnson
SELECT
    o.business_name,
    p.full_name as "Owner Name",
    p.email,
    COUNT(a.id) as "Number of RVs"
FROM owners o
JOIN profiles p ON p.id = o.user_id
LEFT JOIN assets a ON a.owner_id = o.id
WHERE o.user_id = 'ced5fabf-1d32-4de5-8ca2-29c6046e1f77'
GROUP BY o.business_name, p.full_name, p.email;
