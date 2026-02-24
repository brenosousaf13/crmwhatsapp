'use client'

import { useLeadsMetrics } from '@/hooks/leads/useLeadsMetrics'
import type { LeadsFilters } from '@/hooks/leads/useLeads'

interface LeadsMetricsProps {
    onFilterClick: (filter: Partial<LeadsFilters>) => void
}

export function LeadsMetrics({ onFilterClick }: LeadsMetricsProps) {
    const { data: metrics, isLoading } = useLeadsMetrics()

    const cards = [
        {
            label: 'Total',
            icon: '📊',
            value: metrics?.total || 0,
            weekDelta: metrics?.totalSemana || 0,
            onClick: () => onFilterClick({ etapas: [] }), // Limpar filtro de etapa = todos
        },
        {
            label: 'Ativos',
            icon: '🟢',
            value: metrics?.ativos || 0,
            weekDelta: metrics?.ativosSemana || 0,
            onClick: () => onFilterClick({ naoLidas: 'todos', temWhatsapp: 'todos' }), // Filtro genérico
        },
        {
            label: 'Negociando',
            icon: '🟡',
            value: metrics?.negociando || 0,
            weekDelta: metrics?.negociandoSemana || 0,
            onClick: () => { }, // Será implementado com etapa_id
        },
        {
            label: 'Ganhos',
            icon: '🏆',
            value: metrics?.ganhos || 0,
            weekDelta: metrics?.ganhosSemana || 0,
            onClick: () => { }, // Será implementado com etapa_id
        },
    ]

    if (isLoading) {
        return (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="bg-white rounded-xl border border-gray-200 p-4 animate-pulse">
                        <div className="h-4 bg-gray-200 rounded w-20 mb-3" />
                        <div className="h-7 bg-gray-200 rounded w-12 mb-2" />
                        <div className="h-3 bg-gray-200 rounded w-24" />
                    </div>
                ))}
            </div>
        )
    }

    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {cards.map((card) => (
                <button
                    key={card.label}
                    onClick={card.onClick}
                    className="bg-white rounded-xl border border-gray-200 p-4 text-left hover:shadow-sm transition-shadow"
                >
                    <p className="text-[13px] text-gray-500 flex items-center gap-1.5">
                        <span>{card.icon}</span> {card.label}
                    </p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{card.value}</p>
                    {card.weekDelta > 0 && (
                        <p className="text-xs text-green-600 mt-1">+{card.weekDelta} esta semana</p>
                    )}
                </button>
            ))}
        </div>
    )
}
