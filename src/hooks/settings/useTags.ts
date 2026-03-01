import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { useOrganization } from '@/components/providers/organization-provider'

export interface Tag {
    id: string
    organization_id: string
    nome: string
    cor: string
    created_at?: string
}

export function useTags() {
    const queryClient = useQueryClient()
    const supabase = createClient()
    const { organization } = useOrganization()
    const orgId = organization?.id

    const queryKey = ['settings-tags', orgId]

    const { data: tags, isLoading } = useQuery({
        queryKey,
        queryFn: async () => {
            if (!orgId) return []
            const { data, error } = await supabase
                .from('tags')
                .select('*')
                .eq('organization_id', orgId)
                .order('nome', { ascending: true })

            if (error) throw error
            return data as Tag[]
        },
        enabled: !!orgId,
    })

    const addTagMutation = useMutation({
        mutationFn: async (newTag: Omit<Tag, 'id' | 'organization_id' | 'created_at'>) => {
            if (!orgId) throw new Error('Organização não selecionada')

            const { data, error } = await supabase
                .from('tags')
                .insert({
                    ...newTag,
                    organization_id: orgId
                })
                .select()
                .single()

            if (error) throw error
            return data as Tag
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey })
            toast.success('Tag criada com sucesso.')
        },
        onError: (error: Error) => {
            toast.error('Erro ao adicionar tag: ' + error.message)
        }
    })

    const updateTagMutation = useMutation({
        mutationFn: async ({ id, ...updateData }: Partial<Tag> & { id: string }) => {
            const { data, error } = await supabase
                .from('tags')
                .update(updateData)
                .eq('id', id)
                .eq('organization_id', orgId)
                .select()
                .single()

            if (error) throw error
            return data as Tag
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey })
            toast.success('Tag atualizada.')
        },
        onError: (error: Error) => {
            toast.error('Erro ao atualizar tag: ' + error.message)
        }
    })

    const deleteTagMutation = useMutation({
        mutationFn: async (id: string) => {
            if (!orgId) throw new Error('Organização não selecionada')

            // Because we use ON DELETE CASCADE generally or just manually delete lead_tags?
            // Supabase FK lead_tags(tag_id) might not be ON DELETE CASCADE.
            // But typically it is. Let's rely on standard delete and handle errors.
            const { error } = await supabase
                .from('tags')
                .delete()
                .eq('id', id)
                .eq('organization_id', orgId)

            if (error) {
                if (error.code === '23503') {
                    throw new Error('Esta tag está em uso por um ou mais leads. Remova-a dos leads antes de excluir.')
                }
                throw error
            }
            return true
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey })
            toast.success('Tag excluída.')
        },
        onError: (error: Error) => {
            toast.error('Erro ao excluir tag: ' + error.message)
        }
    })

    return {
        tags,
        isLoading,
        addTag: addTagMutation.mutateAsync,
        isAdding: addTagMutation.isPending,
        updateTag: updateTagMutation.mutateAsync,
        isUpdating: updateTagMutation.isPending,
        deleteTag: deleteTagMutation.mutateAsync,
        isDeleting: deleteTagMutation.isPending
    }
}
