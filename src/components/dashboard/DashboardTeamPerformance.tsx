import { useTeamPerformance } from '@/hooks/dashboard/useTeamPerformance'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

// Helper function definitions
const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

export function DashboardTeamPerformance({ dateFrom, dateTo }: { dateFrom: Date, dateTo: Date }) {
    const { data: teamData, isLoading } = useTeamPerformance(dateFrom, dateTo)

    if (isLoading) {
        return <div className="h-[350px] w-full bg-white rounded-xl border border-gray-200 animate-pulse" />
    }

    if (!teamData || teamData.length === 0) {
        return (
            <div className="h-[350px] bg-white border border-gray-200 rounded-xl p-5 flex flex-col items-center justify-center text-center">
                <h3 className="font-semibold text-gray-900 mb-2">Performance da Equipe</h3>
                <p className="text-sm text-gray-500 max-w-[250px]">Nenhum dado de equipe encontrado neste período.</p>
            </div>
        )
    }

    return (
        <div className="min-h-[350px] bg-white border border-gray-200 rounded-xl p-0 flex flex-col overflow-hidden shadow-sm">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">Performance por Atendente</h3>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-gray-50/50 text-xs uppercase text-gray-500 font-medium">
                            <th className="py-3 px-5 whitespace-nowrap">Posição</th>
                            <th className="py-3 px-5 whitespace-nowrap">Atendente</th>
                            <th className="py-3 px-5 whitespace-nowrap text-center">Leads Tratados</th>
                            <th className="py-3 px-5 whitespace-nowrap text-center">Ganhos</th>
                            <th className="py-3 px-5 whitespace-nowrap text-center">T. Conversão</th>
                            <th className="py-3 px-5 whitespace-nowrap text-right">Receita T.</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-sm">
                        {teamData.map((member, index) => {
                            const conversionRate = member.total_leads > 0
                                ? ((member.conversoes / member.total_leads) * 100).toFixed(1)
                                : '0.0'

                            const isTop3 = index < 3

                            return (
                                <tr key={member.atendente_id} className="hover:bg-gray-50 transition-colors">
                                    <td className="py-3 px-5">
                                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${index === 0 ? 'bg-amber-100 text-amber-700' :
                                                index === 1 ? 'bg-gray-200 text-gray-700' :
                                                    index === 2 ? 'bg-orange-100 text-orange-800' :
                                                        'bg-gray-100 text-gray-500'
                                            }`}>
                                            {index + 1}
                                        </div>
                                    </td>
                                    <td className="py-3 px-5">
                                        <div className="flex items-center gap-3">
                                            <Avatar className="h-8 w-8">
                                                <AvatarImage src={member.avatar_url || ''} />
                                                <AvatarFallback className="bg-indigo-100 text-indigo-700 text-xs">
                                                    {member.atendente_nome?.slice(0, 2).toUpperCase() || 'U'}
                                                </AvatarFallback>
                                            </Avatar>
                                            <span className={`font-medium ${isTop3 ? 'text-gray-900' : 'text-gray-700'}`}>
                                                {member.atendente_nome || 'Sem nome'}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="py-3 px-5 text-center text-gray-600">
                                        {member.total_leads}
                                    </td>
                                    <td className="py-3 px-5 text-center font-medium text-gray-900">
                                        {member.conversoes}
                                    </td>
                                    <td className="py-3 px-5 text-center">
                                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${parseFloat(conversionRate) > 20 ? 'bg-green-100 text-green-800' :
                                                parseFloat(conversionRate) > 10 ? 'bg-blue-100 text-blue-800' :
                                                    'bg-gray-100 text-gray-800'
                                            }`}>
                                            {conversionRate}%
                                        </span>
                                    </td>
                                    <td className="py-3 px-5 text-right font-medium text-emerald-600">
                                        {formatCurrency(member.receita)}
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
