'use client'

import { MoreHorizontal, MessageCircle } from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuSub,
    DropdownMenuSubContent,
    DropdownMenuSubTrigger,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { formatDistanceToNow, format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useRouter } from 'next/navigation'
import type { LeadRow } from '@/hooks/leads/useLeads'
import { TagSelector } from '@/components/shared/TagSelector'
import type { Tag } from '@/hooks/settings/useTags'

interface LeadsTableRowProps {
    lead: LeadRow
    index: number
    selected: boolean
    onToggleSelect: () => void
    onClick: () => void
    onEtapaChange: (leadId: string, etapaId: string, etapaNome: string) => void
    etapas: { id: string; nome: string; cor: string }[]
    members: { id: string; nome: string }[]
    tags: { id: string; nome: string; cor: string }[]
    onTagsChange: (leadId: string, tagIds: string[]) => void
}

// Gerar cor de avatar baseada no nome
function getAvatarColor(name: string): string {
    const colors = ['#2563EB', '#16A34A', '#EA580C', '#7C3AED', '#DC2626', '#0891B2']
    let hash = 0
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
    return colors[Math.abs(hash) % colors.length]
}

function getInitials(name: string): string {
    return name.split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2)
}

// Formatar telefone para exibição
function formatPhone(phone: string): string {
    const clean = phone.replace(/\D/g, '')
    if (clean.length === 13) return `+${clean.slice(0, 2)} ${clean.slice(2, 4)} ${clean.slice(4, 9)}-${clean.slice(9)}`
    if (clean.length === 12) return `+${clean.slice(0, 2)} ${clean.slice(2, 4)} ${clean.slice(4, 8)}-${clean.slice(8)}`
    if (clean.length === 11) return `(${clean.slice(0, 2)}) ${clean.slice(2, 7)}-${clean.slice(7)}`
    return phone
}

// Checar se é lead "perdido" (esmaecido)
function isLost(etapaNome: string): boolean {
    return etapaNome.toLowerCase().includes('perdido')
}

export function LeadsTableRow({
    lead,
    index,
    selected,
    onToggleSelect,
    onClick,
    onEtapaChange,
    etapas,
    members,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    tags: _allTags,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    onTagsChange,
}: LeadsTableRowProps) {
    const router = useRouter()
    const lost = isLost(lead.etapa_nome)
    const textColor = lost ? 'text-gray-400' : 'text-gray-900'

    const handleAddTag = (tag: Tag) => {
        const newTags = [...lead.tags.map(t => t.id), tag.id]
        onTagsChange(lead.id, Array.from(new Set(newTags)))
    }

    const handleRemoveTag = (tagId: string) => {
        const newTags = lead.tags.map(t => t.id).filter(id => id !== tagId)
        onTagsChange(lead.id, newTags)
    }

    return (
        <tr
            className={`border-b border-gray-100 h-14 transition-colors ${selected ? 'bg-blue-50/60' : 'hover:bg-gray-50'
                }`}
            role="row"
        >
            {/* # */}
            <td className="px-3 text-sm text-gray-400">{index}</td>

            {/* Checkbox */}
            <td className="px-2">
                <Checkbox checked={selected} onCheckedChange={onToggleSelect} aria-label={`Selecionar ${lead.nome}`} />
            </td>

            {/* Nome */}
            <td className="px-3">
                <button onClick={onClick} className="flex items-center gap-2.5 group">
                    <div
                        className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[11px] font-bold shrink-0"
                        style={{ backgroundColor: lead.etapa_cor || getAvatarColor(lead.nome) }}
                    >
                        {getInitials(lead.nome)}
                    </div>
                    <span className={`text-sm font-medium group-hover:underline ${textColor}`}>
                        {lead.nome}
                    </span>
                </button>
            </td>

            {/* Telefone */}
            <td className="px-3">
                <button
                    onClick={() => router.push(`/chat?lead=${lead.id}`)}
                    className={`text-[13px] hover:underline ${lost ? 'text-gray-400' : 'text-gray-600'}`}
                >
                    {formatPhone(lead.telefone)}
                </button>
            </td>

            {/* Etapa (inline edit) */}
            <td className="px-3">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button
                            className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium"
                            style={{
                                backgroundColor: lead.etapa_cor + '20',
                                color: lead.etapa_cor,
                            }}
                        >
                            {lead.etapa_nome}
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                        {etapas.map(e => (
                            <DropdownMenuItem key={e.id} onClick={() => onEtapaChange(lead.id, e.id, e.nome)}>
                                <span className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: e.cor }} />
                                {e.nome}
                            </DropdownMenuItem>
                        ))}
                    </DropdownMenuContent>
                </DropdownMenu>
            </td>

            {/* Tags (inline edit) */}
            <td className="px-3 py-2">
                <TagSelector
                    selectedTags={lead.tags}
                    onAddTag={handleAddTag}
                    onRemoveTag={handleRemoveTag}
                    size="sm"
                />
            </td>

            {/* Atendente */}
            <td className="px-3">
                <span className={`text-sm ${lost ? 'text-gray-400' : 'text-gray-600'}`}>
                    {lead.atendente_nome || '—'}
                </span>
            </td>

            {/* Última msg */}
            <td className="px-3">
                {lead.ultima_mensagem_at ? (
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <span className={`text-sm ${lost ? 'text-gray-400' : 'text-gray-500'}`}>
                                    {formatDistanceToNow(new Date(lead.ultima_mensagem_at), { addSuffix: true, locale: ptBR })}
                                </span>
                            </TooltipTrigger>
                            <TooltipContent>
                                {format(new Date(lead.ultima_mensagem_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                ) : (
                    <span className="text-gray-400 text-sm">—</span>
                )}
            </td>

            {/* Não lidas */}
            <td className="px-3">
                {lead.mensagens_nao_lidas > 0 ? (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                        <MessageCircle className="w-3 h-3" /> {lead.mensagens_nao_lidas}
                    </span>
                ) : (
                    <span className="text-gray-400 text-sm">—</span>
                )}
            </td>

            {/* Valor */}
            <td className="px-3">
                <span className={`text-sm ${lost ? 'text-gray-400' : 'text-gray-700'}`}>
                    {lead.valor_venda ? `R$ ${lead.valor_venda.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}` : '—'}
                </span>
            </td>

            {/* Menu ações */}
            <td className="px-2">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button className="p-1 rounded hover:bg-gray-100">
                            <MoreHorizontal className="h-4 w-4 text-gray-400" />
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={onClick}>
                            👁 Ver detalhes
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => router.push(`/chat?lead=${lead.id}`)}>
                            💬 Abrir no Chat
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => router.push(`/kanban?highlight=${lead.id}`)}>
                            📋 Ver no Kanban
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuSub>
                            <DropdownMenuSubTrigger>📋 Mover para etapa...</DropdownMenuSubTrigger>
                            <DropdownMenuSubContent>
                                {etapas.map(e => (
                                    <DropdownMenuItem key={e.id} onClick={() => onEtapaChange(lead.id, e.id, e.nome)}>
                                        <span className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: e.cor }} />
                                        {e.nome}
                                    </DropdownMenuItem>
                                ))}
                            </DropdownMenuSubContent>
                        </DropdownMenuSub>
                        <DropdownMenuSub>
                            <DropdownMenuSubTrigger>👤 Atribuir atendente</DropdownMenuSubTrigger>
                            <DropdownMenuSubContent>
                                {members.map(m => (
                                    <DropdownMenuItem key={m.id}>{m.nome}</DropdownMenuItem>
                                ))}
                            </DropdownMenuSubContent>
                        </DropdownMenuSub>
                    </DropdownMenuContent>
                </DropdownMenu>
            </td>
        </tr>
    )
}
