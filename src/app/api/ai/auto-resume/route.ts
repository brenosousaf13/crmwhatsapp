import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function createAdminClient() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
}

// Ensure the function can run on a schedule
export const maxDuration = 60;

// E.g: Cron job calls this endpoint every hour via Vercel Cron or external service
export async function GET(request: Request) {
    try {
        const authHeader = request.headers.get('authorization')
        if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
            // Uncomment in production to secure the route
            // return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const supabase = createAdminClient()

        // Find leads paused for more than 24 hours
        // Usually, if a human paused it, they might want it paused permanently,
        // but perhaps 'out_of_hours' pauses should auto-resume next morning.

        const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

        const { data, error } = await supabase
            .from('leads')
            .update({
                ia_pausada: false,
                ia_pausada_por: null,
                ia_pausada_em: null
            })
            .eq('ia_pausada', true)
            .eq('ia_pausada_por', 'out_of_hours')
            .lt('ia_pausada_em', yesterday)
            .select('id')

        if (error) throw error

        return NextResponse.json({
            success: true,
            resumed_count: data?.length || 0
        })
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
