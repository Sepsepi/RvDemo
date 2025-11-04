-- Fix Owner Profile Linkage
-- Links demo owner users to their owner records

-- Update the first two owners to link to our demo users
UPDATE owners
SET user_id = (SELECT id FROM profiles WHERE email = 'owner1@demo.com' LIMIT 1)
WHERE business_name = 'Sunshine RV Rentals';

UPDATE owners
SET user_id = (SELECT id FROM profiles WHERE email = 'owner2@demo.com' LIMIT 1)
WHERE business_name = 'Mountain View RV Co';

-- Verify the links
SELECT
  o.business_name,
  o.user_id,
  p.email,
  p.full_name
FROM owners o
LEFT JOIN profiles p ON p.id = o.user_id
WHERE o.business_name IN ('Sunshine RV Rentals', 'Mountain View RV Co');
