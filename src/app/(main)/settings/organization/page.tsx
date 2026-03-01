'use client'

import { SettingsPageHeader } from "@/components/settings/SettingsPageHeader"
import { OrganizationForm } from "@/components/settings/organization/OrganizationForm"
import { DeleteOrganizationModal } from "@/components/settings/organization/DeleteOrganizationModal"
import { useOrganization } from "@/components/providers/organization-provider"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"

export default function OrganizationSettingsPage() {
    const { organization, isLoading } = useOrganization()

    const handleDeleteOrganization = async () => {
        if (!organization?.id) return

        try {
            const res = await fetch(`/api/settings/organization?org_id=${organization.id}`, {
                method: 'DELETE',
            })

            if (!res.ok) {
                const error = await res.json()
                throw new Error(error.error || 'Falha ao excluir organização')
            }

            toast.success('Organização excluída permanentemente.')
            // Redirecionar para a tela de escolha/criação de nova org (ou login)
            window.location.href = '/' // Isso força o recarregamento total; middleware deve redirecionar prum onboarding ou login se não tiver org
        } catch (error: unknown) {
            if (error instanceof Error) {
                toast.error(error.message)
            } else {
                toast.error("Ocorreu um erro desconhecido.")
            }
        }
    }

    if (isLoading) {
        return (
            <div className="flex h-[400px] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
        )
    }

    if (!organization) {
        return (
            <div className="p-8 text-center text-gray-500">
                Nenhuma organização selecionada.
            </div>
        )
    }

    return (
        <div className="space-y-6 pb-12">
            <SettingsPageHeader
                title="Configurações da Empresa"
                description="Gerencie as informações públicas e preferências de formatação da sua organização."
            />

            <div className="max-w-4xl">
                <OrganizationForm orgId={organization.id} />

                <DeleteOrganizationModal
                    organizationName={organization.nome}
                    onConfirm={handleDeleteOrganization}
                />
            </div>
        </div>
    )
}
