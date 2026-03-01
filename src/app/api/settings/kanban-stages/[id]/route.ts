import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function DELETE(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const supabase = await createClient()
        const { id } = params
        const body = await request.json()
        const { moveToStageId, orgId } = body

        if (!id || !orgId) {
            return NextResponse.json({ error: 'Stage ID and orgId are required' }, { status: 400 })
        }

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Valida se o targetStageId pertence à mesma organização
        if (moveToStageId) {
            const { data: targetStage, error: targetError } = await supabase
                .from('etapas_kanban')
                .select('id')
                .eq('id', moveToStageId)
                .eq('organization_id', orgId)
                .single()

            if (targetError || !targetStage) {
                return NextResponse.json({ error: 'Etapa de destino inválida para esta organização.' }, { status: 400 })
            }
        }

        // Update leads se necessário
        if (moveToStageId) {
            const { error: moveError } = await supabase
                .from('leads')
                .update({ etapa_id: moveToStageId })
                .eq('etapa_id', id)
                .eq('organization_id', orgId)

            if (moveError) throw moveError
        }

        // Deleta a etapa (agora vazia)
        const { error: deleteError } = await supabase
            .from('etapas_kanban')
            .delete()
            .eq('id', id)
            .eq('organization_id', orgId)

        if (deleteError) {
            // Retorna erro amigável se violar foreign key (caso leads existam e moveToStageId não foi fornecido)
            if (deleteError.code === '23503') {
                return NextResponse.json({ error: 'Não é possível excluir a etapa. Existem leads nela. Por favor, especifique uma etapa de destino.' }, { status: 400 })
            }
            throw deleteError
        }

        return NextResponse.json({ success: true })
    } catch (error: unknown) {
        console.error(`Error in DELETE /api/settings/kanban-stages/[id]:`, error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
