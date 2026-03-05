import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const { data: member } = await supabase
        .from('organization_members')
        .select('organization_id')
        .eq('user_id', user.id)
        .single()

    if (!member) {
        return NextResponse.json({ error: 'Organização não encontrada' }, { status: 404 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const type = searchParams.get('type')
    const leadId = searchParams.get('lead_id')
    const limit = parseInt(searchParams.get('limit') || '50', 10)

    let query = supabase
        .from('followups')
        .select(`
            id, tipo, criado_por, agendado_para, executado_em, status, mensagem, mensagem_enviada,
            tentativa_numero, max_tentativas, contexto, motivo, notas, metadata, criado_em, atualizado_em,
            leads (
                 id, nome, telefone, etapa_id
            )
        `)
        .eq('organization_id', member.organization_id)
        .order('agendado_para', { ascending: true })
        .limit(limit)

    if (status) query = query.eq('status', status)
    if (type) query = query.eq('tipo', type)
    if (leadId) query = query.eq('lead_id', leadId)

    const { data, error } = await query

    if (error) {
        console.error('Error fetching followups:', error)
        return NextResponse.json({ error: 'Erro ao buscar followups' }, { status: 500 })
    }

    return NextResponse.json(data)
}

export async function POST(request: Request) {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    const { data: member } = await supabase
        .from('organization_members')
        .select('organization_id')
        .eq('user_id', user.id)
        .single()

    if (!member) return NextResponse.json({ error: 'Organização não encontrada' }, { status: 404 })

    try {
        const payload = await request.json()
        const { lead_id, agendado_para, mensagem, notas, metadata } = payload

        if (!lead_id || !agendado_para) {
            return NextResponse.json({ error: 'lead_id e agendado_para são obrigatórios' }, { status: 400 })
        }

        const { data, error } = await supabase.from('followups').insert({
            organization_id: member.organization_id,
            lead_id,
            criado_por: user.id,
            tipo: 'humano', // Criado pela interface sempre será humano
            agendado_para,
            mensagem,
            notas,
            status: 'pendente',
            metadata: metadata || {}
        }).select().single()

        if (error) throw error

        // Update lead badge
        await supabase.from('leads').update({ followup_ativo: true }).eq('id', lead_id)

        return NextResponse.json(data)

    } catch (e: any) {
        console.error('Error creating followup:', e)
        return NextResponse.json({ error: e.message || 'Erro ao criar followup' }, { status: 500 })
    }
}

export async function PATCH(request: Request) {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    const { data: member } = await supabase
        .from('organization_members')
        .select('organization_id')
        .eq('user_id', user.id)
        .single()

    if (!member) return NextResponse.json({ error: 'Organização não encontrada' }, { status: 404 })

    try {
        const payload = await request.json()
        const { id, status, agendado_para, notas, mensagem } = payload

        if (!id) return NextResponse.json({ error: 'ID do followup é obrigatório' }, { status: 400 })

        const updateData: any = {}
        if (status) updateData.status = status
        if (agendado_para) updateData.agendado_para = agendado_para
        if (notas !== undefined) updateData.notas = notas
        if (mensagem !== undefined) updateData.mensagem = mensagem

        if (status === 'executado') {
            updateData.executado_em = new Date().toISOString()
        }

        const { data, error } = await supabase
            .from('followups')
            .update(updateData)
            .eq('id', id)
            .eq('organization_id', member.organization_id)
            .select()
            .single()

        if (error) throw error

        // If cancelled or executed, check if lead still has active followups
        if (status === 'cancelado' || status === 'executado') {
            const { count } = await supabase.from('followups')
                .select('*', { count: 'exact', head: true })
                .eq('lead_id', data.lead_id)
                .eq('status', 'pendente')

            if (count === 0) {
                await supabase.from('leads').update({ followup_ativo: false }).eq('id', data.lead_id)
            }
        }

        return NextResponse.json(data)

    } catch (e: any) {
        console.error('Error updating followup:', e)
        return NextResponse.json({ error: e.message || 'Erro ao atualizar followup' }, { status: 500 })
    }
}

export async function DELETE(request: Request) {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    const { data: member } = await supabase
        .from('organization_members')
        .select('organization_id')
        .eq('user_id', user.id)
        .single()

    if (!member) return NextResponse.json({ error: 'Organização não encontrada' }, { status: 404 })

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) return NextResponse.json({ error: 'ID do followup é obrigatório' }, { status: 400 })

    const { data: current } = await supabase.from('followups').select('lead_id').eq('id', id).single()

    const { error } = await supabase.from('followups').delete().eq('id', id).eq('organization_id', member.organization_id)

    if (error) {
        return NextResponse.json({ error: 'Erro ao remover followup' }, { status: 500 })
    }

    if (current) {
        const { count } = await supabase.from('followups')
            .select('*', { count: 'exact', head: true })
            .eq('lead_id', current.lead_id)
            .eq('status', 'pendente')

        if (count === 0) {
            await supabase.from('leads').update({ followup_ativo: false }).eq('id', current.lead_id)
        }
    }

    return NextResponse.json({ success: true })
}
