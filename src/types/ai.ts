export type AiProvider = 'openai' | 'anthropic' | 'google'

export interface BusinessHourDay {
    inicio: string
    fim: string
    ativo: boolean
}

export interface BusinessHours {
    seg: BusinessHourDay
    ter: BusinessHourDay
    qua: BusinessHourDay
    qui: BusinessHourDay
    sex: BusinessHourDay
    sab: BusinessHourDay
    dom: BusinessHourDay
}

export interface AiConfig {
    id: string
    organization_id: string
    enabled: boolean
    provider: AiProvider
    api_key: string
    model: string
    openai_key_for_whisper?: string
    system_prompt: string
    enabled_tools: string[]
    temperature: number
    context_window: number
    concat_delay_seconds: number
    response_delay_ms: number
    business_hours_enabled: boolean
    business_hours: BusinessHours
    out_of_hours_message?: string
    auto_pause_on_human: boolean
    auto_resume_hours: number
    generate_insights: boolean
    qualified_stage_id?: string
    criado_em?: string
    atualizado_em?: string
}

export interface AiKnowledgeDoc {
    id: string
    organization_id: string
    filename: string
    file_size: number
    file_path: string
    content: string
    char_count: number
    status: 'processing' | 'processed' | 'error'
    error?: string
    criado_em?: string
}

export interface AiLog {
    id: string
    organization_id: string
    lead_id: string
    input_text: string
    input_tokens: number
    output_text?: string
    output_tokens: number
    tool_calls?: any
    model: string
    provider: string
    response_time_ms?: number
    estimated_cost: number
    error?: string
    criado_em?: string
}
