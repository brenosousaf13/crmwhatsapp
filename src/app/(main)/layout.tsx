import { OrganizationProvider } from '@/components/providers/organization-provider'
import { QueryProvider } from '@/components/providers/query-provider'
import { Sidebar } from '@/components/sidebar'
import { Header } from '@/components/header'
import { Toaster } from 'sonner'

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <QueryProvider>
            <OrganizationProvider>
                <div className="flex h-screen w-full bg-[#F8F9FB] overflow-hidden">
                    <Sidebar />
                    <div className="flex flex-1 flex-col min-w-0 overflow-y-auto">
                        <Header />
                        <main className="flex-1 p-6 flex flex-col min-h-[calc(100vh-4rem)]">
                            {children}
                        </main>
                    </div>
                </div>
                <Toaster richColors position="top-right" />
            </OrganizationProvider>
        </QueryProvider>
    )
}

