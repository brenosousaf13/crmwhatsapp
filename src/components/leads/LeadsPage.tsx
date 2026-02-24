'use client'

import { useState, useMemo, useCallback, Suspense } from 'react'
import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { useOrganization } from '@/components/providers/organization-provider'
import { useLeads, type LeadRow, type LeadsFilters } from '@/hooks/leads/useLeads'
import { useCreateLead, useMoveLeadEtapa, useDeleteLeads, useManageLeadTags } from '@/hooks/leads/useLeadMutations'
import { useLeadsExport } from '@/hooks/leads/useLeadsExport'
import { LeadsMetrics } from './LeadsMetrics'
import { LeadsToolbar } from './LeadsToolbar'
import { LeadsTable } from './LeadsTable'
import { LeadsPagination } from './LeadsPagination'
import { LeadsActiveFilters } from './LeadsActiveFilters'
import { LeadsFiltersPanel } from './LeadsFilters'
import { LeadCreateEditModal, type LeadFormData } from './LeadCreateEditModal'
import { LeadDetailDrawer } from './LeadDetailDrawer'

function LeadsPageInner() {
    const { organization } = useOrganization()
    const orgId = organization?.id
    const supabase = createClient()

    // Core data hook
    const {
        leads, total, isLoading,
        page, perPage, sortField, sortOrder, filters,
        setPage, setPerPage, setSort, setSearch, setFilters, clearFilters,
    } = useLeads()

    // Referência de etapas e membros para dropdowns
    const { data: etapas = [] } = useQuery({
        queryKey: ['etapas', orgId],
        queryFn: async () => {
            const { data } = await supabase
                .from('etapas_kanban')
                .select('id, nome, cor')
                .eq('organization_id', orgId!)
                .order('ordem')
            return data || []
        },
        enabled: !!orgId,
        staleTime: 60_000,
    })

    const { data: members = [] } = useQuery({
        queryKey: ['org-members', orgId],
        queryFn: async () => {
            const { data } = await supabase
                .from('organization_members')
                .select('user_id, user_profiles(id, nome)')
                .eq('organization_id', orgId!)
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            return (data || []).map((m: any) => {
                const profile = Array.isArray(m.user_profiles) ? m.user_profiles[0] : m.user_profiles
                return { id: profile?.id || m.user_id, nome: profile?.nome || 'Membro' }
            })
        },
        enabled: !!orgId,
        staleTime: 60_000,
    })

    const { data: allTags = [] } = useQuery({
        queryKey: ['tags', orgId],
        queryFn: async () => {
            const { data } = await supabase
                .from('tags')
                .select('id, nome, cor')
                .eq('organization_id', orgId!)
                .order('nome')
            return data || []
        },
        enabled: !!orgId,
        staleTime: 60_000,
    })

    // Mapa de etapas para filter chips
    const etapasMap = useMemo(() => new Map(etapas.map(e => [e.id, e.nome])), [etapas])

    // UI state
    const [filtersOpen, setFiltersOpen] = useState(false)
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
    const [drawerLead, setDrawerLead] = useState<LeadRow | null>(null)
    const [drawerOpen, setDrawerOpen] = useState(false)
    const [createModalOpen, setCreateModalOpen] = useState(false)

    // Mutations
    const { mutate: createLead, isPending: isCreating } = useCreateLead()
    const { mutate: moveEtapa } = useMoveLeadEtapa()
    const { mutate: deleteLeads } = useDeleteLeads()
    const { mutate: manageTags } = useManageLeadTags()
    const { exportCSV, exporting } = useLeadsExport()

    // Checar filtros ativos
    const hasActiveFilters = useMemo(() => {
        return filters.etapas.length > 0
            || filters.atendentes.length > 0
            || filters.tags.length > 0
            || filters.naoLidas !== 'todos'
            || filters.temWhatsapp !== 'todos'
            || !!filters.criadoDe || !!filters.criadoAte
            || !!filters.ultimaMsgDe || !!filters.ultimaMsgAte
            || filters.valorDe !== null || filters.valorAte !== null
            || !!filters.search
    }, [filters])

    // Seleção
    const handleToggleSelect = useCallback((id: string) => {
        setSelectedIds(prev => {
            const next = new Set(prev)
            if (next.has(id)) next.delete(id); else next.add(id)
            return next
        })
    }, [])

    const handleToggleSelectAll = useCallback(() => {
        const allOnPage = leads.map(l => l.id)
        const allSelected = allOnPage.every(id => selectedIds.has(id))
        if (allSelected) {
            setSelectedIds(new Set())
        } else {
            setSelectedIds(new Set(allOnPage))
        }
    }, [leads, selectedIds])

    const handleDeselectAll = useCallback(() => setSelectedIds(new Set()), [])

    // Lead click → abrir drawer
    const handleLeadClick = useCallback((lead: LeadRow) => {
        setDrawerLead(lead)
        setDrawerOpen(true)
    }, [])

    // Etapa mudança inline
    const handleEtapaChange = useCallback((leadId: string, etapaId: string, etapaNome: string) => {
        moveEtapa({ leadId, etapaId, etapaNome })
    }, [moveEtapa])

    // Tags
    const handleTagsChange = useCallback((leadId: string, tagIds: string[]) => {
        manageTags({ leadId, tagIds })
    }, [manageTags])

    // Criar lead
    const handleCreateLead = useCallback((data: LeadFormData) => {
        createLead({
            nome: data.nome,
            telefone: data.telefone,
            email: data.email || undefined,
            etapa_id: data.etapa_id || undefined,
            valor_venda: data.valor_venda ? Number(data.valor_venda) : undefined,
            notas: data.notas || undefined,
        }, {
            onSuccess: () => setCreateModalOpen(false),
        })
    }, [createLead])

    // Exportar
    const handleExport = useCallback(() => {
        exportCSV(selectedIds.size > 0 ? leads.filter(l => selectedIds.has(l.id)) : leads)
    }, [exportCSV, leads, selectedIds])

    // Bulk delete
    const handleBulkDelete = useCallback(() => {
        if (!confirm(`Excluir ${selectedIds.size} lead(s)? Esta ação não pode ser desfeita.`)) return
        deleteLeads(Array.from(selectedIds), {
            onSuccess: () => setSelectedIds(new Set()),
        })
    }, [deleteLeads, selectedIds])

    // Remover filtro individual
    const handleRemoveFilter = useCallback((key: keyof LeadsFilters, value?: string) => {
        if (key === 'etapas' && value) {
            setFilters({ etapas: filters.etapas.filter(id => id !== value) })
        } else if (key === 'tags' && value) {
            setFilters({ tags: filters.tags.filter(id => id !== value) })
        } else if (key === 'naoLidas') {
            setFilters({ naoLidas: 'todos' })
        } else if (key === 'temWhatsapp') {
            setFilters({ temWhatsapp: 'todos' })
        } else if (key === 'criadoDe') {
            setFilters({ criadoDe: null })
        } else if (key === 'criadoAte') {
            setFilters({ criadoAte: null })
        } else if (key === 'ultimaMsgDe') {
            setFilters({ ultimaMsgDe: null })
        } else if (key === 'ultimaMsgAte') {
            setFilters({ ultimaMsgAte: null })
        } else if (key === 'valorDe') {
            setFilters({ valorDe: null })
        } else if (key === 'valorAte') {
            setFilters({ valorAte: null })
        } else if (key === 'search') {
            setSearch('')
        }
    }, [filters, setFilters, setSearch])

    return (
        <div className="flex flex-col gap-4 p-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Leads</h1>
                    <p className="text-sm text-gray-500 mt-0.5">Gerencie todos os seus contatos e oportunidades</p>
                </div>
            </div>

            {/* Métricas */}
            <LeadsMetrics onFilterClick={setFilters} />

            {/* Toolbar */}
            <LeadsToolbar
                search={filters.search}
                onSearchChange={setSearch}
                sortField={sortField}
                sortOrder={sortOrder}
                onSortChange={setSort}
                filtersOpen={filtersOpen}
                onToggleFilters={() => setFiltersOpen(prev => !prev)}
                hasActiveFilters={hasActiveFilters}
                onExportCSV={handleExport}
                exporting={exporting}
                onNewLead={() => setCreateModalOpen(true)}
                selectedCount={selectedIds.size}
                onBulkMoveEtapa={() => { }} // TODO: implementar modal de seleção de etapa
                onBulkAssign={() => { }} // TODO: implementar modal de seleção de atendente
                onBulkDelete={handleBulkDelete}
                onDeselectAll={handleDeselectAll}
            />

            {/* Painel de filtros */}
            {filtersOpen && (
                <LeadsFiltersPanel
                    filters={filters}
                    onChangeFilters={setFilters}
                    onClearAll={clearFilters}
                    onClose={() => setFiltersOpen(false)}
                    etapas={etapas}
                    members={members}
                    tags={allTags}
                />
            )}

            {/* Filtros ativos (chips) */}
            {hasActiveFilters && (
                <LeadsActiveFilters
                    filters={filters}
                    etapasMap={etapasMap}
                    onRemoveFilter={handleRemoveFilter}
                    onClearAll={clearFilters}
                />
            )}

            {/* Tabela */}
            <LeadsTable
                leads={leads}
                isLoading={isLoading}
                sortField={sortField}
                sortOrder={sortOrder}
                onSortChange={setSort}
                selectedIds={selectedIds}
                onToggleSelect={handleToggleSelect}
                onToggleSelectAll={handleToggleSelectAll}
                onLeadClick={handleLeadClick}
                onEtapaChange={handleEtapaChange}
                etapas={etapas}
                members={members}
                tags={allTags}
                onTagsChange={handleTagsChange}
                page={page}
                perPage={perPage}
            />

            {/* Paginação */}
            <LeadsPagination
                page={page}
                perPage={perPage}
                total={total}
                onPageChange={setPage}
                onPerPageChange={setPerPage}
            />

            {/* Drawer de detalhes */}
            <LeadDetailDrawer
                lead={drawerLead}
                open={drawerOpen}
                onOpenChange={setDrawerOpen}
                etapas={etapas}
            />

            {/* Modal criar lead */}
            <LeadCreateEditModal
                open={createModalOpen}
                onOpenChange={setCreateModalOpen}
                mode="create"
                etapas={etapas}
                isPending={isCreating}
                onSubmit={handleCreateLead}
            />
        </div>
    )
}

export function LeadsPage() {
    return (
        <Suspense fallback={
            <div className="p-6">
                <div className="h-8 bg-gray-200 rounded w-40 animate-pulse mb-4" />
                <div className="grid grid-cols-4 gap-4 mb-4">
                    {[...Array(4)].map((_, i) => <div key={i} className="h-24 bg-gray-200 rounded-xl animate-pulse" />)}
                </div>
            </div>
        }>
            <LeadsPageInner />
        </Suspense>
    )
}
