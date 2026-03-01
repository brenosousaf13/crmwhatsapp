import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { v4 as uuidv4 } from 'uuid'

export interface Organization {
    id: string
    nome: string
    logo_url?: string | null
    segmento?: string | null
    website?: string | null
    timezone?: string
    moeda?: string
    phone_format?: string
    email?: string | null
    telefone?: string | null
    endereco?: string | null
}

export function useOrganization(orgId: string | undefined) {
    const queryClient = useQueryClient()
    const supabase = createClient()

    const { data: organization, isLoading } = useQuery({
        queryKey: ['settings-organization', orgId],
        queryFn: async () => {
            if (!orgId) return null
            const res = await fetch(`/api/settings/organization?org_id=${orgId}`)
            if (!res.ok) throw new Error('Failed to fetch organization')
            return (await res.json()) as Organization
        },
        enabled: !!orgId,
    })

    const updateMutation = useMutation({
        mutationFn: async (data: Partial<Organization>) => {
            if (!orgId) throw new Error('No organization ID provided')
            const res = await fetch(`/api/settings/organization`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            })

            if (!res.ok) {
                const errorBody = await res.json().catch(() => ({}))
                console.error('Erro ao atualizar organização:', errorBody)
                throw new Error(errorBody.details || errorBody.error || 'Falha ao atualizar a organização')
            }

            return res.json()
        },
        onSuccess: () => {
            toast.success('Organização atualizada com sucesso')
            queryClient.invalidateQueries({ queryKey: ['settings-organization', orgId] })
            // Custom event if needed globally
            window.dispatchEvent(new Event('organization-updated'))
        },
        onError: (error: Error) => {
            toast.error('Erro ao atualizar organização: ' + error.message)
        }
    })

    const uploadLogo = async (file: File) => {
        if (!orgId) throw new Error('Missing orgId')

        // 1. Upload to Supabase Storage
        const fileExt = file.name.split('.').pop()
        const fileName = `${orgId}-${uuidv4()}.${fileExt}`
        const filePath = `${orgId}/${fileName}`

        const { error: uploadError } = await supabase.storage
            .from('organization-logos')
            .upload(filePath, file, { upsert: true })

        if (uploadError) {
            throw uploadError
        }

        // 2. Get public URL
        const { data: { publicUrl } } = supabase.storage
            .from('organization-logos')
            .getPublicUrl(filePath)

        // 3. Update Organization
        await updateMutation.mutateAsync({ logo_url: publicUrl })

        return publicUrl
    }

    const removeLogo = async () => {
        if (!orgId || !organization?.logo_url) return

        try {
            // Very basic extraction of the file path from the public URL
            const urlParts = organization.logo_url.split('/organization-logos/')
            if (urlParts.length > 1) {
                const filePath = urlParts[1]
                await supabase.storage.from('organization-logos').remove([filePath])
            }
        } catch (e) {
            console.warn('Failed to delete old logo from storage, but continuing to clear URL', e)
        }

        await updateMutation.mutateAsync({ logo_url: null })
    }

    return {
        organization,
        isLoading,
        updateOrganization: updateMutation.mutateAsync,
        isUpdating: updateMutation.isPending,
        uploadLogo,
        removeLogo
    }
}
