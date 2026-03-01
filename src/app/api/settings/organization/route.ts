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
        const { org_id, ...updateData } = body

        if (!org_id) {
            return NextResponse.json({ error: 'org_id is required' }, { status: 400 })
        }

        // Auth verification
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Validate the user belongs to the org and has permission (RLS handles this but we can add explicit checks if needed)
        // For now, relying on RLS `UPDATE` policies on `organizations` table

        const { data: org, error } = await supabase
            .from('organizations')
            .update(updateData)
            .eq('id', org_id)
            .select()
            .single()

        if (error) {
            console.error('Error updating organization:', error)
            return NextResponse.json({ error: 'Failed to update organization' }, { status: 500 })
        }

        return NextResponse.json(org)
    } catch (error: unknown) {
        console.error('Error in PUT /api/settings/organization:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
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
