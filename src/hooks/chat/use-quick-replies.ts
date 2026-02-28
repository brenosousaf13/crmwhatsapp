import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { useOrganization } from '@/components/providers/organization-provider'

export interface QuickReply {
    id: string
    atalho: string
    titulo: string
    conteudo: string
}

export function useQuickReplies() {
    const { organization } = useOrganization()
    const supabase = createClient()

    const queryKey = ['quick-replies', organization?.id]

    const query = useQuery({
        queryKey,
        queryFn: async (): Promise<QuickReply[]> => {
            if (!organization) return []

            const { data, error } = await supabase
                .from('respostas_rapidas')
                .select('*')
                .eq('organization_id', organization.id)
                .order('atalho')

            if (error) {
                console.error("Error fetching quick replies:", error)
                throw error
            }

            return data as QuickReply[]
        },
        enabled: !!organization,
    })

    const queryClient = useQueryClient()

    const addReplyMutation = useMutation({
        mutationFn: async (newReply: Omit<QuickReply, 'id'>) => {
            if (!organization) throw new Error('Organização não selecionada')

            const { data, error } = await supabase
                .from('respostas_rapidas')
                .insert({
                    ...newReply,
                    organization_id: organization.id
                })
                .select()
                .single()

            if (error) throw error
            return data as QuickReply
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey })
        }
    })

    const updateReplyMutation = useMutation({
        mutationFn: async ({ id, ...updateData }: Partial<QuickReply> & { id: string }) => {
            if (!organization) throw new Error('Organização não selecionada')

            const { data, error } = await supabase
                .from('respostas_rapidas')
                .update(updateData)
                .eq('id', id)
                .eq('organization_id', organization.id)
                .select()
                .single()

            if (error) throw error
            return data as QuickReply
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey })
        }
    })

    const deleteReplyMutation = useMutation({
        mutationFn: async (id: string) => {
            if (!organization) throw new Error('Organização não selecionada')

            const { error } = await supabase
                .from('respostas_rapidas')
                .delete()
                .eq('id', id)
                .eq('organization_id', organization.id)

            if (error) throw error
            return true
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey })
        }
    })

    return {
        ...query,
        addReply: addReplyMutation.mutateAsync,
        isAdding: addReplyMutation.isPending,
        updateReply: updateReplyMutation.mutateAsync,
        isUpdating: updateReplyMutation.isPending,
        deleteReply: deleteReplyMutation.mutateAsync,
        isDeleting: deleteReplyMutation.isPending,
    }
}
