'use client'

import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import { BusinessHours } from '@/types/ai'

interface BusinessHoursEditorProps {
    enabled: boolean
    onEnabledChange: (val: boolean) => void
    hours: BusinessHours
    onHoursChange: (hours: BusinessHours) => void
    disabled?: boolean
}

const DIAS = [
    { key: 'seg', label: 'Segunda-feira' },
    { key: 'ter', label: 'Terça-feira' },
    { key: 'qua', label: 'Quarta-feira' },
    { key: 'qui', label: 'Quinta-feira' },
    { key: 'sex', label: 'Sexta-feira' },
    { key: 'sab', label: 'Sábado' },
    { key: 'dom', label: 'Domingo' }
] as const

export function BusinessHoursEditor({
    enabled,
    onEnabledChange,
    hours,
    onHoursChange,
    disabled
}: BusinessHoursEditorProps) {

    const updateDay = (dayKey: keyof BusinessHours, field: 'inicio' | 'fim' | 'ativo', value: string | boolean) => {
        onHoursChange({
            ...hours,
            [dayKey]: {
                ...hours[dayKey],
                [field]: value
            }
        })
    }

    return (
        <div className="space-y-4 border p-4 rounded-lg bg-gray-50/50 dark:bg-[#1B1F3B]/50">
            <div className="flex items-center justify-between pb-4 border-b">
                <div>
                    <Label className="text-base">Horário de Funcionamento</Label>
                    <p className="text-sm text-muted-foreground">Restringir quando a IA pode responder leads automaticamente.</p>
                </div>
                <Switch checked={enabled} onCheckedChange={onEnabledChange} disabled={disabled} />
            </div>

            {enabled && (
                <div className="space-y-3 pt-2">
                    {DIAS.map(dia => {
                        const h = hours[dia.key]
                        return (
                            <div key={dia.key} className="flex items-center gap-4">
                                <div className="w-32 flex items-center gap-2">
                                    <Switch
                                        checked={h.ativo}
                                        onCheckedChange={(val) => updateDay(dia.key, 'ativo', val)}
                                        disabled={disabled}
                                        className="scale-75"
                                    />
                                    <Label className={h.ativo ? 'font-medium' : 'text-muted-foreground'}>{dia.label}</Label>
                                </div>

                                <div className="flex items-center gap-2 flex-1">
                                    <Input
                                        type="time"
                                        value={h.inicio}
                                        onChange={e => updateDay(dia.key, 'inicio', e.target.value)}
                                        disabled={!h.ativo || disabled}
                                        className="w-[120px] h-8"
                                    />
                                    <span className="text-muted-foreground text-sm">até</span>
                                    <Input
                                        type="time"
                                        value={h.fim}
                                        onChange={e => updateDay(dia.key, 'fim', e.target.value)}
                                        disabled={!h.ativo || disabled}
                                        className="w-[120px] h-8"
                                    />
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
