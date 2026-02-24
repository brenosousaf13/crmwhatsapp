import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { DashboardMetrics } from '@/hooks/dashboard/useDashboardMetrics'

export function DashboardFunnelChart({ data, isLoading }: { data?: DashboardMetrics['funil'], isLoading: boolean }) {
    if (isLoading || !data) {
        return <div className="h-[400px] w-full bg-white rounded-xl border border-gray-200 animate-pulse" />
    }

    const maxTotal = data.length > 0 ? data[0].total : 1
    const ganho = data.find(d => d.nome.toLowerCase().includes('ganho'))?.total || 0
    const conversionRate = maxTotal > 0 ? ((ganho / maxTotal) * 100).toFixed(1) : '0.0'

    return (
        <div className="h-[400px] bg-white border border-gray-200 rounded-xl p-5 flex flex-col">
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">Funil de Vendas</h3>
            </div>

            <div className="flex-1 min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        layout="vertical"
                        data={data}
                        margin={{ top: 0, right: 30, left: 0, bottom: 0 }}
                        barCategoryGap={12}
                    >
                        <XAxis type="number" hide />
                        <YAxis
                            type="category"
                            dataKey="nome"
                            axisLine={false}
                            tickLine={false}
                            width={130}
                            tick={{ fontSize: 13, fill: '#4B5563', fontWeight: 500 }}
                        />
                        <Tooltip
                            cursor={{ fill: 'transparent' }}
                            content={({ active, payload }) => {
                                if (active && payload && payload.length) {
                                    const stage = payload[0].payload;
                                    const percent = maxTotal > 0 ? ((stage.total / maxTotal) * 100).toFixed(1) : '0';
                                    return (
                                        <div className="bg-white border border-gray-200 shadow-lg rounded-lg p-3 text-sm z-50">
                                            <p className="font-semibold text-gray-900">{stage.nome}</p>
                                            <div className="flex items-center gap-4 mt-2">
                                                <span className="text-gray-600">Total: {stage.total}</span>
                                                <span className="text-indigo-600 font-medium">{percent}%</span>
                                            </div>
                                        </div>
                                    )
                                }
                                return null;
                            }}
                        />
                        <Bar dataKey="total" radius={[0, 4, 4, 0]} maxBarSize={32}>
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.cor || '#3b82f6'} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between text-sm">
                <span className="text-gray-500 font-medium">Taxa de conversão geral:</span>
                <span className="font-bold text-green-600 text-base">{conversionRate}%</span>
            </div>
        </div>
    )
}
