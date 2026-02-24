import { useEffect, useMemo } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { useOrganization } from '@/components/providers/organization-provider'

export function useMessages(leadId: string | null) {
    const { organization } = useOrganization()
    const supabase = createClient()
    const queryClient = useQueryClient()

    const orgId = organization?.id
    // Estabilizar queryKey com useMemo para evitar re-renders desnecessários
    const queryKey = useMemo(() => ['messages', orgId, leadId], [orgId, leadId])

    const queryInfo = useQuery({
        queryKey,
        queryFn: async () => {
            if (!orgId || !leadId) return []

            const { data, error } = await supabase
                .from('mensagens')
                .select('*')
                .eq('organization_id', orgId)
                .eq('lead_id', leadId)
                .order('timestamp', { ascending: true })

            if (error) {
                console.error("Error fetching messages:", error)
                throw error
            }

            return data
        },
        enabled: !!orgId && !!leadId,
    })

    // Setup Realtime - filtrar apenas por lead_id (Supabase não suporta filtros compostos)
    useEffect(() => {
        if (!orgId || !leadId) return

        const markAsRead = async () => {
            try {
                // Resetar contador de não lidas no lead
                await supabase.from('leads').update({ mensagens_nao_lidas: 0 }).eq('id', leadId)

                // Marcar mensagens de entrada como lidas (opcional, bom para controle)
                await supabase.from('mensagens')
                    .update({ lida: true })
                    .eq('lead_id', leadId)
                    .eq('direcao', 'entrada')
                    .eq('lida', false)

                // Atualizar a interface instantaneamente
                queryClient.invalidateQueries({ queryKey: ['conversations', orgId] })
            } catch (e) {
                console.error('Failed to mark as read', e)
            }
        }

        markAsRead()

        const channel = supabase.channel(`chat-messages-${leadId}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'mensagens',
                    filter: `lead_id=eq.${leadId}`
                },
                (payload) => {
                    console.log('[Realtime] Nova mensagem detectada:', payload.eventType)
                    queryClient.invalidateQueries({ queryKey })
                    // Também atualizar a lista de conversas (preview na sidebar)
                    queryClient.invalidateQueries({ queryKey: ['conversations', orgId] })

                    // Se estivermos com o chat aberto, já marcar como lida e zerar o contador imediatamente 
                    // para não ficar "piscando" a bolinha quando recebemos mensagem na conversa aberta
                    if (payload.eventType === 'INSERT' && payload.new.direcao === 'entrada') {
                        markAsRead()
                    }
                }
            )
            .subscribe((status) => {
                console.log(`[Realtime] Channel chat-messages-${leadId}: ${status}`)
            })

        return () => {
            supabase.removeChannel(channel)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [orgId, leadId])

    return queryInfo
}
