-- SIMPLE OWNER FIX
-- Links demo users to owners that actually have RVs

-- First, let's see which owners have RVs assigned
SELECT
    o.id,
    o.business_name,
    COUNT(a.id) as rv_count
FROM owners o
LEFT JOIN assets a ON a.owner_id = o.id
GROUP BY o.id, o.business_name
HAVING COUNT(a.id) > 0
ORDER BY rv_count DESC
LIMIT 10;

-- Now link the top 2 owners (with most RVs) to our demo users
-- Get the owner IDs with most RVs
WITH top_owners AS (
    SELECT
        o.id,
        o.business_name,
        COUNT(a.id) as rv_count,
        ROW_NUMBER() OVER (ORDER BY COUNT(a.id) DESC) as rank
    FROM owners o
    LEFT JOIN assets a ON a.owner_id = o.id
    GROUP BY o.id, o.business_name
    HAVING COUNT(a.id) > 0
)
UPDATE owners
SET user_id = (SELECT id FROM profiles WHERE email = 'owner1@demo.com')
WHERE id = (SELECT id FROM top_owners WHERE rank = 1);

WITH top_owners AS (
    SELECT
        o.id,
        o.business_name,
        COUNT(a.id) as rv_count,
        ROW_NUMBER() OVER (ORDER BY COUNT(a.id) DESC) as rank
    FROM owners o
    LEFT JOIN assets a ON a.owner_id = o.id
    GROUP BY o.id, o.business_name
    HAVING COUNT(a.id) > 0
)
UPDATE owners
SET user_id = (SELECT id FROM profiles WHERE email = 'owner2@demo.com')
WHERE id = (SELECT id FROM top_owners WHERE rank = 2);

-- Verify the links
SELECT
    o.business_name,
    o.user_id,
    p.email as owner_email,
    p.full_name,
    COUNT(a.id) as rv_count
FROM owners o
LEFT JOIN profiles p ON p.id = o.user_id
LEFT JOIN assets a ON a.owner_id = o.id
WHERE o.user_id IS NOT NULL
GROUP BY o.business_name, o.user_id, p.email, p.full_name;
