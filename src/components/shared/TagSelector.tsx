'use client'

import { useState, useMemo } from 'react'
import { Plus, X, Search } from 'lucide-react'
import { Tag, useTags } from '@/hooks/settings/useTags'
import * as Popover from '@radix-ui/react-popover'
import { cn } from '@/lib/utils'

interface TagSelectorProps {
    selectedTags: { id: string; nome: string; cor: string }[]
    onAddTag: (tag: Tag) => void
    onRemoveTag: (tagId: string) => void
    disabled?: boolean
    size?: 'sm' | 'md'
}

export function TagSelector({ selectedTags, onAddTag, onRemoveTag, disabled, size = 'md' }: TagSelectorProps) {
    const { tags = [], isLoading } = useTags()
    const [open, setOpen] = useState(false)
    const [search, setSearch] = useState('')

    // Filter available tags that aren't already selected
    const availableTags = useMemo(() => {
        const query = search.toLowerCase().trim()
        return tags.filter(tag => {
            const isSelected = selectedTags.some(selected => selected.id === tag.id)
            if (isSelected) return false
            if (query && !tag.nome.toLowerCase().includes(query)) return false
            return true
        })
    }, [tags, search, selectedTags])

    const isSmall = size === 'sm'

    return (
        <div className="flex flex-wrap items-center gap-2">
            {/* Selected Pills */}
            {selectedTags.map(tag => (
                <div
                    key={tag.id}
                    className={cn(
                        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium border shadow-sm",
                        isSmall ? "px-2 py-0" : ""
                    )}
                    style={{
                        backgroundColor: `${tag.cor}15`, // 15% opacity
                        color: tag.cor,
                        borderColor: `${tag.cor}40`
                    }}
                >
                    <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: tag.cor }} />
                    {tag.nome}
                    {!disabled && (
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation()
                                onRemoveTag(tag.id)
                            }}
                            className="ml-0.5 rounded-full p-0.5 hover:bg-black/10 transition-colors focus:outline-none"
                        >
                            <X className="w-3 h-3" />
                            <span className="sr-only">Remover {tag.nome}</span>
                        </button>
                    )}
                </div>
            ))}

            {/* Add Button & Popover */}
            {!disabled && (
                <Popover.Root open={open} onOpenChange={setOpen}>
                    <Popover.Trigger asChild>
                        <button
                            type="button"
                            className={cn(
                                "inline-flex items-center justify-center rounded-full border border-dashed border-gray-300 bg-gray-50 text-gray-500 hover:text-gray-700 hover:border-gray-400 hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1",
                                isSmall ? "w-5 h-5" : "px-2.5 py-1 text-xs font-medium gap-1"
                            )}
                        >
                            <Plus className={cn("w-3.5 h-3.5", isSmall ? "w-3 h-3" : "")} />
                            {!isSmall && <span>Adicionar tag</span>}
                        </button>
                    </Popover.Trigger>

                    <Popover.Portal>
                        <Popover.Content
                            className="z-50 w-64 p-0 outline-none bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden text-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=top]:slide-in-from-bottom-2"
                            sideOffset={6}
                            align="start"
                        >
                            <div className="flex items-center border-b px-3">
                                <Search className="w-4 h-4 text-gray-400 shrink-0" />
                                <input
                                    type="text"
                                    className="flex h-10 w-full rounded-md bg-transparent py-3 px-2 text-sm outline-none placeholder:text-gray-500 disabled:cursor-not-allowed disabled:opacity-50"
                                    placeholder="Buscar tags..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    autoFocus
                                />
                            </div>

                            <div className="max-h-60 overflow-y-auto p-1">
                                {isLoading ? (
                                    <div className="p-4 text-center text-sm text-gray-500">
                                        Carregando tags...
                                    </div>
                                ) : availableTags.length === 0 ? (
                                    <div className="p-4 text-center text-sm text-gray-500">
                                        {search.length > 0 ? 'Nenhuma tag encontrada.' : 'Todas as tags já foram adicionadas.'}
                                    </div>
                                ) : (
                                    availableTags.map(tag => (
                                        <button
                                            key={tag.id}
                                            onClick={() => {
                                                onAddTag(tag)
                                                setSearch('')
                                                setOpen(false)
                                            }}
                                            className="w-full flex items-center justify-between gap-2 rounded-md px-2 py-1.5 text-sm outline-none hover:bg-gray-100 focus:bg-gray-100 transition-colors cursor-pointer"
                                        >
                                            <div className="flex items-center gap-2">
                                                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: tag.cor }} />
                                                <span className="text-gray-900 font-medium">{tag.nome}</span>
                                            </div>
                                        </button>
                                    ))
                                )}
                            </div>
                        </Popover.Content>
                    </Popover.Portal>
                </Popover.Root>
            )}
        </div>
    )
}
