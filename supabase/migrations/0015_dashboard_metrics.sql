CREATE OR REPLACE FUNCTION get_dashboard_metrics(
  p_organization_id UUID,
  p_date_from TIMESTAMPTZ,
  p_date_to TIMESTAMPTZ
)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    -- KPIs
    'total_leads', (
      SELECT COUNT(*) FROM leads
      WHERE organization_id = p_organization_id
      AND etapa_id NOT IN (
        SELECT id FROM etapas_kanban
        WHERE organization_id = p_organization_id
        AND (nome ILIKE '%perdido%')
      )
    ),
    'novos_periodo', (
      SELECT COUNT(*) FROM leads
      WHERE organization_id = p_organization_id
      AND criado_em BETWEEN p_date_from AND p_date_to
    ),
    'conversoes_periodo', (
      SELECT COUNT(*) FROM lead_events
      WHERE organization_id = p_organization_id
      AND tipo = 'etapa_alterada'
      AND metadata->>'nova_etapa' ILIKE '%ganho%'
      AND criado_em BETWEEN p_date_from AND p_date_to
    ),
    'receita_periodo', (
      SELECT COALESCE(SUM(valor_venda), 0) FROM leads
      WHERE organization_id = p_organization_id
      AND valor_venda > 0
      AND id IN (
        SELECT lead_id FROM lead_events
        WHERE tipo = 'etapa_alterada'
        AND metadata->>'nova_etapa' ILIKE '%ganho%'
        AND criado_em BETWEEN p_date_from AND p_date_to
      )
    ),

    -- Comparação com período anterior (para calcular variações %)
    'novos_periodo_anterior', (
      SELECT COUNT(*) FROM leads
      WHERE organization_id = p_organization_id
      AND criado_em BETWEEN
        p_date_from - (p_date_to - p_date_from)
        AND p_date_from
    ),
    'receita_periodo_anterior', (
      SELECT COALESCE(SUM(valor_venda), 0) FROM leads
      WHERE organization_id = p_organization_id
      AND valor_venda > 0
      AND id IN (
        SELECT lead_id FROM lead_events
        WHERE tipo = 'etapa_alterada'
        AND metadata->>'nova_etapa' ILIKE '%ganho%'
        AND criado_em BETWEEN
          p_date_from - (p_date_to - p_date_from)
          AND p_date_from
      )
    ),

    -- Funil
    'funil', (
      SELECT COALESCE(json_agg(row_to_json(f)), '[]') FROM (
        SELECT ek.nome, ek.cor, ek.ordem, COUNT(l.id) as total
        FROM etapas_kanban ek
        LEFT JOIN leads l ON l.etapa_id = ek.id
          AND l.organization_id = p_organization_id
          AND l.criado_em BETWEEN p_date_from AND p_date_to
        WHERE ek.organization_id = p_organization_id
        GROUP BY ek.id, ek.nome, ek.cor, ek.ordem
        ORDER BY ek.ordem
      ) f
    ),

    -- Leads por dia (para gráfico temporal)
    'leads_por_dia', (
      SELECT COALESCE(json_agg(row_to_json(d)), '[]') FROM (
        SELECT DATE(criado_em) as data, COUNT(*) as total
        FROM leads
        WHERE organization_id = p_organization_id
        AND criado_em BETWEEN p_date_from AND p_date_to
        GROUP BY DATE(criado_em)
        ORDER BY data
      ) d
    ),

    -- Tags
    'leads_por_tag', (
      SELECT COALESCE(json_agg(row_to_json(t)), '[]') FROM (
        SELECT tags.nome, tags.cor, COUNT(lt.lead_id) as total
        FROM tags
        LEFT JOIN lead_tags lt ON lt.tag_id = tags.id
        LEFT JOIN leads l ON l.id = lt.lead_id
          AND l.criado_em BETWEEN p_date_from AND p_date_to
        WHERE tags.organization_id = p_organization_id
        GROUP BY tags.id, tags.nome, tags.cor
        ORDER BY total DESC
        LIMIT 10
      ) t
    ),

    -- Mensagens WhatsApp
    'total_mensagens', (
      SELECT COUNT(*) FROM mensagens
      WHERE organization_id = p_organization_id
      AND timestamp BETWEEN p_date_from AND p_date_to
    ),
    'mensagens_recebidas', (
      SELECT COUNT(*) FROM mensagens
      WHERE organization_id = p_organization_id
      AND direcao = 'entrada'
      AND timestamp BETWEEN p_date_from AND p_date_to
    ),
    'mensagens_enviadas', (
      SELECT COUNT(*) FROM mensagens
      WHERE organization_id = p_organization_id
      AND direcao = 'saida'
      AND timestamp BETWEEN p_date_from AND p_date_to
    ),

    -- Leads sem resposta (> 30 min)
    'leads_sem_resposta', (
      SELECT COUNT(*) FROM leads l
      WHERE l.organization_id = p_organization_id
      AND l.mensagens_nao_lidas > 0
      AND l.ultima_mensagem_at < NOW() - INTERVAL '30 minutes'
      AND l.etapa_id NOT IN (
        SELECT id FROM etapas_kanban
        WHERE organization_id = p_organization_id AND (nome ILIKE '%ganho%' OR nome ILIKE '%perdido%')
      )
    ),

    -- Leads sem atendente
    'leads_sem_atendente', (
      SELECT COUNT(*) FROM leads l
      WHERE l.organization_id = p_organization_id
      AND NOT EXISTS (
        SELECT 1 FROM atendimentos a
        WHERE a.lead_id = l.id AND a.atendente_id IS NOT NULL
      )
      AND l.etapa_id NOT IN (
        SELECT id FROM etapas_kanban
        WHERE organization_id = p_organization_id AND (nome ILIKE '%ganho%' OR nome ILIKE '%perdido%')
      )
    )

  ) INTO result;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
