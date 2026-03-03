-- Migration para Suporte a Processamento de Mídia (Imagens e Áudios)

-- Tabela: mensagens
ALTER TABLE mensagens ADD COLUMN IF NOT EXISTS whatsapp_message_id TEXT;
ALTER TABLE mensagens ADD COLUMN IF NOT EXISTS media_mimetype TEXT;
ALTER TABLE mensagens ADD COLUMN IF NOT EXISTS media_transcription TEXT;

-- Tabela: ai_config
ALTER TABLE ai_config ADD COLUMN IF NOT EXISTS openai_key_for_whisper TEXT;
ALTER TABLE ai_config ADD COLUMN IF NOT EXISTS transcribe_audio BOOLEAN DEFAULT true;
ALTER TABLE ai_config ADD COLUMN IF NOT EXISTS analyze_images BOOLEAN DEFAULT true;
