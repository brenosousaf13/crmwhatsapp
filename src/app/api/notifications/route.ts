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
    const limit = parseInt(searchParams.get('limit') || '20', 10)
    const unreadOnly = searchParams.get('unread_only') === 'true'

    let query = supabase
        .from('notifications')
        .select('*')
        .eq('organization_id', member.organization_id)
        .or(`user_id.eq.${user.id},user_id.is.null`)
        .order('criado_em', { ascending: false })
        .limit(limit)

    if (unreadOnly) {
        query = query.eq('lida', false)
    }

    const { data: notifications, error } = await query

    if (error) {
        console.error('Error fetching notifications:', error)
        return NextResponse.json({ error: 'Erro ao buscar notificações' }, { status: 500 })
    }

    // Pega a contagem de não lidas tbm
    const { count } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', member.organization_id)
        .or(`user_id.eq.${user.id},user_id.is.null`)
        .eq('lida', false)

    return NextResponse.json({
        notifications,
        unread_count: count || 0
    })
}

export async function PATCH(request: Request) {
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

    try {
        const { id, read_all } = await request.json()

        if (read_all) {
            // Marcar todas como lidas
            const { error } = await supabase
                .from('notifications')
                .update({ lida: true })
                .eq('organization_id', member.organization_id)
                .or(`user_id.eq.${user.id},user_id.is.null`)
                .eq('lida', false)

            if (error) throw error
            return NextResponse.json({ success: true, message: 'Todas as notificações marcadas como lidas' })
        }

        if (!id) {
            return NextResponse.json({ error: 'ID da notificação é obrigatório' }, { status: 400 })
        }

        // Marcar uma específica como lida
        const { error } = await supabase
            .from('notifications')
            .update({ lida: true })
            .eq('id', id)
            .eq('organization_id', member.organization_id)
            .or(`user_id.eq.${user.id},user_id.is.null`)

        if (error) throw error
        return NextResponse.json({ success: true, message: 'Notificação atualizada' })

    } catch (e) {
        console.error('Error updating notification:', e)
        return NextResponse.json({ error: 'Erro ao atualizar notificação' }, { status: 500 })
    }
}
