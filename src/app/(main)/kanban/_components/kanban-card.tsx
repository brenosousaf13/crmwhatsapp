'use client'

import { Clock, MoreHorizontal, User, MessageCircle } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

export interface KanbanCardData {
    id: string
    name: string
    phone: string
    valor_venda?: number
    urgency: string
    lastMessage?: string
    lastMessageTime?: string
    tags?: string[]
    assignee?: string
    unreadCount: number
    waitTime?: string | null
}

interface KanbanCardProps {
    data: KanbanCardData
    onClick?: () => void
}

export function KanbanCard({ data, onClick }: KanbanCardProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({
        id: data.id,
        data: {
            type: 'Card',
            card: data,
        },
    })

    const style = {
        transition,
        transform: CSS.Transform.toString(transform),
    }

    const borderColorClass = data.urgency === 'high' ? 'border-red-600' : 'border-green-600'

    if (isDragging) {
        return (
            <div
                ref={setNodeRef}
                style={style}
                className="bg-gray-50 rounded-xl p-4 border-2 border-dashed border-gray-300 h-[140px]"
            />
        )
    }

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            onClick={onClick}
            className={`bg-white rounded-xl p-4 shadow-sm border-l-4 border-y border-r border-y-gray-200 border-r-gray-200 ${borderColorClass} cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow relative group`}
        >

            {/* Context menu trigger that shows on hover */}
            <button className="absolute top-3 right-3 p-1 text-gray-400 hover:text-gray-900 opacity-0 group-hover:opacity-100 transition-opacity bg-white/80 rounded">
                <MoreHorizontal className="h-4 w-4" />
            </button>

            {/* User Info */}
            <div className="flex items-start gap-3 mb-3 pr-6">
                <Avatar className="h-8 w-8">
                    <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${data.name}`} />
                    <AvatarFallback>{data.name.substring(0, 2)}</AvatarFallback>
                </Avatar>
                <div>
                    <h4 className="font-semibold text-gray-900 text-[14px] leading-none mb-1 line-clamp-1">{data.name}</h4>
                    <p className="text-[13px] text-gray-500">{data.phone}</p>
                </div>
            </div>

            {/* Message Preview */}
            <div className="mb-3">
                <p className="text-[13px] text-gray-700 line-clamp-2 leading-relaxed">
                    <span className="mr-1">💬</span>
                    {data.lastMessage || <span className="text-gray-400 italic">Nenhuma mensagem ainda</span>}
                </p>
                {data.lastMessageTime && (
                    <p className="text-[11px] text-gray-400 mt-1">
                        Há {data.lastMessageTime}
                    </p>
                )}
            </div>

            {/* Tags limit 3 */}
            {data.tags && data.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-3">
                    {data.tags.slice(0, 3).map((tag: string, i: number) => (
                        <span key={i} className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-gray-100 text-gray-600">
                            {tag}
                        </span>
                    ))}
                    {data.tags.length > 3 && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-medium bg-gray-100 text-gray-500">
                            +{data.tags.length - 3}
                        </span>
                    )}
                </div>
            )}

            {/* Footer Attributes */}
            <div className="flex items-center justify-between pt-3 border-t border-gray-100 text-[12px]">
                <div className="flex items-center gap-1.5 text-gray-600 font-medium truncate max-w-[120px]">
                    <User className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{data.assignee || 'Não atribuído'}</span>
                </div>

                <div className="flex items-center gap-2">
                    {data.unreadCount > 0 && (
                        <Badge variant="secondary" className="bg-blue-100 text-blue-700 hover:bg-blue-100 px-1.5 py-0 h-5 text-[11px] border-none font-semibold flex items-center gap-1">
                            <MessageCircle className="h-3 w-3" />
                            {data.unreadCount}
                        </Badge>
                    )}

                    {data.waitTime && (
                        <div className="flex items-center gap-1 text-orange-600 font-medium">
                            <Clock className="h-3 w-3" />
                            {data.waitTime}
                        </div>
                    )}
                </div>
            </div>

        </div>
    )
}
