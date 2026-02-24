import { usePathname, useRouter, useSearchParams } from 'next/navigation'
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

    const now = new Date()
    let dateFrom: Date
    let dateTo: Date = now

    switch (currentPeriod) {
        case 'hoje':
            dateFrom = startOfDay(now)
            break
        case '7d':
            dateFrom = startOfDay(subDays(now, 7))
            break
        case '30d':
            dateFrom = startOfDay(subDays(now, 30))
            break
        case '90d':
            dateFrom = startOfDay(subDays(now, 90))
            break
        case 'este_mes':
            dateFrom = startOfMonth(now)
            break
        case 'mes_passado':
            dateFrom = startOfMonth(subMonths(now, 1))
            dateTo = endOfMonth(subMonths(now, 1))
            break
        case 'personalizado':
            dateFrom = deParam ? startOfDay(new Date(deParam)) : startOfDay(subDays(now, 30))
            dateTo = ateParam ? endOfDay(new Date(ateParam)) : now
            break
        default:
            dateFrom = startOfDay(subDays(now, 30))
            break
    }

    return {
        currentPeriod,
        dateFrom,
        dateTo,
        setPeriod
    }
}
