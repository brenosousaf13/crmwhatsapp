import { Metadata } from 'next'
import { AiSettingsPage } from '@/components/ai/AiSettingsPage'

export const metadata: Metadata = {
    title: 'Configuração do Agente IA | CRM WhatsApp',
    description: 'Configure o atendente de inteligência artificial da sua operação',
}

export default function Page() {
    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Agente IA</h2>
            </div>
            <AiSettingsPage />
        </div>
    )
}
