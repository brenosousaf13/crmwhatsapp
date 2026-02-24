-- Habilitar o Realtime (WebSockets) para as tabelas de chat
-- Isso permite que o frontend seja atualizado instantaneamente quando o webhook recebe uma mensagem

ALTER PUBLICATION supabase_realtime ADD TABLE mensagens;
ALTER PUBLICATION supabase_realtime ADD TABLE leads;
