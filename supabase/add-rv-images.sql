-- Add RV Images to Existing Records
-- Uses free Unsplash RV/camping photos

WITH image_urls AS (
  SELECT unnest(ARRAY[
    'https://images.unsplash.com/photo-1527786356703-4b100091cd2c?w=800',
    'https://images.unsplash.com/photo-1464219789935-c2d9d9aba644?w=800',
    'https://images.unsplash.com/photo-1558859798-acb7dfa50742?w=800',
    'https://images.unsplash.com/photo-1523987355523-c7b5b0dd90a7?w=800',
    'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800',
    'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=800',
    'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=800',
    'https://images.unsplash.com/photo-1482192505345-5655af888f49?w=800',
    'https://images.unsplash.com/photo-1533587851505-d119e13fa0d7?w=800',
    'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800'
  ]) AS url
),
numbered_assets AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at) as rn
  FROM assets
),
numbered_images AS (
  SELECT url, ROW_NUMBER() OVER () as rn
  FROM image_urls
)
UPDATE assets
SET
  primary_image_url = ni.url,
  image_urls = ARRAY[ni.url]
FROM numbered_assets na
JOIN numbered_images ni ON ((na.rn - 1) % 10) + 1 = ni.rn
WHERE assets.id = na.id;

-- Verify images were added
SELECT name, primary_image_url FROM assets LIMIT 5;
