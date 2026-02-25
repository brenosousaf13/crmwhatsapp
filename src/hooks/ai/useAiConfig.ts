import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { useOrganization } from '@/components/providers/organization-provider'
import { AiConfig } from '@/types/ai'

const DEFAULT_BUSINESS_HOURS = {
    seg: { inicio: '08:00', fim: '22:00', ativo: true },
    ter: { inicio: '08:00', fim: '22:00', ativo: true },
    qua: { inicio: '08:00', fim: '22:00', ativo: true },
    qui: { inicio: '08:00', fim: '22:00', ativo: true },
    sex: { inicio: '08:00', fim: '22:00', ativo: true },
    sab: { inicio: '09:00', fim: '18:00', ativo: true },
    dom: { inicio: '00:00', fim: '00:00', ativo: false }
}

const DEFAULT_CONFIG: Partial<AiConfig> = {
    enabled: false,
    provider: 'openai',
    api_key: '',
    model: 'gpt-4.1-mini',
    system_prompt: '',
    enabled_tools: ['mover_lead_etapa', 'qualificar_lead', 'adicionar_tag', 'transferir_humano', 'registrar_info', 'encerrar_conversa'],
    temperature: 0.7,
    context_window: 15,
    concat_delay_seconds: 20,
    response_delay_ms: 1500,
    business_hours_enabled: false,
    business_hours: DEFAULT_BUSINESS_HOURS,
    auto_pause_on_human: true,
    auto_resume_hours: 4,
    generate_insights: true
}

export function useAiConfig() {
    const supabase = createClient()
    const queryClient = useQueryClient()
    const { organization } = useOrganization()

    const queryKey = ['ai_config', organization?.id]

    const { data: config, isLoading, error } = useQuery({
        queryKey,
        queryFn: async () => {
            if (!organization?.id) return null

            // Fetch config if exists
            const { data, error } = await supabase
                .from('ai_config')
                .select('*')
                .eq('organization_id', organization.id)
                .single()

            if (error && error.code !== 'PGRST116') {
                throw error // Throw real errors, suppress not-found code PGRST116
            }

            if (!data) {
                // Return blank slate to the UI initially if null
                return { ...DEFAULT_CONFIG, organization_id: organization.id } as AiConfig
            }

            return data as AiConfig
        },
        enabled: !!organization?.id
    })

    const mutation = useMutation({
        mutationFn: async (updatedConfig: Partial<AiConfig>) => {
            if (!organization?.id) throw new Error('Organização não selecionada')

            const payload = {
                ...updatedConfig,
                organization_id: organization.id,
                atualizado_em: new Date().toISOString()
            }

            const { data, error } = await supabase
                .from('ai_config')
                .upsert(payload, { onConflict: 'organization_id' })
                .select()
                .single()

            if (error) throw error
            return data
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey })
        }
    })

    return {
        config,
        isLoading,
        error,
        updateConfig: mutation.mutateAsync,
        isUpdating: mutation.isPending
    }
}
