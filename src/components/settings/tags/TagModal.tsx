'use client'

import { useState, useEffect } from "react"
import { X, Check } from "lucide-react"
import type { Tag } from "@/hooks/settings/useTags"

interface TagModalProps {
    isOpen: boolean
    onClose: () => void
    onSave: (data: Partial<Tag>) => Promise<void>
    initialData?: Tag | null
}

const TAG_COLORS = [
    { value: '#3B82F6', name: 'Azul' },
    { value: '#22C55E', name: 'Verde' },
    { value: '#EAB308', name: 'Amarelo' },
    { value: '#F97316', name: 'Laranja' },
    { value: '#EF4444', name: 'Vermelho' },
    { value: '#8B5CF6', name: 'Roxo' },
    { value: '#EC4899', name: 'Rosa' },
    { value: '#14B8A6', name: 'Teal' },
    { value: '#64748B', name: 'Cinza' },
    { value: '#0F172A', name: 'Preto' },
    { value: '#06B6D4', name: 'Ciano' },
    { value: '#84CC16', name: 'Lima' },
]

export function TagModal({ isOpen, onClose, onSave, initialData }: TagModalProps) {
    const [nome, setNome] = useState("")
    const [cor, setCor] = useState(TAG_COLORS[0].value)
    const [isSaving, setIsSaving] = useState(false)

    useEffect(() => {
        if (isOpen) {
            if (initialData) {
                setNome(initialData.nome || "")
                setCor(initialData.cor || TAG_COLORS[0].value)
            } else {
                setNome("")
                setCor(TAG_COLORS[0].value)
            }
            setIsSaving(false)
        }
    }, [isOpen, initialData])

    if (!isOpen) return null

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!nome.trim()) return

        setIsSaving(true)
        try {
            await onSave({
                nome: nome.trim(),
                cor
            })
            onClose()
        } finally {
            setIsSaving(false)
        }
    }

    const title = initialData ? 'Editar Tag' : 'Nova Tag'

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-lg w-full max-w-sm overflow-hidden flex flex-col">
                <div className="flex items-center justify-between p-4 border-b">
                    <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-500"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form id="tag-form" onSubmit={handleSubmit} className="p-4 space-y-6">
                    <div className="space-y-1">
                        <label className="text-sm font-medium text-gray-700">Nome da tag *</label>
                        <input
                            type="text"
                            value={nome}
                            onChange={(e) => setNome(e.target.value)}
                            required
                            maxLength={40}
                            placeholder="Ex: Cliente VIP"
                            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Cor</label>
                        <div className="grid grid-cols-6 gap-2">
                            {TAG_COLORS.map(c => (
                                <button
                                    key={c.value}
                                    type="button"
                                    onClick={() => setCor(c.value)}
                                    className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all hover:scale-110 active:scale-95 ${cor === c.value ? 'border-gray-900 shadow-md ring-2 ring-offset-1 ring-gray-900' : 'border-transparent shadow-sm'
                                        }`}
                                    style={{ backgroundColor: c.value }}
                                    title={c.name}
                                >
                                    {cor === c.value && <Check className="w-4 h-4 text-white drop-shadow-sm" />}
                                </button>
                            ))}
                        </div>
                    </div>
                </form>

                <div className="p-4 border-t bg-gray-50 flex justify-end gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isSaving}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        form="tag-form"
                        disabled={isSaving || !nome.trim()}
                        className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isSaving ? 'Salvando...' : 'Salvar'}
                    </button>
                </div>
            </div>
        </div>
    )
}
