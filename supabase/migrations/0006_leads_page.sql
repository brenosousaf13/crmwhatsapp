-- Migração 0006: Página de Leads — índices de busca e RLS faltantes
-- Habilitar extensão pg_trgm para busca fuzzy por nome/telefone/email
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Índices trigram para busca rápida
CREATE INDEX IF NOT EXISTS idx_leads_nome_trgm ON leads USING gin(nome gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_leads_telefone_trgm ON leads USING gin(telefone gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_leads_email_trgm ON leads USING gin(email gin_trgm_ops);

-- Índice para ordenação por criado_em (paginação)
CREATE INDEX IF NOT EXISTS idx_leads_criado_em ON leads(organization_id, criado_em DESC);

-- RLS faltante: update e delete em lead_notas
CREATE POLICY "Membros da org podem atualizar suas notas"
  ON lead_notas FOR UPDATE
  USING (
    user_id = auth.uid()
    AND organization_id IN (
      SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Membros da org podem excluir suas notas"
  ON lead_notas FOR DELETE
  USING (
    user_id = auth.uid()
    AND organization_id IN (
      SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
    )
  );
