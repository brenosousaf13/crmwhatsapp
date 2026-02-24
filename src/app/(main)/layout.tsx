import { OrganizationProvider } from '@/components/providers/organization-provider'
import { QueryProvider } from '@/components/providers/query-provider'
import { Sidebar } from '@/components/sidebar'
import { Header } from '@/components/header'

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <QueryProvider>
            <OrganizationProvider>
                <div className="flex min-h-screen bg-[#F8F9FB]">
                    <Sidebar />
                    <div className="flex flex-1 flex-col ml-[240px] min-w-0">
                        <Header />
                        <main className="flex-1 p-6 h-[calc(100vh-4rem)] max-h-[calc(100vh-4rem)] overflow-hidden flex flex-col">
                            {children}
                        </main>
                    </div>
                </div>
            </OrganizationProvider>
        </QueryProvider>
    )
}

