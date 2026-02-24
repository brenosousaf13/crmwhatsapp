import { DashboardMetrics } from '@/hooks/dashboard/useDashboardMetrics'
import { MessageSquare, ArrowDownLeft, ArrowUpRight, Clock, UserX } from 'lucide-react'

export function DashboardWhatsAppMetrics({ metrics, isLoading }: { metrics?: DashboardMetrics | null, isLoading: boolean }) {
    if (isLoading || !metrics) {
        return <div className="h-[350px] w-full bg-white rounded-xl border border-gray-200 animate-pulse" />
    }

    // Calcula balanço
    const recebidas = metrics.mensagens_recebidas
    const enviadas = metrics.mensagens_enviadas
    const total = metrics.total_mensagens

    const percRecebidas = total > 0 ? ((recebidas / total) * 100).toFixed(0) : '0'
    const percEnviadas = total > 0 ? ((enviadas / total) * 100).toFixed(0) : '0'

    return (
        <div className="h-[350px] bg-white border border-gray-200 rounded-xl p-5 flex flex-col">
            <div className="flex items-center justify-between mb-6">
                <h3 className="font-semibold text-gray-900">Métricas do WhatsApp</h3>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-8">
                <div className="bg-gray-50 rounded-lg p-4 text-center border border-gray-100">
                    <MessageSquare className="h-5 w-5 text-gray-500 mx-auto mb-2" />
                    <p className="text-sm text-gray-500 font-medium">Total</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{total}</p>
                </div>
                <div className="bg-emerald-50 rounded-lg p-4 text-center border border-emerald-100">
                    <ArrowDownLeft className="h-5 w-5 text-emerald-600 mx-auto mb-2" />
                    <p className="text-sm text-emerald-700 font-medium">Recebidas</p>
                    <p className="text-2xl font-bold text-emerald-800 mt-1">{recebidas}</p>
                </div>
                <div className="bg-blue-50 rounded-lg p-4 text-center border border-blue-100">
                    <ArrowUpRight className="h-5 w-5 text-blue-600 mx-auto mb-2" />
                    <p className="text-sm text-blue-700 font-medium">Enviadas</p>
                    <p className="text-2xl font-bold text-blue-800 mt-1">{enviadas}</p>
                </div>
            </div>

            {total > 0 && (
                <div className="mb-8">
                    <div className="flex items-center justify-between text-xs font-medium text-gray-500 mb-2">
                        <span>Recebidas ({percRecebidas}%)</span>
                        <span>Enviadas ({percEnviadas}%)</span>
                    </div>
                    <div className="h-4 w-full bg-gray-100 rounded-full flex overflow-hidden">
                        <div style={{ width: `${percRecebidas}%` }} className="bg-emerald-500 h-full transition-all duration-500" />
                        <div style={{ width: `${percEnviadas}%` }} className="bg-blue-500 h-full transition-all duration-500" />
                    </div>
                </div>
            )}
        </div>
    )
}

export function DashboardAttentionLeads({ metrics, isLoading }: { metrics?: DashboardMetrics | null, isLoading: boolean }) {
    if (isLoading || !metrics) {
        return <div className="h-[400px] w-full bg-white rounded-xl border border-gray-200 animate-pulse" />
    }

    return (
        <div className="h-[400px] bg-white border border-gray-200 rounded-xl p-5 flex flex-col">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-900">Atenção Necessária</h3>
                    <span className="bg-red-100 text-red-700 text-xs font-bold px-2 py-0.5 rounded-full">Urgent</span>
                </div>
            </div>

            <div className="space-y-4 flex-1">
                <div className="bg-orange-50 border border-orange-100 rounded-lg p-4 flex items-start gap-3">
                    <div className="bg-orange-100 p-2 rounded-full shrink-0">
                        <Clock className="w-5 h-5 text-orange-600" />
                    </div>
                    <div>
                        <h4 className="font-semibold text-orange-900">Leads aguardando resposta</h4>
                        <p className="text-sm text-orange-700 mt-1">
                            Você tem <span className="font-bold">{metrics.leads_sem_resposta}</span> leads com mensagens não lidas há mais de 30 minutos.
                        </p>
                    </div>
                </div>

                <div className="bg-red-50 border border-red-100 rounded-lg p-4 flex items-start gap-3">
                    <div className="bg-red-100 p-2 rounded-full shrink-0">
                        <UserX className="w-5 h-5 text-red-600" />
                    </div>
                    <div>
                        <h4 className="font-semibold text-red-900">Leads sem atendente</h4>
                        <p className="text-sm text-red-700 mt-1">
                            Existem <span className="font-bold">{metrics.leads_sem_atendente}</span> leads aguardando na fila sem um responsável atribuído.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
