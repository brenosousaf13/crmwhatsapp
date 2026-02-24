'use client'

import { useState, useEffect } from 'react'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'

export interface LeadFormData {
    nome: string
    telefone: string
    email: string
    etapa_id: string
    valor_venda: string
    notas: string
}

interface LeadCreateEditModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    mode: 'create' | 'edit'
    initialData?: Partial<LeadFormData & { id: string }>
    etapas: { id: string; nome: string; cor: string }[]
    isPending: boolean
    onSubmit: (data: LeadFormData) => void
}

export function LeadCreateEditModal({
    open,
    onOpenChange,
    mode,
    initialData,
    etapas,
    isPending,
    onSubmit,
}: LeadCreateEditModalProps) {
    const [form, setForm] = useState<LeadFormData>({
        nome: '',
        telefone: '',
        email: '',
        etapa_id: etapas[0]?.id || '',
        valor_venda: '',
        notas: '',
    })

    // Resetar form ao abrir/fechar
    useEffect(() => {
        if (open && initialData) {
            setForm({
                nome: initialData.nome || '',
                telefone: initialData.telefone || '',
                email: initialData.email || '',
                etapa_id: initialData.etapa_id || etapas[0]?.id || '',
                valor_venda: initialData.valor_venda || '',
                notas: initialData.notas || '',
            })
        } else if (open) {
            setForm({
                nome: '',
                telefone: '',
                email: '',
                etapa_id: etapas[0]?.id || '',
                valor_venda: '',
                notas: '',
            })
        }
    }, [open, initialData, etapas])

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        onSubmit(form)
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[480px]">
                <DialogHeader>
                    <DialogTitle>{mode === 'create' ? 'Novo Lead' : 'Editar Lead'}</DialogTitle>
                    <DialogDescription className="sr-only">
                        {mode === 'create' ? 'Preencha os dados para criar um novo lead.' : 'Atualize os dados do lead.'}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 mt-2">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                            <Label htmlFor="lead-nome">Nome *</Label>
                            <Input
                                id="lead-nome"
                                placeholder="Ex: João da Silva"
                                required
                                value={form.nome}
                                onChange={(e) => setForm(f => ({ ...f, nome: e.target.value }))}
                            />
                        </div>

                        <div>
                            <Label htmlFor="lead-telefone">WhatsApp *</Label>
                            <Input
                                id="lead-telefone"
                                placeholder="+55 11 99999-9999"
                                required
                                value={form.telefone}
                                onChange={(e) => setForm(f => ({ ...f, telefone: e.target.value }))}
                            />
                        </div>

                        <div>
                            <Label htmlFor="lead-email">Email</Label>
                            <Input
                                id="lead-email"
                                type="email"
                                placeholder="email@exemplo.com"
                                value={form.email}
                                onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))}
                            />
                        </div>

                        <div>
                            <Label htmlFor="lead-etapa">Etapa</Label>
                            <Select value={form.etapa_id} onValueChange={(v) => setForm(f => ({ ...f, etapa_id: v }))}>
                                <SelectTrigger id="lead-etapa">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {etapas.map(e => (
                                        <SelectItem key={e.id} value={e.id}>
                                            <span className="flex items-center gap-2">
                                                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: e.cor }} />
                                                {e.nome}
                                            </span>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <Label htmlFor="lead-valor">Valor da venda (R$)</Label>
                            <Input
                                id="lead-valor"
                                type="number"
                                placeholder="0,00"
                                value={form.valor_venda}
                                onChange={(e) => setForm(f => ({ ...f, valor_venda: e.target.value }))}
                            />
                        </div>
                    </div>

                    <div>
                        <Label htmlFor="lead-notas">Notas</Label>
                        <Textarea
                            id="lead-notas"
                            placeholder="Notas sobre o lead..."
                            rows={3}
                            value={form.notas}
                            onChange={(e) => setForm(f => ({ ...f, notas: e.target.value }))}
                        />
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
                            Cancelar
                        </Button>
                        <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white" disabled={isPending}>
                            {isPending ? 'Salvando...' : mode === 'create' ? 'Criar Lead' : 'Salvar'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
