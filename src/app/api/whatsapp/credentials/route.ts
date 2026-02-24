import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { encrypt } from '@/lib/crypto'

export async function POST(request: Request) {
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
        const { apiUrl, apiToken } = await request.json()

        if (!apiUrl || !apiToken) {
            return NextResponse.json({ error: 'Faltam dados obrigatórios' }, { status: 400 })
        }

        const encryptedToken = encrypt(apiToken)

        // Upsert the credentials for this organization
        const { error } = await supabase
            .from('whatsapp_configs')
            .upsert({
                organization_id: member.organization_id,
                instance_name: "Uazapi",
                api_url: apiUrl,
                api_token: encryptedToken,
                atualizado_em: new Date().toISOString()
            }, { onConflict: 'organization_id' })

        if (error) {
            console.error('Database error saving whatsapp credentials:', error)
            return NextResponse.json({ error: 'Erro ao salvar credenciais' }, { status: 500 })
        }

        return NextResponse.json({ success: true })
    } catch (e) {
        console.error('Error in credentials route:', e)
        return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
    }
}
