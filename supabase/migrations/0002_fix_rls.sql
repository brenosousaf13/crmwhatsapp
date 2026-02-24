-- Fixes the infinite recursion bug in the organization_members RLS policy and optimizes global checks

-- 1. Drop the flawed recursive policy
DROP POLICY IF EXISTS "Users can view members of their organizations" ON organization_members;
DROP POLICY IF EXISTS "Users can view their own organizations" ON organizations;

-- 2. Create a bypass function to safely get the user's organizations without triggering RLS recursively
CREATE OR REPLACE FUNCTION public.get_auth_user_organizations()
RETURNS SETOF uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT organization_id FROM organization_members WHERE user_id = auth.uid();
$$;

-- 3. Replace Core Policies
CREATE POLICY "Users can view their own membership" ON organization_members
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can view other members in same organization" ON organization_members
  FOR SELECT USING (organization_id IN (SELECT public.get_auth_user_organizations()));

CREATE POLICY "Users can view their own organizations" ON organizations
  FOR SELECT USING (id IN (SELECT public.get_auth_user_organizations()));

-- 4. Replace and Optimize Generic Policies across the CRM
-- Doing this prevents Postgres from repeatedly scanning organization_members and risking recursion

-- whatsapp_configs
DROP POLICY IF EXISTS "Users can view org whatsapp configs" ON whatsapp_configs;
CREATE POLICY "Users can view org whatsapp configs" ON whatsapp_configs
  FOR SELECT USING (organization_id IN (SELECT public.get_auth_user_organizations()));

-- etapas_kanban
DROP POLICY IF EXISTS "Users can view org etapas" ON etapas_kanban;
DROP POLICY IF EXISTS "Users can insert org etapas" ON etapas_kanban;
DROP POLICY IF EXISTS "Users can update org etapas" ON etapas_kanban;
DROP POLICY IF EXISTS "Users can delete org etapas" ON etapas_kanban;

CREATE POLICY "Users can view org etapas" ON etapas_kanban FOR SELECT USING (organization_id IN (SELECT public.get_auth_user_organizations()));
CREATE POLICY "Users can insert org etapas" ON etapas_kanban FOR INSERT WITH CHECK (organization_id IN (SELECT public.get_auth_user_organizations()));
CREATE POLICY "Users can update org etapas" ON etapas_kanban FOR UPDATE USING (organization_id IN (SELECT public.get_auth_user_organizations()));
CREATE POLICY "Users can delete org etapas" ON etapas_kanban FOR DELETE USING (organization_id IN (SELECT public.get_auth_user_organizations()));

-- tags
DROP POLICY IF EXISTS "Users can view org tags" ON tags;
DROP POLICY IF EXISTS "Users can insert org tags" ON tags;
DROP POLICY IF EXISTS "Users can update org tags" ON tags;
DROP POLICY IF EXISTS "Users can delete org tags" ON tags;

CREATE POLICY "Users can view org tags" ON tags FOR SELECT USING (organization_id IN (SELECT public.get_auth_user_organizations()));
CREATE POLICY "Users can insert org tags" ON tags FOR INSERT WITH CHECK (organization_id IN (SELECT public.get_auth_user_organizations()));
CREATE POLICY "Users can update org tags" ON tags FOR UPDATE USING (organization_id IN (SELECT public.get_auth_user_organizations()));
CREATE POLICY "Users can delete org tags" ON tags FOR DELETE USING (organization_id IN (SELECT public.get_auth_user_organizations()));

-- leads
DROP POLICY IF EXISTS "Users can view org leads" ON leads;
DROP POLICY IF EXISTS "Users can insert org leads" ON leads;
DROP POLICY IF EXISTS "Users can update org leads" ON leads;
DROP POLICY IF EXISTS "Users can delete org leads" ON leads;

CREATE POLICY "Users can view org leads" ON leads FOR SELECT USING (organization_id IN (SELECT public.get_auth_user_organizations()));
CREATE POLICY "Users can insert org leads" ON leads FOR INSERT WITH CHECK (organization_id IN (SELECT public.get_auth_user_organizations()));
CREATE POLICY "Users can update org leads" ON leads FOR UPDATE USING (organization_id IN (SELECT public.get_auth_user_organizations()));
CREATE POLICY "Users can delete org leads" ON leads FOR DELETE USING (organization_id IN (SELECT public.get_auth_user_organizations()));

-- mensagens
DROP POLICY IF EXISTS "Users can view org mensagens" ON mensagens;
DROP POLICY IF EXISTS "Users can insert org mensagens" ON mensagens;

CREATE POLICY "Users can view org mensagens" ON mensagens FOR SELECT USING (organization_id IN (SELECT public.get_auth_user_organizations()));
CREATE POLICY "Users can insert org mensagens" ON mensagens FOR INSERT WITH CHECK (organization_id IN (SELECT public.get_auth_user_organizations()));

-- atendimentos
DROP POLICY IF EXISTS "Users can view org atendimentos" ON atendimentos;
DROP POLICY IF EXISTS "Users can insert org atendimentos" ON atendimentos;
DROP POLICY IF EXISTS "Users can update org atendimentos" ON atendimentos;

CREATE POLICY "Users can view org atendimentos" ON atendimentos FOR SELECT USING (organization_id IN (SELECT public.get_auth_user_organizations()));
CREATE POLICY "Users can insert org atendimentos" ON atendimentos FOR INSERT WITH CHECK (organization_id IN (SELECT public.get_auth_user_organizations()));
CREATE POLICY "Users can update org atendimentos" ON atendimentos FOR UPDATE USING (organization_id IN (SELECT public.get_auth_user_organizations()));

-- lead_tags (requires a join with leads to check organization_id)
DROP POLICY IF EXISTS "Users can view org lead tags" ON lead_tags;
DROP POLICY IF EXISTS "Users can insert org lead tags" ON lead_tags;
DROP POLICY IF EXISTS "Users can delete org lead tags" ON lead_tags;

CREATE POLICY "Users can view org lead tags" ON lead_tags FOR SELECT USING (
  EXISTS (SELECT 1 FROM leads WHERE id = lead_tags.lead_id AND organization_id IN (SELECT public.get_auth_user_organizations()))
);
CREATE POLICY "Users can insert org lead tags" ON lead_tags FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM leads WHERE id = lead_tags.lead_id AND organization_id IN (SELECT public.get_auth_user_organizations()))
);
CREATE POLICY "Users can delete org lead tags" ON lead_tags FOR DELETE USING (
  EXISTS (SELECT 1 FROM leads WHERE id = lead_tags.lead_id AND organization_id IN (SELECT public.get_auth_user_organizations()))
);
