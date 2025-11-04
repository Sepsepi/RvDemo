-- FIX ALL OWNERS WITH RVS
-- This ensures EVERY owner that has RVs can receive messages

-- Step 1: See which owners have RVs but NO user_id
SELECT
    o.id,
    o.business_name,
    o.user_id,
    COUNT(a.id) as rv_count
FROM owners o
LEFT JOIN assets a ON a.owner_id = o.id
GROUP BY o.id, o.business_name, o.user_id
HAVING COUNT(a.id) > 0
ORDER BY COUNT(a.id) DESC;

-- Step 2: For the first owner without user_id, link to owner1@demo.com
UPDATE owners
SET user_id = (SELECT id FROM profiles WHERE email = 'owner1@demo.com')
WHERE id IN (
    SELECT o.id
    FROM owners o
    LEFT JOIN assets a ON a.owner_id = o.id
    WHERE o.user_id IS NULL
    GROUP BY o.id
    HAVING COUNT(a.id) > 0
    ORDER BY COUNT(a.id) DESC
    LIMIT 1
);

-- Step 3: For the second owner without user_id, link to owner2@demo.com
UPDATE owners
SET user_id = (SELECT id FROM profiles WHERE email = 'owner2@demo.com')
WHERE id IN (
    SELECT o.id
    FROM owners o
    LEFT JOIN assets a ON a.owner_id = o.id
    WHERE o.user_id IS NULL
    GROUP BY o.id
    HAVING COUNT(a.id) > 0
    ORDER BY COUNT(a.id) DESC
    LIMIT 1
);

-- Step 4: For ALL remaining owners with RVs, create dummy user_ids
-- We'll use the manager account as a fallback so messages can be sent
UPDATE owners
SET user_id = (SELECT id FROM profiles WHERE email = 'manager@demo.com')
WHERE user_id IS NULL
AND id IN (
    SELECT o.id
    FROM owners o
    LEFT JOIN assets a ON a.owner_id = o.id
    GROUP BY o.id
    HAVING COUNT(a.id) > 0
);

-- Step 5: Verify ALL owners with RVs now have user_id
SELECT
    o.business_name,
    o.user_id IS NOT NULL as has_user,
    p.email as linked_to,
    COUNT(a.id) as rv_count
FROM owners o
LEFT JOIN assets a ON a.owner_id = o.id
LEFT JOIN profiles p ON p.id = o.user_id
GROUP BY o.business_name, o.user_id, p.email
HAVING COUNT(a.id) > 0
ORDER BY COUNT(a.id) DESC;
