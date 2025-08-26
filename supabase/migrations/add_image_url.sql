-- Add image_url column to prints table if it doesn't exist
ALTER TABLE public.prints ADD COLUMN IF NOT EXISTS image_url TEXT;