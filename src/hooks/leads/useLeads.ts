'use client'

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useMemo, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useOrganization } from '@/components/providers/organization-provider'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'

// Tipo do lead retornado pela query
export interface LeadRow {
    id: string
    nome: string
    telefone: string
    email: string | null
    etapa_id: string
    etapa_nome: string
    etapa_cor: string
    tags: { id: string; nome: string; cor: string }[]
    atendente_id: string | null
    atendente_nome: string | null
    ultima_mensagem_at: string | null
    mensagens_nao_lidas: number
    valor_venda: number | null
    notas: string | null
    criado_em: string
    atualizado_em: string
}

// Tipo dos filtros aplicados
export interface LeadsFilters {
    search: string
    etapas: string[]
    atendentes: string[]
    tags: string[]
    naoLidas: 'todos' | 'com' | 'sem'
    temWhatsapp: 'todos' | 'com' | 'sem'
    criadoDe: string | null
    criadoAte: string | null
    ultimaMsgDe: string | null
    ultimaMsgAte: string | null
    valorDe: number | null
    valorAte: number | null
}

export type SortField = 'nome' | 'criado_em' | 'ultima_mensagem_at' | 'mensagens_nao_lidas' | 'valor_venda'
export type SortOrder = 'asc' | 'desc'

const DEFAULT_PER_PAGE = 25

// Extrai filtros da URL
function parseFiltersFromURL(searchParams: URLSearchParams): LeadsFilters {
    return {
        search: searchParams.get('search') || '',
        etapas: searchParams.get('etapa')?.split(',').filter(Boolean) || [],
        atendentes: searchParams.get('atendente')?.split(',').filter(Boolean) || [],
        tags: searchParams.get('tag')?.split(',').filter(Boolean) || [],
        naoLidas: (searchParams.get('nao_lidas') as LeadsFilters['naoLidas']) || 'todos',
        temWhatsapp: (searchParams.get('tem_whatsapp') as LeadsFilters['temWhatsapp']) || 'todos',
        criadoDe: searchParams.get('criado_de') || null,
        criadoAte: searchParams.get('criado_ate') || null,
        ultimaMsgDe: searchParams.get('ultima_msg_de') || null,
        ultimaMsgAte: searchParams.get('ultima_msg_ate') || null,
        valorDe: searchParams.get('valor_de') ? Number(searchParams.get('valor_de')) : null,
        valorAte: searchParams.get('valor_ate') ? Number(searchParams.get('valor_ate')) : null,
    }
}

export function useLeads() {
    const { organization } = useOrganization()
    const orgId = organization?.id
    const searchParams = useSearchParams()
    const router = useRouter()
    const pathname = usePathname()
    const queryClient = useQueryClient()
    const supabase = createClient()

    // Parsear parâmetros da URL
    const page = Number(searchParams.get('page') || '1')
    const perPage = Number(searchParams.get('per_page') || String(DEFAULT_PER_PAGE))
    const sortField = (searchParams.get('sort') as SortField) || 'criado_em'
    const sortOrder = (searchParams.get('order') as SortOrder) || 'desc'
    const filters = useMemo(() => parseFiltersFromURL(searchParams), [searchParams])

    // Atualizar URL sem perder filtros existentes
    const updateURL = useCallback((updates: Record<string, string | null>) => {
        const params = new URLSearchParams(searchParams.toString())
        Object.entries(updates).forEach(([key, value]) => {
            if (value === null || value === '' || value === 'todos') {
                params.delete(key)
            } else {
                params.set(key, value)
            }
        })
        router.replace(`${pathname}?${params.toString()}`, { scroll: false })
    }, [searchParams, router, pathname])

    // Funções de conveniência para atualizar filtros
    const setPage = useCallback((p: number) => updateURL({ page: String(p) }), [updateURL])
    const setPerPage = useCallback((pp: number) => updateURL({ per_page: String(pp), page: '1' }), [updateURL])
    const setSort = useCallback((field: SortField, order: SortOrder) => updateURL({ sort: field, order, page: '1' }), [updateURL])
    const setSearch = useCallback((q: string) => updateURL({ search: q || null, page: '1' }), [updateURL])

    const setFilters = useCallback((newFilters: Partial<LeadsFilters>) => {
        const updates: Record<string, string | null> = { page: '1' }
        if (newFilters.etapas !== undefined) updates.etapa = newFilters.etapas.length ? newFilters.etapas.join(',') : null
        if (newFilters.atendentes !== undefined) updates.atendente = newFilters.atendentes.length ? newFilters.atendentes.join(',') : null
        if (newFilters.tags !== undefined) updates.tag = newFilters.tags.length ? newFilters.tags.join(',') : null
        if (newFilters.naoLidas !== undefined) updates.nao_lidas = newFilters.naoLidas
        if (newFilters.temWhatsapp !== undefined) updates.tem_whatsapp = newFilters.temWhatsapp
        if (newFilters.criadoDe !== undefined) updates.criado_de = newFilters.criadoDe
        if (newFilters.criadoAte !== undefined) updates.criado_ate = newFilters.criadoAte
        if (newFilters.ultimaMsgDe !== undefined) updates.ultima_msg_de = newFilters.ultimaMsgDe
        if (newFilters.ultimaMsgAte !== undefined) updates.ultima_msg_ate = newFilters.ultimaMsgAte
        if (newFilters.valorDe !== undefined) updates.valor_de = newFilters.valorDe !== null ? String(newFilters.valorDe) : null
        if (newFilters.valorAte !== undefined) updates.valor_ate = newFilters.valorAte !== null ? String(newFilters.valorAte) : null
        updateURL(updates)
    }, [updateURL])

    const clearFilters = useCallback(() => {
        const keysToRemove = ['etapa', 'atendente', 'tag', 'nao_lidas', 'tem_whatsapp', 'criado_de', 'criado_ate', 'ultima_msg_de', 'ultima_msg_ate', 'valor_de', 'valor_ate', 'search']
        const updates: Record<string, string | null> = { page: '1' }
        keysToRemove.forEach(k => { updates[k] = null })
        updateURL(updates)
    }, [updateURL])

    // Query principal de leads
    const queryKey = ['leads', orgId, page, perPage, sortField, sortOrder, filters]

    const { data, isLoading, refetch } = useQuery({
        queryKey,
        queryFn: async () => {
            if (!orgId) return { leads: [], total: 0 }

            // Construir query base com joins
            let query = supabase
                .from('leads')
                .select(`
          id, nome, telefone, email, etapa_id, valor_venda, notas,
          ultima_mensagem_at, mensagens_nao_lidas, criado_em, atualizado_em,
          etapas_kanban!inner(nome, cor),
          lead_tags(tag_id, tags(id, nome, cor)),
          atendimentos(atendente_id, user_profiles(nome))
        `, { count: 'exact' })
                .eq('organization_id', orgId)

            // Aplicar filtros
            if (filters.search) {
                query = query.or(`nome.ilike.%${filters.search}%,telefone.ilike.%${filters.search}%,email.ilike.%${filters.search}%`)
            }
            if (filters.etapas.length > 0) {
                query = query.in('etapa_id', filters.etapas)
            }
            if (filters.naoLidas === 'com') {
                query = query.gt('mensagens_nao_lidas', 0)
            } else if (filters.naoLidas === 'sem') {
                query = query.eq('mensagens_nao_lidas', 0)
            }
            if (filters.temWhatsapp === 'com') {
                query = query.not('ultima_mensagem_at', 'is', null)
            } else if (filters.temWhatsapp === 'sem') {
                query = query.is('ultima_mensagem_at', null)
            }
            if (filters.criadoDe) {
                query = query.gte('criado_em', filters.criadoDe)
            }
            if (filters.criadoAte) {
                query = query.lte('criado_em', filters.criadoAte)
            }
            if (filters.ultimaMsgDe) {
                query = query.gte('ultima_mensagem_at', filters.ultimaMsgDe)
            }
            if (filters.ultimaMsgAte) {
                query = query.lte('ultima_mensagem_at', filters.ultimaMsgAte)
            }
            if (filters.valorDe !== null) {
                query = query.gte('valor_venda', filters.valorDe)
            }
            if (filters.valorAte !== null) {
                query = query.lte('valor_venda', filters.valorAte)
            }

            // Ordenação
            query = query.order(sortField, { ascending: sortOrder === 'asc', nullsFirst: false })

            // Paginação
            const from = (page - 1) * perPage
            const to = from + perPage - 1
            query = query.range(from, to)

            const { data: rawData, count, error } = await query

            if (error) {
                console.error('Erro ao buscar leads:', error)
                return { leads: [], total: 0 }
            }

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const leads: LeadRow[] = (rawData || []).map((row: any) => {
                const etapa = row.etapas_kanban
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const tags = (row.lead_tags || []).map((lt: any) => {
                    const t = Array.isArray(lt.tags) ? lt.tags[0] : lt.tags
                    return t ? { id: t.id, nome: t.nome, cor: t.cor } : null
                }).filter(Boolean)

                // Pegar o atendente ativo (mais recente)
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const atendimento = (row.atendimentos || []).find((a: any) => a.atendente_id)
                const atendenteProfile = atendimento?.user_profiles
                const atendenteNome = Array.isArray(atendenteProfile) ? atendenteProfile[0]?.nome : atendenteProfile?.nome

                return {
                    id: row.id,
                    nome: row.nome,
                    telefone: row.telefone,
                    email: row.email,
                    etapa_id: row.etapa_id,
                    etapa_nome: etapa?.nome || '',
                    etapa_cor: etapa?.cor || '#6B7280',
                    tags,
                    atendente_id: atendimento?.atendente_id || null,
                    atendente_nome: atendenteNome || null,
                    ultima_mensagem_at: row.ultima_mensagem_at,
                    mensagens_nao_lidas: row.mensagens_nao_lidas || 0,
                    valor_venda: row.valor_venda,
                    notas: row.notas,
                    criado_em: row.criado_em,
                    atualizado_em: row.atualizado_em,
                }
            })

            return { leads, total: count || 0 }
        },
        enabled: !!orgId,
    })

    // Supabase Realtime para atualizações em tempo real
    useEffect(() => {
        if (!orgId) return

        const channel = supabase
            .channel('leads-table-page')
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'leads',
                filter: `organization_id=eq.${orgId}`
            }, () => {
                // Invalidar queries para refetch
                queryClient.invalidateQueries({ queryKey: ['leads', orgId] })
                queryClient.invalidateQueries({ queryKey: ['leads-metrics', orgId] })
            })
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [orgId])

    return {
        leads: data?.leads || [],
        total: data?.total || 0,
        isLoading,
        refetch,
        // State
        page,
        perPage,
        sortField,
        sortOrder,
        filters,
        // Setters
        setPage,
        setPerPage,
        setSort,
        setSearch,
        setFilters,
        clearFilters,
    }
}
