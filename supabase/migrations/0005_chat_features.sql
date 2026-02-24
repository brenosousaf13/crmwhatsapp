-- Respostas rápidas (atalhos de texto para o chat)
CREATE TABLE IF NOT EXISTS respostas_rapidas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  atalho TEXT NOT NULL,             -- ex: "/saudacao", "/preco"
  titulo TEXT NOT NULL,             -- ex: "Saudação inicial"
  conteudo TEXT NOT NULL,           -- ex: "Olá {{name}}! Como posso ajudar?"
  criado_por UUID REFERENCES user_profiles(id),
  criado_em TIMESTAMPTZ DEFAULT now(),
  atualizado_em TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_respostas_rapidas_org ON respostas_rapidas(organization_id);
ALTER TABLE respostas_rapidas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Membros da org podem ver respostas rápidas"
  ON respostas_rapidas FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Membros da org podem gerenciar respostas rápidas"
  ON respostas_rapidas FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
    )
  );


-- Modificações e adições na tabela leads para suporte ao Chat
ALTER TABLE leads ADD COLUMN IF NOT EXISTS conversa_fixada BOOLEAN DEFAULT false;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS conversa_arquivada BOOLEAN DEFAULT false;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS ultima_mensagem_at TIMESTAMPTZ;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS mensagens_nao_lidas INTEGER DEFAULT 0;

-- Índices otimizados para listar e ordenar a tela de Chat (Conversations List)
CREATE INDEX IF NOT EXISTS idx_leads_ultima_msg ON leads(organization_id, ultima_mensagem_at DESC);
CREATE INDEX IF NOT EXISTS idx_leads_nao_lidas ON leads(organization_id, mensagens_nao_lidas) WHERE mensagens_nao_lidas > 0;

-- Função RPC (Remote Procedure Call) atômica para incrementar mensagens não lidas
CREATE OR REPLACE FUNCTION increment_nao_lidas(lead_row_id UUID)
RETURNS INTEGER AS $$
  UPDATE leads
  SET mensagens_nao_lidas = mensagens_nao_lidas + 1
  WHERE id = lead_row_id
  RETURNING mensagens_nao_lidas;
$$ LANGUAGE SQL;
