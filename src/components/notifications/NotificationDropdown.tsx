import * as React from 'react'
import { Bell, Check } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'

import { Button } from '@/components/ui/button'
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { cn } from '@/lib/utils'

interface Notification {
    id: string
    tipo: string
    titulo: string
    descricao: string
    link: string
    lida: boolean
    criado_em: string
}

export function NotificationDropdown() {
    const queryClient = useQueryClient()
    const [open, setOpen] = React.useState(false)

    const { data, isLoading } = useQuery<{ notifications: Notification[], unread_count: number }>({
        queryKey: ['notifications'],
        queryFn: async () => {
            const res = await fetch('/api/notifications?limit=30')
            if (!res.ok) throw new Error('Falha ao buscar notificações')
            return res.json()
        },
        refetchInterval: 30000 // Refetch a cada 30 segundos
    })

    // Mutations
    const markAsReadMutation = useMutation({
        mutationFn: async (id: string) => {
            const res = await fetch('/api/notifications', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id })
            })
            if (!res.ok) throw new Error('Falha ao atualizar notificação')
            return res.json()
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] })
        }
    })

    const markAllAsReadMutation = useMutation({
        mutationFn: async () => {
            const res = await fetch('/api/notifications', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ read_all: true })
            })
            if (!res.ok) throw new Error('Falha ao atualizar notificações')
            return res.json()
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] })
        }
    })

    const notifications = data?.notifications || []
    const unreadCount = data?.unread_count || 0

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative h-9 w-9 text-[#6B7280] hover:bg-[#F3F4F6] hover:text-[#111827]">
                    <Bell className="h-[18px] w-[18px]" strokeWidth={1.5} />
                    {unreadCount > 0 && (
                        <span className="absolute top-1.5 right-1.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[#EF4444] px-1 text-[10px] font-bold text-white shadow-sm ring-2 ring-white">
                            {unreadCount > 99 ? '99+' : unreadCount}
                        </span>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0 shadow-[0_4px_16px_rgba(0,0,0,0.08)] border-[#E5E7EB] rounded-[8px]" align="end">
                <div className="flex items-center justify-between border-b border-[#E5E7EB] px-4 py-3">
                    <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-[14px] text-[#111827]">Notificações</h4>
                        {unreadCount > 0 && <Badge variant="secondary" className="px-1.5 py-0 text-xs bg-[#F3F4F6] text-[#374151] font-medium rounded-[6px]">{unreadCount}</Badge>}
                    </div>
                    {unreadCount > 0 && (
                        <Button
                            variant="ghost"
                            className="h-auto p-1 text-[12px] text-[#6B7280] hover:text-[#111827]"
                            onClick={() => markAllAsReadMutation.mutate()}
                            disabled={markAllAsReadMutation.isPending}
                        >
                            <Check className="h-3 w-3 mr-1" /> Marcar lidas
                        </Button>
                    )}
                </div>

                <ScrollArea className="h-[360px]">
                    {isLoading ? (
                        <div className="p-4 text-center text-[13px] text-[#6B7280]">Carregando...</div>
                    ) : notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full p-6 text-center text-[#6B7280] space-y-3">
                            <Bell className="h-10 w-10 text-[#D1D5DB]" strokeWidth={1} />
                            <div className="space-y-1">
                                <p className="font-medium text-[14px] text-[#374151]">Tudo tranquilo por aqui</p>
                                <p className="text-[13px]">Você não tem novas notificações.</p>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col">
                            {notifications.map((notif) => (
                                <div
                                    key={notif.id}
                                    className={cn(
                                        "relative flex flex-col gap-1 border-b border-[#F3F4F6] p-4 hover:bg-[#F9FAFB] transition-colors",
                                        !notif.lida && "bg-[#F0FDF4]/30"
                                    )}
                                >
                                    {!notif.lida && (
                                        <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-[#16A34A] rounded-r-md" />
                                    )}
                                    <div className="flex items-start justify-between gap-2">
                                        <p className={cn("text-[13px] font-medium line-clamp-2", !notif.lida ? "text-[#111827]" : "text-[#374151]")}>
                                            {notif.titulo}
                                        </p>
                                        <span className="text-[11px] text-[#9CA3AF] whitespace-nowrap shrink-0">
                                            {formatDistanceToNow(new Date(notif.criado_em), { addSuffix: true, locale: ptBR })}
                                        </span>
                                    </div>
                                    <p className="text-[13px] text-[#6B7280] line-clamp-2 mt-0.5">
                                        {notif.descricao}
                                    </p>

                                    <div className="flex items-center gap-3 mt-2">
                                        {notif.link && (
                                            <Link
                                                href={notif.link}
                                                onClick={() => {
                                                    if (!notif.lida) markAsReadMutation.mutate(notif.id)
                                                    setOpen(false)
                                                }}
                                                className="text-[#2563EB] text-[12px] font-medium hover:underline"
                                            >
                                                Visualizar
                                            </Link>
                                        )}
                                        {!notif.lida && (
                                            <button
                                                onClick={() => markAsReadMutation.mutate(notif.id)}
                                                className="text-[#6B7280] text-[12px] font-medium hover:text-[#111827]"
                                            >
                                                Marcar como lida
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </ScrollArea>

                {notifications.length > 0 && (
                    <div className="p-2 border-t border-[#E5E7EB] bg-[#FAFAFA]">
                        <Button variant="ghost" className="w-full text-[13px] h-8 text-[#374151] hover:text-[#111827] hover:bg-[#F3F4F6]">
                            Ver todas (Em breve)
                        </Button>
                    </div>
                )}
            </PopoverContent>
        </Popover>
    )
}
