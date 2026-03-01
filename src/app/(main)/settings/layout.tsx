import { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Configurações | CRM',
    description: 'Gerencie suas configurações de organização, integrações e agentes.',
}

export default function SettingsLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return <>{children}</>
}
