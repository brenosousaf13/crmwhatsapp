'use client'

import { BarChart3, MessageCircleWarning, Flame } from 'lucide-react'

// Dummy data for now, will be fetched via React Query later
const metrics = {
    activeLeads: 30,
    waitingResponse: 8,
    hotDeals: 3,
}

export function KanbanMetrics() {
    return (
        <div className="flex items-center gap-4 mb-6">
            <div className="flex items-center gap-3 bg-white px-5 py-3 rounded-lg border border-gray-200 shadow-sm flex-1 md:flex-none">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                    <BarChart3 className="h-5 w-5" />
                </div>
                <div>
                    <p className="text-2xl font-bold text-gray-900">{metrics.activeLeads}</p>
                    <p className="text-sm font-medium text-gray-500">Leads ativos</p>
                </div>
            </div>

            <div className="flex items-center gap-3 bg-white px-5 py-3 rounded-lg border border-gray-200 shadow-sm flex-1 md:flex-none">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-50 text-amber-500">
                    <MessageCircleWarning className="h-5 w-5" />
                </div>
                <div>
                    <p className="text-2xl font-bold text-gray-900">{metrics.waitingResponse}</p>
                    <p className="text-sm font-medium text-gray-500">Aguardando resposta</p>
                </div>
            </div>

            <div className="flex items-center gap-3 bg-white px-5 py-3 rounded-lg border border-gray-200 shadow-sm flex-1 md:flex-none">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-50 text-red-500">
                    <Flame className="h-5 w-5" />
                </div>
                <div>
                    <p className="text-2xl font-bold text-gray-900">{metrics.hotDeals}</p>
                    <p className="text-sm font-medium text-gray-500">Quentes</p>
                </div>
            </div>
        </div>
    )
}
