import { useEffect, useMemo } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { useOrganization } from '@/components/providers/organization-provider'

export function useConversations() {
    const { organization } = useOrganization()
    const supabase = createClient()
    const queryClient = useQueryClient()

    const orgId = organization?.id
    const queryKey = useMemo(() => ['conversations', orgId], [orgId])

    const queryInfo = useQuery({
        queryKey,
        queryFn: async () => {
            if (!orgId) return []

            const { data, error } = await supabase
                .from('leads')
                .select(`
                    *,
                    etapas_kanban(id, nome, cor),
                    mensagens(
                        id,
                        conteudo,
                        tipo,
                        direcao,
                        lida,
                        timestamp
                    )
                `)
                .eq('organization_id', orgId)
                .order('ultima_mensagem_at', { ascending: false, nullsFirst: false })
                // Limit the joined messages to the most recent 1 per lead
                .order('timestamp', { foreignTable: 'mensagens', ascending: false })
                .limit(1, { foreignTable: 'mensagens' })

            if (error) {
                console.error("Error fetching conversations:", error)
                throw error
            }

            return data
        },
        enabled: !!orgId,
    })

    // Realtime: escutar mudanças em leads e novas mensagens
    useEffect(() => {
        if (!orgId) return

        console.log('[Realtime] Assinando conversas para org:', orgId)

        const channel = supabase.channel(`chat-conversations-${orgId}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'leads'
                },
                (payload) => {
                    const isForThisOrg = payload.new && 'organization_id' in payload.new
                        ? payload.new.organization_id === orgId
                        : true // If UPDATE without organization_id (Replica Identity Default), we invalidate anyway to be safe

                    if (isForThisOrg) {
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        console.log('[Realtime-Conversations] Lead event:', payload.eventType, (payload.new as any)?.id)
                        queryClient.invalidateQueries({ queryKey: ['conversations', orgId] })
                    }
                }
            )
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'mensagens'
                },
                (payload) => {
                    const isForThisOrg = payload.new && 'organization_id' in payload.new
                        ? payload.new.organization_id === orgId
                        : true

                    if (isForThisOrg) {
                        console.log('[Realtime-Conversations] Mensagem event:', payload.eventType)
                        queryClient.invalidateQueries({ queryKey: ['conversations', orgId] })
                    }
                }
            )
            .subscribe((status) => {
                console.log(`[Realtime-Conversations] Status:`, status)
            })

        return () => {
            supabase.removeChannel(channel)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [orgId])

    return queryInfo
}
