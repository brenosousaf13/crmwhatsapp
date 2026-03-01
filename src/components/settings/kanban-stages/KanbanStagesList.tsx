'use client'

import { useState, useEffect } from "react"
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent
} from "@dnd-kit/core"
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy
} from "@dnd-kit/sortable"

import type { KanbanStage } from "@/hooks/settings/useKanbanStages"
import { KanbanStageItem } from "./KanbanStageItem"

interface KanbanStagesListProps {
    stages: (KanbanStage & { leadsCount: number })[]
    onEdit: (stage: KanbanStage) => void
    onDelete: (stage: KanbanStage) => void
    onReorder: (orderedIds: string[]) => Promise<boolean>
}

export function KanbanStagesList({ stages, onEdit, onDelete, onReorder }: KanbanStagesListProps) {
    // We keep a local state of items for immediate visual feedback during drag
    const [items, setItems] = useState(stages)

    // Sync with prop when server data changes (but not while dragging)
    useEffect(() => {
        setItems(stages)
    }, [stages])

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 5, // Requires 5px of movement before drag triggering to prevent accidental clicks
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    )

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event

        if (over && active.id !== over.id) {
            setItems((items) => {
                const oldIndex = items.findIndex(item => item.id === active.id)
                const newIndex = items.findIndex(item => item.id === over.id)

                const newOrder = arrayMove(items, oldIndex, newIndex)

                // Trigger background save
                const orderedIds = newOrder.map(item => item.id)
                onReorder(orderedIds).catch(() => {
                    // Revert on failure
                    setItems(stages)
                })

                return newOrder
            })
        }
    }

    if (items.length === 0) {
        return (
            <div className="text-center p-8 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                <p className="text-gray-500">Nenhuma etapa configurada.</p>
            </div>
        )
    }

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
        >
            <SortableContext
                items={items.map(item => item.id)}
                strategy={verticalListSortingStrategy}
            >
                <div className="space-y-1">
                    {items.map(stage => (
                        <KanbanStageItem
                            key={stage.id}
                            stage={stage}
                            onEdit={onEdit}
                            onDelete={onDelete}
                        />
                    ))}
                </div>
            </SortableContext>
        </DndContext>
    )
}
