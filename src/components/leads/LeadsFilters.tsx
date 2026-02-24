'use client'

import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import type { LeadsFilters } from '@/hooks/leads/useLeads'

interface LeadsFiltersPanelProps {
    filters: LeadsFilters
    onChangeFilters: (updates: Partial<LeadsFilters>) => void
    onClearAll: () => void
    onClose: () => void
    etapas: { id: string; nome: string; cor: string }[]
    members: { id: string; nome: string }[]
    tags: { id: string; nome: string; cor: string }[]
}

export function LeadsFiltersPanel({
    filters,
    onChangeFilters,
    onClearAll,
    onClose,
    etapas,
    members,
    tags,
}: LeadsFiltersPanelProps) {
    return (
        <div className="bg-white rounded-xl border border-gray-200 p-4 animate-in slide-in-from-top-2 duration-200">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-gray-700">Filtros avançados</h3>
                <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={onClearAll} className="text-xs text-gray-500 h-7">
                        Limpar tudo
                    </Button>
                    <button onClick={onClose} className="p-1 rounded hover:bg-gray-100">
                        <X className="h-4 w-4 text-gray-400" />
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Etapa */}
                <div>
                    <Label className="text-xs text-gray-500 mb-1.5 block">Etapa</Label>
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                        {etapas.map(e => (
                            <label key={e.id} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-gray-50 rounded px-1 py-0.5">
                                <Checkbox
                                    checked={filters.etapas.includes(e.id)}
                                    onCheckedChange={(checked) => {
                                        const updated = checked
                                            ? [...filters.etapas, e.id]
                                            : filters.etapas.filter(id => id !== e.id)
                                        onChangeFilters({ etapas: updated })
                                    }}
                                />
                                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: e.cor }} />
                                <span className="text-gray-700">{e.nome}</span>
                            </label>
                        ))}
                    </div>
                </div>

                {/* Atendente */}
                <div>
                    <Label className="text-xs text-gray-500 mb-1.5 block">Atendente</Label>
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                        {members.map(m => (
                            <label key={m.id} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-gray-50 rounded px-1 py-0.5">
                                <Checkbox
                                    checked={filters.atendentes.includes(m.id)}
                                    onCheckedChange={(checked) => {
                                        const updated = checked
                                            ? [...filters.atendentes, m.id]
                                            : filters.atendentes.filter(id => id !== m.id)
                                        onChangeFilters({ atendentes: updated })
                                    }}
                                />
                                <span className="text-gray-700">{m.nome}</span>
                            </label>
                        ))}
                    </div>
                </div>

                {/* Tags */}
                <div>
                    <Label className="text-xs text-gray-500 mb-1.5 block">Tags</Label>
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                        {tags.map(t => (
                            <label key={t.id} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-gray-50 rounded px-1 py-0.5">
                                <Checkbox
                                    checked={filters.tags.includes(t.id)}
                                    onCheckedChange={(checked) => {
                                        const updated = checked
                                            ? [...filters.tags, t.id]
                                            : filters.tags.filter(id => id !== t.id)
                                        onChangeFilters({ tags: updated })
                                    }}
                                />
                                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: t.cor }} />
                                <span className="text-gray-700">{t.nome}</span>
                            </label>
                        ))}
                        {tags.length === 0 && <p className="text-xs text-gray-400">Nenhuma tag criada</p>}
                    </div>
                </div>

                {/* Status / WhatsApp */}
                <div className="space-y-3">
                    <div>
                        <Label className="text-xs text-gray-500 mb-1.5 block">Mensagens não lidas</Label>
                        <Select value={filters.naoLidas} onValueChange={(v) => onChangeFilters({ naoLidas: v as LeadsFilters['naoLidas'] })}>
                            <SelectTrigger className="h-8 text-sm">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="todos">Todos</SelectItem>
                                <SelectItem value="com">Com não lidas</SelectItem>
                                <SelectItem value="sem">Sem não lidas</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div>
                        <Label className="text-xs text-gray-500 mb-1.5 block">Conversas WhatsApp</Label>
                        <Select value={filters.temWhatsapp} onValueChange={(v) => onChangeFilters({ temWhatsapp: v as LeadsFilters['temWhatsapp'] })}>
                            <SelectTrigger className="h-8 text-sm">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="todos">Todos</SelectItem>
                                <SelectItem value="com">Com mensagens</SelectItem>
                                <SelectItem value="sem">Sem mensagens</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </div>

            {/* Linha 2: Datas e Valor */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4 pt-4 border-t border-gray-100">
                <div>
                    <Label className="text-xs text-gray-500 mb-1.5 block">Criado desde</Label>
                    <Input
                        type="date"
                        value={filters.criadoDe || ''}
                        onChange={(e) => onChangeFilters({ criadoDe: e.target.value || null })}
                        className="h-8 text-sm"
                    />
                </div>
                <div>
                    <Label className="text-xs text-gray-500 mb-1.5 block">Criado até</Label>
                    <Input
                        type="date"
                        value={filters.criadoAte || ''}
                        onChange={(e) => onChangeFilters({ criadoAte: e.target.value || null })}
                        className="h-8 text-sm"
                    />
                </div>
                <div>
                    <Label className="text-xs text-gray-500 mb-1.5 block">Valor mínimo (R$)</Label>
                    <Input
                        type="number"
                        placeholder="0,00"
                        value={filters.valorDe ?? ''}
                        onChange={(e) => onChangeFilters({ valorDe: e.target.value ? Number(e.target.value) : null })}
                        className="h-8 text-sm"
                    />
                </div>
                <div>
                    <Label className="text-xs text-gray-500 mb-1.5 block">Valor máximo (R$)</Label>
                    <Input
                        type="number"
                        placeholder="0,00"
                        value={filters.valorAte ?? ''}
                        onChange={(e) => onChangeFilters({ valorAte: e.target.value ? Number(e.target.value) : null })}
                        className="h-8 text-sm"
                    />
                </div>
            </div>
        </div>
    )
}
