'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { useAiConfig } from '@/hooks/ai/useAiConfig'
import { Bot, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

export function AiStatusBanner() {
    const { config, updateConfig, isUpdating } = useAiConfig()

    if (!config) return (
        <Card className="bg-gradient-to-r from-blue-900 to-[#1B1F3B] border-blue-500/20 text-white animate-pulse">
            <CardContent className="h-[96px]" />
        </Card>
    )

    const handleToggle = async (checked: boolean) => {
        try {
            await updateConfig({ enabled: checked })
            toast.success(`Agente IA ${checked ? 'ativado' : 'desativado'} com sucesso.`)
        } catch (e: any) {
            toast.error('Ocorreu um erro ao alterar o status do agente.')
        }
    }

    const statusColor = config.enabled ? 'text-green-400 bg-green-400/10' : 'text-gray-400 bg-gray-400/10'

    return (
        <Card className={`transition-all duration-300 ${config.enabled ? 'bg-gradient-to-r from-blue-900 to-[#1B1F3B] border-blue-500/40 text-white' : 'bg-gray-100 dark:bg-[#1B1F3B] dark:border-white/10 text-gray-400'}`}>
            <CardContent className="p-6 flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className={`flex items-center justify-center w-12 h-12 rounded-full ${statusColor}`}>
                        <Bot size={24} />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h3 className={`text-xl font-bold ${config.enabled ? 'text-white' : 'text-gray-900 dark:text-white/50'}`}>Agente IA</h3>
                            {isUpdating && <Loader2 size={14} className="animate-spin text-blue-400" />}
                        </div>
                        <p className={`text-sm ${config.enabled ? 'text-blue-200' : 'text-gray-500 dark:text-gray-500'}`}>
                            Provider: <span className="capitalize">{config.provider}</span> · Modelo: {config.model}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <span className="text-sm font-medium">
                        {config.enabled ? '✔ ATIVO' : '✕ INATIVO'}
                    </span>
                    <Switch
                        id="ai-status"
                        checked={config.enabled}
                        onCheckedChange={handleToggle}
                        disabled={isUpdating}
                    />
                </div>
            </CardContent>
        </Card>
    )
}
