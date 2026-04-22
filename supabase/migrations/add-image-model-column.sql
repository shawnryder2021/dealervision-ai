-- Add image generation model selection to dealerships
-- Allows per-dealership configuration of which AI model to use for image generation
-- Defaults to KIE.ai's nano-banana-2 for backward compatibility

ALTER TABLE dealerships
ADD COLUMN IF NOT EXISTS image_model TEXT DEFAULT 'kie-nano-banana'
CHECK (image_model IN ('kie-nano-banana', 'openai-gpt-image-2'));

-- Add comment for clarity
COMMENT ON COLUMN dealerships.image_model IS 'AI model used for image generation. Values: kie-nano-banana (default), openai-gpt-image-2. Can be overridden at dealership level or set globally via admin.';

-- Create index for efficient lookups when determining which model to use
CREATE INDEX IF NOT EXISTS idx_dealerships_image_model ON dealerships(image_model);
