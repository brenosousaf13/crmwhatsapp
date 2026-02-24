'use client'

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { CalendarIcon, RefreshCw } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useState, useEffect } from 'react'
import { usePeriodFilter, PeriodOption } from '@/hooks/dashboard/usePeriodFilter'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function DashboardPeriodFilter({ onRefresh, isRefreshing }: { onRefresh?: () => void, isRefreshing?: boolean }) {
    const { currentPeriod, setPeriod, dateFrom, dateTo } = usePeriodFilter()
    const [isCustomOpen, setIsCustomOpen] = useState(false)
    const [customFrom, setCustomFrom] = useState(format(dateFrom, 'yyyy-MM-dd'))
    const [customTo, setCustomTo] = useState(format(dateTo, 'yyyy-MM-dd'))

    // Sincroniza estado com as props quando mudam via navegacao
    useEffect(() => {
        setCustomFrom(format(dateFrom, 'yyyy-MM-dd'))
        setCustomTo(format(dateTo, 'yyyy-MM-dd'))
    }, [dateFrom, dateTo])

    const handleSelect = (value: PeriodOption) => {
        if (value === 'personalizado') {
            setIsCustomOpen(true)
        } else {
            setIsCustomOpen(false)
            setPeriod(value)
        }
    }

    const applyCustomPeriod = () => {
        setPeriod('personalizado', { de: customFrom, ate: customTo })
        setIsCustomOpen(false)
    }

    const formatDisplayDate = () => {
        // Exibir sempre os ultimos nn dias de forma customizada se fora dos presets
        if (currentPeriod !== 'personalizado') {
            const labels: Record<string, string> = {
                hoje: 'Hoje',
                '7d': 'Últimos 7 dias',
                '30d': 'Últimos 30 dias',
                '90d': 'Últimos 90 dias',
                este_mes: 'Este mês',
                mes_passado: 'Mês passado'
            }
            return labels[currentPeriod] || 'Últimos 30 dias'
        }

        return `${format(dateFrom, "dd MMM", { locale: ptBR })} - ${format(dateTo, "dd MMM", { locale: ptBR })}`
    }

    return (
        <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-500 hidden sm:inline-block">Período:</span>

                <Popover open={isCustomOpen} onOpenChange={setIsCustomOpen}>
                    <PopoverTrigger asChild>
                        <Button variant="outline" className="w-[180px] justify-between text-left font-normal bg-white">
                            <span className="truncate">{formatDisplayDate()}</span>
                            <CalendarIcon className="mr-2 h-4 w-4 opacity-50" />
                        </Button>
                    </PopoverTrigger>

                    <PopoverContent className="w-80 p-0" align="end">
                        <div className="p-3">
                            <Select value={currentPeriod === 'personalizado' ? '' : currentPeriod} onValueChange={handleSelect}>
                                <SelectTrigger className="w-full mb-3">
                                    <SelectValue placeholder="Selecione um período rápido..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="hoje">Hoje</SelectItem>
                                    <SelectItem value="7d">Últimos 7 dias</SelectItem>
                                    <SelectItem value="30d">Últimos 30 dias</SelectItem>
                                    <SelectItem value="90d">Últimos 90 dias</SelectItem>
                                    <SelectItem value="este_mes">Este mês</SelectItem>
                                    <SelectItem value="mes_passado">Mês passado</SelectItem>
                                    <SelectItem value="personalizado">Personalizado...</SelectItem>
                                </SelectContent>
                            </Select>

                            {currentPeriod === 'personalizado' || isCustomOpen ? (
                                <div className="space-y-4 pt-4 border-t border-gray-100">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="date-from" className="text-xs text-gray-500">Data Inicial</Label>
                                            <Input
                                                id="date-from"
                                                type="date"
                                                value={customFrom}
                                                onChange={(e) => setCustomFrom(e.target.value)}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="date-to" className="text-xs text-gray-500">Data Final</Label>
                                            <Input
                                                id="date-to"
                                                type="date"
                                                value={customTo}
                                                onChange={(e) => setCustomTo(e.target.value)}
                                                max={format(new Date(), 'yyyy-MM-dd')}
                                            />
                                        </div>
                                    </div>

                                    <Button onClick={applyCustomPeriod} className="w-full">
                                        Aplicar Período
                                    </Button>
                                </div>
                            ) : null}
                        </div>
                    </PopoverContent>
                </Popover>

            </div>

            <Button
                variant="outline"
                size="icon"
                onClick={onRefresh}
                disabled={isRefreshing}
                className="bg-white shrink-0"
                title="Atualizar dados"
            >
                <RefreshCw className={cn("h-4 w-4 text-gray-500", isRefreshing && "animate-spin text-blue-500")} />
            </Button>
        </div>
    )
}
