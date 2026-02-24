'use client'

import { ArrowUp, ArrowDown } from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'
import { LeadsTableRow } from './LeadsTableRow'
import type { LeadRow, SortField, SortOrder } from '@/hooks/leads/useLeads'

interface LeadsTableProps {
    leads: LeadRow[]
    isLoading: boolean
    sortField: SortField
    sortOrder: SortOrder
    onSortChange: (field: SortField, order: SortOrder) => void
    selectedIds: Set<string>
    onToggleSelect: (id: string) => void
    onToggleSelectAll: () => void
    onLeadClick: (lead: LeadRow) => void
    onEtapaChange: (leadId: string, etapaId: string, etapaNome: string) => void
    etapas: { id: string; nome: string; cor: string }[]
    members: { id: string; nome: string }[]
    tags: { id: string; nome: string; cor: string }[]
    onTagsChange: (leadId: string, tagIds: string[]) => void
    page: number
    perPage: number
}

interface ColumnDef {
    key: SortField | 'none'
    label: string
    sortable: boolean
    width: string
}

const columns: ColumnDef[] = [
    { key: 'nome', label: 'Nome', sortable: true, width: 'min-w-[200px]' },
    { key: 'none', label: 'Telefone', sortable: false, width: 'min-w-[140px]' },
    { key: 'none', label: 'Etapa', sortable: false, width: 'min-w-[130px]' },
    { key: 'none', label: 'Tags', sortable: false, width: 'min-w-[140px]' },
    { key: 'none', label: 'Atendente', sortable: false, width: 'min-w-[120px]' },
    { key: 'ultima_mensagem_at', label: 'Última msg', sortable: true, width: 'min-w-[110px]' },
    { key: 'mensagens_nao_lidas', label: 'Não lidas', sortable: true, width: 'min-w-[90px]' },
    { key: 'valor_venda', label: 'Valor', sortable: true, width: 'min-w-[110px]' },
]

export function LeadsTable({
    leads,
    isLoading,
    sortField,
    sortOrder,
    onSortChange,
    selectedIds,
    onToggleSelect,
    onToggleSelectAll,
    onLeadClick,
    onEtapaChange,
    etapas,
    members,
    tags,
    onTagsChange,
    page,
    perPage,
}: LeadsTableProps) {
    const allSelected = leads.length > 0 && leads.every(l => selectedIds.has(l.id))

    const handleSort = (key: SortField) => {
        if (key === sortField) {
            onSortChange(key, sortOrder === 'asc' ? 'desc' : 'asc')
        } else {
            onSortChange(key, 'asc')
        }
    }

    // Skeleton loader
    if (isLoading) {
        return (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-200">
                                <th className="w-[50px] px-3 py-3" />
                                <th className="w-[40px] px-2 py-3" />
                                {columns.map((col) => (
                                    <th key={col.label} className={`px-3 py-3 text-left ${col.width}`}>
                                        <span className="text-xs font-medium text-gray-500 uppercase">{col.label}</span>
                                    </th>
                                ))}
                                <th className="w-[50px]" />
                            </tr>
                        </thead>
                        <tbody>
                            {[...Array(5)].map((_, i) => (
                                <tr key={i} className="border-b border-gray-100">
                                    <td className="px-3 py-4"><div className="h-4 w-6 bg-gray-200 rounded animate-pulse" /></td>
                                    <td className="px-2 py-4"><div className="h-4 w-4 bg-gray-200 rounded animate-pulse" /></td>
                                    <td className="px-3 py-4"><div className="h-5 w-32 bg-gray-200 rounded animate-pulse" /></td>
                                    <td className="px-3 py-4"><div className="h-4 w-28 bg-gray-200 rounded animate-pulse" /></td>
                                    <td className="px-3 py-4"><div className="h-5 w-20 bg-gray-200 rounded-full animate-pulse" /></td>
                                    <td className="px-3 py-4"><div className="h-5 w-16 bg-gray-200 rounded-full animate-pulse" /></td>
                                    <td className="px-3 py-4"><div className="h-4 w-16 bg-gray-200 rounded animate-pulse" /></td>
                                    <td className="px-3 py-4"><div className="h-4 w-16 bg-gray-200 rounded animate-pulse" /></td>
                                    <td className="px-3 py-4"><div className="h-4 w-10 bg-gray-200 rounded animate-pulse" /></td>
                                    <td className="px-3 py-4"><div className="h-4 w-16 bg-gray-200 rounded animate-pulse" /></td>
                                    <td />
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        )
    }

    // Estado vazio
    if (leads.length === 0) {
        return (
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                <div className="mx-auto w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                    <span className="text-2xl">👥</span>
                </div>
                <h3 className="text-base font-medium text-gray-700">Nenhum lead encontrado</h3>
                <p className="text-sm text-gray-500 mt-1">Tente ajustar seus filtros ou adicione um novo lead.</p>
            </div>
        )
    }

    return (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full" role="table">
                    <thead>
                        <tr className="bg-gray-50 border-b border-gray-200">
                            {/* # */}
                            <th className="w-[50px] px-3 py-3 text-left text-xs font-medium text-gray-400">#</th>
                            {/* Checkbox */}
                            <th className="w-[40px] px-2 py-3">
                                <Checkbox checked={allSelected} onCheckedChange={onToggleSelectAll} aria-label="Selecionar todos" />
                            </th>
                            {/* Colunas de dados */}
                            {columns.map((col) => (
                                <th
                                    key={col.label}
                                    className={`px-3 py-3 text-left ${col.width} ${col.sortable ? 'cursor-pointer select-none hover:text-gray-900' : ''}`}
                                    onClick={() => col.sortable && col.key !== 'none' && handleSort(col.key)}
                                >
                                    <span className={`inline-flex items-center gap-1 text-xs font-medium uppercase ${col.sortable && col.key === sortField ? 'text-gray-900' : 'text-gray-500'
                                        }`}>
                                        {col.label}
                                        {col.sortable && col.key === sortField && (
                                            sortOrder === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                                        )}
                                    </span>
                                </th>
                            ))}
                            {/* Ações */}
                            <th className="w-[50px]" />
                        </tr>
                    </thead>
                    <tbody>
                        {leads.map((lead, index) => (
                            <LeadsTableRow
                                key={lead.id}
                                lead={lead}
                                index={(page - 1) * perPage + index + 1}
                                selected={selectedIds.has(lead.id)}
                                onToggleSelect={() => onToggleSelect(lead.id)}
                                onClick={() => onLeadClick(lead)}
                                onEtapaChange={onEtapaChange}
                                etapas={etapas}
                                members={members}
                                tags={tags}
                                onTagsChange={onTagsChange}
                            />
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
