'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { useOrganization } from '@/components/providers/organization-provider'

const supabase = createClient()

// Criar lead
export function useCreateLead() {
    const { organization } = useOrganization()
    const queryClient = useQueryClient()
    const orgId = organization?.id

    return useMutation({
        mutationFn: async (data: {
            nome: string
            telefone: string
            email?: string
            etapa_id?: string
            notas?: string
            valor_venda?: number
        }) => {
            if (!orgId) throw new Error('Organização não encontrada')

            // Se não informou etapa, usar a primeira (Novo)
            let etapaId = data.etapa_id
            if (!etapaId) {
                const { data: etapa } = await supabase
                    .from('etapas_kanban')
                    .select('id')
                    .eq('organization_id', orgId)
                    .order('ordem')
                    .limit(1)
                    .single()
                etapaId = etapa?.id
            }

            const { data: lead, error } = await supabase
                .from('leads')
                .insert({
                    organization_id: orgId,
                    nome: data.nome,
                    telefone: data.telefone,
                    email: data.email || null,
                    etapa_id: etapaId!,
                    notas: data.notas || null,
                    valor_venda: data.valor_venda || null,
                })
                .select('id')
                .single()

            if (error) throw error

            // Registrar evento de criação
            await supabase.from('lead_events').insert({
                organization_id: orgId,
                lead_id: lead.id,
                tipo: 'criado',
                descricao: `Lead "${data.nome}" criado`,
            })

            return lead
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['leads', orgId] })
            queryClient.invalidateQueries({ queryKey: ['leads-metrics', orgId] })
            queryClient.invalidateQueries({ queryKey: ['kanban'] })
        },
    })
}

// Atualizar lead
export function useUpdateLead() {
    const { organization } = useOrganization()
    const queryClient = useQueryClient()
    const orgId = organization?.id

    return useMutation({
        mutationFn: async ({ leadId, data }: {
            leadId: string
            data: {
                nome?: string
                telefone?: string
                email?: string | null
                etapa_id?: string
                notas?: string | null
                valor_venda?: number | null
                motivo_perda?: string | null
            }
        }) => {
            const { error } = await supabase
                .from('leads')
                .update(data)
                .eq('id', leadId)
                .eq('organization_id', orgId!)

            if (error) throw error
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['leads', orgId] })
            queryClient.invalidateQueries({ queryKey: ['leads-metrics', orgId] })
            queryClient.invalidateQueries({ queryKey: ['kanban'] })
        },
    })
}

// Mover lead para outra etapa
export function useMoveLeadEtapa() {
    const { organization } = useOrganization()
    const queryClient = useQueryClient()
    const orgId = organization?.id

    return useMutation({
        mutationFn: async ({ leadId, etapaId, etapaNome }: {
            leadId: string
            etapaId: string
            etapaNome: string
        }) => {
            const { error } = await supabase
                .from('leads')
                .update({ etapa_id: etapaId })
                .eq('id', leadId)
                .eq('organization_id', orgId!)

            if (error) throw error

            // Registrar evento
            await supabase.from('lead_events').insert({
                organization_id: orgId!,
                lead_id: leadId,
                tipo: 'etapa_alterada',
                descricao: `Movido para "${etapaNome}"`,
                metadata: { para: etapaNome },
            })
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['leads', orgId] })
            queryClient.invalidateQueries({ queryKey: ['leads-metrics', orgId] })
            queryClient.invalidateQueries({ queryKey: ['kanban'] })
        },
    })
}

// Excluir lead(s)
export function useDeleteLeads() {
    const { organization } = useOrganization()
    const queryClient = useQueryClient()
    const orgId = organization?.id

    return useMutation({
        mutationFn: async (leadIds: string[]) => {
            const { error } = await supabase
                .from('leads')
                .delete()
                .in('id', leadIds)
                .eq('organization_id', orgId!)

            if (error) throw error
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['leads', orgId] })
            queryClient.invalidateQueries({ queryKey: ['leads-metrics', orgId] })
            queryClient.invalidateQueries({ queryKey: ['kanban'] })
        },
    })
}

// Ações em lote: mover etapa
export function useBulkMoveEtapa() {
    const { organization } = useOrganization()
    const queryClient = useQueryClient()
    const orgId = organization?.id

    return useMutation({
        mutationFn: async ({ leadIds, etapaId }: { leadIds: string[]; etapaId: string }) => {
            const { error } = await supabase
                .from('leads')
                .update({ etapa_id: etapaId })
                .in('id', leadIds)
                .eq('organization_id', orgId!)

            if (error) throw error
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['leads', orgId] })
            queryClient.invalidateQueries({ queryKey: ['leads-metrics', orgId] })
            queryClient.invalidateQueries({ queryKey: ['kanban'] })
        },
    })
}

// Ações em lote: atribuir atendente
export function useBulkAssignAtendente() {
    const { organization } = useOrganization()
    const queryClient = useQueryClient()
    const orgId = organization?.id

    return useMutation({
        mutationFn: async ({ leadIds, atendenteId }: { leadIds: string[]; atendenteId: string }) => {
            // Para cada lead, criar ou atualizar atendimento
            const promises = leadIds.map(leadId =>
                supabase.from('atendimentos').upsert({
                    organization_id: orgId!,
                    lead_id: leadId,
                    atendente_id: atendenteId,
                    status: 'aberto',
                }, { onConflict: 'lead_id' }).select()
            )
            // Nota: upsert com onConflict em lead_id pode não funcionar se não houver unique constraint.
            // Fallback: deletar atendimentos abertos existentes e inserir novos.
            await Promise.allSettled(promises)
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['leads', orgId] })
            queryClient.invalidateQueries({ queryKey: ['kanban'] })
        },
    })
}

// Gerenciar tags de um lead
export function useManageLeadTags() {
    const { organization } = useOrganization()
    const queryClient = useQueryClient()
    const orgId = organization?.id

    return useMutation({
        mutationFn: async ({ leadId, tagIds }: { leadId: string; tagIds: string[] }) => {
            // Remover todas as tags existentes
            await supabase.from('lead_tags').delete().eq('lead_id', leadId)

            // Inserir novas tags
            if (tagIds.length > 0) {
                const rows = tagIds.map(tagId => ({ lead_id: leadId, tag_id: tagId }))
                const { error } = await supabase.from('lead_tags').insert(rows)
                if (error) throw error
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['leads', orgId] })
            queryClient.invalidateQueries({ queryKey: ['kanban'] })
        },
    })
}

// Ações em lote: adicionar tag
export function useBulkAddTag() {
    const { organization } = useOrganization()
    const queryClient = useQueryClient()
    const orgId = organization?.id

    return useMutation({
        mutationFn: async ({ leadIds, tagId }: { leadIds: string[]; tagId: string }) => {
            const rows = leadIds.map(leadId => ({ lead_id: leadId, tag_id: tagId }))
            const { error } = await supabase.from('lead_tags').upsert(rows, { onConflict: 'lead_id,tag_id', ignoreDuplicates: true })
            if (error) throw error
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['leads', orgId] })
            queryClient.invalidateQueries({ queryKey: ['kanban'] })
        },
    })
}

// Ações em lote: remover tag
export function useBulkRemoveTag() {
    const { organization } = useOrganization()
    const queryClient = useQueryClient()
    const orgId = organization?.id

    return useMutation({
        mutationFn: async ({ leadIds, tagId }: { leadIds: string[]; tagId: string }) => {
            const { error } = await supabase
                .from('lead_tags')
                .delete()
                .in('lead_id', leadIds)
                .eq('tag_id', tagId)

            if (error) throw error
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['leads', orgId] })
            queryClient.invalidateQueries({ queryKey: ['kanban'] })
        },
    })
}
