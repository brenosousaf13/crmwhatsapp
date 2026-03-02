-- Tabela lead_notas (para observações registradas pela IA)
CREATE TABLE IF NOT EXISTS lead_notas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  conteudo TEXT NOT NULL,
  criado_por UUID REFERENCES auth.users(id), -- NULL quando criado pela IA
  criado_em TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_lead_notas_lead ON lead_notas(lead_id, criado_em DESC);
ALTER TABLE lead_notas ENABLE ROW LEVEL SECURITY;

-- Drop policy to ensure idempotency
DROP POLICY IF EXISTS "Membros da org podem ver notas" ON lead_notas;
CREATE POLICY "Membros da org podem ver notas" ON lead_notas
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
    )
  );


-- Tabela lead_events (para histórico de ações)
CREATE TABLE IF NOT EXISTS lead_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL,
  descricao TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  criado_em TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_lead_events_lead ON lead_events(lead_id, criado_em DESC);
ALTER TABLE lead_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Membros da org podem ver eventos" ON lead_events;
CREATE POLICY "Membros da org podem ver eventos" ON lead_events
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
    )
  );


-- Tabela lead_tags (associação lead <> tag)
CREATE TABLE IF NOT EXISTS lead_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  criado_em TIMESTAMPTZ DEFAULT now(),
  UNIQUE(lead_id, tag_id)
);

-- Adicionar organization_id para suportar retrocompatibilidade se a tabela já existir de migrations passadas
ALTER TABLE lead_tags ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

-- Preencher os dados legados copiando a organization do lead_id
UPDATE lead_tags
SET organization_id = leads.organization_id
FROM leads
WHERE lead_tags.lead_id = leads.id AND lead_tags.organization_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_lead_tags_lead ON lead_tags(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_tags_tag ON lead_tags(tag_id);
ALTER TABLE lead_tags ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Membros da org podem ver lead_tags" ON lead_tags;
CREATE POLICY "Membros da org podem ver lead_tags" ON lead_tags
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
    )
  );


-- Campo email no leads (se não existir)
ALTER TABLE leads ADD COLUMN IF NOT EXISTS email TEXT;

-- Campos de pausa da IA no leads (se não existirem)
ALTER TABLE leads ADD COLUMN IF NOT EXISTS ia_pausada BOOLEAN DEFAULT false;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS ia_pausada_em TIMESTAMPTZ;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS ia_pausada_por TEXT;

-- Campo enviada_por_ia no mensagens (se não existir)
ALTER TABLE mensagens ADD COLUMN IF NOT EXISTS enviada_por_ia BOOLEAN DEFAULT false;
