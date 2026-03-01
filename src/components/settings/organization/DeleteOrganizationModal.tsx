'use client'

import { useState } from "react"
import { AlertTriangle, X } from "lucide-react"

interface DeleteOrganizationModalProps {
    organizationName: string
    onConfirm: () => Promise<void>
}

export function DeleteOrganizationModal({ organizationName, onConfirm }: DeleteOrganizationModalProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [confirmName, setConfirmName] = useState("")
    const [isDeleting, setIsDeleting] = useState(false)

    const isMatched = confirmName === organizationName

    const handleDelete = async () => {
        if (!isMatched) return
        setIsDeleting(true)
        try {
            await onConfirm()
            // Note: The onConfirm logic should handle redirection to a safe page (e.g., /new-organization or auth boundary)
        } finally {
            setIsDeleting(false)
            setIsOpen(false)
        }
    }

    return (
        <div className="bg-white border rounded-xl overflow-hidden shadow-sm mt-8 border-red-200">
            <div className="p-6 md:p-8 space-y-4">
                <div className="flex items-center gap-2 text-red-600 mb-2">
                    <AlertTriangle className="w-5 h-5" />
                    <h2 className="text-lg font-medium">Zona de Perigo</h2>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h3 className="font-medium text-gray-900">Excluir organização</h3>
                        <p className="text-sm text-gray-500">
                            Esta ação é permanente e irá remover todos os dados (leads, mensagens e configurações).
                        </p>
                    </div>
                    <button
                        onClick={() => setIsOpen(true)}
                        className="shrink-0 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-red-600 bg-red-50 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                    >
                        Excluir organização
                    </button>
                </div>
            </div>

            {/* Modal */}
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-lg w-full max-w-md overflow-hidden flex flex-col">
                        <div className="flex items-center justify-between p-4 border-b">
                            <h3 className="text-lg font-semibold text-gray-900">Excluir {organizationName}?</h3>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="text-gray-400 hover:text-gray-500"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-4 space-y-4">
                            <p className="text-sm text-gray-600">
                                Esta ação <strong>não pode ser desfeita</strong>. Todos os dados da organização serão apagados.
                            </p>

                            <div className="space-y-1">
                                <label className="text-sm font-medium text-gray-700">
                                    Digite o nome da organização para confirmar: <strong>{organizationName}</strong>
                                </label>
                                <input
                                    type="text"
                                    value={confirmName}
                                    onChange={(e) => setConfirmName(e.target.value)}
                                    placeholder={organizationName}
                                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                                />
                            </div>
                        </div>

                        <div className="p-4 border-t bg-gray-50 flex justify-end gap-3">
                            <button
                                onClick={() => setIsOpen(false)}
                                disabled={isDeleting}
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleDelete}
                                disabled={!isMatched || isDeleting}
                                className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isDeleting ? 'Excluindo...' : 'Sim, excluir permanentemente'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
