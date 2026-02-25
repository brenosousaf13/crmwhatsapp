-- Fix Row Level Security recursive or restricted subquery issues on ai_config

-- 1. Create a definitive RPC function that bypasses RLS on organization_members
-- to accurately verify if the current user is an admin or owner of the organization.
CREATE OR REPLACE FUNCTION public.is_org_admin(org_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_role TEXT;
BEGIN
  SELECT role INTO v_role 
  FROM public.organization_members 
  WHERE organization_id = org_id AND user_id = auth.uid();
  
  RETURN v_role IN ('owner', 'admin');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Create an RPC function to check if user is at least a member
CREATE OR REPLACE FUNCTION public.is_org_member(org_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_exists BOOLEAN;
BEGIN
  SELECT TRUE INTO v_exists 
  FROM public.organization_members 
  WHERE organization_id = org_id AND user_id = auth.uid();
  
  RETURN v_exists IS TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Drop existing flawed policies on ai_config
DROP POLICY IF EXISTS "Membros da org podem ver config IA" ON ai_config;
DROP POLICY IF EXISTS "Admins da org podem gerenciar config IA" ON ai_config;

-- 4. Re-create robust policies using the SECURITY DEFINER functions
CREATE POLICY "Membros da org podem ver config IA"
  ON ai_config FOR SELECT
  USING ( public.is_org_member(organization_id) );

CREATE POLICY "Admins da org podem gerenciar config IA"
  ON ai_config FOR ALL
  USING ( public.is_org_admin(organization_id) )
  WITH CHECK ( public.is_org_admin(organization_id) );

-- 5. Fix ai_knowledge_docs as well just in case
DROP POLICY IF EXISTS "Membros da org podem ver KB" ON ai_knowledge_docs;
DROP POLICY IF EXISTS "Admins da org podem gerenciar KB" ON ai_knowledge_docs;

CREATE POLICY "Membros da org podem ver KB"
  ON ai_knowledge_docs FOR SELECT
  USING ( public.is_org_member(organization_id) );

CREATE POLICY "Admins da org podem gerenciar KB"
  ON ai_knowledge_docs FOR ALL
  USING ( public.is_org_admin(organization_id) )
  WITH CHECK ( public.is_org_admin(organization_id) );
