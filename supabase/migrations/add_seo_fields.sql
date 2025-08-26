-- Add comprehensive SEO/AEO fields to prints table
ALTER TABLE public.prints ADD COLUMN IF NOT EXISTS meta_description TEXT;
ALTER TABLE public.prints ADD COLUMN IF NOT EXISTS long_description TEXT;
ALTER TABLE public.prints ADD COLUMN IF NOT EXISTS keywords TEXT[];
ALTER TABLE public.prints ADD COLUMN IF NOT EXISTS location TEXT;
ALTER TABLE public.prints ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE public.prints ADD COLUMN IF NOT EXISTS style TEXT[];
ALTER TABLE public.prints ADD COLUMN IF NOT EXISTS colors TEXT[];
ALTER TABLE public.prints ADD COLUMN IF NOT EXISTS mood TEXT[];
ALTER TABLE public.prints ADD COLUMN IF NOT EXISTS room_suggestions TEXT[];
ALTER TABLE public.prints ADD COLUMN IF NOT EXISTS artist_notes TEXT;
ALTER TABLE public.prints ADD COLUMN IF NOT EXISTS print_details TEXT;
ALTER TABLE public.prints ADD COLUMN IF NOT EXISTS care_instructions TEXT;
ALTER TABLE public.prints ADD COLUMN IF NOT EXISTS seo_data JSONB;
ALTER TABLE public.prints ADD COLUMN IF NOT EXISTS agent_context TEXT;
ALTER TABLE public.prints ADD COLUMN IF NOT EXISTS voice_search_terms TEXT[];

-- Add image metadata table for alt texts and captions
CREATE TABLE IF NOT EXISTS public.print_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  print_id UUID NOT NULL REFERENCES public.prints(id) ON DELETE CASCADE,
  image_type TEXT NOT NULL, -- 'main' or 'staged'
  image_path TEXT NOT NULL,
  alt_text TEXT,
  caption TEXT,
  seo_title TEXT,
  position INT DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_print_images_print_id ON public.print_images(print_id);
CREATE INDEX IF NOT EXISTS idx_prints_location ON public.prints(location);
CREATE INDEX IF NOT EXISTS idx_prints_category ON public.prints(category);
CREATE INDEX IF NOT EXISTS idx_prints_keywords ON public.prints USING GIN(keywords);

-- Enable full-text search on descriptions and keywords
ALTER TABLE public.prints ADD COLUMN IF NOT EXISTS search_vector tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(meta_description, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(long_description, '')), 'C') ||
    setweight(to_tsvector('english', coalesce(array_to_string(keywords, ' '), '')), 'D')
  ) STORED;

CREATE INDEX IF NOT EXISTS idx_prints_search ON public.prints USING GIN(search_vector);

-- Add RLS policies for new table
ALTER TABLE public.print_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "print_images_select_public"
  ON public.print_images FOR SELECT USING (true);

-- Update trigger for print_images
DROP TRIGGER IF EXISTS trg_print_images_updated_at ON public.print_images;
CREATE TRIGGER trg_print_images_updated_at
BEFORE UPDATE ON public.print_images
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();