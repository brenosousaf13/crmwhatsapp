'use client'

import { useState } from "react"
import { SettingsPageHeader } from "@/components/settings/SettingsPageHeader"
import { useTags, Tag } from "@/hooks/settings/useTags"
import { TagModal } from "@/components/settings/tags/TagModal"
import { Loader2, Plus, Search, Pencil, Trash2 } from "lucide-react"
import { toast } from "sonner"

export default function TagsSettingsPage() {
    const { tags, isLoading, addTag, updateTag, deleteTag } = useTags()
    const [searchTerm, setSearchTerm] = useState("")

    const [isModalOpen, setIsModalOpen] = useState(false)
    const [tagToEdit, setTagToEdit] = useState<Tag | null>(null)

    const filteredTags = tags?.filter(t =>
        t.nome.toLowerCase().includes(searchTerm.toLowerCase())
    ) || []

    const handleCreateNew = () => {
        setTagToEdit(null)
        setIsModalOpen(true)
    }

    const handleEdit = (tag: Tag) => {
        setTagToEdit(tag)
        setIsModalOpen(true)
    }

    const handleDelete = async (tag: Tag) => {
        if (confirm(`Tem certeza que deseja excluir a tag "${tag.nome}"? Esta ação removerá a tag de todos os leads associados.`)) {
            try {
                await deleteTag(tag.id)
            } catch (err: any) {
                toast.error(err.message)
            }
        }
    }

    const handleSaveTag = async (data: Partial<Tag>) => {
        if (tagToEdit) {
            await updateTag({ id: tagToEdit.id, ...data })
        } else {
            await addTag(data as any)
        }
    }

    return (
        <div className="space-y-6 pb-12">
            <SettingsPageHeader
                title="Tags de Leads"
                description="Crie e gerencie etiquetas coloridas para classificar e segmentar seus contatos rapidamente."
                action={
                    <button
                        onClick={handleCreateNew}
                        className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Nova tag
                    </button>
                }
            />

            <div className="max-w-4xl space-y-4">
                {/* Search Bar */}
                <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                        <Search className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                        type="text"
                        placeholder="Buscar tags..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="block w-full rounded-md border-0 py-2.5 pl-10 pr-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                    />
                </div>

                {/* Tags List */}
                <div className="bg-white border rounded-xl overflow-hidden shadow-sm">
                    {isLoading ? (
                        <div className="flex justify-center items-center py-12">
                            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                        </div>
                    ) : filteredTags.length === 0 ? (
                        <div className="p-8 text-center text-gray-500">
                            {searchTerm ? 'Nenhuma tag encontrada para sua busca.' : 'Nenhuma tag cadastrada ainda.'}
                        </div>
                    ) : (
                        <ul className="divide-y divide-gray-100">
                            {filteredTags.map((tag) => (
                                <li key={tag.id} className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div
                                            className="w-4 h-4 rounded-full border border-black/10 shadow-inner"
                                            style={{ backgroundColor: tag.cor }}
                                        />
                                        <span className="font-medium text-gray-900">{tag.nome}</span>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => handleEdit(tag)}
                                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                                            title="Editar tag"
                                        >
                                            <Pencil className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(tag)}
                                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                                            title="Excluir tag"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>

            <TagModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                initialData={tagToEdit}
                onSave={handleSaveTag}
            />
        </div>
    )
}
