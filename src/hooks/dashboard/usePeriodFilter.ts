import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useMemo } from 'react'
import { startOfDay, startOfMonth, subDays, subMonths, endOfMonth, endOfDay } from 'date-fns'

export type PeriodOption = 'hoje' | '7d' | '30d' | '90d' | 'este_mes' | 'mes_passado' | 'personalizado'

export function usePeriodFilter() {
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()

    const periodParam = searchParams.get('periodo') as PeriodOption | null
    const deParam = searchParams.get('de')
    const ateParam = searchParams.get('ate')

    // Se tem datas customizadas na URL, consideramos "personalizado" prioritário
    const currentPeriod: PeriodOption = periodParam || (deParam ? 'personalizado' : '30d')

    const setPeriod = (period: PeriodOption, customDateRange?: { de: string; ate: string }) => {
        const params = new URLSearchParams(searchParams.toString())

        if (period === 'personalizado' && customDateRange) {
            params.set('periodo', 'personalizado')
            params.set('de', customDateRange.de)
            params.set('ate', customDateRange.ate)
        } else {
            params.set('periodo', period)
            params.delete('de')
            params.delete('ate')
        }

        router.push(`${pathname}?${params.toString()}`)
    }

    const { dateFrom, dateTo } = useMemo(() => {
        const now = new Date()
        let from: Date
        let to: Date = now

        switch (currentPeriod) {
            case 'hoje':
                from = startOfDay(now)
                break
            case '7d':
                from = startOfDay(subDays(now, 7))
                break
            case '30d':
                from = startOfDay(subDays(now, 30))
                break
            case '90d':
                from = startOfDay(subDays(now, 90))
                break
            case 'este_mes':
                from = startOfMonth(now)
                break
            case 'mes_passado':
                from = startOfMonth(subMonths(now, 1))
                to = endOfMonth(subMonths(now, 1))
                break
            case 'personalizado':
                from = deParam ? startOfDay(new Date(deParam)) : startOfDay(subDays(now, 30))
                to = ateParam ? endOfDay(new Date(ateParam)) : now
                break
            default:
                from = startOfDay(subDays(now, 30))
                break
        }

        return { dateFrom: from, dateTo: to }
    }, [currentPeriod, deParam, ateParam])

    return {
        currentPeriod,
        dateFrom,
        dateTo,
        setPeriod
    }
}
