import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { useOrganization } from '@/components/providers/organization-provider'
import { AiLog } from '@/types/ai'

export function useAiLogs(limit = 100) {
    const supabase = createClient()
    const { organization } = useOrganization()

    const queryKey = ['ai_logs', organization?.id, limit]

    const { data: logs, isLoading, error } = useQuery({
        queryKey,
        queryFn: async () => {
            if (!organization?.id) return []

            const { data, error } = await supabase
                .from('ai_logs')
                .select(`
          *,
          lead:leads (
            id,
            nome,
            telefone
          )
        `)
                .eq('organization_id', organization.id)
                .order('criado_em', { ascending: false })
                .limit(limit)

            if (error) throw error
            return data as (AiLog & { lead: { id: string, nome: string, telefone: string } })[]
        },
        enabled: !!organization?.id
    })

    // Global metrics from fetched data (approximate for the requested limit)
    const metrics = {
        totalInteractions: logs?.length || 0,
        totalTokens: logs?.reduce((acc, log) => acc + (log.input_tokens || 0) + (log.output_tokens || 0), 0) || 0,
        totalCost: logs?.reduce((acc, log) => acc + (log.estimated_cost || 0), 0) || 0,
        avgResponseTime: logs?.length
            ? Math.round((logs.reduce((acc, log) => acc + (log.response_time_ms || 0), 0) / logs.length))
            : 0
    }

    return {
        logs,
        isLoading,
        error,
        metrics
    }
}
