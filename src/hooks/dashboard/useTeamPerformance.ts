import { useQuery, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { useOrganization } from '@/components/providers/organization-provider'
import { useEffect, useMemo } from 'react'

export interface TeamPerformanceMember {
    atendente_id: string;
    atendente_nome: string;
    avatar_url: string | null;
    total_leads: number;
    conversoes: number;
    receita: number;
    mensagens_enviadas: number;
    tempo_resposta_minutos: number;
}

export function useTeamPerformance(dateFrom: Date, dateTo: Date) {
    const { organization } = useOrganization()
    const supabase = createClient()
    const queryClient = useQueryClient()

    const queryKey = useMemo(() => ['team-performance', organization?.id, dateFrom.toISOString(), dateTo.toISOString()], [organization?.id, dateFrom, dateTo])

    const query = useQuery({
        queryKey,
        queryFn: async () => {
            if (!organization?.id) return []

            const { data, error } = await supabase.rpc('get_team_performance', {
                p_organization_id: organization.id,
                p_date_from: dateFrom.toISOString(),
                p_date_to: dateTo.toISOString()
            })

            if (error) throw error
            return data as TeamPerformanceMember[]
        },
        enabled: !!organization?.id,
        staleTime: 5 * 60 * 1000,
    })

    // Realtime Subscriptions
    useEffect(() => {
        if (!organization?.id) return

        const channel = supabase.channel(`team-performance-${organization.id}`)
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'atendimentos', filter: `organization_id=eq.${organization.id}` },
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
