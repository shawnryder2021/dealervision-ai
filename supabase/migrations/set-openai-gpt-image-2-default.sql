-- Set OpenAI GPT Image 2 as the platform default image model

ALTER TABLE IF EXISTS platform_settings
  ALTER COLUMN default_image_model SET DEFAULT 'openai-gpt-image-2';

UPDATE platform_settings
SET default_image_model = 'openai-gpt-image-2',
    updated_at = NOW()
WHERE id = 1;

ALTER TABLE IF EXISTS dealerships
  ALTER COLUMN image_model SET DEFAULT 'openai-gpt-image-2';
