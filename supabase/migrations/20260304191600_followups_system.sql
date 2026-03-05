-- ============================================================
-- Tabela principal de follow-ups
-- Serve tanto para follow-ups da IA quanto do humano
-- ============================================================
CREATE TABLE IF NOT EXISTS followups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,

  -- Quem criou
  tipo TEXT NOT NULL CHECK (tipo IN ('ia', 'humano')),
  criado_por UUID REFERENCES auth.users(id),       -- NULL se criado pela IA

  -- Agendamento
  agendado_para TIMESTAMPTZ NOT NULL,               -- quando deve ser executado
  executado_em TIMESTAMPTZ,                          -- quando foi de fato executado
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'executado', 'cancelado', 'falhou')),

  -- Conteúdo
  mensagem TEXT,                                     -- mensagem a enviar (se humano definiu)
  mensagem_enviada TEXT,                             -- mensagem que foi realmente enviada
  contexto TEXT,                                     -- resumo do contexto da conversa (para IA gerar msg)
  
  -- Tentativas (para follow-up da IA)
  tentativa_numero INTEGER DEFAULT 1,               -- 1ª, 2ª, 3ª tentativa
  max_tentativas INTEGER DEFAULT 3,

  -- Metadata
  motivo TEXT,                                       -- por que o follow-up foi criado
  notas TEXT,                                        -- notas do atendente
  metadata JSONB DEFAULT '{}',

  criado_em TIMESTAMPTZ DEFAULT now(),
  atualizado_em TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_followups_pendentes ON followups(organization_id, status, agendado_para)
  WHERE status = 'pendente';
CREATE INDEX idx_followups_lead ON followups(lead_id, criado_em DESC);

ALTER TABLE followups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Membros da org podem gerenciar follow-ups"
  ON followups FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
    )
  );

-- ============================================================
-- Configuração de follow-up automático (IA) por organização
-- ============================================================
-- Adicionar campos na tabela ai_config existente
ALTER TABLE ai_config ADD COLUMN IF NOT EXISTS followup_enabled BOOLEAN DEFAULT false;
ALTER TABLE ai_config ADD COLUMN IF NOT EXISTS followup_max_attempts INTEGER DEFAULT 3;
ALTER TABLE ai_config ADD COLUMN IF NOT EXISTS followup_intervals JSONB DEFAULT '[4, 24, 72]';
  -- Array de horas: 1ª tentativa após 4h, 2ª após 24h, 3ª após 72h
ALTER TABLE ai_config ADD COLUMN IF NOT EXISTS followup_business_hours_only BOOLEAN DEFAULT true;
  -- Só enviar follow-up dentro do horário comercial
ALTER TABLE ai_config ADD COLUMN IF NOT EXISTS followup_active_stages UUID[] DEFAULT '{}';
  -- Array de etapa_ids onde follow-up é ativo. Se vazio, todas exceto finais.

-- ============================================================
-- Alteração no leads para rastrear follow-up
-- ============================================================
ALTER TABLE leads ADD COLUMN IF NOT EXISTS ultimo_followup_em TIMESTAMPTZ;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS followup_count INTEGER DEFAULT 0;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS followup_ativo BOOLEAN DEFAULT false;

-- ============================================================
-- Tabela de Notificações
-- ============================================================
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),          -- NULL = todos da org
  tipo TEXT NOT NULL CHECK (tipo IN ('followup_due', 'followup_sent', 'lead_new', 'transfer_request')),
  titulo TEXT NOT NULL,
  descricao TEXT,
  link TEXT,                                         -- rota para navegar (ex: /chat?lead=uuid)
  lida BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}',
  criado_em TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_notifications_user ON notifications(user_id, lida, criado_em DESC);
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuário vê suas notificações" ON notifications
  FOR ALL USING (
    user_id = auth.uid() OR
    (user_id IS NULL AND organization_id IN (
      SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
    ))
  );
