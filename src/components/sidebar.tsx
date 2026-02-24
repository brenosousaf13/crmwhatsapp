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
    LogOut,
    ChevronLeft,
    ChevronRight
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
    const [isCollapsed, setIsCollapsed] = useState(false)

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
        <aside
            className={`
                sticky top-0 h-screen flex-shrink-0 flex flex-col bg-[#1B1F3B] text-[#8B8FA3] 
                transition-all duration-300 ease-in-out z-40
                ${isCollapsed ? 'w-[80px]' : 'w-[240px]'}
            `}
        >
            {/* Sidebar Header / Logo */}
            <div className={`flex items-center px-4 py-6 border-b border-white/10 ${isCollapsed ? 'justify-center flex-col gap-4' : 'justify-between gap-3'}`}>
                <div className="flex items-center gap-3 overflow-hidden">
                    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-green-500 text-white font-bold">
                        {organization?.nome?.charAt(0) || 'C'}
                    </div>
                    {!isCollapsed && (
                        <span className="font-semibold text-white truncate max-w-[120px]">
                            {organization?.nome || 'Carregando...'}
                        </span>
                    )}
                </div>
                <button
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className="p-1 rounded-md hover:bg-[#232847] text-gray-400 hover:text-white transition-colors"
                >
                    {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
                </button>
            </div>

            {/* Navigation */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden py-4 px-3 custom-scrollbar">
                <nav className="space-y-2">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                title={isCollapsed ? item.name : undefined}
                                className={`flex items-center rounded-lg py-2.5 transition-colors ${isCollapsed ? 'justify-center px-0' : 'px-3 gap-3'
                                    } ${isActive
                                        ? 'bg-blue-600 text-white'
                                        : 'hover:bg-[#232847] hover:text-white'
                                    }`}
                            >
                                <item.icon className="h-[18px] w-[18px] flex-shrink-0" />
                                {!isCollapsed && (
                                    <span className="text-sm font-medium whitespace-nowrap overflow-hidden text-ellipsis">
                                        {item.name}
                                    </span>
                                )}
                            </Link>
                        )
                    })}

                    <div className={`mt-8 mb-4 ${isCollapsed ? 'px-0 text-center' : 'px-2'}`}>
                        {!isCollapsed ? (
                            <p className="text-[11px] font-semibold uppercase tracking-wider text-[#6B7280]">
                                Configurações
                            </p>
                        ) : (
                            <div className="h-px w-8 bg-white/10 mx-auto" />
                        )}
                    </div>

                    {settingsItems.map((item) => {
                        const isActive = pathname === item.href
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                title={isCollapsed ? item.name : undefined}
                                className={`flex items-center rounded-lg py-2.5 transition-colors ${isCollapsed ? 'justify-center px-0' : 'px-3 gap-3'
                                    } ${isActive
                                        ? 'bg-blue-600 text-white'
                                        : 'hover:bg-[#232847] hover:text-white'
                                    }`}
                            >
                                <item.icon className="h-[18px] w-[18px] flex-shrink-0" />
                                {!isCollapsed && (
                                    <span className="text-sm font-medium whitespace-nowrap overflow-hidden text-ellipsis">
                                        {item.name}
                                    </span>
                                )}
                            </Link>
                        )
                    })}
                </nav>
            </div>

            {/* Footer */}
            <div className="p-3 border-t border-white/10">
                <Link
                    href="#"
                    title={isCollapsed ? "Help and Support" : undefined}
                    className={`flex items-center rounded-lg py-2 text-sm font-medium hover:bg-[#232847] hover:text-white mb-3 ${isCollapsed ? 'justify-center px-0' : 'px-3 gap-3'
                        }`}
                >
                    <HelpCircle className="h-[18px] w-[18px] flex-shrink-0" />
                    {!isCollapsed && <span className="whitespace-nowrap overflow-hidden text-ellipsis">Suporte</span>}
                </Link>
                <div
                    onClick={handleLogout}
                    title="Sair da aplicação"
                    className={`flex items-center bg-[#232847] rounded-lg cursor-pointer hover:bg-gray-800 transition-colors group ${isCollapsed ? 'justify-center py-2' : 'px-3 py-2 gap-3'
                        }`}
                >
                    {isCollapsed ? (
                        <LogOut className="h-[18px] w-[18px] text-gray-400 group-hover:text-red-400 transition-colors flex-shrink-0" />
                    ) : (
                        <>
                            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-blue-500 text-white uppercase font-bold text-sm">
                                {userInitial.toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0 pr-1">
                                <p className="truncate text-sm font-medium text-white group-hover:text-red-400 transition-colors flex items-center justify-between">
                                    {userName}
                                    <LogOut className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                                </p>
                            </div>
                        </>
                    )}
                </div>
            </div>

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background-color: rgba(255, 255, 255, 0.1);
                    border-radius: 20px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background-color: rgba(255, 255, 255, 0.2);
                }
            `}</style>
        </aside>
    )
}
