-- Migration: General Settings Data Architecture

-- 1. Organizations Expansions
ALTER TABLE public.organizations 
  ADD COLUMN IF NOT EXISTS logo_url TEXT,
  ADD COLUMN IF NOT EXISTS segmento TEXT,
  ADD COLUMN IF NOT EXISTS website TEXT,
  ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'America/Sao_Paulo',
  ADD COLUMN IF NOT EXISTS moeda TEXT DEFAULT 'BRL',
  ADD COLUMN IF NOT EXISTS phone_format TEXT DEFAULT 'BR',
  ADD COLUMN IF NOT EXISTS email TEXT,
  ADD COLUMN IF NOT EXISTS telefone TEXT,
  ADD COLUMN IF NOT EXISTS endereco TEXT;

-- 2. Kanban Stages Expansions
ALTER TABLE public.etapas_kanban 
  ADD COLUMN IF NOT EXISTS tipo TEXT DEFAULT 'normal' CHECK (tipo IN ('normal', 'ganho', 'perdido'));

-- Update existing stages to mark Win/Loss based on naive name matching if they don't have it set
UPDATE public.etapas_kanban SET tipo = 'ganho' WHERE nome ILIKE '%ganho%' AND tipo = 'normal';
UPDATE public.etapas_kanban SET tipo = 'perdido' WHERE nome ILIKE '%perdido%' AND tipo = 'normal';

-- 3. Tags Expansions
ALTER TABLE public.tags 
  ADD COLUMN IF NOT EXISTS cor TEXT DEFAULT '#6B7280';

-- 4. Storage Bucket for Logos
INSERT INTO storage.buckets (id, name, public) 
VALUES ('organization-logos', 'organization-logos', true)
ON CONFLICT (id) DO NOTHING;

-- 5. Storage Policies for Logos bucket
-- Allow public read access to logos
CREATE POLICY "Public Access for Logos" ON storage.objects
  FOR SELECT USING (bucket_id = 'organization-logos');

-- Allow authenticated users to upload/manage logos
CREATE POLICY "Auth Users Manage Logos" ON storage.objects
  FOR ALL USING (
    bucket_id = 'organization-logos' AND 
    auth.role() = 'authenticated'
  )
  WITH CHECK (
    bucket_id = 'organization-logos' AND 
    auth.role() = 'authenticated'
  );
