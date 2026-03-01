import { KanbanColumnData } from './kanban-board'
import { KanbanCardData } from './kanban-card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Clock, MessageCircle } from 'lucide-react'

interface KanbanListViewProps {
    columns: KanbanColumnData[]
    onCardClick: (card: KanbanCardData) => void
}

export function KanbanListView({ columns, onCardClick }: KanbanListViewProps) {
    const allLeads = columns.flatMap(col =>
        col.items.map(item => ({
            ...item,
            columnTitle: col.title,
            columnColor: col.color
        }))
    )

    if (allLeads.length === 0) {
        return (
            <div className="flex h-full items-center justify-center p-8 text-gray-500">
                <span className="bg-white px-4 py-2 rounded-lg border border-gray-200">Nenhum lead encontrado para os filtros atuais.</span>
            </div>
        )
    }

    return (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden flex-1 flex flex-col h-full mr-4">
            <div className="overflow-auto flex-1 h-full">
                <table className="w-full text-sm text-left">
                    <thead className="text-xs text-gray-500 bg-gray-50 sticky top-0 z-10 border-b border-gray-200">
                        <tr>
                            <th className="px-6 py-4 font-medium uppercase tracking-wider">Lead</th>
                            <th className="px-6 py-4 font-medium uppercase tracking-wider">Etapa</th>
                            <th className="px-6 py-4 font-medium uppercase tracking-wider">Valor Venda</th>
                            <th className="px-6 py-4 font-medium uppercase tracking-wider">Tags</th>
                            <th className="px-6 py-4 font-medium uppercase tracking-wider text-right">Interação</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {allLeads.map(lead => (
                            <tr
                                key={lead.id}
                                onClick={() => onCardClick(lead)}
                                className="group hover:bg-gray-50 cursor-pointer transition-colors"
                            >
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3 w-48 xl:w-64">
                                        <Avatar className="h-9 w-9 border border-gray-100">
                                            <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${lead.name}`} />
                                            <AvatarFallback>{lead.name.substring(0, 2)}</AvatarFallback>
                                        </Avatar>
                                        <div className="truncate">
                                            <p className="font-semibold text-gray-900 truncate">{lead.name}</p>
                                            <p className="text-gray-500 truncate">{lead.phone}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-2">
                                        <div
                                            className="w-2.5 h-2.5 rounded-full"
                                            style={{ backgroundColor: lead.columnColor }}
                                        />
                                        <span className="font-medium text-gray-900">{lead.columnTitle}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-gray-600 font-medium">
                                    {lead.valor_venda ? (
                                        <span>R$ {lead.valor_venda.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                                    ) : (
                                        <span className="text-gray-400 font-normal">--</span>
                                    )}
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex flex-wrap gap-1 max-w-[200px]">
                                        {lead.tags?.slice(0, 2).map((tag, i) => (
                                            <span
                                                key={i}
                                                className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium border truncate"
                                                style={{
                                                    backgroundColor: `${tag.cor}15`,
                                                    color: tag.cor,
                                                    borderColor: `${tag.cor}40`
                                                }}
                                            >
                                                {tag.nome}
                                            </span>
                                        ))}
                                        {lead.tags && lead.tags.length > 2 && (
                                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-medium bg-gray-100 text-gray-500">
                                                +{lead.tags.length - 2}
                                            </span>
                                        )}
                                        {(!lead.tags || lead.tags.length === 0) && (
                                            <span className="text-gray-400 font-normal">--</span>
                                        )}
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex items-center justify-end gap-3 text-xs">
                                        {lead.unreadCount > 0 && (
                                            <Badge variant="secondary" className="bg-blue-100 text-blue-700 hover:bg-blue-100 px-1.5 py-0 h-5 border-none font-semibold flex items-center gap-1">
                                                <MessageCircle className="h-3 w-3" />
                                                {lead.unreadCount}
                                            </Badge>
                                        )}
                                        {lead.waitTime && (
                                            <span className="flex items-center gap-1 text-orange-600 font-medium">
                                                <Clock className="h-3 w-3" />
                                                {lead.waitTime}
                                            </span>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
