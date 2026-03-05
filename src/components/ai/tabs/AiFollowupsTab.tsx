'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { Clock, Loader2, Save, Info } from 'lucide-react'
import { useOrganization } from '@/components/providers/organization-provider'

export function AiFollowupsTab() {
    const { organization } = useOrganization()
    const supabase = createClient()
    const queryClient = useQueryClient()

    const { data: config, isLoading } = useQuery({
        queryKey: ['aiConfig', organization?.id],
        queryFn: async () => {
            if (!organization) return null
            const { data } = await supabase.from('ai_config').select('*').eq('organization_id', organization.id).single()
            return data
        },
        enabled: !!organization?.id
    })

    const [enabled, setEnabled] = useState(false)
    const [maxAttempts, setMaxAttempts] = useState(3)
    const [businessHoursOnly, setBusinessHoursOnly] = useState(true)
    const [intervals, setIntervals] = useState<number[]>([24, 48, 72])

    useEffect(() => {
        if (config) {
            setEnabled(config.followup_enabled || false)
            setMaxAttempts(config.followup_max_attempts || 3)
            setBusinessHoursOnly(config.followup_business_hours_only ?? true)
            if (config.followup_intervals && Array.isArray(config.followup_intervals)) {
                setIntervals(config.followup_intervals)
            }
        }
    }, [config])

    const saveMutation = useMutation({
        mutationFn: async () => {
            if (!organization) throw new Error('No organization')
            const { error } = await supabase
                .from('ai_config')
                .update({
                    followup_enabled: enabled,
                    followup_max_attempts: maxAttempts,
                    followup_business_hours_only: businessHoursOnly,
                    followup_intervals: intervals
                })
                .eq('organization_id', organization.id)
            if (error) throw error
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['aiConfig'] })
            alert('Configurações de Follow-up atualizadas com sucesso.')
        }
    })

    const handleIntervalChange = (index: number, value: string) => {
        const num = parseInt(value, 10)
        const newIntervals = [...intervals]
        newIntervals[index] = isNaN(num) ? 0 : num
        setIntervals(newIntervals)
    }

    if (isLoading) {
        return <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-gray-400 h-8 w-8" /></div>
    }

    return (
        <Card className="border-gray-200 shadow-sm relative overflow-hidden">
            <CardHeader className="bg-gray-50/50 border-b border-gray-100 pb-4">
                <CardTitle className="text-xl flex items-center gap-2">
                    <Clock className="h-5 w-5 text-blue-600" />
                    Engajamento & Follow-ups
                </CardTitle>
                <CardDescription>
                    Configure como o agente de IA deve acompanhar os leads que pararam de responder.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 border rounded-xl bg-white shadow-sm">
                    <div className="space-y-0.5">
                        <Label className="text-base">Módulo de Follow-up Automático (IA)</Label>
                        <p className="text-sm text-gray-500">
                            Permitir que a IA envie mensagens para leads que não responderam.
                        </p>
                    </div>
                    <Switch checked={enabled} onCheckedChange={setEnabled} />
                </div>

                {enabled && (
                    <div className="space-y-6 pt-4 border-t border-gray-100 animate-in fade-in duration-300">
                        <div className="grid gap-6 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label>Máximo de Tentativas</Label>
                                <p className="text-[13px] text-gray-500 mb-2">Quantas vezes tentar reconectar com o lead.</p>
                                <Input
                                    type="number"
                                    min={1}
                                    max={10}
                                    value={maxAttempts}
                                    onChange={e => setMaxAttempts(parseInt(e.target.value) || 1)}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>Horário Comercial Restrito</Label>
                                <p className="text-[13px] text-gray-500 mb-2">Se ativado, as mensagens serão adiadas se caírem de madrugada ou fds.</p>
                                <div className="flex items-center h-10 px-3 border rounded-md bg-gray-50">
                                    <Switch checked={businessHoursOnly} onCheckedChange={setBusinessHoursOnly} className="mr-3" />
                                    <span className="text-sm font-medium">{businessHoursOnly ? 'Sim, apenas horário comercial' : 'Não, enviar a qualquer hora'}</span>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <Label>Intervalos de Tentativa (Em Horas)</Label>
                            <p className="text-[13px] text-gray-500">
                                Defina quantas horas a Inteligência Artificial deve esperar entre cada tentativa de contato. Se o limite máximo de tentativas for maior que os intervalos, o último valor se repetirá na lógica.
                            </p>

                            <div className="flex flex-wrap items-center gap-3">
                                {intervals.map((val, idx) => (
                                    <div key={idx} className="flex items-center gap-2">
                                        <span className="text-sm font-medium text-gray-500 w-24">Tentativa {idx + 1}:</span>
                                        <Input
                                            type="number"
                                            min={1}
                                            className="w-24"
                                            value={val}
                                            onChange={e => handleIntervalChange(idx, e.target.value)}
                                        />
                                        <span className="text-sm text-gray-400">h</span>
                                    </div>
                                ))}
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setIntervals([...intervals, 24])}
                                    className="ml-2"
                                >
                                    + Adicionar
                                </Button>
                                {intervals.length > 1 && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setIntervals(intervals.slice(0, -1))}
                                        className="text-red-500 hover:text-red-600 hover:bg-red-50"
                                    >
                                        Remover Último
                                    </Button>
                                )}
                            </div>

                        </div>

                        <div className="bg-blue-50/50 p-4 rounded-lg flex gap-3 text-sm text-blue-800 border border-blue-100">
                            <Info className="h-5 w-5 shrink-0 text-blue-500" />
                            <p>
                                Um agendamento automático será criado para o Lead logo após a IA responder, respeitando estas variáveis. Você pode gerenciar ou cancelar as execuções individualmente na página de Follow-ups do Dashboard e no chat do Lead.
                            </p>
                        </div>
                    </div>
                )}
            </CardContent>

            <CardFooter className="bg-gray-50/50 border-t border-gray-100 py-4 flex justify-end">
                <Button
                    onClick={() => saveMutation.mutate()}
                    disabled={saveMutation.isPending}
                    className="bg-[#2563EB] hover:bg-[#1D4ED8]"
                >
                    {saveMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                    Salvar Configurações
                </Button>
            </CardFooter>
        </Card>
    )
}
