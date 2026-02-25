import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { useOrganization } from '@/components/providers/organization-provider'
import { AiKnowledgeDoc } from '@/types/ai'

export function useAiKnowledge() {
    const supabase = createClient()
    const queryClient = useQueryClient()
    const { organization } = useOrganization()

    const queryKey = ['ai_knowledge', organization?.id]

    const { data: documents, isLoading, error } = useQuery({
        queryKey,
        queryFn: async () => {
            if (!organization?.id) return []

            const { data, error } = await supabase
                .from('ai_knowledge_docs')
                .select('id, organization_id, filename, file_size, file_path, char_count, status, error, criado_em')
                .eq('organization_id', organization.id)
                .order('criado_em', { ascending: false })

            if (error) throw error
            return data as Omit<AiKnowledgeDoc, 'content'>[]
        },
        enabled: !!organization?.id
    })

    const deleteDoc = useMutation({
        mutationFn: async (id: string) => {
            // Deleta primeiro do storage, depois do banco (em uma API robusta seria o ideal)
            // Aqui fazemos pelo banco direto e podemos ter um trigger ou function, ou apenas aceitar o ghost file

            const { data: doc } = await supabase.from('ai_knowledge_docs').select('file_path').eq('id', id).single()

            // Apaga o registro
            const { error } = await supabase.from('ai_knowledge_docs').delete().eq('id', id)
            if (error) throw error

            // Apaga o arquivo
            if (doc?.file_path) {
                await supabase.storage.from('ai-knowledge-base').remove([doc.file_path])
            }

            return true
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey })
        }
    })

    // Calcula total de caracteres pra o banner
    const totalChars = documents?.reduce((acc, doc) => acc + (doc.char_count || 0), 0) || 0

    return {
        documents,
        isLoading,
        error,
        deleteDoc: deleteDoc.mutateAsync,
        isDeleting: deleteDoc.isPending,
        totalChars
    }
}
