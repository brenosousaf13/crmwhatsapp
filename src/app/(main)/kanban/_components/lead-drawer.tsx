'use client'

import { useState } from 'react'
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { KanbanCardData } from './kanban-card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Phone, Loader2, GitCommit, ListPlus, Clock } from 'lucide-react'
import { useLeadNotes, useAddLeadNote, useLeadHistory, useUpdateLead } from '../_logic/use-kanban'
import { useQuery } from '@tanstack/react-query'
import { formatDistanceToNow, format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'

interface LeadDrawerProps {
    lead: KanbanCardData | null
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function LeadDrawer({ lead, open, onOpenChange }: LeadDrawerProps) {
    if (!lead) return null

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="w-[400px] sm:w-[540px] border-l-gray-200 p-0 flex flex-col h-full bg-gray-50">
                <div className="p-6 bg-white border-b border-gray-100 shrink-0">
                    <SheetHeader className="text-left flex flex-row items-center gap-4 space-y-0">
                        <Avatar className="h-16 w-16">
                            <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${lead.name}`} />
                            <AvatarFallback>{lead.name.substring(0, 2)}</AvatarFallback>
                        </Avatar>
                        <div>
                            <SheetTitle className="text-xl font-bold">{lead.name}</SheetTitle>
                            <p className="text-sm text-gray-500">{lead.phone}</p>
                        </div>
                    </SheetHeader>
                </div>

                <Tabs defaultValue="info" className="flex-1 flex flex-col overflow-hidden">
                    <div className="px-6 border-b border-gray-200 bg-white shrink-0">
                        <TabsList className="bg-transparent h-12 p-0 space-x-6">
                            <TabsTrigger value="info" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-green-600 rounded-none px-0 h-12">
                                Informações
                            </TabsTrigger>
                            <TabsTrigger value="history" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-green-600 rounded-none px-0 h-12">
                                Histórico
                            </TabsTrigger>
                            <TabsTrigger value="notes" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-green-600 rounded-none px-0 h-12">
                                Notas
                            </TabsTrigger>
                            <TabsTrigger value="followups" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-green-600 rounded-none px-0 h-12 flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5" /> Follow-ups
                            </TabsTrigger>
                        </TabsList>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6">
                        <TabsContent value="info" className="mt-0">
                            <LeadInfoTab lead={lead} />
                        </TabsContent>

                        <TabsContent value="history" className="mt-0">
                            <LeadHistoryTab leadId={lead.id} />
                        </TabsContent>

                        <TabsContent value="notes" className="mt-0 flex flex-col gap-6">
                            <LeadNotesTab leadId={lead.id} />
                        </TabsContent>

                        <TabsContent value="followups" className="mt-0 flex flex-col gap-6">
                            <LeadFollowupsTab leadId={lead.id} />
                        </TabsContent>
                    </div>
                </Tabs>
            </SheetContent>
        </Sheet>
    )
}

function LeadInfoTab({ lead }: { lead: KanbanCardData }) {
    const [isEditing, setIsEditing] = useState(false)
    const { mutate: updateLead, isPending } = useUpdateLead()
    const [formData, setFormData] = useState({
        nome: lead.name || '',
        telefone: lead.phone || '',
        valor_venda: lead.valor_venda?.toString() || ''
    })

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault()
        updateLead({
            leadId: lead.id,
            data: {
                nome: formData.nome,
                telefone: formData.telefone,
                valor_venda: formData.valor_venda ? Number(formData.valor_venda) : undefined
            }
        }, {
            onSuccess: () => setIsEditing(false)
        })
    }

    if (!isEditing) {
        return (
            <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm space-y-4">
                <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                    <h3 className="font-semibold text-gray-900">Detalhes do Lead</h3>
                    <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)} className="h-8 text-xs font-semibold text-blue-600 hover:text-blue-700">
                        Editar
                    </Button>
                </div>
                <div className="space-y-4">
                    <div className="flex items-center gap-3 text-sm text-gray-600">
                        <Phone className="h-4 w-4 text-gray-400" />
                        <span>{lead.phone}</span>
                    </div>
                    {lead.valor_venda && (
                        <div className="flex items-center gap-3 text-sm text-gray-600">
                            <span className="font-medium text-gray-400">R$</span>
                            <span>{lead.valor_venda.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                        </div>
                    )}
                </div>
            </div>
        )
    }

    return (
        <form onSubmit={handleSave} className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm space-y-4">
            <h3 className="font-semibold text-gray-900 border-b border-gray-100 pb-2">Editar Lead</h3>

            <div className="space-y-3">
                <div className="space-y-1">
                    <label className="text-xs font-medium text-gray-700">Nome</label>
                    <Input
                        value={formData.nome}
                        onChange={e => setFormData({ ...formData, nome: e.target.value })}
                        className="h-9 text-sm"
                        required
                    />
                </div>
                <div className="space-y-1">
                    <label className="text-xs font-medium text-gray-700">Telefone</label>
                    <Input
                        value={formData.telefone}
                        onChange={e => setFormData({ ...formData, telefone: e.target.value })}
                        className="h-9 text-sm"
                        required
                    />
                </div>
                <div className="space-y-1">
                    <label className="text-xs font-medium text-gray-700">Valor da Venda (R$)</label>
                    <Input
                        type="number"
                        step="0.01"
                        value={formData.valor_venda}
                        onChange={e => setFormData({ ...formData, valor_venda: e.target.value })}
                        className="h-9 text-sm"
                    />
                </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-gray-100 mt-4">
                <Button type="button" variant="outline" size="sm" onClick={() => setIsEditing(false)} disabled={isPending} className="h-8 text-xs">
                    Cancelar
                </Button>
                <Button type="submit" size="sm" disabled={isPending} className="h-8 text-xs bg-green-600 hover:bg-green-700">
                    {isPending ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null}
                    Salvar
                </Button>
            </div>
        </form>
    )
}

function LeadHistoryTab({ leadId }: { leadId: string }) {
    const { data: events, isLoading } = useLeadHistory(leadId)

    if (isLoading) {
        return <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-gray-400" /></div>
    }

    if (!events || events.length === 0) {
        return <div className="text-center text-sm text-gray-500 py-8">Nenhum histórico encontrado para este lead.</div>
    }

    return (
        <div className="relative border-l border-gray-200 ml-3 pl-6 space-y-6 pb-4">
            {events.map((event: { id: string, descricao: string, user_profiles: { nome?: string, avatar_url?: string } | { nome?: string, avatar_url?: string }[] | null, criado_em: string }) => {
                const profile = Array.isArray(event.user_profiles) ? event.user_profiles[0] : event.user_profiles
                return (
                    <div key={event.id} className="relative">
                        <span className="absolute -left-[31px] top-1 p-1 bg-white border border-gray-200 rounded-full flex items-center justify-center">
                            <GitCommit className="h-3 w-3 text-gray-400" />
                        </span>
                        <div className="flex flex-col gap-1.5">
                            <div className="flex items-baseline justify-between gap-4">
                                <span className="text-sm font-medium text-gray-900 leading-snug">{event.descricao}</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                                <span>{profile?.nome || 'Sistema'}</span>
                                <span>•</span>
                                <span>{format(new Date(event.criado_em), "d 'de' MMM, HH:mm", { locale: ptBR })}</span>
                            </div>
                        </div>
                    </div>
                )
            })}
        </div>
    )
}

function LeadNotesTab({ leadId }: { leadId: string }) {
    const { data: notes, isLoading } = useLeadNotes(leadId)
    const { mutate: addNote, isPending } = useAddLeadNote()
    const [noteContent, setNoteContent] = useState('')

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (!noteContent.trim()) return

        addNote({ leadId, conteudo: noteContent.trim() }, {
            onSuccess: () => {
                setNoteContent('')
            }
        })
    }

    return (
        <>
            <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm space-y-3">
                <Textarea
                    placeholder="Adicione uma nota sobre este lead..."
                    className="min-h-[100px] border-none focus-visible:ring-0 px-0 rounded-none resize-none"
                    value={noteContent}
                    onChange={(e) => setNoteContent(e.target.value)}
                />
                <div className="flex justify-end pt-2 border-t border-gray-100">
                    <Button
                        type="submit"
                        disabled={isPending || !noteContent.trim()}
                        className="bg-[#5B63E6] hover:bg-[#4A51CD] h-9 px-4 text-xs font-semibold"
                    >
                        {isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <ListPlus className="h-4 w-4 mr-2" />}
                        Salvar Nota
                    </Button>
                </div>
            </form>

            <div className="space-y-4">
                <h4 className="text-sm font-semibold text-gray-900">Anotações da Equipe</h4>

                {isLoading ? (
                    <div className="flex justify-center py-4"><Loader2 className="h-6 w-6 animate-spin text-gray-400" /></div>
                ) : !notes || notes.length === 0 ? (
                    <div className="text-sm text-gray-500 text-center py-6 bg-white border border-dashed border-gray-200 rounded-xl">Nenhuma anotação registrada ainda.</div>
                ) : (
                    <div className="space-y-4">
                        {notes.map((note: { id: string, conteudo: string, user_profiles: { nome?: string, avatar_url?: string } | { nome?: string, avatar_url?: string }[] | null, criado_em: string }) => {
                            const profile = Array.isArray(note.user_profiles) ? note.user_profiles[0] : note.user_profiles
                            return (
                                <div key={note.id} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex gap-4">
                                    <Avatar className="h-8 w-8 shrink-0">
                                        <AvatarImage src={profile?.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${profile?.nome}`} />
                                        <AvatarFallback>{profile?.nome?.substring(0, 2) || 'US'}</AvatarFallback>
                                    </Avatar>
                                    <div className="space-y-1 w-full">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-semibold text-gray-900">{profile?.nome}</span>
                                            <span className="text-[11px] text-gray-500">
                                                {formatDistanceToNow(new Date(note.criado_em), { addSuffix: true, locale: ptBR })}
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-700 whitespace-pre-wrap">{note.conteudo}</p>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>
        </>
    )
}

function LeadFollowupsTab({ leadId }: { leadId: string }) {
    const { data: followups, isLoading } = useQuery({
        queryKey: ['followups', 'lead', leadId],
        queryFn: async () => {
            const res = await fetch(`/api/followups?lead_id=${leadId}`)
            if (!res.ok) throw new Error('Falha ao buscar')
            return res.json()
        }
    })

    if (isLoading) {
        return <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-gray-400" /></div>
    }

    if (!followups || followups.length === 0) {
        return (
            <div className="text-center text-sm text-gray-500 py-8">
                Nenhum follow-up cadastrado para este lead.
            </div>
        )
    }

    return (
        <div className="space-y-4">
            {followups.map((f: any) => (
                <div key={f.id} className="bg-white border rounded-lg p-4 flex flex-col gap-2 shadow-sm">
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-gray-900 capitalize flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-blue-600" />
                            {f.tipo === 'ia' ? 'Automação IA' : 'Ação Humana'}
                        </span>
                        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${f.status === 'pendente' ? 'bg-orange-100 text-orange-700' : f.status === 'executado' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                            {f.status}
                        </span>
                    </div>
                    <p className="text-xs text-gray-500">
                        {f.status === 'pendente' ? 'Agendado para: ' : 'Executado em: '}
                        {format(new Date(f.status === 'pendente' ? f.agendado_para : (f.executado_em || f.agendado_para)), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </p>
                    {f.motivo && <p className="text-sm text-gray-700 mt-1"><strong>Motivo:</strong> {f.motivo}</p>}
                    {f.notas && <p className="text-sm text-gray-700 mt-1"><strong>Notas:</strong> {f.notas}</p>}
                </div>
            ))}
        </div>
    )
}
