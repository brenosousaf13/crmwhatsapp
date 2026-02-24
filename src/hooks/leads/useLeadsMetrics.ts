'use client'

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { useOrganization } from '@/components/providers/organization-provider'

export interface LeadsMetrics {
    total: number
    ativos: number
    negociando: number
    ganhos: number
    totalSemana: number
    ativosSemana: number
    negociandoSemana: number
    ganhosSemana: number
}

export function useLeadsMetrics() {
    const { organization } = useOrganization()
    const orgId = organization?.id
    const supabase = createClient()

    return useQuery({
        queryKey: ['leads-metrics', orgId],
        queryFn: async (): Promise<LeadsMetrics> => {
            if (!orgId) return { total: 0, ativos: 0, negociando: 0, ganhos: 0, totalSemana: 0, ativosSemana: 0, negociandoSemana: 0, ganhosSemana: 0 }

            // Buscar etapas para identificar "Negociando", "Fechado/Ganho", "Fechado/Perdido"
            const { data: etapas } = await supabase
                .from('etapas_kanban')
                .select('id, nome')
                .eq('organization_id', orgId)

            const etapaMap = new Map((etapas || []).map(e => [e.nome, e.id]))
            const etapaGanho = etapaMap.get('Fechado/Ganho')
            const etapaPerdido = etapaMap.get('Fechado/Perdido')
            const etapaNegociando = etapaMap.get('Negociando')

            // Início da semana (segunda-feira)
            const now = new Date()
            const dayOfWeek = now.getDay()
            const diffToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1
            const monday = new Date(now)
            monday.setDate(now.getDate() - diffToMonday)
            monday.setHours(0, 0, 0, 0)
            const weekStart = monday.toISOString()

            // Contagens totais
            const { count: total } = await supabase
                .from('leads').select('id', { count: 'exact', head: true })
                .eq('organization_id', orgId)

            // Ativos: não ganho nem perdido
            let ativosQuery = supabase
                .from('leads').select('id', { count: 'exact', head: true })
                .eq('organization_id', orgId)
            if (etapaGanho) ativosQuery = ativosQuery.neq('etapa_id', etapaGanho)
            if (etapaPerdido) ativosQuery = ativosQuery.neq('etapa_id', etapaPerdido)
            const { count: ativos } = await ativosQuery

            // Negociando
            const { count: negociando } = etapaNegociando
                ? await supabase.from('leads').select('id', { count: 'exact', head: true })
                    .eq('organization_id', orgId).eq('etapa_id', etapaNegociando)
                : { count: 0 }

            // Ganhos
            const { count: ganhos } = etapaGanho
                ? await supabase.from('leads').select('id', { count: 'exact', head: true })
                    .eq('organization_id', orgId).eq('etapa_id', etapaGanho)
                : { count: 0 }

            // Contagens da semana (criados esta semana)
            const { count: totalSemana } = await supabase
                .from('leads').select('id', { count: 'exact', head: true })
                .eq('organization_id', orgId).gte('criado_em', weekStart)

            let ativosSemanaQuery = supabase
                .from('leads').select('id', { count: 'exact', head: true })
                .eq('organization_id', orgId).gte('criado_em', weekStart)
            if (etapaGanho) ativosSemanaQuery = ativosSemanaQuery.neq('etapa_id', etapaGanho)
            if (etapaPerdido) ativosSemanaQuery = ativosSemanaQuery.neq('etapa_id', etapaPerdido)
            const { count: ativosSemana } = await ativosSemanaQuery

            const { count: negociandoSemana } = etapaNegociando
                ? await supabase.from('leads').select('id', { count: 'exact', head: true })
                    .eq('organization_id', orgId).eq('etapa_id', etapaNegociando).gte('criado_em', weekStart)
                : { count: 0 }

            const { count: ganhosSemana } = etapaGanho
                ? await supabase.from('leads').select('id', { count: 'exact', head: true })
                    .eq('organization_id', orgId).eq('etapa_id', etapaGanho).gte('criado_em', weekStart)
                : { count: 0 }

            return {
                total: total || 0,
                ativos: ativos || 0,
                negociando: negociando || 0,
                ganhos: ganhos || 0,
                totalSemana: totalSemana || 0,
                ativosSemana: ativosSemana || 0,
                negociandoSemana: negociandoSemana || 0,
                ganhosSemana: ganhosSemana || 0,
            }
        },
        enabled: !!orgId,
        staleTime: 30_000, // Cache de 30s para evitar queries excessivas
    })
}
