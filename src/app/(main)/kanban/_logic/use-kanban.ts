import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useOrganization } from '@/components/providers/organization-provider'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import type { KanbanColumnData } from '../_components/kanban-board'
import type { KanbanCardData } from '../_components/kanban-card'

interface DbMessage {
    conteudo: string
    timestamp: string
    direcao: string
    lida: boolean
}

interface DbLeadTag {
    tags?: { id?: string; nome?: string; cor?: string } | { id?: string; nome?: string; cor?: string }[]
}

interface DbAtendimento {
    user_profiles?: { nome?: string } | { nome?: string }[]
}

export function useKanbanBoard() {
    const { organization } = useOrganization()
    const supabase = createClient()

    return useQuery({
        queryKey: ['kanban', organization?.id],
        queryFn: async (): Promise<KanbanColumnData[]> => {
            if (!organization?.id) return []

            // 1. Fetch Etapas (Columns)
            const etapasResponse = await supabase
                .from('etapas_kanban')
                .select('*')
                .eq('organization_id', organization.id)
                .order('ordem')

            let etapas = etapasResponse.data
            const etapasError = etapasResponse.error

            if (etapasError) throw etapasError

            // Auto-seed default stages if none exist for this organization
            if (!etapas || etapas.length === 0) {
                const defaultStages = [
                    { organization_id: organization.id, nome: 'Novo', ordem: 1, cor: '#A855F7' },
                    { organization_id: organization.id, nome: 'Em contato', ordem: 2, cor: '#3B82F6' },
                    { organization_id: organization.id, nome: 'Negociando', ordem: 3, cor: '#EAB308' },
                    { organization_id: organization.id, nome: 'Fechado/Ganho', ordem: 4, cor: '#22C55E' },
                    { organization_id: organization.id, nome: 'Fechado/Perdido', ordem: 5, cor: '#1F2937' }
                ]

                // Try to insert them in the background (might fail if user isn't admin/owner, depending on RLS)
                const { data: inserted, error: insertError } = await supabase
                    .from('etapas_kanban')
                    .insert(defaultStages)
                    .select()
                    .order('ordem')

                // For the UI, we just use the default array instantly so it's never empty.
                // We mock the IDs temporarily if insert failed (falling back to frontend state)
                etapas = inserted && !insertError ? inserted : defaultStages.map((s, i) => ({ ...s, id: `temp-${i}` }))
            }

            // 2. Fetch Leads with related data
            const { data: leads, error: leadsError } = await supabase
                .from('leads')
                .select(`
                    id, 
                    nome, 
                    telefone, 
                    valor_venda,
                    etapa_id,
                    atualizado_em,
                    followup_ativo,
                    atendimentos ( user_profiles ( nome ) ),
                    lead_tags ( tags ( id, nome, cor ) ),
                    mensagens ( conteudo, timestamp, lida, direcao )
                `)
                .eq('organization_id', organization.id)

            if (leadsError) throw leadsError

            // 3. Map into KanbanColumnData
            const columns: KanbanColumnData[] = etapas.map(etapa => {
                const columnLeads = leads.filter(l => l.etapa_id === etapa.id)

                const items: KanbanCardData[] = columnLeads.map(lead => {
                    // Sort messages by timestamp descending
                    const msgs = Array.isArray(lead.mensagens) ? [...lead.mensagens].sort((a: unknown, b: unknown) =>
                        new Date((b as DbMessage).timestamp).getTime() - new Date((a as DbMessage).timestamp).getTime()
                    ) : []

                    const lastMsg = msgs[0] as DbMessage | undefined
                    const unreadCount = msgs.filter((m: unknown) => (m as DbMessage).direcao === 'entrada' && !(m as DbMessage).lida).length

                    // Assignee
                    const atendimentos = Array.isArray(lead.atendimentos) ? lead.atendimentos : []
                    const currentAtendimento = atendimentos[0] as DbAtendimento | undefined
                    const profiles = currentAtendimento?.user_profiles
                    const assignee = Array.isArray(profiles) ? profiles[0]?.nome : profiles?.nome

                    // Tags
                    const leadTags = Array.isArray(lead.lead_tags) ? lead.lead_tags : []
                    const tags = leadTags.flatMap((lt: unknown) => {
                        const tagsProp = (lt as DbLeadTag).tags
                        if (Array.isArray(tagsProp)) return tagsProp.filter(t => t.id && t.nome && t.cor).map(t => ({ id: t.id!, nome: t.nome!, cor: t.cor! }))
                        return tagsProp?.id && tagsProp?.nome && tagsProp?.cor ? [{ id: tagsProp.id, nome: tagsProp.nome, cor: tagsProp.cor }] : []
                    })

                    return {
                        id: lead.id,
                        name: lead.nome,
                        phone: lead.telefone,
                        valor_venda: lead.valor_venda,
                        urgency: unreadCount > 0 ? 'high' : 'normal',
                        lastMessage: lastMsg?.conteudo,
                        lastMessageTime: lastMsg ? formatDistanceToNow(new Date(lastMsg.timestamp), { addSuffix: true, locale: ptBR }) : undefined,
                        tags: tags,
                        assignee: assignee,
                        unreadCount: unreadCount,
                        waitTime: formatDistanceToNow(new Date(lead.atualizado_em), { locale: ptBR }),
                        followupAtivo: lead.followup_ativo
                    }
                })

                return {
                    id: etapa.id,
                    title: etapa.nome,
                    color: etapa.cor,
                    items
                }
            })

            return columns
        },
        enabled: !!organization?.id,
    })
}

export function useMoveLead() {
    const { organization } = useOrganization()
    const supabase = createClient()
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async ({ leadId, newEtapaId }: { leadId: string, newEtapaId: string }) => {
            const { data: userResponse } = await supabase.auth.getUser()

            // Fetch name of the new stage to log the event
            const { data: etapaData } = await supabase
                .from('etapas_kanban')
                .select('nome')
                .eq('id', newEtapaId)
                .single()

            const nomeEtapa = etapaData?.nome || 'Etapa desconhecida'

            // Update the lead stage
            const { error: updateError } = await supabase
                .from('leads')
                .update({ etapa_id: newEtapaId, atualizado_em: new Date().toISOString() })
                .eq('id', leadId)
                .eq('organization_id', organization?.id)

            if (updateError) throw updateError

            // Log the movement in history
            if (userResponse.user) {
                await supabase
                    .from('lead_events')
                    .insert({
                        organization_id: organization?.id,
                        lead_id: leadId,
                        tipo: 'mudanca_etapa',
                        descricao: `Movido para a etapa: ${nomeEtapa}`,
                        user_id: userResponse.user.id
                    })
            }
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['kanban', organization?.id] })
            queryClient.invalidateQueries({ queryKey: ['lead-events', variables.leadId] })
        },
    })
}

export function useCreateLead() {
    const { organization } = useOrganization()
    const supabase = createClient()
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async ({ nome, telefone }: { nome: string, telefone: string }) => {
            if (!organization?.id) throw new Error('No organization')

            // Get the first stage (Novo)
            const { data: etapas } = await supabase
                .from('etapas_kanban')
                .select('id')
                .eq('organization_id', organization.id)
                .order('ordem')
                .limit(1)

            let primeiraEtapaId = etapas?.[0]?.id

            // Fallback for UI optimistic stages if database insert failed behind
            if (!primeiraEtapaId) {
                primeiraEtapaId = 'temp-0' // Maps to 'Novo' ID if seed failed
            }

            const { error } = await supabase
                .from('leads')
                .insert({
                    organization_id: organization.id,
                    nome,
                    telefone,
                    etapa_id: primeiraEtapaId
                })

            if (error) throw error
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['kanban', organization?.id] })
        }
    })
}

export function useUpdateLead() {
    const { organization } = useOrganization()
    const supabase = createClient()
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async ({ leadId, data }: { leadId: string, data: { nome?: string, telefone?: string, valor_venda?: number } }) => {
            if (!organization?.id) throw new Error('No organization')

            const { data: userResponse } = await supabase.auth.getUser()

            const { error } = await supabase
                .from('leads')
                .update({ ...data, atualizado_em: new Date().toISOString() })
                .eq('id', leadId)
                .eq('organization_id', organization.id)

            if (error) throw error

            if (userResponse.user) {
                await supabase
                    .from('lead_events')
                    .insert({
                        organization_id: organization.id,
                        lead_id: leadId,
                        tipo: 'informacao_atualizada',
                        descricao: 'Atualizou as informações de contato/venda do lead.',
                        user_id: userResponse.user.id
                    })
            }
        },
        onSuccess: (_, vars) => {
            queryClient.invalidateQueries({ queryKey: ['kanban', organization?.id] })
            queryClient.invalidateQueries({ queryKey: ['lead-events', vars.leadId] })
        }
    })
}

export function useKanbanRealtime() {
    const { organization } = useOrganization()
    const supabase = createClient()
    const queryClient = useQueryClient()

    useEffect(() => {
        if (!organization?.id) return

        const channel = supabase.channel('kanban_realtime')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'leads',
                    filter: `organization_id=eq.${organization.id}`
                },
                () => {
                    // Any change to leads in our org should trigger a refetch
                    queryClient.invalidateQueries({ queryKey: ['kanban', organization.id] })
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [organization?.id, supabase, queryClient])
}

export function useLeadNotes(leadId: string | undefined) {
    const { organization } = useOrganization()
    const supabase = createClient()

    return useQuery({
        queryKey: ['lead-notes', leadId],
        queryFn: async () => {
            if (!leadId || !organization?.id) return []

            const { data, error } = await supabase
                .from('lead_notas')
                .select(`
                    id,
                    conteudo,
                    criado_em,
                    user_id,
                    user_profiles ( nome, avatar_url )
                `)
                .eq('lead_id', leadId)
                .order('criado_em', { ascending: false })

            if (error) throw error
            return data
        },
        enabled: !!leadId && !!organization?.id,
    })
}

export function useAddLeadNote() {
    const { organization } = useOrganization()
    const supabase = createClient()
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async ({ leadId, conteudo }: { leadId: string, conteudo: string }) => {
            if (!organization?.id) throw new Error('No organization')

            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error('Not authenticated')

            const { error } = await supabase
                .from('lead_notas')
                .insert({
                    organization_id: organization.id,
                    lead_id: leadId,
                    conteudo,
                    user_id: user.id
                })

            if (error) throw error
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['lead-notes', variables.leadId] })
        }
    })
}

export function useLeadHistory(leadId: string | undefined) {
    const { organization } = useOrganization()
    const supabase = createClient()

    return useQuery({
        queryKey: ['lead-events', leadId],
        queryFn: async () => {
            if (!leadId || !organization?.id) return []

            const { data, error } = await supabase
                .from('lead_events')
                .select(`
                    id,
                    tipo,
                    descricao,
                    metadata,
                    criado_em,
                    user_profiles ( nome )
                `)
                .eq('lead_id', leadId)
                .order('criado_em', { ascending: false })

            if (error) throw error
            return data
        },
        enabled: !!leadId && !!organization?.id,
    })
}
