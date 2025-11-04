-- SUPER SIMPLE FIX - Run each query ONE AT A TIME

-- 1. First, find ANY owner with RVs
SELECT id, business_name FROM owners WHERE id IN (SELECT owner_id FROM assets LIMIT 1);

-- 2. Copy the ID from above, then run this (replace YOUR-OWNER-ID):
-- UPDATE owners SET user_id = 'ced5fabf-1d32-4de5-8ca2-29c6046e1f77' WHERE id = 'YOUR-OWNER-ID';

-- 3. Check it worked:
SELECT * FROM owners WHERE user_id = 'ced5fabf-1d32-4de5-8ca2-29c6046e1f77';

-- If step 3 shows a row, you're done! If not, try this alternative:

-- 4. Get the FIRST owner from assets
SELECT DISTINCT owner_id FROM assets LIMIT 1;

-- 5. Use that owner_id in this update:
-- UPDATE owners SET user_id = 'ced5fabf-1d32-4de5-8ca2-29c6046e1f77' WHERE id = 'PASTE-OWNER-ID-FROM-STEP-4';

-- 6. Final verification - MUST return 1 row:
SELECT o.*, COUNT(a.id) as rv_count
FROM owners o
LEFT JOIN assets a ON a.owner_id = o.id
WHERE o.user_id = 'ced5fabf-1d32-4de5-8ca2-29c6046e1f77'
GROUP BY o.id;
