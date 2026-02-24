'use client'

import { X } from 'lucide-react'
import type { LeadsFilters } from '@/hooks/leads/useLeads'

interface LeadsActiveFiltersProps {
    filters: LeadsFilters
    etapasMap: Map<string, string> // etapa_id → nome
    onRemoveFilter: (key: keyof LeadsFilters, value?: string) => void
    onClearAll: () => void
}

export function LeadsActiveFilters({ filters, etapasMap, onRemoveFilter, onClearAll }: LeadsActiveFiltersProps) {
    const chips: { label: string; onRemove: () => void }[] = []

    // Etapas
    filters.etapas.forEach(etapaId => {
        const nome = etapasMap.get(etapaId) || etapaId
        chips.push({
            label: `Etapa: ${nome}`,
            onRemove: () => onRemoveFilter('etapas', etapaId),
        })
    })

    // Tags
    filters.tags.forEach(tag => {
        chips.push({
            label: `Tag: ${tag}`,
            onRemove: () => onRemoveFilter('tags', tag),
        })
    })

    // Não lidas
    if (filters.naoLidas !== 'todos') {
        chips.push({
            label: `Não lidas: ${filters.naoLidas === 'com' ? 'Sim' : 'Não'}`,
            onRemove: () => onRemoveFilter('naoLidas'),
        })
    }

    // Tem WhatsApp
    if (filters.temWhatsapp !== 'todos') {
        chips.push({
            label: `WhatsApp: ${filters.temWhatsapp === 'com' ? 'Com msgs' : 'Sem msgs'}`,
            onRemove: () => onRemoveFilter('temWhatsapp'),
        })
    }

    // Datas
    if (filters.criadoDe) chips.push({ label: `Criado de: ${filters.criadoDe}`, onRemove: () => onRemoveFilter('criadoDe') })
    if (filters.criadoAte) chips.push({ label: `Criado até: ${filters.criadoAte}`, onRemove: () => onRemoveFilter('criadoAte') })
    if (filters.ultimaMsgDe) chips.push({ label: `Msg de: ${filters.ultimaMsgDe}`, onRemove: () => onRemoveFilter('ultimaMsgDe') })
    if (filters.ultimaMsgAte) chips.push({ label: `Msg até: ${filters.ultimaMsgAte}`, onRemove: () => onRemoveFilter('ultimaMsgAte') })

    // Valor
    if (filters.valorDe !== null) chips.push({ label: `Valor ≥ R$${filters.valorDe}`, onRemove: () => onRemoveFilter('valorDe') })
    if (filters.valorAte !== null) chips.push({ label: `Valor ≤ R$${filters.valorAte}`, onRemove: () => onRemoveFilter('valorAte') })

    // Busca
    if (filters.search) chips.push({ label: `Busca: "${filters.search}"`, onRemove: () => onRemoveFilter('search' as keyof LeadsFilters) })

    if (chips.length === 0) return null

    return (
        <div className="flex flex-wrap items-center gap-2">
            {chips.map((chip, idx) => (
                <span
                    key={idx}
                    className="inline-flex items-center gap-1 pl-2.5 pr-1.5 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-medium border border-blue-200"
                >
                    {chip.label}
                    <button onClick={chip.onRemove} className="hover:bg-blue-100 rounded-full p-0.5">
                        <X className="h-3 w-3" />
                    </button>
                </span>
            ))}
            <button onClick={onClearAll} className="text-xs text-gray-500 hover:text-gray-700 underline">
                Limpar todos
            </button>
        </div>
    )
}
