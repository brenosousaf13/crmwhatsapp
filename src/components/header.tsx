'use client'

import { Bell, HelpCircle, Search } from 'lucide-react'
import { usePathname } from 'next/navigation'

export function Header() {
    const pathname = usePathname()

    // Determine title based on current path
    let title = 'Dashboard'
    if (pathname?.startsWith('/kanban')) title = 'Kanban'
    else if (pathname?.startsWith('/leads')) title = 'Leads'
    else if (pathname?.startsWith('/chat')) title = 'Chat'
    else if (pathname?.startsWith('/settings')) title = 'Configurações'

    return (
        <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-gray-200 bg-white px-6">
            <div className="flex items-center gap-2">
                <h1 className="text-2xl font-semibold text-gray-900">{title}</h1>
            </div>

            <div className="flex items-center gap-4">
                {/* Search Input (Placeholder for layout) */}
                <div className="relative hidden md:block">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search..."
                        className="h-9 w-64 rounded-md border border-gray-200 pl-9 pr-4 text-sm outline-none placeholder:text-gray-400 focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                    />
                </div>

                <button className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-gray-100 text-gray-500">
                    <Bell className="h-5 w-5" />
                </button>

                <button className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-gray-100 text-gray-500">
                    <HelpCircle className="h-5 w-5" />
                </button>
            </div>
        </header>
    )
}
