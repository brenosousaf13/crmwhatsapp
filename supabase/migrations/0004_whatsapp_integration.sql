-- Atualizar tabela whatsapp_configs se necessário
ALTER TABLE whatsapp_configs ADD COLUMN IF NOT EXISTS instance_id TEXT;
ALTER TABLE whatsapp_configs ADD COLUMN IF NOT EXISTS instance_name TEXT;
ALTER TABLE whatsapp_configs ADD COLUMN IF NOT EXISTS profile_name TEXT;
ALTER TABLE whatsapp_configs ADD COLUMN IF NOT EXISTS profile_pic_url TEXT;
ALTER TABLE whatsapp_configs ADD COLUMN IF NOT EXISTS phone_number TEXT;
ALTER TABLE whatsapp_configs ADD COLUMN IF NOT EXISTS is_business BOOLEAN DEFAULT false;
ALTER TABLE whatsapp_configs ADD COLUMN IF NOT EXISTS webhook_configured BOOLEAN DEFAULT false;
ALTER TABLE whatsapp_configs ADD COLUMN IF NOT EXISTS webhook_events TEXT[] DEFAULT '{}';
ALTER TABLE whatsapp_configs ADD COLUMN IF NOT EXISTS ignore_groups BOOLEAN DEFAULT true;
ALTER TABLE whatsapp_configs ADD COLUMN IF NOT EXISTS last_connected_at TIMESTAMPTZ;
ALTER TABLE whatsapp_configs ADD COLUMN IF NOT EXISTS last_disconnected_at TIMESTAMPTZ;
ALTER TABLE whatsapp_configs ADD COLUMN IF NOT EXISTS last_disconnect_reason TEXT;

-- Tabela de log de eventos do webhook (para "Últimos eventos recebidos")
CREATE TABLE IF NOT EXISTS webhook_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,
    payload JSONB NOT NULL,
    processed BOOLEAN DEFAULT false,
    error TEXT,
    criado_em TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_webhook_logs_org_id ON webhook_logs(organization_id);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_criado ON webhook_logs(criado_em DESC);

ALTER TABLE webhook_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Membros da org podem ver logs"
    ON webhook_logs FOR SELECT
    USING (organization_id IN (SELECT public.get_auth_user_organizations()));
