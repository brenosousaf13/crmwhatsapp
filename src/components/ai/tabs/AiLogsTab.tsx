'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAiLogs } from '@/hooks/ai/useAiLogs'
import { Loader2, Zap, DollarSign, Clock, MessageSquare, Wrench } from 'lucide-react'
import { Label } from '@/components/ui/label'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

export function AiLogsTab() {
    const { logs, isLoading, metrics } = useAiLogs()

    if (isLoading) return (
        <Card className="flex items-center justify-center p-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </Card>
    )

    return (
        <div className="space-y-8 pb-12">
            {/* Metrics Row */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="bg-gray-50/50 dark:bg-[#1B1F3B]/30">
                    <CardContent className="p-4 flex items-center gap-4">
                        <div className="p-3 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg">
                            <MessageSquare size={20} />
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Interações</p>
                            <h4 className="text-2xl font-bold">{metrics.totalInteractions}</h4>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-gray-50/50 dark:bg-[#1B1F3B]/30">
                    <CardContent className="p-4 flex items-center gap-4">
                        <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg">
                            <Zap size={20} />
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Tokens Usados</p>
                            <h4 className="text-2xl font-bold font-mono">{metrics.totalTokens.toLocaleString()}</h4>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-gray-50/50 dark:bg-[#1B1F3B]/30">
                    <CardContent className="p-4 flex items-center gap-4">
                        <div className="p-3 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-lg">
                            <DollarSign size={20} />
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Custo Est. (USD)</p>
                            <h4 className="text-2xl font-bold font-mono">${metrics.totalCost.toFixed(4)}</h4>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-gray-50/50 dark:bg-[#1B1F3B]/30">
                    <CardContent className="p-4 flex items-center gap-4">
                        <div className="p-3 bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 rounded-lg">
                            <Clock size={20} />
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Latência Média</p>
                            <h4 className="text-2xl font-bold font-mono">{metrics.avgResponseTime}ms</h4>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Histórico de Respostas Recentes</CardTitle>
                    <CardDescription>Visualização da telemetria bruta e chamadas de ferramenta.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-[#1B1F3B]/50 dark:text-gray-400">
                                <tr>
                                    <th className="px-4 py-3 font-medium">Data</th>
                                    <th className="px-4 py-3 font-medium">Lead</th>
                                    <th className="px-4 py-3 font-medium">Métricas (Tokens / Tempo)</th>
                                    <th className="px-4 py-3 font-medium">Modelo / Ação</th>
                                    <th className="px-4 py-3 font-medium text-right">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {!logs || logs.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="h-24 text-center px-4 py-3 text-muted-foreground">Nenhum log encontrado.</td>
                                    </tr>
                                ) : (
                                    logs.map((log) => {
                                        const totalLogTokens = log.input_tokens + log.output_tokens
                                        const hasTool = log.tool_calls && Object.keys(log.tool_calls).length > 0

                                        return (
                                            <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-[#1B1F3B]/30">
                                                <td className="px-4 py-3 whitespace-nowrap">
                                                    {new Date(log.criado_em!).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="font-medium">{log.lead?.nome || 'Lead Excluído'}</div>
                                                    <div className="text-xs text-muted-foreground">{log.lead?.telefone}</div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-2">
                                                        <Badge variant="outline" className="font-mono text-xs">{totalLogTokens} tks</Badge>
                                                        <span className="text-xs text-muted-foreground">{log.response_time_ms}ms</span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <span className="text-xs text-muted-foreground">{log.model}</span>
                                                        {hasTool && (
                                                            <Badge variant="secondary" className="flex items-center gap-1 text-[10px]">
                                                                <Wrench size={10} /> Tool Executada
                                                            </Badge>
                                                        )}
                                                        {log.error && (
                                                            <Badge variant="destructive" className="text-[10px]">Erro</Badge>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    <Dialog>
                                                        <DialogTrigger asChild>
                                                            <Button variant="ghost" size="sm">Ver Trilha</Button>
                                                        </DialogTrigger>
                                                        <DialogContent className="max-w-3xl h-[80vh] flex flex-col">
                                                            <DialogHeader>
                                                                <DialogTitle>Log de Execução IA</DialogTitle>
                                                                <DialogDescription>
                                                                    Metadados do evento executado com o lead {log.lead?.nome}.
                                                                </DialogDescription>
                                                            </DialogHeader>
                                                            <div className="flex-1 overflow-y-auto space-y-4 pr-2">
                                                                <div className="grid grid-cols-2 gap-4">
                                                                    <div className="p-3 bg-gray-50 border rounded-lg text-sm">
                                                                        <span className="text-muted-foreground block mb-1">Custo Estimado</span>
                                                                        <span className="font-mono">${log.estimated_cost?.toFixed(6)}</span>
                                                                    </div>
                                                                    <div className="p-3 bg-gray-50 border rounded-lg text-sm">
                                                                        <span className="text-muted-foreground block mb-1">Provider</span>
                                                                        <span className="capitalize">{log.provider}</span>
                                                                    </div>
                                                                </div>

                                                                <div>
                                                                    <Label className="text-xs text-muted-foreground uppercase tracking-wider mb-2 block">Contexto Lido (Input)</Label>
                                                                    <div className="p-4 bg-gray-100 dark:bg-gray-900 border rounded-lg font-mono text-xs whitespace-pre-wrap">
                                                                        {log.input_text}
                                                                    </div>
                                                                </div>
                                                                <div>
                                                                    <Label className="text-xs text-muted-foreground uppercase tracking-wider mb-2 block">Resposta Gerada (Output)</Label>
                                                                    <div className="p-4 bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900 rounded-lg font-mono text-xs whitespace-pre-wrap">
                                                                        {log.output_text || '(Nenhum texto gerado)'}
                                                                    </div>
                                                                </div>

                                                                {hasTool && (
                                                                    <div>
                                                                        <Label className="text-xs text-muted-foreground uppercase tracking-wider mb-2 block flex items-center gap-2">
                                                                            <Wrench size={12} /> Ferramentas Chamadas
                                                                        </Label>
                                                                        <div className="p-4 bg-purple-50 dark:bg-purple-900/10 border border-purple-100 dark:border-purple-900 rounded-lg font-mono text-xs whitespace-pre-wrap text-purple-800 dark:text-purple-300">
                                                                            {JSON.stringify(log.tool_calls, null, 2)}
                                                                        </div>
                                                                    </div>
                                                                )}

                                                                {log.error && (
                                                                    <div>
                                                                        <Label className="text-xs text-red-500 uppercase tracking-wider mb-2 block">Erro Fatal</Label>
                                                                        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg font-mono text-xs text-red-600 dark:text-red-400">
                                                                            {log.error}
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </DialogContent>
                                                    </Dialog>
                                                </td>
                                            </tr>
                                        )
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
