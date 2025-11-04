-- COMPLETE OWNER FIX
-- This ensures ALL owners can be messaged and all owner pages work

-- Step 1: Link existing demo users to owners
UPDATE owners
SET user_id = (SELECT id FROM profiles WHERE email = 'owner1@demo.com')
WHERE business_name = 'Sunshine RV Rentals';

UPDATE owners
SET user_id = (SELECT id FROM profiles WHERE email = 'owner2@demo.com')
WHERE business_name = 'Mountain View RV Co';

-- Step 2: For ALL other owners without user_id, create profiles for them
-- This allows renters to message ANY owner

DO $$
DECLARE
    owner_record RECORD;
    new_user_id UUID;
BEGIN
    FOR owner_record IN
        SELECT id, business_name
        FROM owners
        WHERE user_id IS NULL
    LOOP
        -- Create a profile for this owner
        INSERT INTO profiles (id, email, full_name, role)
        VALUES (
            gen_random_uuid(),
            lower(replace(owner_record.business_name, ' ', '')) || '@owner.demo',
            owner_record.business_name,
            'owner'::user_role
        )
        RETURNING id INTO new_user_id;

        -- Link owner to new profile
        UPDATE owners
        SET user_id = new_user_id
        WHERE id = owner_record.id;
    END LOOP;
END $$;

-- Step 3: Verify ALL owners now have user_id
SELECT
    o.business_name,
    o.user_id IS NOT NULL as has_user_id,
    p.email,
    p.full_name,
    p.role
FROM owners o
LEFT JOIN profiles p ON p.id = o.user_id
ORDER BY o.business_name
LIMIT 10;

-- Step 4: Count how many owners are now linked
SELECT
    COUNT(*) as total_owners,
    COUNT(user_id) as owners_with_profiles
FROM owners;
