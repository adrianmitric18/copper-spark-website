-- Create public storage bucket for assets (logo, etc.)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('assets', 'assets', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access to all files in assets bucket
CREATE POLICY "Public assets are accessible to everyone"
ON storage.objects FOR SELECT
USING (bucket_id = 'assets');

-- Allow authenticated users to upload to assets bucket (for admin)
CREATE POLICY "Anyone can upload assets"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'assets');