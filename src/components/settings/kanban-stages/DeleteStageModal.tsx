'use client'

import { useState, useEffect } from "react"
import { AlertTriangle, X } from "lucide-react"
import type { KanbanStage } from "@/hooks/settings/useKanbanStages"

interface DeleteStageModalProps {
    stage: KanbanStage & { leadsCount: number } | null
    availableStages: KanbanStage[]
    isOpen: boolean
    onClose: () => void
    onConfirm: (stageId: string, moveToStageId?: string) => Promise<void>
}

export function DeleteStageModal({ stage, availableStages, isOpen, onClose, onConfirm }: DeleteStageModalProps) {
    const [moveToStageId, setMoveToStageId] = useState<string>("")
    const [isDeleting, setIsDeleting] = useState(false)

    // As etapas alvo não podem ser a própria etapa que estamos excluindo
    const targetStages = availableStages.filter(s => s.id !== stage?.id)

    useEffect(() => {
        if (isOpen) {
            setMoveToStageId("")
            setIsDeleting(false)
        }
    }, [isOpen])

    if (!isOpen || !stage) return null

    const hasLeads = stage.leadsCount > 0

    const handleConfirm = async () => {
        if (hasLeads && !moveToStageId) return

        setIsDeleting(true)
        try {
            await onConfirm(stage.id, hasLeads ? moveToStageId : undefined)
            onClose()
        } finally {
            setIsDeleting(false)
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-lg w-full max-w-md overflow-hidden flex flex-col">
                <div className="flex items-center justify-between p-4 border-b">
                    <div className="flex items-center gap-2 text-red-600">
                        <AlertTriangle className="w-5 h-5" />
                        <h3 className="text-lg font-semibold text-gray-900">Excluir etapa</h3>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-500"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-4 space-y-4">
                    <p className="text-sm text-gray-600">
                        Você está prestes a excluir a etapa <strong>{stage.nome}</strong>. Esta ação não pode ser desfeita.
                    </p>

                    {hasLeads && (
                        <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg space-y-3">
                            <p className="text-sm text-amber-800 font-medium">
                                Esta etapa possui {stage.leadsCount} lead{stage.leadsCount !== 1 && 's'}.
                            </p>
                            <p className="text-xs text-amber-700">
                                Para prosseguir com a exclusão, você deve selecionar uma etapa de destino para transferir estes leads:
                            </p>

                            <select
                                value={moveToStageId}
                                onChange={(e) => setMoveToStageId(e.target.value)}
                                className="w-full rounded-md border border-amber-300 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 bg-white"
                            >
                                <option value="">Selecione a etapa de destino...</option>
                                {targetStages.map(s => (
                                    <option key={s.id} value={s.id}>{s.nome}</option>
                                ))}
                            </select>
                        </div>
                    )}
                </div>

                <div className="p-4 border-t bg-gray-50 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        disabled={isDeleting}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={isDeleting || (hasLeads && !moveToStageId)}
                        className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isDeleting ? 'Excluindo...' : 'Sim, excluir'}
                    </button>
                </div>
            </div>
        </div>
    )
}
