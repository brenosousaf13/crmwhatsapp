import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
export async function GET(request: Request) {
    try {
        const supabase = await createClient()
        const { searchParams } = new URL(request.url)
        const orgId = searchParams.get('org_id')

        if (!orgId) {
            return NextResponse.json({ error: 'org_id is required' }, { status: 400 })
        }

        // Auth verification
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Get organization details
        const { data: org, error } = await supabase
            .from('organizations')
            .select('*')
            .eq('id', orgId)
            .single()

        if (error) {
            console.error('Error fetching organization:', error)
            return NextResponse.json({ error: 'Failed to fetch organization' }, { status: 500 })
        }

        return NextResponse.json(org)
    } catch (error: unknown) {
        console.error('Error in GET /api/settings/organization:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}

export async function PUT(request: Request) {
    try {
        const supabase = await createClient()

        // 1. Auth verification
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
        }

        // 2. Buscar org do usuário
        const { data: member, error: memberError } = await supabase
            .from('organization_members')
            .select('organization_id')
            .eq('user_id', user.id)
            .single()

        if (memberError || !member) {
            console.error('Erro ao buscar membro:', memberError)
            return NextResponse.json({ error: 'Organização não encontrada' }, { status: 404 })
        }

        // 3. Ler body do request
        const body = await request.json()
        console.log('PUT organization body recebido:', JSON.stringify(body))

        // Extrair apenas campos permitidos (ignorar org_id, id, criado_em, etc)
        const allowedFields = [
            'nome', 'segmento', 'website', 'timezone', 'moeda',
            'phone_format', 'email', 'telefone', 'endereco', 'logo_url'
        ]

        const updateData: Record<string, unknown> = {}
        for (const field of allowedFields) {
            if (body[field] !== undefined) {
                updateData[field] = body[field]
            }
        }

        console.log('Campos a atualizar:', JSON.stringify(updateData))
        console.log('Organization ID:', member.organization_id)

        if (Object.keys(updateData).length === 0) {
            return NextResponse.json({ error: 'Nenhum campo válido para atualizar' }, { status: 400 })
        }

        // 4. Atualizar
        const { data: updatedRows, error: updateError } = await supabase
            .from('organizations')
            .update(updateData)
            .eq('id', member.organization_id)
            .select()

        if (updateError) {
            console.error('Erro no UPDATE:', updateError)
            return NextResponse.json({
                error: 'Falha ao atualizar',
                details: updateError.message,
                code: updateError.code,
                hint: updateError.hint
            }, { status: 500 })
        }

        if (!updatedRows || updatedRows.length === 0) {
            console.error('Nenhuma linha atualizada. Possível bloqueio de RLS (Row Level Security).')
            return NextResponse.json({
                error: 'Acesso negado ou organização não encontrada.',
                details: 'Nenhuma linha foi alterada. Verifique se as políticas RLS (Row Level Security) para UPDATE na tabela organizations estão corretas.'
            }, { status: 403 })
        }

        const updated = updatedRows[0]

        console.log('Organização atualizada com sucesso:', updated?.id)
        return NextResponse.json(updated)

    } catch (err: unknown) {
        const error = err as Error
        console.error('PUT /api/settings/organization erro fatal:', error)
        return NextResponse.json({
            error: 'Erro interno do servidor',
            details: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        }, { status: 500 })
    }
}

export async function DELETE(request: Request) {
    try {
        const supabase = await createClient()
        const { searchParams } = new URL(request.url)
        const orgId = searchParams.get('org_id')

        if (!orgId) {
            return NextResponse.json({ error: 'org_id is required' }, { status: 400 })
        }

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { data: membership, error: memberErr } = await supabase
            .from('organization_members')
            .select('role')
            .eq('organization_id', orgId)
            .eq('user_id', user.id)
            .single()

        if (memberErr || !membership || membership.role !== 'owner') {
            return NextResponse.json({ error: 'Forbidden: Only owners can delete the organization' }, { status: 403 })
        }

        const { error: deleteErr } = await supabase
            .from('organizations')
            .delete()
            .eq('id', orgId)

        if (deleteErr) {
            console.error('Error deleting organization:', deleteErr)
            return NextResponse.json({ error: 'Failed to delete organization' }, { status: 500 })
        }

        return NextResponse.json({ success: true })
    } catch (error: unknown) {
        console.error('Error in DELETE /api/settings/organization:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
