'use client'

import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface ModelSelectorProps {
    provider: string
    value: string
    onChange: (val: string) => void
    disabled?: boolean
}

export const AI_MODELS: Record<string, { value: string, label: string, description: string }[]> = {
    openai: [
        { value: 'gpt-4o-mini', label: 'GPT-4o Mini (Recomendado)', description: 'Rápido e econômico' },
        { value: 'gpt-4o', label: 'GPT-4o', description: 'Avançado multimodal' },
        { value: 'gpt-4-turbo', label: 'GPT-4 Turbo', description: 'Alto processamento' },
    ],
    anthropic: [
        { value: 'claude-3-5-sonnet-20241022', label: 'Claude 3.5 Sonnet (Recomendado)', description: 'Equilíbrio ideal' },
        { value: 'claude-3-5-haiku-20241022', label: 'Claude 3.5 Haiku', description: 'Mais rápido e barato' },
    ],
    google: [
        { value: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash (Recomendado)', description: 'Rápido e multimodal' },
        { value: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro', description: 'Mais poderoso' },
    ]
}

export function ModelSelector({ provider, value, onChange, disabled }: ModelSelectorProps) {
    const models = AI_MODELS[provider] || AI_MODELS['openai']

    return (
        <div className="space-y-3">
            <Label className="text-sm font-medium">Modelo <span className="text-red-500">*</span></Label>
            <Select value={value} onValueChange={onChange} disabled={disabled}>
                <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecione um modelo..." />
                </SelectTrigger>
                <SelectContent>
                    {models.map(m => (
                        <SelectItem key={m.value} value={m.value}>
                            <div className="flex flex-col">
                                <span>{m.label}</span>
                                <span className="text-xs text-muted-foreground">{m.description}</span>
                            </div>
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    )
}
