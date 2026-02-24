CREATE OR REPLACE FUNCTION get_team_performance(
  p_organization_id UUID,
  p_date_from TIMESTAMPTZ,
  p_date_to TIMESTAMPTZ
)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT COALESCE(json_agg(row_to_json(t)), '[]') FROM (
    SELECT 
      up.id as atendente_id,
      up.nome as atendente_nome,
      up.avatar_url,
      
      -- Total Leads atribuidos no periodo
      (SELECT COUNT(DISTINCT a.lead_id) FROM atendimentos a 
       JOIN leads l ON a.lead_id = l.id
       WHERE a.atendente_id = up.id 
       AND a.organization_id = p_organization_id
       AND l.criado_em BETWEEN p_date_from AND p_date_to) as total_leads,
       
      -- Conversoes no periodo
      (SELECT COUNT(DISTINCT le.lead_id) FROM lead_events le
       JOIN atendimentos a ON a.lead_id = le.lead_id
       WHERE a.atendente_id = up.id
       AND le.tipo = 'etapa_alterada'
       AND le.metadata->>'nova_etapa' ILIKE '%ganho%'
       AND le.organization_id = p_organization_id
       AND le.criado_em BETWEEN p_date_from AND p_date_to) as conversoes,
       
      -- Receita no periodo
      (SELECT COALESCE(SUM(l.valor_venda), 0) FROM leads l
       JOIN atendimentos a ON a.lead_id = l.id
       JOIN lead_events le ON le.lead_id = l.id
       WHERE a.atendente_id = up.id
       AND le.tipo = 'etapa_alterada'
       AND le.metadata->>'nova_etapa' ILIKE '%ganho%'
       AND l.organization_id = p_organization_id
       AND le.criado_em BETWEEN p_date_from AND p_date_to) as receita,
       
      -- Mensagens enviadas
      (SELECT COUNT(*) FROM mensagens m
       JOIN atendimentos a ON a.lead_id = m.lead_id
       WHERE a.atendente_id = up.id
       AND m.direcao = 'saida'
       AND m.organization_id = p_organization_id
       AND m.timestamp BETWEEN p_date_from AND p_date_to) as mensagens_enviadas,
       
      -- Tempo de resposta simulado por hora (cálculo real requer tabela dedicada de sessões de chat, que será complexo agora)
      -- Para nâo estourar o banco com joins cruzados de mensagens, simularemos baseado em velocidade média do atendente se tivéssemos esse dado
      -- Mas deixaremos 0 pronto para ser integrado depois no frontend
      0 as tempo_resposta_minutos
      
    FROM user_profiles up
    JOIN organization_members om ON om.user_id = up.id
    WHERE om.organization_id = p_organization_id
    ORDER BY conversoes DESC, receita DESC, total_leads DESC
  ) t INTO result;

  RETURN COALESCE(result, '[]');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
