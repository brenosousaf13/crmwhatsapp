'use client'

import { useState } from "react"
import { SettingsPageHeader } from "@/components/settings/SettingsPageHeader"
import { useKanbanStages, KanbanStage } from "@/hooks/settings/useKanbanStages"
import { KanbanStagesList } from "@/components/settings/kanban-stages/KanbanStagesList"
import { KanbanStageModal } from "@/components/settings/kanban-stages/KanbanStageModal"
import { DeleteStageModal } from "@/components/settings/kanban-stages/DeleteStageModal"
import { Loader2, Plus } from "lucide-react"

export default function KanbanStagesSettingsPage() {
    const {
        stages,
        isLoading,
        addStage,
        updateStage,
        deleteStage,
        reorderStages
    } = useKanbanStages()

    const [isModalOpen, setIsModalOpen] = useState(false)
    const [stageToEdit, setStageToEdit] = useState<KanbanStage | null>(null)

    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
    const [stageToDelete, setStageToDelete] = useState<(KanbanStage & { leadsCount: number }) | null>(null)

    const handleCreateNew = () => {
        setStageToEdit(null)
        setIsModalOpen(true)
    }

    const handleEdit = (stage: KanbanStage) => {
        setStageToEdit(stage)
        setIsModalOpen(true)
    }

    const handleDeleteClick = (stage: KanbanStage) => {
        // Assert it has leadsCount since it came from the list
        setStageToDelete(stage as KanbanStage & { leadsCount: number })
        setIsDeleteModalOpen(true)
    }

    const handleSaveStage = async (data: Partial<KanbanStage>) => {
        if (stageToEdit) {
            await updateStage({ id: stageToEdit.id, ...data })
        } else {
            // For new stages, automatically append them to the end
            const newOrdem = stages ? stages.length : 0
            await addStage({ ...data, ordem: newOrdem } as any)
        }
    }

    const handleConfirmDelete = async (stageId: string, moveToStageId?: string) => {
        await deleteStage({ id: stageId, moveToStageId })
    }

    return (
        <div className="space-y-6 pb-12">
            <SettingsPageHeader
                title="Etapas do Kanban"
                description="Configure as etapas do seu pipeline de vendas. Arraste para reordenar as colunas do seu painel."
                action={
                    <button
                        onClick={handleCreateNew}
                        className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Nova etapa
                    </button>
                }
            />

            <div className="max-w-4xl">
                {isLoading ? (
                    <div className="flex justify-center items-center py-12">
                        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                    </div>
                ) : (
                    <KanbanStagesList
                        stages={stages || []}
                        onEdit={handleEdit}
                        onDelete={handleDeleteClick}
                        onReorder={reorderStages}
                    />
                )}
            </div>

            <KanbanStageModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                initialData={stageToEdit}
                onSave={handleSaveStage}
            />

            <DeleteStageModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                stage={stageToDelete}
                availableStages={stages || []}
                onConfirm={handleConfirmDelete}
            />
        </div>
    )
}
