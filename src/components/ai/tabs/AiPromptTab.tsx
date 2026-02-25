'use client'

import { useRef, useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { useAiConfig } from '@/hooks/ai/useAiConfig'
import { Loader2, Save, Wrench } from 'lucide-react'
import { toast } from 'sonner'

const VARIABLES = [
    { tag: '{{lead.nome}}', desc: 'Nome do chumbamento' },
    { tag: '{{lead.telefone}}', desc: 'Número WhatsApp' },
    { tag: '{{lead.email}}', desc: 'Email do contato' },
    { tag: '{{lead.etapa}}', desc: 'Status atual do Kanban' },
    { tag: '{{lead.tags}}', desc: 'Lista de etiquetas' },
    { tag: '{{lead.atendente}}', desc: 'Consultor responsável' },
    { tag: '{{lead.criado_em}}', desc: 'Data de recepção' },
    { tag: '{{lead.valor_venda}}', desc: 'Ticket/Orçamento' },
    { tag: '{{org.nome}}', desc: 'Nome da sua Empresa' },
    { tag: '{{data_hora}}', desc: 'Timestamp D-0 local' }
]

const TOOLS = [
    { id: 'mover_lead_etapa', icon: '📋', name: 'Mover Etapa', desc: 'Move o lead para qualquer estágio do kanban (ex: Novo -> Em Contato).' },
    { id: 'qualificar_lead', icon: '⭐', name: 'Qualificar Lead', desc: 'Move automaticamente para a etapa de qualificados se o humano mostrar fit.' },
    { id: 'adicionar_tag', icon: '🏷️', name: 'Adicionar Tag', desc: 'Etiqueta o fluxo para relatórios ou segmentação posterior.' },
    { id: 'transferir_humano', icon: '👤', name: 'Transferir a Humano', desc: 'Desliga a IA passivamente para o humano atuar alertando sobre limitação.' },
    { id: 'registrar_info', icon: '📝', name: 'Registrar Informação', desc: 'Armazena variáveis valiosas (email, valor financeiro, objeções).' },
    { id: 'encerrar_conversa', icon: '🔚', name: 'Encerrar', desc: 'Sinaliza fechamento cordial de tópico se não houver mais dor exposta.' },
]

export function AiPromptTab() {
    const { config, updateConfig, isLoading } = useAiConfig()
    const [prompt, setPrompt] = useState('')
    const [enabledTools, setEnabledTools] = useState<string[]>([])
    const [isSaving, setIsSaving] = useState(false)
    const textareaRef = useRef<HTMLTextAreaElement>(null)

    useEffect(() => {
        if (config) {
            setPrompt(config.system_prompt || '')
            setEnabledTools(config.enabled_tools || [])
        }
    }, [config])

    if (isLoading || !config) return (
        <Card className="flex items-center justify-center p-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </Card>
    )

    const insertVariable = (tag: string) => {
        const el = textareaRef.current
        if (!el) return

        const start = el.selectionStart
        const end = el.selectionEnd
        const current = prompt
        const before = current.substring(0, start)
        const after = current.substring(end)
        const newText = before + tag + after

        setPrompt(newText)
        setTimeout(() => {
            el.focus()
            el.setSelectionRange(start + tag.length, start + tag.length)
        }, 0)
    }

    const toggleTool = (toolId: string, checked: boolean) => {
        if (checked) {
            setEnabledTools([...enabledTools, toolId])
        } else {
            setEnabledTools(enabledTools.filter(t => t !== toolId))
        }
    }

    const handleSave = async () => {
        setIsSaving(true)
        try {
            await updateConfig({ system_prompt: prompt, enabled_tools: enabledTools })
            toast.success('Prompt e Ferramentas salvos com sucesso!')
        } catch (e: any) {
            toast.error('Erro ao salvar prompt do Agente.')
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <div className="space-y-8 pb-12">
            {/* System Prompt Section */}
            <Card>
                <CardHeader>
                    <CardTitle>Comportamento e Instruções do Agente</CardTitle>
                    <CardDescription>
                        Defina o System Prompt (ou a personalidade) do robô. Essa é a diretriz mestre lida antes de toda interação com clientes.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/50 rounded-lg p-4">
                        <Label className="text-sm font-semibold text-blue-900 dark:text-blue-200 mb-2 block">
                            Variáveis Dinâmicas Prontas para Uso
                        </Label>
                        <div className="flex flex-wrap gap-2">
                            {VARIABLES.map(v => (
                                <button
                                    key={v.tag}
                                    onClick={() => insertVariable(v.tag)}
                                    title={v.desc}
                                    className="px-2 py-1 bg-white dark:bg-[#1B1F3B] border shadow-sm text-xs font-mono text-blue-600 dark:text-blue-400 rounded hover:bg-blue-600 hover:text-white dark:hover:bg-blue-600 transition-colors"
                                >
                                    {v.tag}
                                </button>
                            ))}
                        </div>
                        <p className="text-xs text-blue-700/70 dark:text-blue-300/50 mt-2">
                            Clique numa pílula para inserir na posição do cursor abaixo. Estas chaves serão substituídas pelos metadados reais de cada Lead no ato da resposta.
                        </p>
                    </div>

                    <div className="space-y-2">
                        <Textarea
                            ref={textareaRef}
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            placeholder="Você é [Nome], um consultor incansável e cordial da empresa [{{org.nome}}]..."
                            className="min-h-[400px] font-mono whitespace-pre-wrap leading-relaxed dark:bg-[#0B0E1E] resize-y"
                            maxLength={50000}
                        />
                        <div className="flex justify-between text-xs text-muted-foreground px-1">
                            <span>Evite redigir markdown (use textos fluidos simulando WhatsApp).</span>
                            <span className={prompt.length >= 48000 ? 'text-red-500' : ''}>
                                {prompt.length.toLocaleString()} / 50.000 caracteres
                            </span>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Tools Section */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Wrench className="w-5 h-5" /> Ferramentas Ativas (Tool Calling)
                    </CardTitle>
                    <CardDescription>
                        Exponha à IA habilidades mecânicas que perturbam o CRM físico (só atuarão se você dar instruções de "quando acionar" ali em cima no Prompt).
                    </CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {TOOLS.map(t => {
                        const isEnabled = enabledTools.includes(t.id)
                        return (
                            <div key={t.id} className={`flex items-start justify-between p-4 border rounded-xl transition-colors ${isEnabled ? 'bg-green-50/50 dark:bg-green-900/10 border-green-200 dark:border-green-800/50' : 'bg-gray-50 dark:bg-[#1B1F3B]/30'}`}>
                                <div className="flex gap-3">
                                    <div className="text-xl pt-1">{t.icon}</div>
                                    <div className="space-y-1 pr-4">
                                        <Label className="font-semibold text-base">{t.name}</Label>
                                        <p className="text-xs text-muted-foreground leading-relaxed">{t.desc}</p>
                                        <code className="text-[10px] text-gray-400 block mt-1">tool_name: {t.id}</code>
                                    </div>
                                </div>
                                <Switch
                                    checked={isEnabled}
                                    onCheckedChange={(val) => toggleTool(t.id, val)}
                                />
                            </div>
                        )
                    })}
                </CardContent>
            </Card>

            <div className="flex justify-end pt-4">
                <Button size="lg" onClick={handleSave} disabled={isSaving}>
                    {isSaving ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Save className="w-5 h-5 mr-2" />}
                    Salvar Prompt e Ferramentas
                </Button>
            </div>
        </div>
    )
}
