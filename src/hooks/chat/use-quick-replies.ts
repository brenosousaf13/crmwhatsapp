import { useQuery } from '@tanstack/react-query'
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

    return useQuery({
        queryKey: ['quick-replies', organization?.id],
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
}
