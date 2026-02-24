'use client'

import { useCallback, useState } from 'react'
import type { LeadRow } from './useLeads'

// Exportação client-side de leads para CSV
export function useLeadsExport() {
    const [exporting, setExporting] = useState(false)

    const exportCSV = useCallback((leads: LeadRow[], filename?: string) => {
        setExporting(true)
        try {
            const headers = ['Nome', 'Telefone', 'Email', 'Etapa', 'Tags', 'Atendente', 'Criado em', 'Última mensagem', 'Valor da venda', 'Notas']

            const rows = leads.map(lead => [
                lead.nome,
                lead.telefone,
                lead.email || '',
                lead.etapa_nome,
                lead.tags.map(t => t.nome).join('; '),
                lead.atendente_nome || '',
                new Date(lead.criado_em).toLocaleDateString('pt-BR'),
                lead.ultima_mensagem_at ? new Date(lead.ultima_mensagem_at).toLocaleDateString('pt-BR') : '',
                lead.valor_venda !== null ? `R$ ${lead.valor_venda.toFixed(2)}` : '',
                (lead.notas || '').replace(/"/g, '""'), // Escapar aspas
            ])

            // Construir CSV com BOM para Excel
            const csvContent = '\uFEFF' + [
                headers.join(','),
                ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
            ].join('\n')

            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
            const url = URL.createObjectURL(blob)
            const link = document.createElement('a')
            link.href = url
            link.download = filename || `leads-${new Date().toISOString().split('T')[0]}.csv`
            link.click()
            URL.revokeObjectURL(url)
        } finally {
            setExporting(false)
        }
    }, [])

    return { exportCSV, exporting }
}
