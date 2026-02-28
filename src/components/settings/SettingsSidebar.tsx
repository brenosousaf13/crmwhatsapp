'use client'

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
    Building2,
    LayoutList,
    Tag,
    MessageSquareQuote,
    Smartphone,
    Bot,
    Users
} from "lucide-react"
import { cn } from "@/lib/utils"

const SETTINGS_NAV = [
    { href: '/settings/organization', label: 'Organização', icon: Building2 },
    { href: '/settings/kanban-stages', label: 'Etapas do Kanban', icon: LayoutList },
    { href: '/settings/tags', label: 'Tags', icon: Tag },
    { href: '/settings/quick-replies', label: 'Respostas Rápidas', icon: MessageSquareQuote },
    { type: 'separator' },
    { href: '/settings/team', label: 'Equipe', icon: Users },
    { href: '/settings/integrations', label: 'WhatsApp', icon: Smartphone },
    { href: '/settings/ai', label: 'Agente IA', icon: Bot },
]

export function SettingsSidebar() {
    const pathname = usePathname()
    const router = useRouter()

    return (
        <div className="flex flex-col space-y-2">
            {/* Mobile Select Navigation */}
            <div className="md:hidden mb-4">
                <select
                    value={pathname}
                    onChange={(e) => router.push(e.target.value)}
                    className="w-full flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    {SETTINGS_NAV.map((item, index) => {
                        if (item.type === 'separator') {
                            return <option key={`sep-${index}`} disabled>──────────</option>
                        }
                        return (
                            <option key={item.href} value={item.href}>
                                {item.label}
                            </option>
                        )
                    })}
                </select>
            </div>

            {/* Desktop Sidebar Navigation */}
            <nav className="hidden md:flex flex-col space-y-1 w-[220px]">
                {SETTINGS_NAV.map((item, index) => {
                    if (item.type === 'separator') {
                        return <div key={`sep-${index}`} className="h-px bg-border my-2 mx-2" />
                    }

                    const isActive = pathname.startsWith(item.href!)

                    return (
                        <Link
                            key={item.href}
                            href={item.href!}
                            className={cn(
                                "flex items-center gap-3 px-4 py-2.5 rounded-md text-sm font-medium transition-colors",
                                isActive
                                    ? "bg-blue-50 text-blue-600"
                                    : "text-gray-700 hover:bg-gray-100"
                            )}
                        >
                            {item.icon && <item.icon className={cn("h-4 w-4", isActive ? "text-blue-600" : "text-gray-500")} />}
                            {item.label}
                        </Link>
                    )
                })}
            </nav>
        </div>
    )
}
