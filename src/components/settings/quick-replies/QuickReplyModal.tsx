'use client'

import { useState, useEffect } from "react"
import { X, PlusCircle } from "lucide-react"
import type { QuickReply } from "@/hooks/chat/use-quick-replies"

interface QuickReplyModalProps {
    isOpen: boolean
    onClose: () => void
    onSave: (data: Partial<QuickReply>) => Promise<void>
    initialData?: QuickReply | null
}

const VARIABLES = [
    { label: 'Nome do Lead', value: '{{lead.nome}}' },
    { label: 'Telefone do Lead', value: '{{lead.telefone}}' },
    { label: 'Nome da Empresa', value: '{{organizacao.nome}}' },
    { label: 'Saudação do Dia', value: '{{saudacao}}' } // Bom dia, Boa tarde, Boa noite
]

export function QuickReplyModal({ isOpen, onClose, onSave, initialData }: QuickReplyModalProps) {
    const [atalho, setAtalho] = useState("")
    const [titulo, setTitulo] = useState("")
    const [conteudo, setConteudo] = useState("")
    const [isSaving, setIsSaving] = useState(false)
    const [atalhoError, setAtalhoError] = useState("")

    useEffect(() => {
        if (isOpen) {
            if (initialData) {
                setAtalho(initialData.atalho || "")
                setTitulo(initialData.titulo || "")
                setConteudo(initialData.conteudo || "")
            } else {
                setAtalho("")
                setTitulo("")
                setConteudo("")
            }
            setAtalhoError("")
            setIsSaving(false)
        }
    }, [isOpen, initialData])

    if (!isOpen) return null

    const handleAtalhoChange = (val: string) => {
        // Only lowercase alphanumeric and underscores
        const sanitized = val.toLowerCase().replace(/[^a-z0-9_]/g, '')
        setAtalho(sanitized)

        if (val !== sanitized && val !== '') {
            setAtalhoError("O atalho deve conter apenas letras minúsculas, números e underline (_).")
        } else {
            setAtalhoError("")
        }
    }

    const insertVariable = (variableValue: string) => {
        setConteudo(prev => prev + variableValue)
        // Focus the textarea logic could go here, but this is sufficient
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!atalho.trim() || !titulo.trim() || !conteudo.trim()) return

        setIsSaving(true)
        try {
            await onSave({
                atalho: atalho.trim(),
                titulo: titulo.trim(),
                conteudo: conteudo.trim()
            })
            onClose()
        } finally {
            setIsSaving(false)
        }
    }

    const titleText = initialData ? 'Editar Resposta Rápida' : 'Nova Resposta Rápida'

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-lg w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
                <div className="flex items-center justify-between p-4 border-b shrink-0">
                    <h3 className="text-lg font-semibold text-gray-900">{titleText}</h3>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-500"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form id="qr-form" onSubmit={handleSubmit} className="p-4 space-y-6 overflow-y-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-sm font-medium text-gray-700">Atalho *</label>
                            <div className="relative">
                                <span className="absolute left-3 top-2.5 text-gray-400 font-mono">/</span>
                                <input
                                    type="text"
                                    value={atalho}
                                    onChange={(e) => handleAtalhoChange(e.target.value)}
                                    required
                                    maxLength={20}
                                    placeholder="ola"
                                    className="w-full rounded-md border border-gray-300 pl-7 pr-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                                />
                            </div>
                            {atalhoError ? (
                                <p className="text-xs text-red-500 mt-1">{atalhoError}</p>
                            ) : (
                                <p className="text-xs text-gray-500">O que você digitará para buscar.</p>
                            )}
                        </div>

                        <div className="space-y-1">
                            <label className="text-sm font-medium text-gray-700">Título interno *</label>
                            <input
                                type="text"
                                value={titulo}
                                onChange={(e) => setTitulo(e.target.value)}
                                required
                                maxLength={50}
                                placeholder="Boas vindas inicial"
                                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                            <p className="text-xs text-gray-500">Para identificar na lista facilmente.</p>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <label className="text-sm font-medium text-gray-700">Mensagem *</label>
                        </div>

                        <textarea
                            value={conteudo}
                            onChange={(e) => setConteudo(e.target.value)}
                            required
                            rows={5}
                            placeholder="Olá! Como posso ajudar?"
                            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-y min-h-[100px]"
                        />

                        <div className="pt-2 border-t mt-2">
                            <p className="text-xs font-medium text-gray-700 mb-2">Variáveis dinâmicas (clique para inserir):</p>
                            <div className="flex flex-wrap gap-2">
                                {VARIABLES.map(v => (
                                    <button
                                        key={v.value}
                                        type="button"
                                        onClick={() => insertVariable(v.value)}
                                        className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 transition-colors"
                                    >
                                        <PlusCircle className="w-3 h-3 mr-1" />
                                        {v.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </form>

                <div className="p-4 border-t bg-gray-50 flex justify-end gap-3 shrink-0">
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
                        form="qr-form"
                        disabled={isSaving || !atalho.trim() || !titulo.trim() || !conteudo.trim()}
                        className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isSaving ? 'Salvando...' : 'Salvar'}
                    </button>
                </div>
            </div>
        </div>
    )
}
