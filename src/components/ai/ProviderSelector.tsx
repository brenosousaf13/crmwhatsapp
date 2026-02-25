'use client'

import { Label } from '@/components/ui/label'

interface ProviderSelectorProps {
    value: string
    onChange: (val: any) => void
    disabled?: boolean
}

const PROVIDERS = [
    { id: 'openai', name: 'OpenAI', icon: '🟢', description: 'Recomendado. Modelos GPT-4' },
    { id: 'anthropic', name: 'Anthropic', icon: '🟣', description: 'Modelos Claude 3.5 Sonnet' },
    { id: 'google', name: 'Google', icon: '🔵', description: 'Modelos Gemini 1.5/2.0 Flash' }
]

export function ProviderSelector({ value, onChange, disabled }: ProviderSelectorProps) {
    return (
        <div className="space-y-3">
            <Label className="text-sm font-medium">Provider da IA <span className="text-red-500">*</span></Label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {PROVIDERS.map(p => (
                    <div
                        key={p.id}
                        onClick={() => !disabled && onChange(p.id)}
                        className={`border rounded-lg p-4 cursor-pointer transition-all ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${value === p.id
                                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 ring-1 ring-blue-500'
                                : 'border-gray-200 hover:border-gray-300 dark:border-gray-800'
                            }`}
                    >
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-lg">{p.icon}</span>
                            <span className="font-semibold text-gray-900 dark:text-gray-100">{p.name}</span>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{p.description}</p>
                    </div>
                ))}
            </div>
        </div>
    )
}
