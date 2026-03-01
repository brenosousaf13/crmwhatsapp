'use client'

import { DndContext, DragEndEvent, DragStartEvent, DragOverEvent, closestCorners, useSensor, useSensors, PointerSensor, DragOverlay } from '@dnd-kit/core'
import { arrayMove } from '@dnd-kit/sortable'
import { KanbanColumn } from './kanban-column'
import { KanbanCard, type KanbanCardData } from './kanban-card'
import { LeadDrawer } from './lead-drawer'
import { useState, useEffect } from 'react'
import { useKanbanBoard, useMoveLead, useKanbanRealtime } from '../_logic/use-kanban'
import { useOrganization } from '@/components/providers/organization-provider'
import { useKanbanContext } from '../_logic/kanban-context'
import { KanbanListView } from './kanban-list-view'

export interface KanbanColumnData {
    id: string
    title: string
    color: string
    items: KanbanCardData[]
}

export function KanbanBoard() {
    // 1. Setup real-time listener
    useKanbanRealtime()

    // 2. Query initial/synced data
    const { organization, isLoading: orgLoading } = useOrganization()
    const { data: dbColumns, isLoading: columnsLoading } = useKanbanBoard()
    const { mutate: moveLead } = useMoveLead()
    const { searchQuery, viewMode } = useKanbanContext()

    // We keep local state for instant optimistic UI updates during drag, 
    // but sync it when db data changes (e.g., initial load or another client updates)
    const [columns, setColumns] = useState<KanbanColumnData[]>([])

    useEffect(() => {
        if (dbColumns) {
            setColumns(dbColumns)
        }
    }, [dbColumns])

    const [activeId, setActiveId] = useState<string | null>(null)
    const [activeCard, setActiveCard] = useState<KanbanCardData | null>(null)
    const [originalColumnId, setOriginalColumnId] = useState<string | null>(null)

    // State for the lead details drawer
    const [drawerOpen, setDrawerOpen] = useState(false)
    const [selectedLead, setSelectedLead] = useState<KanbanCardData | null>(null)

    const handleCardClick = (card: KanbanCardData) => {
        setSelectedLead(card)
        setDrawerOpen(true)
    }

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 5, // minimum distance before drag starts
            },
        })
    )

    const handleDragStart = (event: DragStartEvent) => {
        const { active } = event
        setActiveId(active.id as string)

        // Find active card data for overlay
        for (const col of columns) {
            const card = col.items.find((item: KanbanCardData) => item.id === active.id)
            if (card) {
                setActiveCard(card as KanbanCardData)
                setOriginalColumnId(col.id)
                break
            }
        }
    }

    const handleDragOver = (event: DragOverEvent) => {
        const { active, over } = event
        if (!over) return

        const activeIdStr = active.id as string
        const overIdStr = over.id as string

        if (activeIdStr === overIdStr) return

        // Find the columns containing active and over
        const activeColumnIndex = columns.findIndex(col => col.items.some(item => item.id === activeIdStr))
        let overColumnIndex = columns.findIndex(col => col.id === overIdStr)

        // If we didn't find the column by ID, it might be an item we are hovering over
        if (overColumnIndex === -1) {
            overColumnIndex = columns.findIndex(col => col.items.some(item => item.id === overIdStr))
        }

        if (activeColumnIndex === -1 || overColumnIndex === -1) return

        if (activeColumnIndex !== overColumnIndex) {
            setColumns((prev) => {
                const newCols = [...prev]
                const activeItems = [...newCols[activeColumnIndex].items]
                const overItems = [...newCols[overColumnIndex].items]

                const activeItemIndex = activeItems.findIndex(item => item.id === activeIdStr)
                const overItemIndex = overIdStr in newCols[overColumnIndex] ? overItems.length : overItems.findIndex(item => item.id === overIdStr)

                // Remove from active column
                const [item] = activeItems.splice(activeItemIndex, 1)

                // Add to over column
                const insertIndex = overItemIndex >= 0 ? overItemIndex : overItems.length
                overItems.splice(insertIndex, 0, item)

                newCols[activeColumnIndex] = {
                    ...newCols[activeColumnIndex],
                    items: activeItems
                }
                newCols[overColumnIndex] = {
                    ...newCols[overColumnIndex],
                    items: overItems
                }

                return newCols
            })
        }
    }

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event

        const activeIdStr = active.id as string
        const overIdStr = over?.id as string

        if (overIdStr) {
            const overColumn = columns.find(col => col.id === overIdStr || col.items.some(item => item.id === overIdStr))
            const newEtapaId = overColumn?.id

            // Trigger database mutation if column changed
            if (newEtapaId && originalColumnId && newEtapaId !== originalColumnId) {
                moveLead({ leadId: activeIdStr, newEtapaId })
            } else if (newEtapaId && originalColumnId && newEtapaId === originalColumnId) {
                // Same column reordering
                const activeColumnIndex = columns.findIndex(col => col.id === originalColumnId)
                if (activeColumnIndex !== -1) {
                    setColumns((prev) => {
                        const newCols = [...prev]
                        const items = [...newCols[activeColumnIndex].items]
                        const activeIndex = items.findIndex(item => item.id === activeIdStr)
                        const overIndex = items.findIndex(item => item.id === overIdStr)

                        if (activeIndex !== -1 && overIndex !== -1 && activeIndex !== overIndex) {
                            newCols[activeColumnIndex] = {
                                ...newCols[activeColumnIndex],
                                items: arrayMove(items, activeIndex, overIndex)
                            }
                        }
                        return newCols
                    })
                }
            }
        }

        setActiveId(null)
        setActiveCard(null)
        setOriginalColumnId(null)
    }

    if (orgLoading || columnsLoading) {
        return <div className="flex h-full items-center justify-center text-gray-500">Carregando colunas...</div>
    }

    if (!organization) {
        return (
            <div className="flex h-full items-center justify-center text-center p-8 text-gray-500">
                <div className="max-w-md bg-white border border-red-200 rounded-xl p-8 shadow-sm">
                    <h2 className="text-xl font-bold text-red-600 mb-4">Conta Incompleta</h2>
                    <p className="text-gray-700 mb-4">Parece que este usuário foi criado <strong className="font-semibold text-gray-900">antes</strong> da configuração final do banco de dados estar pronta, e por isso sua Organização não foi gerada no banco.</p>
                    <p className="text-sm mt-4">Para corrigir isso de uma vez por todas, por favor acesse o painel <strong className="text-gray-900">Authentication &gt; Users</strong> do seu Supabase Dashboard, apague este usuário e faça o cadastro (Sign Up) novamente pelo seu sistema.</p>
                </div>
            </div>
        )
    }

    const normalizedQuery = searchQuery.toLowerCase().trim()
    const filteredColumns = columns.map(col => ({
        ...col,
        items: col.items.filter(item => {
            if (!normalizedQuery) return true
            const matchName = item.name.toLowerCase().includes(normalizedQuery)
            const matchPhone = item.phone.includes(normalizedQuery)
            const matchTags = item.tags?.some(t => t.nome.toLowerCase().includes(normalizedQuery))
            return matchName || matchPhone || matchTags
        })
    }))

    if (viewMode === 'list') {
        return (
            <>
                <KanbanListView columns={filteredColumns} onCardClick={handleCardClick} />
                <LeadDrawer
                    lead={selectedLead}
                    open={drawerOpen}
                    onOpenChange={setDrawerOpen}
                />
            </>
        )
    }

    // For now returning basic DndContext without full Sortable implementation yet
    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
        >
            <div className="flex h-full gap-4 overflow-x-auto pb-4">
                {filteredColumns.map(col => (
                    <KanbanColumn
                        key={col.id}
                        id={col.id}
                        title={col.title}
                        color={col.color}
                        count={col.items.length}
                        items={col.items}
                        onCardClick={handleCardClick}
                    />
                ))}

                {/* Ghost column for new stage */}
                <div className="flex flex-col w-[320px] shrink-0 rounded-xl h-full border-2 border-dashed border-gray-200 bg-gray-50/50 hover:bg-gray-100 transition-colors cursor-pointer items-center justify-center text-gray-500 font-medium whitespace-nowrap px-6">
                    + Nova etapa
                </div>
            </div>

            <DragOverlay>
                {activeId && activeCard ? (
                    <div className="opacity-80 rotate-2 scale-105 pointer-events-none">
                        <KanbanCard data={activeCard} />
                    </div>
                ) : null}
            </DragOverlay>

            <LeadDrawer
                lead={selectedLead}
                open={drawerOpen}
                onOpenChange={setDrawerOpen}
            />
        </DndContext>
    )
}
