import { useState } from 'react'
import { CalendarIcon, Clock, Loader2 } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useMutation, useQueryClient } from '@tanstack/react-query'

import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { Label } from '@/components/ui/label'

interface ScheduleFollowupDialogProps {
    leadId: string
    leadName: string
}

export function ScheduleFollowupDialog({ leadId, leadName }: ScheduleFollowupDialogProps) {
    const [open, setOpen] = useState(false)
    const [date, setDate] = useState<Date>()
    const [time, setTime] = useState<string>('09:00')
    const [notes, setNotes] = useState('')
    const queryClient = useQueryClient()

    const scheduleMutation = useMutation({
        mutationFn: async () => {
            if (!date || !time) throw new Error('Selecione data e hora')

            const [hours, minutes] = time.split(':')
            const scheduledDate = new Date(date)
            scheduledDate.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0)

            const res = await fetch('/api/followups', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    lead_id: leadId,
                    agendado_para: scheduledDate.toISOString(),
                    notas: notes,
                    metadata: { envio_automatico: false }
                })
            })

            if (!res.ok) {
                const d = await res.json()
                throw new Error(d.error || 'Erro ao agendar')
            }

            return res.json()
        },
        onSuccess: () => {
            setOpen(false)
            setDate(undefined)
            setTime('09:00')
            setNotes('')
            queryClient.invalidateQueries({ queryKey: ['followups'] })
        }
    })

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9 text-[#6B7280] hover:bg-[#F3F4F6] hover:text-[#111827]" title="Agendar Lembrete/Follow-up">
                    <Clock className="h-[18px] w-[18px]" strokeWidth={1.5} />
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Agendar Follow-up</DialogTitle>
                    <DialogDescription>
                        Lembrete de contato manual para <span className="font-semibold text-gray-900">{leadName}</span>.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <div className="flex flex-col gap-2">
                        <Label>Data do Lembrete</Label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant={"outline"}
                                    className={cn(
                                        "w-full justify-start text-left font-normal border-gray-200",
                                        !date && "text-muted-foreground"
                                    )}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {date ? format(date, 'PPP', { locale: ptBR }) : <span>Selecione a data</span>}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                    mode="single"
                                    selected={date}
                                    onSelect={setDate}
                                    initialFocus
                                    locale={ptBR}
                                    disabled={(d: Date) => d < new Date(new Date().setHours(0, 0, 0, 0))}
                                />
                            </PopoverContent>
                        </Popover>
                    </div>

                    <div className="flex flex-col gap-2">
                        <Label>Horário</Label>
                        <Select value={time} onValueChange={setTime}>
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="Selecione o horário" />
                            </SelectTrigger>
                            <SelectContent>
                                {Array.from({ length: 24 }).map((_, i) => (
                                    <SelectItem key={i} value={`${i.toString().padStart(2, '0')}:00`}>
                                        {`${i.toString().padStart(2, '0')}:00`}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex flex-col gap-2">
                        <Label htmlFor="notas">Notas Internas / Motivo (Opcional)</Label>
                        <Textarea
                            id="notas"
                            placeholder="Ex: Retornar para aprovar o orçamento..."
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            className="h-20 resize-none"
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
                    <Button
                        className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white"
                        onClick={() => scheduleMutation.mutate()}
                        disabled={!date || scheduleMutation.isPending}
                    >
                        {scheduleMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                        Confirmar e Agendar
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
