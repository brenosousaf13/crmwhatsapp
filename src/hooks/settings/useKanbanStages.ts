import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { useOrganization } from '@/components/providers/organization-provider'

export interface KanbanStage {
    id: string
    organization_id: string
    nome: string
    ordem: number
    cor: string
    tipo: 'normal' | 'ganho' | 'perdido'
    created_at?: string
    updated_at?: string
}

export function useKanbanStages() {
    const queryClient = useQueryClient()
    const supabase = createClient()
    const { organization } = useOrganization()
    const orgId = organization?.id

    const queryKey = ['settings-kanban-stages', orgId]

    const { data: stages, isLoading } = useQuery({
        queryKey,
        queryFn: async () => {
            if (!orgId) return []
            const { data, error } = await supabase
                .from('etapas_kanban')
                .select(`
          *,
          leads:leads(count)
        `)
                .eq('organization_id', orgId)
                .order('ordem', { ascending: true })

            if (error) throw error

            // Map the count from leads
            return data.map(stage => ({
                ...stage,
                leadsCount: stage.leads?.[0]?.count || 0
            })) as (KanbanStage & { leadsCount: number })[]
        },
        enabled: !!orgId,
    })

    const addStageMutation = useMutation({
        mutationFn: async (newStage: Omit<KanbanStage, 'id' | 'organization_id' | 'created_at' | 'updated_at'>) => {
            if (!orgId) throw new Error('Organização não selecionada')

            const { data, error } = await supabase
                .from('etapas_kanban')
                .insert({
                    ...newStage,
                    organization_id: orgId
                })
                .select()
                .single()

            if (error) throw error
            return data as KanbanStage
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey })
            queryClient.invalidateQueries({ queryKey: ['kanban', orgId] })
            toast.success('Etapa criada com sucesso.')
        },
        onError: (error: Error) => {
            toast.error('Erro ao criar etapa: ' + error.message)
        }
    })

    const updateStageMutation = useMutation({
        mutationFn: async ({ id, ...updateData }: Partial<KanbanStage> & { id: string }) => {
            const { data, error } = await supabase
                .from('etapas_kanban')
                .update(updateData)
                .eq('id', id)
                .select()
                .single()

            if (error) throw error
            return data as KanbanStage
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey })
            queryClient.invalidateQueries({ queryKey: ['kanban', orgId] })
            toast.success('Etapa atualizada.')
        },
        onError: (error: Error) => {
            toast.error('Erro ao atualizar etapa: ' + error.message)
        }
    })

    const deleteStageMutation = useMutation({
        mutationFn: async ({ id, moveToStageId }: { id: string, moveToStageId?: string }) => {
            if (!orgId) throw new Error('Organização não selecionada')

            // Call our custom API endpoint to safely delete and migrate leads if needed
            const res = await fetch(`/api/settings/kanban-stages/${id}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ moveToStageId, orgId })
            })

            if (!res.ok) {
                const error = await res.json()
                throw new Error(error.error || 'Falha ao excluir etapa')
            }
            return true
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey })
            queryClient.invalidateQueries({ queryKey: ['kanban', orgId] })
            toast.success('Etapa excluída.')
        },
        onError: (error: Error) => {
            toast.error('Erro ao excluir etapa: ' + error.message)
        }
    })

    const reorderStagesMutation = useMutation({
        mutationFn: async (orderedIds: string[]) => {
            if (!orgId) throw new Error('Organização não selecionada')

            const res = await fetch(`/api/settings/kanban-stages/reorder`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ orderedIds, orgId })
            })

            if (!res.ok) {
                const error = await res.json()
                throw new Error(error.error || 'Falha ao reordenar etapas')
            }
            return true
        },
        onMutate: async (orderedIds) => {
            // Optimistic update
            await queryClient.cancelQueries({ queryKey })
            const previousStages = queryClient.getQueryData<KanbanStage[]>(queryKey)

            if (previousStages) {
                const newOrderedStages = orderedIds.map((id, index) => {
                    const stage = previousStages.find(s => s.id === id)
                    return { ...stage, ordem: index }
                }).filter(Boolean) as KanbanStage[]

                queryClient.setQueryData(queryKey, newOrderedStages)
            }

            return { previousStages }
        },
        onError: (error: Error, _, context) => {
            if (context?.previousStages) {
                queryClient.setQueryData(queryKey, context.previousStages)
            }
            toast.error('Erro ao reordenar: ' + error.message)
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey })
            queryClient.invalidateQueries({ queryKey: ['kanban', orgId] })
        }
    })

    return {
        stages,
        isLoading,
        addStage: addStageMutation.mutateAsync,
        isAdding: addStageMutation.isPending,
        updateStage: updateStageMutation.mutateAsync,
        isUpdating: updateStageMutation.isPending,
        deleteStage: deleteStageMutation.mutateAsync,
        isDeleting: deleteStageMutation.isPending,
        reorderStages: reorderStagesMutation.mutateAsync,
        isReordering: reorderStagesMutation.isPending
    }
}
