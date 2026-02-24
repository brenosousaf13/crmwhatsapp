'use client'

import { DashboardMetrics } from '@/hooks/dashboard/useDashboardMetrics'
import { Filter, Users, Trophy, DollarSign, Zap } from 'lucide-react'

// Util helper to format currency
const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

// Util helper to calculate difference and percentage
const calculateChange = (current: number, previous: number) => {
    if (previous === 0) {
        if (current === 0) return { percent: 0, raw: 0, isPositive: true }
        return { percent: 100, raw: current, isPositive: true }
    }
    const diff = current - previous
    const percent = (diff / previous) * 100
    return { percent, raw: diff, isPositive: diff >= 0 }
}

export function KpiCards({ metrics, isLoading }: { metrics?: DashboardMetrics | null, isLoading: boolean }) {
    if (isLoading || !metrics) {
        return (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                {[1, 2, 3, 4, 5].map(i => (
                    <div key={i} className="h-[120px] bg-white rounded-xl border border-gray-200 animate-pulse" />
                ))}
            </div>
        )
    }

    // Calcular variacoes para os cards que pediram comparacao
    const novosChange = calculateChange(metrics.novos_periodo, metrics.novos_periodo_anterior)
    const receitaChange = calculateChange(metrics.receita_periodo, metrics.receita_periodo_anterior)

    // Conversões e taxa de conversao proativamente
    const convRate = metrics.total_leads > 0
        ? ((metrics.conversoes_periodo / metrics.total_leads) * 100).toFixed(1)
        : '0.0'

    // Tempo Medio de resposta
    // Atualmente estamos aguardando implementação futura na API pra calcular preciso
    // Por enquanto, faremos placeholder do design
    const avgResponseTimeMin = 8

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Total Leads */}
            <div className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow cursor-pointer">
                <div className="flex items-start justify-between">
                    <div>
                        <p className="text-[13px] font-medium text-gray-500">Total Leads</p>
                        <h3 className="text-[28px] font-bold text-gray-900 mt-1 leading-none">{metrics.total_leads}</h3>
                    </div>
                    <div className="h-10 w-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                        <Filter className="h-5 w-5" />
                    </div>
                </div>
                <div className="mt-4 flex items-center gap-1.5 text-xs">
                    <span className="text-gray-500">Ativos na organização</span>
                </div>
            </div>

            {/* Novos Leads */}
            <div className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow cursor-pointer">
                <div className="flex items-start justify-between">
                    <div>
                        <p className="text-[13px] font-medium text-gray-500">Novos no Período</p>
                        <h3 className="text-[28px] font-bold text-gray-900 mt-1 leading-none">{metrics.novos_periodo}</h3>
                    </div>
                    <div className="h-10 w-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
                        <Users className="h-5 w-5" />
                    </div>
                </div>
                <div className="mt-4 flex items-center gap-1.5 text-xs">
                    <span className={`font-medium flex items-center ${novosChange.isPositive ? 'text-green-600' : 'text-red-600'}`}>
                        {novosChange.isPositive ? '↑' : '↓'} {Math.abs(novosChange.percent).toFixed(1)}%
                    </span>
                    <span className="text-gray-500">vs. período ant.</span>
                </div>
            </div>

            {/* Conversoes */}
            <div className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow cursor-pointer">
                <div className="flex items-start justify-between">
                    <div>
                        <p className="text-[13px] font-medium text-gray-500">Conversões (Ganhos)</p>
                        <h3 className="text-[28px] font-bold text-gray-900 mt-1 leading-none">{metrics.conversoes_periodo}</h3>
                    </div>
                    <div className="h-10 w-10 rounded-full bg-amber-50 flex items-center justify-center text-amber-500 shrink-0">
                        <Trophy className="h-5 w-5" />
                    </div>
                </div>
                <div className="mt-4 flex items-center gap-1.5 text-xs">
                    <span className="font-medium text-gray-700">{convRate}%</span>
                    <span className="text-gray-500">taxa de conversão</span>
                </div>
            </div>

            {/* Receita */}
            <div className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow cursor-pointer">
                <div className="flex items-start justify-between">
                    <div>
                        <p className="text-[13px] font-medium text-gray-500">Receita</p>
                        <h3 className="text-[24px] font-bold text-gray-900 mt-2 leading-none">{formatCurrency(metrics.receita_periodo)}</h3>
                    </div>
                    <div className="h-10 w-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
                        <DollarSign className="h-5 w-5" />
                    </div>
                </div>
                <div className="mt-4 flex items-center gap-1.5 text-xs">
                    <span className={`font-medium flex items-center ${receitaChange.isPositive ? 'text-green-600' : 'text-red-600'}`}>
                        {receitaChange.isPositive ? '↑' : '↓'} {Math.abs(receitaChange.percent).toFixed(1)}%
                    </span>
                    <span className="text-gray-500">vs. período ant.</span>
                </div>
            </div>

            {/* Tempo de Resposta */}
            <div className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow cursor-pointer lg:col-span-1 sm:col-span-2">
                <div className="flex items-start justify-between">
                    <div>
                        <p className="text-[13px] font-medium text-gray-500">Atendimento</p>
                        <h3 className="text-[28px] font-bold text-gray-900 mt-1 leading-none">{avgResponseTimeMin} <span className="text-sm font-normal text-gray-500">min</span></h3>
                    </div>
                    <div className="h-10 w-10 rounded-full bg-orange-50 flex items-center justify-center text-orange-500 shrink-0">
                        <Zap className="h-5 w-5" />
                    </div>
                </div>
                <div className="mt-4 flex items-center gap-1.5 text-xs">
                    <span className="font-medium text-green-600 flex items-center gap-1">
                        ↓ -2min ✅
                    </span>
                    <span className="text-gray-500">tempo médio resp.</span>
                </div>
            </div>
        </div>
    )
}
