-- Update existing RVs with local professional images
-- Uses type-specific images from /public/rv-images/

-- Class A Motorhomes
UPDATE assets
SET
  primary_image_url = '/rv-images/class-a/class-a-' || ((ROW_NUMBER() OVER (PARTITION BY rv_type ORDER BY id) - 1) % 8 + 1) || '.jpg',
  image_urls = ARRAY[
    '/rv-images/class-a/class-a-' || ((ROW_NUMBER() OVER (PARTITION BY rv_type ORDER BY id) - 1) % 8 + 1) || '.jpg',
    '/rv-images/class-a/class-a-' || ((ROW_NUMBER() OVER (PARTITION BY rv_type ORDER BY id)) % 8 + 1) || '.jpg',
    '/rv-images/class-a/class-a-' || ((ROW_NUMBER() OVER (PARTITION BY rv_type ORDER BY id) + 1) % 8 + 1) || '.jpg'
  ]
WHERE rv_type = 'Class A';

-- Class B Vans
UPDATE assets
SET
  primary_image_url = '/rv-images/class-b/class-b-' || ((ROW_NUMBER() OVER (PARTITION BY rv_type ORDER BY id) - 1) % 8 + 1) || '.jpg',
  image_urls = ARRAY[
    '/rv-images/class-b/class-b-' || ((ROW_NUMBER() OVER (PARTITION BY rv_type ORDER BY id) - 1) % 8 + 1) || '.jpg',
    '/rv-images/class-b/class-b-' || ((ROW_NUMBER() OVER (PARTITION BY rv_type ORDER BY id)) % 8 + 1) || '.jpg',
    '/rv-images/class-b/class-b-' || ((ROW_NUMBER() OVER (PARTITION BY rv_type ORDER BY id) + 1) % 8 + 1) || '.jpg'
  ]
WHERE rv_type = 'Class B';

-- Class C Motorhomes
UPDATE assets
SET
  primary_image_url = '/rv-images/class-c/class-c-' || ((ROW_NUMBER() OVER (PARTITION BY rv_type ORDER BY id) - 1) % 8 + 1) || '.jpg',
  image_urls = ARRAY[
    '/rv-images/class-c/class-c-' || ((ROW_NUMBER() OVER (PARTITION BY rv_type ORDER BY id) - 1) % 8 + 1) || '.jpg',
    '/rv-images/class-c/class-c-' || ((ROW_NUMBER() OVER (PARTITION BY rv_type ORDER BY id)) % 8 + 1) || '.jpg',
    '/rv-images/class-c/class-c-' || ((ROW_NUMBER() OVER (PARTITION BY rv_type ORDER BY id) + 1) % 8 + 1) || '.jpg'
  ]
WHERE rv_type = 'Class C';

-- Travel Trailers
UPDATE assets
SET
  primary_image_url = '/rv-images/travel-trailer/travel-trailer-' || ((ROW_NUMBER() OVER (PARTITION BY rv_type ORDER BY id) - 1) % 8 + 1) || '.jpg',
  image_urls = ARRAY[
    '/rv-images/travel-trailer/travel-trailer-' || ((ROW_NUMBER() OVER (PARTITION BY rv_type ORDER BY id) - 1) % 8 + 1) || '.jpg',
    '/rv-images/travel-trailer/travel-trailer-' || ((ROW_NUMBER() OVER (PARTITION BY rv_type ORDER BY id)) % 8 + 1) || '.jpg',
    '/rv-images/travel-trailer/travel-trailer-' || ((ROW_NUMBER() OVER (PARTITION BY rv_type ORDER BY id) + 1) % 8 + 1) || '.jpg'
  ]
WHERE rv_type = 'Travel Trailer';

-- Fifth Wheels
UPDATE assets
SET
  primary_image_url = '/rv-images/fifth-wheel/fifth-wheel-' || ((ROW_NUMBER() OVER (PARTITION BY rv_type ORDER BY id) - 1) % 8 + 1) || '.jpg',
  image_urls = ARRAY[
    '/rv-images/fifth-wheel/fifth-wheel-' || ((ROW_NUMBER() OVER (PARTITION BY rv_type ORDER BY id) - 1) % 8 + 1) || '.jpg',
    '/rv-images/fifth-wheel/fifth-wheel-' || ((ROW_NUMBER() OVER (PARTITION BY rv_type ORDER BY id)) % 8 + 1) || '.jpg',
    '/rv-images/fifth-wheel/fifth-wheel-' || ((ROW_NUMBER() OVER (PARTITION BY rv_type ORDER BY id) + 1) % 8 + 1) || '.jpg'
  ]
WHERE rv_type = 'Fifth Wheel';

-- Verify images were updated
SELECT rv_type, name, primary_image_url
FROM assets
ORDER BY rv_type, name
LIMIT 10;
