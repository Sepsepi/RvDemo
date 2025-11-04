-- Remove broken Unsplash image URLs
-- Set all images to NULL so placeholders show instead

UPDATE assets
SET
  primary_image_url = NULL,
  image_urls = NULL
WHERE primary_image_url LIKE '%unsplash%';

-- Verify - should show NULL for images
SELECT name, primary_image_url
FROM assets
LIMIT 10;
