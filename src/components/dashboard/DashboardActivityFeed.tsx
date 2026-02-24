import { AlertCircle } from 'lucide-react'

// Placeholder activity feed just resolving to a UI block.
// A full activity feed with real-time websocket connections to events requires dedicated hooks in the future.
export function DashboardActivityFeed() {
    return (
        <div className="h-[400px] bg-white border border-gray-200 rounded-xl p-5 flex flex-col">
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">Feed de Atividades</h3>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                <div className="flex flex-col items-center justify-center h-full text-center p-6 text-gray-400">
                    <AlertCircle className="w-8 h-8 mb-3 opacity-20" />
                    <p className="text-sm">O feed de atividades em tempo real está sendo configurado.</p>
                </div>
            </div>
        </div>
    )
}
