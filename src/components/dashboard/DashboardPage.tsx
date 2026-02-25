'use client'

import { DashboardPeriodFilter } from './DashboardPeriodFilter'
import { KpiCards } from './KpiCards'
import { DashboardFunnelChart } from './DashboardFunnelChart'
import { DashboardLeadsOverTime } from './DashboardLeadsOverTime'
import { DashboardTagDistribution } from './DashboardTagDistribution'
import { DashboardWhatsAppMetrics, DashboardAttentionLeads } from './DashboardWhatsAppMetrics'
import { DashboardTeamPerformance } from './DashboardTeamPerformance'
import { DashboardActivityFeed } from './DashboardActivityFeed'
import { usePeriodFilter } from '@/hooks/dashboard/usePeriodFilter'
import { useDashboardMetrics } from '@/hooks/dashboard/useDashboardMetrics'

export function DashboardPage() {
    const { dateFrom, dateTo } = usePeriodFilter()
    const { data: metrics, isLoading, isFetching, refetch, isError, error } = useDashboardMetrics(dateFrom, dateTo)

    if (isError) {
        return (
            <div className="flex-1 p-8 text-red-500 bg-red-50">
                <h2 className="text-xl font-bold mb-2">Erro ao carregar Dashboard</h2>
                <p>{error instanceof Error ? error.message : String(error)}</p>
                <p className="mt-4 text-sm text-gray-700">Verifique se as funções SQL foram criadas corretamente no Supabase.</p>
            </div>
        )
    }

    return (
        <div className="flex-1 space-y-6 p-6 sm:p-8 bg-gray-50/50 min-h-full">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-gray-900">Dashboard</h1>
                    <p className="text-sm text-gray-500 mt-1">Visão geral do seu funil e atendimento.</p>
                </div>

                <DashboardPeriodFilter onRefresh={refetch} isRefreshing={isFetching} />
            </div>

            <KpiCards metrics={metrics} isLoading={isLoading} />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <DashboardFunnelChart data={metrics?.funil} isLoading={isLoading} />
                <DashboardLeadsOverTime data={metrics?.leads_por_dia} isLoading={isLoading} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <DashboardWhatsAppMetrics metrics={metrics} isLoading={isLoading} />
                <DashboardTagDistribution data={metrics?.leads_por_tag} isLoading={isLoading} />
            </div>

            <div className="grid grid-cols-1 gap-6">
                <DashboardTeamPerformance dateFrom={dateFrom} dateTo={dateTo} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-10">
                <DashboardAttentionLeads metrics={metrics} isLoading={isLoading} />
                <DashboardActivityFeed />
            </div>
        </div>
    )
}
