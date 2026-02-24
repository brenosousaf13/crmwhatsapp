'use client'

import { Plus, MoreHorizontal } from 'lucide-react'
import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { KanbanCard, type KanbanCardData } from './kanban-card'
import { ScrollArea } from '@/components/ui/scroll-area'

interface KanbanColumnProps {
    id: string
    title: string
    color: string
    count: number
    items: KanbanCardData[]
    onCardClick: (card: KanbanCardData) => void
}

export function KanbanColumn({ id, title, color, count, items, onCardClick }: KanbanColumnProps) {
    const { setNodeRef } = useDroppable({
        id: id,
        data: {
            type: 'Column',
            column: { id, title }
        }
    })

    return (
        <div ref={setNodeRef} className="flex flex-col w-[320px] shrink-0 bg-slate-100/60 rounded-xl h-full border border-slate-200 shadow-sm">
            {/* Column Header */}
            <div className="flex items-center justify-between p-3 border-b border-gray-100">
                <div className="flex items-center gap-2">
                    <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: color }}
                    />
                    <h3 className="font-semibold text-gray-900 text-sm">{title}</h3>
                    <span className="text-xs font-medium text-gray-500 bg-gray-200 px-2 py-0.5 rounded-full">
                        {count}
                    </span>
                </div>

                <div className="flex items-center gap-1">
                    <button className="p-1 hover:bg-gray-200 rounded text-gray-500 transition-colors">
                        <Plus className="h-4 w-4" />
                    </button>
                    <button className="p-1 hover:bg-gray-200 rounded text-gray-500 transition-colors">
                        <MoreHorizontal className="h-4 w-4" />
                    </button>
                </div>
            </div>

            {/* Column Cards Area */}
            <ScrollArea className="flex-1 p-3">
                <SortableContext items={items.map(item => item.id)} strategy={verticalListSortingStrategy}>
                    <div className="flex flex-col gap-3 pb-4 min-h-[150px]">
                        {items.map(item => (
                            <KanbanCard key={item.id} data={item} onClick={() => onCardClick(item)} />
                        ))}
                    </div>
                </SortableContext>
            </ScrollArea>
        </div>
    )
}
