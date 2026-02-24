-- Migração 0001: Funcionalidades do Kanban
-- Extensão da tabela de leads e criação de tabelas de histórico e notas

-- 1. Adicionar campos extras na tabela leads (se ainda não existirem)
ALTER TABLE leads ADD COLUMN IF NOT EXISTS valor_venda DECIMAL(10,2);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS motivo_perda TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS notas TEXT;

-- 2. Histórico de eventos do lead (para tab Histórico)
CREATE TABLE lead_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL, -- 'criado', 'etapa_alterada', 'tag_adicionada', 'tag_removida', 'atendente_alterado', 'nota_adicionada', 'venda_fechada', 'perda_registrada'
  descricao TEXT NOT NULL,
  metadata JSONB DEFAULT '{}', -- dados extras (ex: { "de": "Novo", "para": "Em contato", "valor": 5000 })
  user_id UUID REFERENCES user_profiles(id),
  criado_em TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_lead_events_lead_id ON lead_events(lead_id);
CREATE INDEX idx_lead_events_org_id ON lead_events(organization_id);

ALTER TABLE lead_events ENABLE ROW LEVEL SECURITY;

-- RLS: mesma lógica das outras tabelas (filtrar por organization_id via membership)
CREATE POLICY "Membros da org podem ver eventos dos leads"
  ON lead_events FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Membros da org podem inserir eventos"
  ON lead_events FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
    )
  );

-- 3. Tabela de notas do lead
CREATE TABLE lead_notas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  conteudo TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES user_profiles(id),
  criado_em TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_lead_notas_lead_id ON lead_notas(lead_id);
ALTER TABLE lead_notas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Membros da org podem ver notas"
  ON lead_notas FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Membros da org podem inserir notas"
  ON lead_notas FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
    )
  );
