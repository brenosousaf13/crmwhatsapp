-- ============================================================
-- Configuração principal da IA por organização
-- ============================================================
CREATE TABLE IF NOT EXISTS ai_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL UNIQUE REFERENCES organizations(id) ON DELETE CASCADE,

  -- Status
  enabled BOOLEAN DEFAULT false,

  -- Provider e modelo
  provider TEXT NOT NULL DEFAULT 'openai' CHECK (provider IN ('openai', 'anthropic', 'google')),
  api_key TEXT NOT NULL DEFAULT '',              -- Criptografado AES-256-GCM
  model TEXT NOT NULL DEFAULT 'gpt-4.1-mini',
  openai_key_for_whisper TEXT,                    -- Chave separada para transcrição de áudio (criptografada)

  -- Prompt
  system_prompt TEXT NOT NULL DEFAULT '',
  enabled_tools TEXT[] DEFAULT ARRAY['mover_lead_etapa', 'qualificar_lead', 'adicionar_tag', 'transferir_humano', 'registrar_info', 'encerrar_conversa'],

  -- Comportamento
  temperature REAL DEFAULT 0.7,
  context_window INTEGER DEFAULT 15,
  concat_delay_seconds INTEGER DEFAULT 20,
  response_delay_ms INTEGER DEFAULT 1500,

  -- Horário
  business_hours_enabled BOOLEAN DEFAULT false,
  business_hours JSONB DEFAULT '{
    "seg": {"inicio": "08:00", "fim": "22:00", "ativo": true},
    "ter": {"inicio": "08:00", "fim": "22:00", "ativo": true},
    "qua": {"inicio": "08:00", "fim": "22:00", "ativo": true},
    "qui": {"inicio": "08:00", "fim": "22:00", "ativo": true},
    "sex": {"inicio": "08:00", "fim": "22:00", "ativo": true},
    "sab": {"inicio": "09:00", "fim": "18:00", "ativo": true},
    "dom": {"inicio": "00:00", "fim": "00:00", "ativo": false}
  }',
  out_of_hours_message TEXT,

  -- Pausa e retomada
  auto_pause_on_human BOOLEAN DEFAULT true,
  auto_resume_hours INTEGER DEFAULT 4,           -- 0 = nunca retoma

  -- Qualificação
  generate_insights BOOLEAN DEFAULT true,
  qualified_stage_id UUID REFERENCES etapas_kanban(id),

  -- Timestamps
  criado_em TIMESTAMPTZ DEFAULT now(),
  atualizado_em TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE ai_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Membros da org podem ver config IA"
  ON ai_config FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins da org podem gerenciar config IA"
  ON ai_config FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- ============================================================
-- Base de conhecimento (documentos)
-- ============================================================
CREATE TABLE IF NOT EXISTS ai_knowledge_docs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  file_size INTEGER NOT NULL,                     -- em bytes
  file_path TEXT NOT NULL,                         -- caminho no Supabase Storage
  content TEXT NOT NULL,                            -- texto extraído
  char_count INTEGER NOT NULL,
  status TEXT DEFAULT 'processed' CHECK (status IN ('processing', 'processed', 'error')),
  error TEXT,
  criado_em TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_ai_kb_org ON ai_knowledge_docs(organization_id);
ALTER TABLE ai_knowledge_docs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Membros da org podem ver KB"
  ON ai_knowledge_docs FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins da org podem gerenciar KB"
  ON ai_knowledge_docs FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- ============================================================
-- Logs da IA
-- ============================================================
CREATE TABLE IF NOT EXISTS ai_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,

  -- Input
  input_text TEXT NOT NULL,                        -- mensagem do lead (processada)
  input_tokens INTEGER DEFAULT 0,

  -- Output
  output_text TEXT,                                -- resposta da IA
  output_tokens INTEGER DEFAULT 0,
  tool_calls JSONB,                                -- tools chamadas [{name, arguments, result}]

  -- Meta
  model TEXT NOT NULL,
  provider TEXT NOT NULL,
  response_time_ms INTEGER,                        -- tempo de resposta em ms
  estimated_cost REAL DEFAULT 0,                   -- custo estimado em USD
  error TEXT,                                      -- se houve erro

  criado_em TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_ai_logs_org ON ai_logs(organization_id, criado_em DESC);
CREATE INDEX idx_ai_logs_lead ON ai_logs(lead_id, criado_em DESC);
ALTER TABLE ai_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Membros da org podem ver logs IA"
  ON ai_logs FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
    )
  );

-- ============================================================
-- Fila de processamento (para delay de concatenação)
-- ============================================================
CREATE TABLE IF NOT EXISTS ai_processing_queue (
  lead_id UUID PRIMARY KEY REFERENCES leads(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  queued_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  status TEXT DEFAULT 'waiting' CHECK (status IN ('waiting', 'processing'))
);

-- ============================================================
-- Alterações em tabelas existentes
-- ============================================================

-- No leads: flag de pausa da IA
ALTER TABLE leads ADD COLUMN IF NOT EXISTS ia_pausada BOOLEAN DEFAULT false;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS ia_pausada_em TIMESTAMPTZ;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS ia_pausada_por TEXT;         -- 'humano', 'tool', 'manual'

-- No mensagens: flag de mensagem enviada pela IA
ALTER TABLE mensagens ADD COLUMN IF NOT EXISTS enviada_por_ia BOOLEAN DEFAULT false;
