'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'

interface LeadsPaginationProps {
    page: number
    perPage: number
    total: number
    onPageChange: (page: number) => void
    onPerPageChange: (perPage: number) => void
}

export function LeadsPagination({ page, perPage, total, onPageChange, onPerPageChange }: LeadsPaginationProps) {
    const totalPages = Math.ceil(total / perPage) || 1
    const from = (page - 1) * perPage + 1
    const to = Math.min(page * perPage, total)

    // Gerar números de página visíveis (max 5 com ellipsis)
    const getPageNumbers = () => {
        const pages: (number | '...')[] = []
        if (totalPages <= 5) {
            for (let i = 1; i <= totalPages; i++) pages.push(i)
        } else {
            pages.push(1)
            if (page > 3) pages.push('...')
            const start = Math.max(2, page - 1)
            const end = Math.min(totalPages - 1, page + 1)
            for (let i = start; i <= end; i++) pages.push(i)
            if (page < totalPages - 2) pages.push('...')
            pages.push(totalPages)
        }
        return pages
    }

    if (total === 0) return null

    return (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
            <p className="text-sm text-gray-500">
                Mostrando {from}-{to} de {total} leads
            </p>

            <div className="flex items-center gap-2">
                <Button
                    variant="outline"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => onPageChange(page - 1)}
                    className="h-8 w-8 p-0"
                >
                    <ChevronLeft className="h-4 w-4" />
                </Button>

                {getPageNumbers().map((p, idx) =>
                    p === '...' ? (
                        <span key={`ellipsis-${idx}`} className="text-sm text-gray-400 px-1">…</span>
                    ) : (
                        <Button
                            key={p}
                            variant={p === page ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => onPageChange(p)}
                            className={`h-8 w-8 p-0 ${p === page ? 'bg-blue-600 text-white hover:bg-blue-700' : ''}`}
                        >
                            {p}
                        </Button>
                    )
                )}

                <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= totalPages}
                    onClick={() => onPageChange(page + 1)}
                    className="h-8 w-8 p-0"
                >
                    <ChevronRight className="h-4 w-4" />
                </Button>

                <Select value={String(perPage)} onValueChange={(v) => onPerPageChange(Number(v))}>
                    <SelectTrigger className="h-8 w-[80px] text-sm">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="25">25/pág</SelectItem>
                        <SelectItem value="50">50/pág</SelectItem>
                        <SelectItem value="100">100/pág</SelectItem>
                    </SelectContent>
                </Select>
            </div>
        </div>
    )
}
