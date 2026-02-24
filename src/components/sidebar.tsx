'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
    LayoutDashboard,
    CheckSquare,
    Users,
    MessageCircle,
    Settings,
    HelpCircle,
    ChevronDown,
    LogOut
} from 'lucide-react'
import { useOrganization } from '@/components/providers/organization-provider'
import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'

export function Sidebar() {
    const pathname = usePathname()
    const router = useRouter()
    const { organization } = useOrganization()
    const supabase = createClient()
    const [user, setUser] = useState<User | null>(null)

    useEffect(() => {
        const fetchUser = async () => {
            const { data } = await supabase.auth.getUser()
            setUser(data.user)
        }
        fetchUser()
    }, [supabase.auth])

    const handleLogout = async () => {
        await supabase.auth.signOut()
        router.push('/login')
        router.refresh()
    }

    const navItems = [
        { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
        { name: 'Kanban', href: '/kanban', icon: CheckSquare },
        { name: 'Leads', href: '/leads', icon: Users },
        { name: 'Chat', href: '/chat', icon: MessageCircle },
    ]

    const settingsItems = [
        { name: 'Geral', href: '/settings', icon: Settings },
        { name: 'Equipe', href: '/settings/team', icon: Users },
        { name: 'Integrações', href: '/settings/integrations', icon: Settings },
    ]

    const userInitial = user?.user_metadata?.name?.charAt(0) || user?.email?.charAt(0) || 'U'
    const userName = user?.user_metadata?.name || 'Usuário Logado'

    return (
        <aside className="fixed left-0 top-0 z-40 h-screen w-[240px] flex flex-col bg-[#1B1F3B] text-[#8B8FA3]">
            {/* Sidebar Header / Logo */}
            <div className="flex items-center gap-3 px-4 py-6 border-b border-white/10">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-500 text-white font-bold">
                    {organization?.nome?.charAt(0) || 'C'}
                </div>
                <div className="flex flex-1 items-center justify-between">
                    <span className="font-semibold text-white truncate max-w-[140px]">
                        {organization?.nome || 'Carregando...'}
                    </span>
                    <ChevronDown className="h-4 w-4" />
                </div>
            </div>

            {/* Navigation */}
            <div className="flex-1 overflow-y-auto py-4 px-4">
                <nav className="space-y-3">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${isActive
                                    ? 'bg-blue-600 text-white'
                                    : 'hover:bg-[#232847] hover:text-white'
                                    }`}
                            >
                                <item.icon className="h-[18px] w-[18px]" />
                                {item.name}
                            </Link>
                        )
                    })}

                    <div className="mt-8 mb-4">
                        <p className="px-3 text-[11px] font-semibold uppercase tracking-wider text-[#6B7280]">
                            Configurações
                        </p>
                    </div>

                    {settingsItems.map((item) => {
                        const isActive = pathname === item.href
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${isActive
                                    ? 'bg-blue-600 text-white'
                                    : 'hover:bg-[#232847] hover:text-white'
                                    }`}
                            >
                                <item.icon className="h-[18px] w-[18px]" />
                                {item.name}
                            </Link>
                        )
                    })}
                </nav>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-white/10">
                <Link
                    href="#"
                    className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium hover:bg-[#232847] hover:text-white mb-4"
                >
                    <HelpCircle className="h-[18px] w-[18px]" />
                    Help and Support
                </Link>
                <div
                    onClick={handleLogout}
                    title="Sair da aplicação"
                    className="flex items-center gap-3 px-3 py-2 bg-[#232847] rounded-lg cursor-pointer hover:bg-gray-800 transition-colors group"
                >
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-500 text-white uppercase font-bold text-sm">
                        {userInitial.toUpperCase()}
                    </div>
                    <div className="flex-1 overflow-hidden">
                        <p className="truncate text-sm font-medium text-white group-hover:text-red-400 transition-colors flex items-center justify-between">
                            {userName}
                            <LogOut className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </p>
                        <p className="truncate text-xs text-[#8B8FA3]">{user?.email || 'Carregando...'}</p>
                    </div>
                </div>
            </div>
        </aside>
    )
}
