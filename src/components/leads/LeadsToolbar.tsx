'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Search, ArrowUpDown, SlidersHorizontal, Download, Plus, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { SortField, SortOrder } from '@/hooks/leads/useLeads'

interface LeadsToolbarProps {
    search: string
    onSearchChange: (value: string) => void
    sortField: SortField
    sortOrder: SortOrder
    onSortChange: (field: SortField, order: SortOrder) => void
    filtersOpen: boolean
    onToggleFilters: () => void
    hasActiveFilters: boolean
    onExportCSV: () => void
    exporting: boolean
    onNewLead: () => void
    // Ações em lote
    selectedCount: number
    onBulkMoveEtapa: () => void
    onBulkAssign: () => void
    onBulkDelete: () => void
    tags: { id: string; nome: string; cor: string }[]
    onBulkAddTag: (tagId: string) => void
    onBulkRemoveTag: (tagId: string) => void
    onDeselectAll: () => void
}

const sortOptions: { field: SortField; order: SortOrder; label: string }[] = [
    { field: 'nome', order: 'asc', label: 'Nome (A-Z)' },
    { field: 'nome', order: 'desc', label: 'Nome (Z-A)' },
    { field: 'criado_em', order: 'desc', label: 'Mais recente' },
    { field: 'criado_em', order: 'asc', label: 'Mais antigo' },
    { field: 'ultima_mensagem_at', order: 'desc', label: 'Última mensagem (recente)' },
    { field: 'ultima_mensagem_at', order: 'asc', label: 'Última mensagem (antigo)' },
    { field: 'mensagens_nao_lidas', order: 'desc', label: 'Não lidas (mais)' },
    { field: 'mensagens_nao_lidas', order: 'asc', label: 'Não lidas (menos)' },
    { field: 'valor_venda', order: 'desc', label: 'Valor (maior)' },
    { field: 'valor_venda', order: 'asc', label: 'Valor (menor)' },
]

export function LeadsToolbar({
    search,
    onSearchChange,
    sortField,
    sortOrder,
    onSortChange,
    filtersOpen,
    onToggleFilters,
    hasActiveFilters,
    onExportCSV,
    exporting,
    onNewLead,
    selectedCount,
    onBulkMoveEtapa,
    onBulkAssign,
    onBulkDelete,
    tags,
    onBulkAddTag,
    onBulkRemoveTag,
    onDeselectAll,
}: LeadsToolbarProps) {
    // Debounce da busca
    const [localSearch, setLocalSearch] = useState(search)
    const debounceRef = useRef<NodeJS.Timeout>()

    useEffect(() => {
        setLocalSearch(search)
    }, [search])

    const handleSearchChange = useCallback((value: string) => {
        setLocalSearch(value)
        clearTimeout(debounceRef.current)
        debounceRef.current = setTimeout(() => onSearchChange(value), 300)
    }, [onSearchChange])

    // Se há selecionados, mostrar barra de ações em lote
    if (selectedCount > 0) {
        return (
            <div className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">
                <span className="text-sm font-medium text-blue-700">
                    ☑ {selectedCount} selecionado{selectedCount > 1 ? 's' : ''}
                </span>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={onBulkMoveEtapa}>
                        Mover para ▾
                    </Button>
                    <Button variant="outline" size="sm" onClick={onBulkAssign}>
                        Atribuir a ▾
                    </Button>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm">Adicionar Tag ▾</Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                            {tags.map(t => (
                                <DropdownMenuItem key={t.id} onClick={() => onBulkAddTag(t.id)}>
                                    <span className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: t.cor }} />
                                    {t.nome}
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm">Remover Tag ▾</Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                            {tags.map(t => (
                                <DropdownMenuItem key={t.id} onClick={() => onBulkRemoveTag(t.id)}>
                                    <span className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: t.cor }} />
                                    {t.nome}
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>
                    <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50" onClick={onBulkDelete}>
                        🗑️
                    </Button>
                    <Button variant="outline" size="sm" onClick={onExportCSV} disabled={exporting}>
                        Exportar
                    </Button>
                    <Button variant="ghost" size="sm" onClick={onDeselectAll}>
                        Desselecionar
                    </Button>
                </div>
            </div>
        )
    }

    const activeSortLabel = sortOptions.find(s => s.field === sortField && s.order === sortOrder)?.label || 'Ordenar'

    return (
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            {/* Busca */}
            <div className="relative flex-1 w-full sm:max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                    placeholder="Buscar por nome, telefone ou email..."
                    value={localSearch}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    className="pl-9 pr-8 h-9 bg-white"
                />
                {localSearch && (
                    <button
                        onClick={() => handleSearchChange('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                        <X className="h-4 w-4" />
                    </button>
                )}
            </div>

            <div className="flex items-center gap-2">
                {/* Ordenar */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" className="gap-1.5 text-gray-600">
                            <ArrowUpDown className="h-4 w-4" />
                            <span className="hidden sm:inline">{activeSortLabel}</span>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        {sortOptions.map((opt) => (
                            <DropdownMenuItem
                                key={`${opt.field}-${opt.order}`}
                                onClick={() => onSortChange(opt.field, opt.order)}
                                className={sortField === opt.field && sortOrder === opt.order ? 'bg-gray-100 font-medium' : ''}
                            >
                                {opt.label}
                            </DropdownMenuItem>
                        ))}
                    </DropdownMenuContent>
                </DropdownMenu>

                {/* Filtros */}
                <Button
                    variant={filtersOpen || hasActiveFilters ? 'default' : 'outline'}
                    size="sm"
                    onClick={onToggleFilters}
                    className={`gap-1.5 ${filtersOpen || hasActiveFilters ? 'bg-blue-600 text-white hover:bg-blue-700' : 'text-gray-600'}`}
                >
                    <SlidersHorizontal className="h-4 w-4" />
                    <span className="hidden sm:inline">Filtros</span>
                </Button>

                {/* Exportar */}
                <Button variant="outline" size="sm" onClick={onExportCSV} disabled={exporting} className="gap-1.5 text-gray-600">
                    <Download className="h-4 w-4" />
                    <span className="hidden sm:inline">{exporting ? 'Exportando...' : 'Exportar'}</span>
                </Button>

                {/* Novo Lead */}
                <Button onClick={onNewLead} className="bg-green-600 hover:bg-green-700 text-white gap-1.5" size="sm">
                    <Plus className="h-4 w-4" />
                    <span className="hidden sm:inline">Novo Lead</span>
                </Button>
            </div>
        </div>
    )
}
