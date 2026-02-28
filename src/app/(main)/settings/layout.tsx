import { Metadata } from 'next'
import { SettingsSidebar } from '@/components/settings/SettingsSidebar'

export const metadata: Metadata = {
    title: 'Configurações | CRM',
    description: 'Gerencie suas configurações de organização, integrações e agentes.',
}

export default function SettingsLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="flex flex-col md:flex-row min-h-[calc(100vh-64px)] w-full bg-slate-50">
            {/* Sidebar Wrapper */}
            <aside className="w-full md:w-[220px] md:shrink-0 md:border-r bg-white p-4">
                <h2 className="text-lg font-semibold mb-6 hidden md:block text-gray-900">Configurações</h2>
                <SettingsSidebar />
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 w-full bg-slate-50 min-h-full">
                <div className="h-full px-4 py-6 md:p-8 max-w-5xl">
                    {children}
                </div>
            </main>
        </div>
    )
}
