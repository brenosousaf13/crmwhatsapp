import { AiConfig } from '@/types/ai'

const dayMap: Record<number, keyof AiConfig['business_hours']> = {
    0: 'dom',
    1: 'seg',
    2: 'ter',
    3: 'qua',
    4: 'qui',
    5: 'sex',
    6: 'sab'
}

export function isWithinBusinessHours(date: Date, businessHours: AiConfig['business_hours']): boolean {
    if (!businessHours) return true

    // Dia da semana de 0 (Dom) a 6 (Sáb)
    const day = date.getDay()
    const dayKey = dayMap[day]

    const dayConfig = businessHours[dayKey]
    if (!dayConfig || !dayConfig.ativo) return false

    // Extrai horários
    const [startHourStr, startMinStr] = (dayConfig.inicio || '08:00').split(':')
    const [endHourStr, endMinStr] = (dayConfig.fim || '18:00').split(':')

    const startH = parseInt(startHourStr, 10)
    const startM = parseInt(startMinStr, 10)
    const endH = parseInt(endHourStr, 10)
    const endM = parseInt(endMinStr, 10)

    const hours = date.getHours()
    const minutes = date.getMinutes()
    const currentAbsoluteMin = hours * 60 + minutes
    const startAbsoluteMin = startH * 60 + startM
    const endAbsoluteMin = endH * 60 + endM

    return currentAbsoluteMin >= startAbsoluteMin && currentAbsoluteMin <= endAbsoluteMin
}

export function adjustToBusinessHours(date: Date, businessHours: AiConfig['business_hours']): Date {
    if (!businessHours) return date

    const adjusted = new Date(date)
    let safetyCounter = 0 // Evitar loop infinito

    while (!isWithinBusinessHours(adjusted, businessHours) && safetyCounter < 7) {
        const dayKey = dayMap[adjusted.getDay()]
        const dayConfig = businessHours[dayKey]

        if (dayConfig && dayConfig.ativo) {
            const [startH, startM] = (dayConfig.inicio || '08:00').split(':').map(Number)
            const [endH, endM] = (dayConfig.fim || '18:00').split(':').map(Number)

            const hours = adjusted.getHours()
            const minutes = adjusted.getMinutes()
            const currentAbsoluteMin = hours * 60 + minutes
            const startAbsoluteMin = startH * 60 + startM
            const endAbsoluteMin = endH * 60 + endM

            // Se ainda é cedo, pula para horário de início de hoje
            if (currentAbsoluteMin < startAbsoluteMin) {
                adjusted.setHours(startH, startM, 0, 0)
                return adjusted
            }
            // Se já for muito tarde, empurra para a manhã do próximo dia
            if (currentAbsoluteMin > endAbsoluteMin) {
                adjusted.setHours(24, 0, 0, 0) // Vai pro início do próximo dia, que resetará pra loop
                continue
            }
        } else {
            // Se não é um dia comercial (ex: Sab/Dom e a loja não abre), pula pro próximo dia
            adjusted.setHours(24, 0, 0, 0)
        }

        // Caso vá pro próximo dia, o loop fará a checagem que vai bater na regra "é cedo" e setará pra start/end normal
        safetyCounter++
    }

    return adjusted
}

// Wrapper para usar o mesmo padrão da documentação se necessário.
export function getNextBusinessHour(date: Date, businessHours: AiConfig['business_hours']): Date {
    return adjustToBusinessHours(date, businessHours)
}
