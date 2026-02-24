'use client'

import { useState } from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { formatDistanceToNow, format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { MessageCircle, Phone, Mail, Calendar, DollarSign, Edit2, Save, X, History, StickyNote, User } from 'lucide-react'
import { useLeadHistory } from '@/app/(main)/kanban/_logic/use-kanban'
import { useLeadNotes, useAddLeadNote } from '@/app/(main)/kanban/_logic/use-kanban'
import { useUpdateLead } from '@/hooks/leads/useLeadMutations'
import { useRouter } from 'next/navigation'
import type { LeadRow } from '@/hooks/leads/useLeads'

interface LeadDetailDrawerProps {
    lead: LeadRow | null
    open: boolean
    onOpenChange: (open: boolean) => void
    etapas: { id: string; nome: string; cor: string }[]
}

export function LeadDetailDrawer({ lead, open, onOpenChange, etapas }: LeadDetailDrawerProps) {
    if (!lead) return null

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="sm:max-w-[460px] p-0 flex flex-col">
                <SheetHeader className="p-5 pb-3 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                        <div
                            className="w-11 h-11 rounded-full flex items-center justify-center text-white text-base font-bold"
                            style={{ backgroundColor: lead.etapa_cor }}
                        >
                            {lead.nome.split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2)}
                        </div>
                        <div className="flex-1 min-w-0">
                            <SheetTitle className="text-lg truncate">{lead.nome}</SheetTitle>
                            <Badge
                                className="text-[11px] font-medium mt-0.5"
                                style={{ backgroundColor: lead.etapa_cor + '20', color: lead.etapa_cor }}
                            >
                                {lead.etapa_nome}
                            </Badge>
                        </div>
                    </div>
                </SheetHeader>

                <Tabs defaultValue="resumo" className="flex-1 flex flex-col overflow-hidden">
                    <TabsList className="mx-5 mt-2 mb-0 bg-gray-100 h-9">
                        <TabsTrigger value="resumo" className="text-xs gap-1"><User className="h-3.5 w-3.5" /> Resumo</TabsTrigger>
                        <TabsTrigger value="chat" className="text-xs gap-1"><MessageCircle className="h-3.5 w-3.5" /> Chat</TabsTrigger>
                        <TabsTrigger value="historico" className="text-xs gap-1"><History className="h-3.5 w-3.5" /> Histórico</TabsTrigger>
                        <TabsTrigger value="notas" className="text-xs gap-1"><StickyNote className="h-3.5 w-3.5" /> Notas</TabsTrigger>
                    </TabsList>

                    <TabsContent value="resumo" className="flex-1 overflow-y-auto px-5 py-4 space-y-4 m-0">
                        <ResumoTab lead={lead} etapas={etapas} />
                    </TabsContent>

                    <TabsContent value="chat" className="flex-1 overflow-y-auto px-5 py-4 m-0">
                        <ChatTab leadId={lead.id} />
                    </TabsContent>

                    <TabsContent value="historico" className="flex-1 overflow-y-auto px-5 py-4 m-0">
                        <HistoricoTab leadId={lead.id} />
                    </TabsContent>

                    <TabsContent value="notas" className="flex-1 overflow-y-auto px-5 py-4 m-0">
                        <NotasTab leadId={lead.id} />
                    </TabsContent>
                </Tabs>
            </SheetContent>
        </Sheet>
    )
}

// --- Resumo Tab ---
function ResumoTab({ lead, etapas }: { lead: LeadRow; etapas: { id: string; nome: string; cor: string }[] }) {
    const [editing, setEditing] = useState(false)
    const [nome, setNome] = useState(lead.nome)
    const [email, setEmail] = useState(lead.email || '')
    const [valorVenda, setValorVenda] = useState(lead.valor_venda?.toString() || '')
    const { mutate: updateLead, isPending } = useUpdateLead()

    const handleSave = () => {
        updateLead({
            leadId: lead.id,
            data: {
                nome,
                email: email || null,
                valor_venda: valorVenda ? Number(valorVenda) : null,
            },
        }, {
            onSuccess: () => setEditing(false),
        })
    }

    return (
        <div className="space-y-5">
            {/* Header ações */}
            <div className="flex justify-end">
                {editing ? (
                    <div className="flex gap-2">
                        <Button variant="ghost" size="sm" onClick={() => setEditing(false)} className="h-7 text-xs gap-1">
                            <X className="h-3 w-3" /> Cancelar
                        </Button>
                        <Button size="sm" onClick={handleSave} disabled={isPending} className="h-7 text-xs gap-1 bg-blue-600 hover:bg-blue-700 text-white">
                            <Save className="h-3 w-3" /> Salvar
                        </Button>
                    </div>
                ) : (
                    <Button variant="ghost" size="sm" onClick={() => setEditing(true)} className="h-7 text-xs gap-1 text-gray-500">
                        <Edit2 className="h-3 w-3" /> Editar
                    </Button>
                )}
            </div>

            {/* Info cards */}
            <div className="space-y-3">
                {editing && (
                    <div className="flex items-start gap-3">
                        <User className="h-4 w-4 text-gray-400 mt-0.5" />
                        <div className="flex-1">
                            <p className="text-xs text-gray-500">Nome</p>
                            <Input value={nome} onChange={e => setNome(e.target.value)} className="h-7 text-sm mt-0.5" />
                        </div>
                    </div>
                )}

                <div className="flex items-start gap-3">
                    <Phone className="h-4 w-4 text-gray-400 mt-0.5" />
                    <div>
                        <p className="text-xs text-gray-500">Telefone</p>
                        <p className="text-sm font-medium text-gray-900">{lead.telefone}</p>
                    </div>
                </div>

                <div className="flex items-start gap-3">
                    <Mail className="h-4 w-4 text-gray-400 mt-0.5" />
                    <div className="flex-1">
                        <p className="text-xs text-gray-500">Email</p>
                        {editing ? (
                            <Input value={email} onChange={e => setEmail(e.target.value)} className="h-7 text-sm mt-0.5" />
                        ) : (
                            <p className="text-sm text-gray-900">{lead.email || '—'}</p>
                        )}
                    </div>
                </div>

                <div className="flex items-start gap-3">
                    <DollarSign className="h-4 w-4 text-gray-400 mt-0.5" />
                    <div className="flex-1">
                        <p className="text-xs text-gray-500">Valor da venda</p>
                        {editing ? (
                            <Input type="number" value={valorVenda} onChange={e => setValorVenda(e.target.value)} className="h-7 text-sm mt-0.5" placeholder="0,00" />
                        ) : (
                            <p className="text-sm text-gray-900">{lead.valor_venda ? `R$ ${lead.valor_venda.toLocaleString('pt-BR')}` : '—'}</p>
                        )}
                    </div>
                </div>

                <div className="flex items-start gap-3">
                    <Calendar className="h-4 w-4 text-gray-400 mt-0.5" />
                    <div>
                        <p className="text-xs text-gray-500">Criado em</p>
                        <p className="text-sm text-gray-900">{format(new Date(lead.criado_em), "dd 'de' MMMM, yyyy", { locale: ptBR })}</p>
                    </div>
                </div>
            </div>

            {/* Etapa */}
            <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500 mb-2">Etapa atual</p>
                <div className="flex flex-wrap gap-1.5">
                    {etapas.map(e => (
                        <Badge
                            key={e.id}
                            variant={e.id === lead.etapa_id ? 'default' : 'outline'}
                            className={`text-xs cursor-default ${e.id === lead.etapa_id ? '' : 'opacity-40'}`}
                            style={e.id === lead.etapa_id ? { backgroundColor: e.cor, color: 'white' } : {}}
                        >
                            {e.nome}
                        </Badge>
                    ))}
                </div>
            </div>

            {/* Tags */}
            {lead.tags.length > 0 && (
                <div>
                    <p className="text-xs text-gray-500 mb-2">Tags</p>
                    <div className="flex flex-wrap gap-1.5">
                        {lead.tags.map(t => (
                            <Badge key={t.id} className="text-[11px]" style={{ backgroundColor: t.cor + '20', color: t.cor }}>
                                {t.nome}
                            </Badge>
                        ))}
                    </div>
                </div>
            )}

            {/* Atendente */}
            {lead.atendente_nome && (
                <div>
                    <p className="text-xs text-gray-500 mb-1">Atendente</p>
                    <p className="text-sm text-gray-900">👤 {lead.atendente_nome}</p>
                </div>
            )}
        </div>
    )
}

// --- Chat Tab ---
function ChatTab({ leadId }: { leadId: string }) {
    const router = useRouter()

    return (
        <div className="flex flex-col items-center justify-center h-40 text-center">
            <MessageCircle className="h-10 w-10 text-gray-300 mb-3" />
            <p className="text-sm text-gray-500 mb-3">Visualize a conversa completa no chat.</p>
            <Button
                variant="outline"
                size="sm"
                onClick={() => router.push(`/chat?lead=${leadId}`)}
                className="gap-1.5"
            >
                <MessageCircle className="h-4 w-4" /> Abrir no Chat
            </Button>
        </div>
    )
}

// --- Histórico Tab ---
function HistoricoTab({ leadId }: { leadId: string }) {
    const { data: events, isLoading } = useLeadHistory(leadId)

    if (isLoading) return <div className="text-sm text-gray-400 animate-pulse">Carregando...</div>
    if (!events || events.length === 0) return <p className="text-sm text-gray-400">Nenhum evento registrado.</p>

    return (
        <div className="space-y-3">
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {events.map((event: any) => (
                <div key={event.id} className="flex gap-3">
                    <div className="w-2 h-2 rounded-full bg-blue-400 mt-1.5 shrink-0" />
                    <div>
                        <p className="text-sm text-gray-700">{event.descricao}</p>
                        <p className="text-xs text-gray-400">
                            {formatDistanceToNow(new Date(event.criado_em), { addSuffix: true, locale: ptBR })}
                        </p>
                    </div>
                </div>
            ))}
        </div>
    )
}

// --- Notas Tab ---
function NotasTab({ leadId }: { leadId: string }) {
    const { data: notes, isLoading } = useLeadNotes(leadId)
    const { mutate: addNote, isPending } = useAddLeadNote()
    const [content, setContent] = useState('')

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (!content.trim()) return
        addNote({ leadId, conteudo: content.trim() }, {
            onSuccess: () => setContent(''),
        })
    }

    return (
        <div className="space-y-4">
            <form onSubmit={handleSubmit} className="space-y-2">
                <Textarea
                    placeholder="Escreva uma nota..."
                    rows={3}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                />
                <Button type="submit" size="sm" disabled={isPending || !content.trim()} className="bg-blue-600 hover:bg-blue-700 text-white">
                    {isPending ? 'Adicionando...' : 'Adicionar nota'}
                </Button>
            </form>

            {isLoading && <div className="text-sm text-gray-400 animate-pulse">Carregando...</div>}

            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {(notes || []).map((note: any) => (
                <div key={note.id} className="bg-gray-50 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium text-gray-700">{note.user_profiles?.nome || 'Usuário'}</span>
                        <span className="text-xs text-gray-400">
                            {formatDistanceToNow(new Date(note.criado_em), { addSuffix: true, locale: ptBR })}
                        </span>
                    </div>
                    <p className="text-sm text-gray-600 whitespace-pre-wrap">{note.conteudo}</p>
                </div>
            ))}
        </div>
    )
}
