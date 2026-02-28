import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function PUT(request: Request) {
    try {
        const supabase = await createClient()
        const body = await request.json()
        const { orderedIds, orgId } = body

        if (!orderedIds || !Array.isArray(orderedIds) || !orgId) {
            return NextResponse.json({ error: 'orderedIds and orgId are required' }, { status: 400 })
        }

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Prepare batch update via RPC or individual updates
        // Since Supabase data-api doesn't bulk-update arrays easily without a loop or custom RPC, 
        // we iterate with Promises (acceptable for < 20 stages).
        const updates = orderedIds.map((id, index) =>
            supabase
                .from('etapas_kanban')
                .update({ ordem: index })
                .eq('id', id)
                .eq('organization_id', orgId)
        )

        await Promise.all(updates)

        return NextResponse.json({ success: true })
    } catch (error: any) {
        console.error('Error in PUT /api/settings/kanban-stages/reorder:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
