'use client'

import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { GripVertical, Pencil, Trash2 } from "lucide-react"

import type { KanbanStage } from "@/hooks/settings/useKanbanStages"
import { Badge } from "@/components/ui/badge"

interface KanbanStageItemProps {
    stage: KanbanStage & { leadsCount: number }
    onEdit: (stage: KanbanStage) => void
    onDelete: (stage: KanbanStage) => void
}

export function KanbanStageItem({ stage, onEdit, onDelete }: KanbanStageItemProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: stage.id })

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 2 : 1,
        opacity: isDragging ? 0.8 : 1,
    }

    const isFinalStage = stage.tipo === 'ganho' || stage.tipo === 'perdido'

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`flex items-center justify-between p-4 mb-2 bg-white border rounded-lg shadow-sm ${isDragging ? 'ring-2 ring-blue-500 shadow-md' : 'hover:border-gray-300'
                }`}
        >
            <div className="flex items-center gap-4 flex-1">
                <button
                    className="p-1 text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing hover:bg-gray-100 rounded touch-none"
                    {...attributes}
                    {...listeners}
                    title="Segure para reordenar"
                >
                    <GripVertical className="w-5 h-5" />
                </button>

                <div className="flex items-center gap-3">
                    <div
                        className="w-4 h-4 rounded-full border border-black/10 shadow-inner shrink-0"
                        style={{ backgroundColor: stage.cor || '#E5E7EB' }}
                    />
                    <span className="font-medium text-gray-900">{stage.nome}</span>

                    {stage.tipo === 'ganho' && (
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                            ✅ Ganho
                        </Badge>
                    )}
                    {stage.tipo === 'perdido' && (
                        <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                            ❌ Perdido
                        </Badge>
                    )}
                </div>
            </div>

            <div className="flex items-center gap-4">
                <span className="text-sm text-gray-500 whitespace-nowrap min-w-[80px] text-right">
                    {stage.leadsCount} lead{stage.leadsCount !== 1 && 's'}
                </span>

                <div className="flex items-center gap-1 border-l pl-3 ml-1">
                    <button
                        onClick={() => onEdit(stage)}
                        className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                        title="Editar etapa"
                    >
                        <Pencil className="w-4 h-4" />
                    </button>

                    {!isFinalStage && (
                        <button
                            onClick={() => onDelete(stage)}
                            className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                            title="Excluir etapa"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    )}
                </div>
            </div>
        </div>
    )
}
