'use client'

import { useState, useEffect } from "react"
import { X, Check } from "lucide-react"
import type { KanbanStage } from "@/hooks/settings/useKanbanStages"

interface KanbanStageModalProps {
    isOpen: boolean
    onClose: () => void
    onSave: (data: Partial<KanbanStage>) => Promise<void>
    initialData?: KanbanStage | null
}

const STAGE_COLORS = [
    { value: '#3B82F6', name: 'Azul' },     // blue-500
    { value: '#22C55E', name: 'Verde' },    // green-500
    { value: '#EAB308', name: 'Amarelo' },  // yellow-500
    { value: '#F97316', name: 'Laranja' },  // orange-500
    { value: '#EF4444', name: 'Vermelho' }, // red-500
    { value: '#8B5CF6', name: 'Roxo' },     // violet-500
    { value: '#EC4899', name: 'Rosa' },     // pink-500
    { value: '#14B8A6', name: 'Teal' },     // teal-500
    { value: '#64748B', name: 'Cinza' },    // slate-500
    { value: '#0F172A', name: 'Preto' },    // slate-900
]

export function KanbanStageModal({ isOpen, onClose, onSave, initialData }: KanbanStageModalProps) {
    const [nome, setNome] = useState("")
    const [cor, setCor] = useState(STAGE_COLORS[0].value)
    const [tipo, setTipo] = useState<'normal' | 'ganho' | 'perdido'>('normal')
    const [isSaving, setIsSaving] = useState(false)

    useEffect(() => {
        if (isOpen) {
            if (initialData) {
                setNome(initialData.nome || "")
                setCor(initialData.cor || STAGE_COLORS[0].value)
                setTipo(initialData.tipo || 'normal')
            } else {
                setNome("")
                setCor(STAGE_COLORS[0].value)
                setTipo('normal')
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
                cor,
                tipo
            })
            onClose()
        } finally {
            setIsSaving(false)
        }
    }

    const title = initialData ? 'Editar etapa' : 'Nova etapa'

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-lg w-full max-w-md overflow-hidden flex flex-col">
                <div className="flex items-center justify-between p-4 border-b">
                    <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-500"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form id="stage-form" onSubmit={handleSubmit} className="p-4 space-y-6">
                    {/* Nome */}
                    <div className="space-y-1">
                        <label className="text-sm font-medium text-gray-700">Nome da etapa *</label>
                        <input
                            type="text"
                            value={nome}
                            onChange={(e) => setNome(e.target.value)}
                            required
                            maxLength={50}
                            placeholder="Ex: Em negociação"
                            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                    </div>

                    {/* Cor */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Cor</label>
                        <div className="flex flex-wrap gap-2">
                            {STAGE_COLORS.map(c => (
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

                    {/* Tipo */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Tipo da etapa</label>
                        <div className="space-y-2">
                            <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                                <input
                                    type="radio"
                                    name="tipo"
                                    value="normal"
                                    checked={tipo === 'normal'}
                                    onChange={() => setTipo('normal')}
                                    className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                                />
                                <div className="flex flex-col">
                                    <span className="text-sm font-medium text-gray-900">Normal</span>
                                    <span className="text-xs text-gray-500">Etapa padrão do funil ativo</span>
                                </div>
                            </label>

                            <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                                <input
                                    type="radio"
                                    name="tipo"
                                    value="ganho"
                                    checked={tipo === 'ganho'}
                                    onChange={() => setTipo('ganho')}
                                    className="w-4 h-4 text-green-600 focus:ring-green-500"
                                    disabled={!!initialData && initialData.tipo !== 'ganho' && initialData.tipo !== 'normal'} // Example restriction logic
                                />
                                <div className="flex flex-col">
                                    <span className="text-sm font-medium text-gray-900">Etapa de ganho (Win)</span>
                                    <span className="text-xs text-gray-500">Negócios fechados com sucesso</span>
                                </div>
                            </label>

                            <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                                <input
                                    type="radio"
                                    name="tipo"
                                    value="perdido"
                                    checked={tipo === 'perdido'}
                                    onChange={() => setTipo('perdido')}
                                    className="w-4 h-4 text-red-600 focus:ring-red-500"
                                    disabled={!!initialData && initialData.tipo !== 'perdido' && initialData.tipo !== 'normal'}
                                />
                                <div className="flex flex-col">
                                    <span className="text-sm font-medium text-gray-900">Etapa de perda (Loss)</span>
                                    <span className="text-xs text-gray-500">Negócios perdidos ou descartados</span>
                                </div>
                            </label>
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
                        form="stage-form"
                        disabled={isSaving || !nome.trim()}
                        className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isSaving ? 'Salvando...' : (initialData ? 'Salvar alterações' : 'Criar etapa')}
                    </button>
                </div>
            </div>
        </div>
    )
}
