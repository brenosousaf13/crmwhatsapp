'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { format, formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Check, Clock, Bot, User, Trash2, Calendar, SendHorizontal, AlertCircle } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import Link from 'next/link'

interface Lead {
    id: string
    nome: string
    telefone: string
    etapa_id: string
}

interface Followup {
    id: string
    tipo: 'ia' | 'humano'
    status: 'pendente' | 'executado' | 'cancelado' | 'falhou'
    agendado_para: string
    executado_em?: string
    motivo?: string
    notas?: string
    mensagem?: string
    mensagem_enviada?: string
    tentativa_numero: number
    max_tentativas: number
    criado_em: string
    leads: Lead
}

export default function FollowupsPage() {
    const queryClient = useQueryClient()
    const [activeTab, setActiveTab] = useState('pendente')
    const [selectedFollowup, setSelectedFollowup] = useState<Followup | null>(null)
    const [completeNotes, setCompleteNotes] = useState('')
    const [sentMessage, setSentMessage] = useState('')

    const { data: followups, isLoading } = useQuery<Followup[]>({
        queryKey: ['followups', activeTab],
        queryFn: async () => {
            const res = await fetch(`/api/followups?status=${activeTab}`)
            if (!res.ok) throw new Error('Falha ao buscar follow-ups')
            return res.json()
        }
    })

    const updateMutation = useMutation({
        mutationFn: async (vars: { id: string, status: string, notas?: string, mensagem?: string }) => {
            const res = await fetch('/api/followups', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(vars)
            })
            if (!res.ok) throw new Error('Falha ao atualizar')
            return res.json()
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['followups'] })
            setSelectedFollowup(null)
            setCompleteNotes('')
            setSentMessage('')
        }
    })

    const cancelMutation = useMutation({
        mutationFn: async (id: string) => {
            const res = await fetch('/api/followups', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, status: 'cancelado', notas: 'Cancelado pelo usuário' })
            })
            if (!res.ok) throw new Error('Falha ao cancelar')
            return res.json()
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['followups'] })
        }
    })

    const handleComplete = () => {
        if (!selectedFollowup) return
        updateMutation.mutate({
            id: selectedFollowup.id,
            status: 'executado',
            notas: completeNotes,
            mensagem: sentMessage
        })
    }

    return (
        <div className="flex-1 space-y-6 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Follow-ups</h2>
                    <p className="text-muted-foreground mt-1">
                        Gerencie os lembretes e o engajamento de leads da sua organização.
                    </p>
                </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
                <TabsList>
                    <TabsTrigger value="pendente" className="relative">
                        Pendentes
                    </TabsTrigger>
                    <TabsTrigger value="executado">Histórico</TabsTrigger>
                </TabsList>

                <Card>
                    <CardHeader className="pb-3 border-b border-gray-100">
                        <CardTitle className="text-lg">
                            {activeTab === 'pendente' ? 'Agendamentos Atuais' : 'Ações Realizadas'}
                        </CardTitle>
                        <CardDescription>
                            {activeTab === 'pendente'
                                ? 'Ações que precisam de intervenção ou serão disparadas em breve.'
                                : 'Registro de acompanhamentos já finalizados ou cancelados.'}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6">
                        {isLoading ? (
                            <div className="flex justify-center p-8 text-gray-500">Buscando registros...</div>
                        ) : !followups || followups.length === 0 ? (
                            <div className="flex flex-col items-center justify-center p-12 text-center text-gray-500">
                                <Calendar className="h-12 w-12 text-gray-300 mb-4" />
                                <p className="text-lg font-medium text-gray-900">Nenhum follow-up encontrado</p>
                                <p className="text-sm">Não há registros para a aba selecionada no momento.</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {followups.map((f) => (
                                    <div key={f.id} className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-4 border rounded-lg hover:bg-gray-50/50 transition-colors">
                                        <div className="flex items-start gap-4">
                                            <div className="mt-1 flex items-center justify-center h-10 w-10 rounded-full bg-blue-50 text-blue-600">
                                                {f.tipo === 'ia' ? <Bot className="h-5 w-5" /> : <User className="h-5 w-5" />}
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <Link href={`/chat?lead=${f.leads.id}`} className="font-semibold text-gray-900 hover:text-blue-600 hover:underline">
                                                        {f.leads.nome || f.leads.telefone}
                                                    </Link>
                                                    {f.tipo === 'ia' && (
                                                        <Badge variant="outline" className="text-xs font-normal border-blue-200 text-blue-700 bg-blue-50/50">
                                                            Automação de IA ({f.tentativa_numero}/{f.max_tentativas})
                                                        </Badge>
                                                    )}
                                                    {f.status === 'falhou' && (
                                                        <Badge variant="destructive" className="flex items-center gap-1 text-[10px] px-1.5 py-0 h-5">
                                                            <AlertCircle className="w-3 h-3" /> Falhou
                                                        </Badge>
                                                    )}
                                                </div>

                                                <div className="flex items-center gap-4 text-sm text-gray-500">
                                                    <span className="flex items-center gap-1.5 leading-none">
                                                        <Clock className="w-3.5 h-3.5" />
                                                        {activeTab === 'pendente' ?
                                                            `Agendado para: ${format(new Date(f.agendado_para), "dd/MM 'às' HH:mm")} (${formatDistanceToNow(new Date(f.agendado_para), { addSuffix: true, locale: ptBR })})` :
                                                            `Realizado em: ${format(new Date(f.executado_em || f.agendado_para), "dd/MM/yyyy 'às' HH:mm")}`
                                                        }
                                                    </span>
                                                </div>

                                                {(f.motivo || f.notas) && (
                                                    <div className="mt-2 text-sm text-gray-600 bg-white border border-gray-100 p-2.5 rounded-md shadow-sm">
                                                        {f.motivo || f.notas}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {activeTab === 'pendente' && (
                                            <div className="flex md:flex-col items-center gap-2 w-full md:w-auto mt-4 md:mt-0">
                                                {f.tipo === 'humano' ? (
                                                    <Button
                                                        variant="default"
                                                        size="sm"
                                                        className="bg-green-600 hover:bg-green-700 text-white w-full md:w-32"
                                                        onClick={() => setSelectedFollowup(f)}
                                                    >
                                                        <Check className="w-4 h-4 mr-2" />
                                                        Resolver
                                                    </Button>
                                                ) : (
                                                    <Button
                                                        variant="secondary"
                                                        size="sm"
                                                        className="w-full md:w-32 bg-gray-100 text-gray-700 hover:bg-gray-200"
                                                        onClick={() => setSelectedFollowup(f)}
                                                    >
                                                        Ver Detalhes
                                                    </Button>
                                                )}
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="text-red-600 hover:text-red-700 hover:bg-red-50 w-full md:w-32"
                                                    onClick={() => {
                                                        if (window.confirm('Tem certeza que deseja cancelar este follow-up?')) {
                                                            cancelMutation.mutate(f.id)
                                                        }
                                                    }}
                                                >
                                                    <Trash2 className="w-4 h-4 mr-2" />
                                                    Cancelar
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </Tabs>

            {/* Dialog for completing/viewing Follow-up */}
            <Dialog open={!!selectedFollowup} onOpenChange={(open) => !open && setSelectedFollowup(null)}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>
                            {selectedFollowup?.tipo === 'ia' ? 'Detalhes do Acompanhamento (IA)' : 'Concluir Follow-up'}
                        </DialogTitle>
                        <DialogDescription>
                            Lead: <span className="font-medium text-gray-900">{selectedFollowup?.leads.nome || selectedFollowup?.leads.telefone}</span>
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 py-4">
                        {selectedFollowup?.tipo === 'ia' ? (
                            <div className="space-y-4">
                                <div className="bg-gray-50 border border-gray-100 p-3 rounded-md text-sm text-gray-600">
                                    A Inteligência Artificial verificará automaticamente o contexto da conversa e enviará uma mensagem condicional para engajar o Lead, se ele não tiver respondido.
                                </div>
                                {selectedFollowup?.motivo && (
                                    <div className="space-y-1">
                                        <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Gatilho / Motivo</label>
                                        <p className="text-sm font-medium text-gray-900">{selectedFollowup.motivo}</p>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <>
                                <div className="grid gap-2">
                                    <label className="text-sm font-medium leading-none text-gray-900">
                                        Como foi o contato? (Notas internas)
                                    </label>
                                    <Textarea
                                        placeholder="Descreva o que foi discutido ou a resposta do cliente..."
                                        className="resize-none h-24"
                                        value={completeNotes}
                                        onChange={(e) => setCompleteNotes(e.target.value)}
                                    />
                                </div>

                                {selectedFollowup?.mensagem && ( // Caso ele tenha deixado uma rascunho de mensagem para enviar...
                                    <div className="grid gap-2">
                                        <label className="text-sm font-medium leading-none text-gray-900 flex items-center gap-2">
                                            <SendHorizontal className="w-4 h-4 text-blue-600" />
                                            Mensagem enviada (opcional)
                                        </label>
                                        <Textarea
                                            placeholder="Cole ou digite aqui a mensagem final enviada ao cliente caso deseje..."
                                            className="resize-none h-24"
                                            value={sentMessage}
                                            onChange={(e) => setSentMessage(e.target.value)}
                                        />
                                    </div>
                                )}
                            </>
                        )}
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setSelectedFollowup(null)}>
                            Fechar
                        </Button>
                        {selectedFollowup?.tipo === 'humano' && (
                            <Button onClick={handleComplete} disabled={updateMutation.isPending} className="bg-green-600 hover:bg-green-700 text-white">
                                <Check className="w-4 h-4 mr-2" />
                                Marcar como Concluído
                            </Button>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
