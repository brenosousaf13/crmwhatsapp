import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import { DashboardMetrics } from '@/hooks/dashboard/useDashboardMetrics'

export function DashboardTagDistribution({ data, isLoading }: { data?: DashboardMetrics['leads_por_tag'], isLoading: boolean }) {
    if (isLoading || !data) {
        return <div className="h-[350px] w-full bg-white rounded-xl border border-gray-200 animate-pulse" />
    }

    if (data.length === 0) {
        return (
            <div className="h-[350px] bg-white border border-gray-200 rounded-xl p-5 flex flex-col items-center justify-center text-center">
                <h3 className="font-semibold text-gray-900 mb-2">Distribuição por Tags</h3>
                <p className="text-sm text-gray-500 max-w-[250px]">Nenhuma tag aplicada neste período. Adicione tags aos seus leads para ver esta métrica.</p>
            </div>
        )
    }

    const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16']

    return (
        <div className="h-[350px] bg-white border border-gray-200 rounded-xl p-5 flex flex-col">
            <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-gray-900">Leads por Tag</h3>
            </div>

            <div className="flex-1 flex items-center">
                <div className="w-1/2 h-full relative">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={data}
                                cx="50%"
                                cy="50%"
                                innerRadius={65}
                                outerRadius={90}
                                paddingAngle={2}
                                dataKey="total"
                                stroke="none"
                            >
                                {data.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.cor || COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip
                                content={({ active, payload }) => {
                                    if (active && payload && payload.length) {
                                        return (
                                            <div className="bg-white border border-gray-100 shadow-lg rounded-lg py-2 px-3 text-sm flex items-center gap-2">
                                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: payload[0].payload.cor || COLORS[0] }} />
                                                <span className="font-medium text-gray-700">{payload[0].payload.nome}:</span>
                                                <span className="font-bold text-gray-900">{payload[0].value}</span>
                                            </div>
                                        )
                                    }
                                    return null;
                                }}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                </div>

                <div className="w-1/2 pl-4 flex flex-col justify-center gap-3 overflow-y-auto max-h-[220px] custom-scrollbar">
                    {data.map((entry, index) => (
                        <div key={index} className="flex items-center justify-between text-sm px-2 py-1 hover:bg-gray-50 rounded-md transition-colors">
                            <div className="flex items-center gap-2 overflow-hidden">
                                <div
                                    className="w-3 h-3 rounded-full shrink-0"
                                    style={{ backgroundColor: entry.cor || COLORS[index % COLORS.length] }}
                                />
                                <span className="text-gray-600 font-medium truncate">{entry.nome}</span>
                            </div>
                            <span className="font-bold text-gray-900 ml-2">{entry.total}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
