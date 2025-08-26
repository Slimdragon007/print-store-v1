-- Create prints table
CREATE TABLE IF NOT EXISTS prints (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  image_url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create print_variants table
CREATE TABLE IF NOT EXISTS print_variants (
  id TEXT PRIMARY KEY,
  print_id TEXT NOT NULL REFERENCES prints(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  stripe_price_id TEXT NOT NULL,
  price_cents INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create indexes
CREATE INDEX idx_print_variants_print_id ON print_variants(print_id);

-- Enable RLS (Row Level Security)
ALTER TABLE prints ENABLE ROW LEVEL SECURITY;
ALTER TABLE print_variants ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access
CREATE POLICY "Public prints are viewable by everyone" ON prints
  FOR SELECT USING (true);

CREATE POLICY "Public print variants are viewable by everyone" ON print_variants
  FOR SELECT USING (true);

-- Create storage bucket for print images
INSERT INTO storage.buckets (id, name, public)
VALUES ('prints', 'prints', true)
ON CONFLICT DO NOTHING;