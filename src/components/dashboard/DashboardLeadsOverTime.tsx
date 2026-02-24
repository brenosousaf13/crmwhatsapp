import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { DashboardMetrics } from '@/hooks/dashboard/useDashboardMetrics'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export function DashboardLeadsOverTime({ data, isLoading }: { data?: DashboardMetrics['leads_por_dia'], isLoading: boolean }) {
    if (isLoading || !data) {
        return <div className="h-[400px] w-full bg-white rounded-xl border border-gray-200 animate-pulse" />
    }

    const formattedData = data.map(d => ({
        ...d,
        displayDate: format(parseISO(d.data), "dd/MMM", { locale: ptBR })
    }))

    const totalNovos = data.reduce((acc, curr) => acc + curr.total, 0)

    return (
        <div className="h-[400px] bg-white border border-gray-200 rounded-xl p-5 flex flex-col">
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">Leads ao Longo do Tempo</h3>
            </div>

            <div className="flex-1 min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={formattedData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                        <XAxis
                            dataKey="displayDate"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 12, fill: '#9CA3AF' }}
                            dy={10}
                        />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 12, fill: '#9CA3AF' }}
                        />
                        <Tooltip
                            cursor={{ fill: '#F9FAFB' }}
                            content={({ active, payload }) => {
                                if (active && payload && payload.length) {
                                    return (
                                        <div className="bg-white border border-gray-100 shadow-lg rounded-lg p-3 text-sm">
                                            <p className="font-medium text-gray-500 mb-1">{payload[0].payload.displayDate}</p>
                                            <p className="font-semibold text-indigo-600">{payload[0].value} novos leads</p>
                                        </div>
                                    )
                                }
                                return null;
                            }}
                        />
                        <Bar
                            dataKey="total"
                            fill="#6366F1" // Indigo 500
                            radius={[4, 4, 0, 0]}
                            maxBarSize={40}
                        />
                    </BarChart>
                </ResponsiveContainer>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-center gap-6 text-sm">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-indigo-500" />
                    <span className="text-gray-600">Criados no período: <span className="font-bold text-gray-900">{totalNovos}</span></span>
                </div>
            </div>
        </div>
    )
}
