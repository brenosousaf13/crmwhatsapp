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
        const body = await request.json()

        // 1. Auth verification
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // 2. Load context membership
        const { data: member } = await supabase
            .from('organization_members')
            .select('organization_id, role')
            .eq('user_id', user.id)
            .single()

        if (!member) {
            return NextResponse.json({ error: 'Forbidden: No valid organization found' }, { status: 403 })
        }

        // 3. Permitted fields whitelisting
        const allowedFields = [
            'nome', 'segmento', 'website', 'timezone', 'moeda',
            'phone_format', 'email', 'telefone', 'endereco', 'logo_url'
        ]
        const updateData: Record<string, any> = {}
        for (const field of allowedFields) {
            if (body[field] !== undefined) {
                updateData[field] = body[field]
            }
        }

        if (Object.keys(updateData).length === 0) {
            return NextResponse.json({ error: 'No valid fields provided to update.' }, { status: 400 })
        }

        // 4. Update targeting internal auth session token (RLS validates owner)
        const { data: org, error } = await supabase
            .from('organizations')
            .update(updateData)
            .eq('id', member.organization_id)
            .select()
            .single()

        if (error) {
            console.error('Error updating organization:', error)
            return NextResponse.json({ error: 'Failed to update organization', details: error.message }, { status: 500 })
        }

        return NextResponse.json(org)
    } catch (error: any) {
        console.error('Error in PUT /api/settings/organization:', error)
        return NextResponse.json({ error: 'Internal Server Error', details: error?.message || String(error) }, { status: 500 })
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
