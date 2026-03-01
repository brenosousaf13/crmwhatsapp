import { useQuery, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { useOrganization } from '@/components/providers/organization-provider'
import { useEffect, useMemo } from 'react'

export interface DashboardMetrics {
    total_leads: number;
    novos_periodo: number;
    conversoes_periodo: number;
    receita_periodo: number;

    novos_periodo_anterior: number;
    receita_periodo_anterior: number;

    funil: Array<{ nome: string; cor: string; ordem: number; total: number }>;
    leads_por_dia: Array<{ data: string; total: number }>;
    leads_por_tag: Array<{ nome: string; cor: string; total: number }>;

    total_mensagens: number;
    mensagens_recebidas: number;
    mensagens_enviadas: number;

    leads_sem_resposta: number;
    leads_sem_atendente: number;
}

export function useDashboardMetrics(dateFrom: Date, dateTo: Date) {
    const { organization } = useOrganization()
    const supabase = createClient()
    const queryClient = useQueryClient()

    const queryKey = useMemo(() => ['dashboard-metrics', organization?.id, dateFrom.toISOString(), dateTo.toISOString()], [organization?.id, dateFrom, dateTo])

    const query = useQuery({
        queryKey,
        queryFn: async () => {
            if (!organization?.id) return null

            const { data, error } = await supabase.rpc('get_dashboard_metrics', {
                p_organization_id: organization.id,
                p_date_from: dateFrom.toISOString(),
                p_date_to: dateTo.toISOString()
            })

            if (error) throw error
            return data as DashboardMetrics
        },
        enabled: !!organization?.id,
        staleTime: 5 * 60 * 1000, // 5 minutos de cache
    })

    // Realtime Subscriptions via Supabase
    useEffect(() => {
        if (!organization?.id) return

        const channel = supabase.channel(`dashboard-metrics-${organization.id}`)
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'leads', filter: `organization_id=eq.${organization.id}` },
                () => {
                    queryClient.invalidateQueries({ queryKey })
                }
            )
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'mensagens', filter: `organization_id=eq.${organization.id}` },
                () => {
                    queryClient.invalidateQueries({ queryKey })
                }
            )
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'lead_events', filter: `organization_id=eq.${organization.id}` },
                () => {
                    queryClient.invalidateQueries({ queryKey })
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [organization?.id, queryClient, supabase, queryKey])

    return query
}
