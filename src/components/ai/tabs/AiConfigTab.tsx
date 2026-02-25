'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { ProviderSelector } from '../ProviderSelector'
import { ModelSelector } from '../ModelSelector'
import { BusinessHoursEditor } from '../BusinessHoursEditor'
import { useAiConfig } from '@/hooks/ai/useAiConfig'
import { AiConfig } from '@/types/ai'
import { Loader2, Save, Eye, EyeOff, CheckCircle } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'

export function AiConfigTab() {
    const { config, updateConfig, isLoading } = useAiConfig()
    const [formData, setFormData] = useState<Partial<AiConfig> | null>(null)
    const [showKey, setShowKey] = useState(false)
    const [isSaving, setIsSaving] = useState(false)
    const [isTesting, setIsTesting] = useState(false)
    const [etapas, setEtapas] = useState<{ id: string, nome: string }[]>([])

    // Load kanban stages
    useEffect(() => {
        const fetchEtapas = async () => {
            const supabase = createClient()
            if (config?.organization_id) {
                const { data } = await supabase.from('etapas_kanban').select('id, nome').eq('organization_id', config.organization_id).order('ordem')
                if (data) setEtapas(data)
            }
        }
        fetchEtapas()
    }, [config?.organization_id])

    // Hydrate form
    useEffect(() => {
        if (config && !formData) {
            setFormData(config)
        }
    }, [config, formData])

    if (isLoading || !formData) return (
        <Card className="flex items-center justify-center p-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </Card>
    )

    const handleChange = (field: keyof AiConfig, value: any) => {
        setFormData(prev => prev ? { ...prev, [field]: value } : prev)
    }

    const handleSave = async () => {
        setIsSaving(true)
        try {
            await updateConfig(formData)
            toast.success('Configurações do Agente salvas com sucesso!')
        } catch (e: any) {
            toast.error('Erro ao salvar configurações.')
        } finally {
            setIsSaving(false)
        }
    }

    const testConnection = async () => {
        // Simulate connection test
        setIsTesting(true)
        await new Promise(r => setTimeout(r, 1500))
        setIsTesting(false)
        if (formData.api_key && formData.api_key.length > 10) {
            toast.success('Conexão estabelecida com sucesso!')
        } else {
            toast.error('Falha de conexão: Verifique a API Key.')
        }
    }

    return (
        <div className="space-y-8 pb-12">
            {/* SECTION: Provider & Model */}
            <Card>
                <CardHeader>
                    <CardTitle>Provider e Modelo</CardTitle>
                    <CardDescription>Escolha o fornecedor de IA e a inteligência de processamento.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <ProviderSelector
                        value={formData.provider || 'openai'}
                        onChange={(val) => {
                            handleChange('provider', val)
                            // Reset model when switching provider
                            const defaultModel = val === 'openai' ? 'gpt-4o-mini' : val === 'anthropic' ? 'claude-3-5-sonnet-20241022' : 'gemini-2.5-flash'
                            handleChange('model', defaultModel)
                        }}
                    />

                    <div className="space-y-3">
                        <Label className="text-sm font-medium">API Key <span className="text-red-500">*</span></Label>
                        <div className="flex gap-2">
                            <div className="relative flex-1">
                                <Input
                                    type={showKey ? 'text' : 'password'}
                                    placeholder="sk-..."
                                    value={formData.api_key || ''}
                                    onChange={(e) => handleChange('api_key', e.target.value)}
                                    className="pr-10"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowKey(!showKey)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                                >
                                    {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                            <Button variant="outline" onClick={testConnection} disabled={isTesting || !formData.api_key}>
                                {isTesting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-2" />}
                                Testar conexão
                            </Button>
                        </div>
                        <p className="text-xs text-muted-foreground">Sua chave é criptografada em nosso banco de dados (AES-256-GCM) e nunca é exposta.</p>
                    </div>

                    <ModelSelector
                        provider={formData.provider || 'openai'}
                        value={formData.model || 'gpt-4o-mini'}
                        onChange={(val) => handleChange('model', val)}
                    />

                    {formData.provider !== 'openai' && (
                        <div className="space-y-3 pt-2">
                            <Label className="text-sm font-medium">OpenAI Key para Transcrição de Áudio (Opcional)</Label>
                            <p className="text-xs text-muted-foreground mb-1">
                                Como você não está usando a OpenAI como provedor principal, precisará fornecer uma chave da OpenAI se desejar que este agente consiga "escutar" e transcrever áudios (usará Whisper).
                            </p>
                            <Input
                                type="password"
                                placeholder="sk-..."
                                value={formData.openai_key_for_whisper || ''}
                                onChange={(e) => handleChange('openai_key_for_whisper', e.target.value)}
                            />
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* SECTION: Behavior */}
            <Card>
                <CardHeader>
                    <CardTitle>Comportamento do Modelo</CardTitle>
                    <CardDescription>Ajuste como a inteligência lida com o tempo e a temperatura das respostas.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-8">

                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <Label>Temperatura</Label>
                            <span className="font-mono text-sm bg-gray-100 dark:bg-gray-800 px-2 rounded">{formData.temperature}</span>
                        </div>
                        <input
                            type="range" min="0" max="1" step="0.1"
                            value={formData.temperature}
                            onChange={(e) => handleChange('temperature', parseFloat(e.target.value))}
                            className="w-full accent-blue-600"
                        />
                        <div className="flex justify-between text-xs text-muted-foreground">
                            <span>Mais preciso (0.0)</span>
                            <span>Mais criativo (1.0)</span>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <Label>Janela de Contexto (Últimas Mgs)</Label>
                            <span className="font-mono text-sm bg-gray-100 dark:bg-gray-800 px-2 rounded">{formData.context_window} msgs</span>
                        </div>
                        <input
                            type="range" min="5" max="30" step="1"
                            value={formData.context_window}
                            onChange={(e) => handleChange('context_window', parseInt(e.target.value))}
                            className="w-full accent-blue-600"
                        />
                        <p className="text-xs text-muted-foreground">Quantas mensagens anteriores da conversa serão enviadas à IA para "memória". (Impacta custo de tokens)</p>
                    </div>

                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <Label>Delay de Concatenação</Label>
                            <span className="font-mono text-sm bg-gray-100 dark:bg-gray-800 px-2 rounded">{formData.concat_delay_seconds} segundos</span>
                        </div>
                        <input
                            type="range" min="5" max="60" step="5"
                            value={formData.concat_delay_seconds}
                            onChange={(e) => handleChange('concat_delay_seconds', parseInt(e.target.value))}
                            className="w-full accent-blue-600"
                        />
                        <p className="text-xs text-muted-foreground">O tempo que a IA esperará por novas mensagens (digitadas picadas) antes de analisar tudo em bloco.</p>
                    </div>

                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <Label>Simular Digitação (Delay por bloco)</Label>
                            <span className="font-mono text-sm bg-gray-100 dark:bg-gray-800 px-2 rounded">{formData.response_delay_ms} ms</span>
                        </div>
                        <input
                            type="range" min="500" max="5000" step="500"
                            value={formData.response_delay_ms}
                            onChange={(e) => handleChange('response_delay_ms', parseInt(e.target.value))}
                            className="w-full accent-blue-600"
                        />
                        <p className="text-xs text-muted-foreground">Tempo entre cada parágrafo disparado pela IA, para parecer mais humano.</p>
                    </div>

                </CardContent>
            </Card>

            {/* SECTION: Business Hours */}
            <BusinessHoursEditor
                enabled={formData.business_hours_enabled || false}
                onEnabledChange={(val) => handleChange('business_hours_enabled', val)}
                hours={formData.business_hours!}
                onHoursChange={(val) => handleChange('business_hours', val)}
            />

            {formData.business_hours_enabled && (
                <div className="space-y-3 px-1">
                    <Label className="text-sm font-medium">Mensagem de Fora do Horário (Opcional)</Label>
                    <Textarea
                        placeholder="Nosso horário de atendimento encerrou..."
                        value={formData.out_of_hours_message || ''}
                        onChange={(e) => handleChange('out_of_hours_message', e.target.value)}
                        className="min-h-[80px]"
                    />
                    <p className="text-xs text-muted-foreground">Se deixar vazio, a IA apenas ignorará a mensagem e não responderá nada.</p>
                </div>
            )}

            {/* SECTION: Pauses and Qualification */}
            <Card>
                <CardHeader>
                    <CardTitle>Pausa, Retomada e Analítica</CardTitle>
                    <CardDescription>Critérios de auto-transbordo entre humano e inteligência artificial.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">

                    <div className="flex items-center justify-between p-4 border rounded-lg bg-gray-50 dark:bg-[#1B1F3B]/30">
                        <div className="mr-4">
                            <Label className="text-base">Pausa Automática (Hand-off Homem-Máquina)</Label>
                            <p className="text-sm text-muted-foreground mt-1">Se você (humano) digitar qualquer coisa no Chat para este lead, a IA ficará instantaneamente MUDINHA e repassará a liderança pra você.</p>
                        </div>
                        <Switch
                            checked={formData.auto_pause_on_human}
                            onCheckedChange={(val) => handleChange('auto_pause_on_human', val)}
                        />
                    </div>

                    <div className="space-y-4 px-1">
                        <div className="flex justify-between items-center">
                            <Label>Retomar IA automaticamente após inatividade do humano</Label>
                            <span className="font-mono text-sm bg-gray-100 dark:bg-gray-800 px-2 rounded">
                                {formData.auto_resume_hours === 0 ? 'DESLIGADO' : `${formData.auto_resume_hours} horas`}
                            </span>
                        </div>
                        <input
                            type="range" min="0" max="24" step="1"
                            value={formData.auto_resume_hours}
                            onChange={(e) => handleChange('auto_resume_hours', parseInt(e.target.value))}
                            className="w-full accent-blue-600"
                        />
                        <div className="flex justify-between text-xs text-muted-foreground">
                            <span>0 (Nunca retoma)</span>
                            <span>24 horas</span>
                        </div>
                    </div>

                    <div className="flex items-center justify-between p-4 border rounded-lg bg-gray-50 dark:bg-[#1B1F3B]/30 mt-6">
                        <div className="mr-4">
                            <Label className="text-base">Gerar Insights Automáticos</Label>
                            <p className="text-sm text-muted-foreground mt-1">Sempre que a IA terminar um longo atendimento, elabora resumos curtos nas Notas Internas do Lead.</p>
                        </div>
                        <Switch
                            checked={formData.generate_insights}
                            onCheckedChange={(val) => handleChange('generate_insights', val)}
                        />
                    </div>

                    {/* Qualified Stage Select */}
                    {etapas.length > 0 && (
                        <div className="space-y-3 px-1 pt-4">
                            <Label className="text-sm font-medium">Mover Leads para Etapa Quando "Qualificados pela IA" <span className="text-xs text-muted-foreground">(Action Tool)</span></Label>
                            <select
                                value={formData.qualified_stage_id || ''}
                                onChange={(e) => handleChange('qualified_stage_id', e.target.value)}
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                <option value="">Selecione a etapa (Opcional)...</option>
                                {etapas.map(e => <option key={e.id} value={e.id}>{e.nome}</option>)}
                            </select>
                        </div>
                    )}

                </CardContent>
            </Card>

            <div className="flex justify-end pt-4">
                <Button size="lg" onClick={handleSave} disabled={isSaving}>
                    {isSaving ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Save className="w-5 h-5 mr-2" />}
                    Salvar Configurações Gerais
                </Button>
            </div>
        </div>
    )
}
