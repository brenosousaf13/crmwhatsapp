'use client'

import { useState } from "react"
import { SettingsPageHeader } from "@/components/settings/SettingsPageHeader"
import { useQuickReplies, QuickReply } from "@/hooks/chat/use-quick-replies"
import { QuickReplyModal } from "@/components/settings/quick-replies/QuickReplyModal"
import { Loader2, Plus, Search, Pencil, Trash2, MessageSquareQuote } from "lucide-react"
import { toast } from "sonner"

export default function QuickRepliesSettingsPage() {
    const {
        data: replies,
        isLoading,
        addReply,
        updateReply,
        deleteReply
    } = useQuickReplies()

    const [searchTerm, setSearchTerm] = useState("")
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [replyToEdit, setReplyToEdit] = useState<QuickReply | null>(null)

    const filteredReplies = replies?.filter(r =>
        r.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.atalho.toLowerCase().includes(searchTerm.toLowerCase())
    ) || []

    const handleCreateNew = () => {
        setReplyToEdit(null)
        setIsModalOpen(true)
    }

    const handleEdit = (reply: QuickReply) => {
        setReplyToEdit(reply)
        setIsModalOpen(true)
    }

    const handleDelete = async (reply: QuickReply) => {
        if (confirm(`Tem certeza que deseja excluir a resposta rápida "${reply.titulo}" (/ ${reply.atalho})?`)) {
            try {
                await deleteReply(reply.id)
            } catch (err: any) {
                toast.error(err.message)
            }
        }
    }

    const handleSaveReply = async (data: Partial<QuickReply>) => {
        if (replyToEdit) {
            await updateReply({ id: replyToEdit.id, ...data })
        } else {
            await addReply(data as any)
        }
    }

    return (
        <div className="space-y-6 pb-12">
            <SettingsPageHeader
                title="Respostas Rápidas"
                description="Gerencie atalhos de mensagens padronizadas em conversas de WhatsApp para sua equipe enviar com o comando (/)."
                action={
                    <button
                        onClick={handleCreateNew}
                        className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Nova resposta
                    </button>
                }
            />

            <div className="max-w-5xl space-y-4">
                {/* Search Bar */}
                <div className="relative max-w-md">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                        <Search className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                        type="text"
                        placeholder="Buscar por título ou atalho..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="block w-full rounded-md border-0 py-2.5 pl-10 pr-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                    />
                </div>

                {/* Replies Grid */}
                {isLoading ? (
                    <div className="flex justify-center items-center py-12">
                        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                    </div>
                ) : filteredReplies.length === 0 ? (
                    <div className="bg-white border rounded-xl p-8 text-center text-gray-500 shadow-sm">
                        {searchTerm ? 'Nenhuma resposta rápida encontrada para sua busca.' : 'Nenhuma resposta rápida cadastrada ainda.'}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
                        {filteredReplies.map((reply) => (
                            <div
                                key={reply.id}
                                className="bg-white border text-left p-5 rounded-xl shadow-sm hover:shadow-md transition-shadow relative group flex flex-col"
                            >
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                        <MessageSquareQuote className="w-5 h-5 text-blue-500" />
                                        <h4 className="font-semibold text-gray-900 truncate pr-2" title={reply.titulo}>
                                            {reply.titulo}
                                        </h4>
                                    </div>

                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => handleEdit(reply)}
                                            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                            title="Editar"
                                        >
                                            <Pencil className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(reply)}
                                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                            title="Excluir"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>

                                <div className="mb-4 text-sm text-gray-600 whitespace-pre-wrap flex-1 bg-gray-50 border border-gray-100 rounded-lg p-3 overflow-hidden text-ellipsis line-clamp-3">
                                    {reply.conteudo}
                                </div>

                                <div className="mt-auto">
                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 font-mono">
                                        /{reply.atalho}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <QuickReplyModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                initialData={replyToEdit}
                onSave={handleSaveReply}
            />
        </div>
    )
}
