-- Fix RLS policies for lead_events and lead_notas using the new optimized function
DROP POLICY IF EXISTS "Membros da org podem ver eventos dos leads" ON lead_events;
DROP POLICY IF EXISTS "Membros da org podem inserir eventos" ON lead_events;
DROP POLICY IF EXISTS "Membros da org podem ver notas" ON lead_notas;
DROP POLICY IF EXISTS "Membros da org podem inserir notas" ON lead_notas;

CREATE POLICY "Membros da org podem ver eventos dos leads" ON lead_events FOR SELECT USING (organization_id IN (SELECT public.get_auth_user_organizations()));
CREATE POLICY "Membros da org podem inserir eventos" ON lead_events FOR INSERT WITH CHECK (organization_id IN (SELECT public.get_auth_user_organizations()));
CREATE POLICY "Membros da org podem ver notas" ON lead_notas FOR SELECT USING (organization_id IN (SELECT public.get_auth_user_organizations()));
CREATE POLICY "Membros da org podem inserir notas" ON lead_notas FOR INSERT WITH CHECK (organization_id IN (SELECT public.get_auth_user_organizations()));
