-- FINAL OWNER FIX - RUN THESE ONE AT A TIME

-- 1. First, see the owner ID with most RVs
SELECT
    o.id,
    o.business_name,
    COUNT(a.id) as rv_count
FROM owners o
LEFT JOIN assets a ON a.owner_id = o.id
GROUP BY o.id, o.business_name
ORDER BY COUNT(a.id) DESC
LIMIT 5;

-- 2. Copy the FIRST owner ID from above results, then run this:
--    Replace 'PASTE-OWNER-ID-HERE' with the actual ID
UPDATE owners
SET user_id = (SELECT id FROM profiles WHERE email = 'owner1@demo.com')
WHERE id = 'PASTE-OWNER-ID-HERE';

-- 3. Copy the SECOND owner ID from results, then run this:
UPDATE owners
SET user_id = (SELECT id FROM profiles WHERE email = 'owner2@demo.com')
WHERE id = 'PASTE-SECOND-OWNER-ID-HERE';

-- 4. Verify it worked
SELECT
    o.business_name,
    p.email,
    p.full_name,
    COUNT(a.id) as rv_count
FROM owners o
LEFT JOIN profiles p ON p.id = o.user_id
LEFT JOIN assets a ON a.owner_id = o.id
WHERE p.email IN ('owner1@demo.com', 'owner2@demo.com')
GROUP BY o.business_name, p.email, p.full_name;
