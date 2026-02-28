'use client'

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { LogoUploader } from './LogoUploader'
import { useOrganization } from '@/hooks/settings/useOrganization'
import { Loader2 } from 'lucide-react'

const SEGMENT_OPTIONS = [
    'E-commerce', 'Moda e Confecção', 'Saúde e Bem-estar', 'Educação',
    'Tecnologia', 'Imobiliário', 'Automotivo', 'Alimentação',
    'Serviços Profissionais', 'Beleza e Estética', 'Fitness e Esporte',
    'Turismo e Viagens', 'Marketing e Publicidade', 'Jurídico',
    'Contabilidade', 'Construção Civil', 'Outro'
]

const TIMEZONE_OPTIONS = [
    { value: 'America/Sao_Paulo', label: 'America/Sao_Paulo (GMT-3) — Brasília' },
    { value: 'America/Manaus', label: 'America/Manaus (GMT-4) — Manaus' },
    { value: 'America/Belem', label: 'America/Belem (GMT-3) — Belém' },
    { value: 'America/Fortaleza', label: 'America/Fortaleza (GMT-3) — Fortaleza' },
    { value: 'America/Recife', label: 'America/Recife (GMT-3) — Recife' },
    { value: 'America/Cuiaba', label: 'America/Cuiaba (GMT-4) — Cuiabá' },
    { value: 'America/Porto_Velho', label: 'America/Porto_Velho (GMT-4) — Porto Velho' },
    { value: 'America/Rio_Branco', label: 'America/Rio_Branco (GMT-5) — Rio Branco' },
    { value: 'America/Noronha', label: 'America/Noronha (GMT-2) — Fernando de Noronha' },
]

const formSchema = z.object({
    nome: z.string().min(2, 'Nome é obrigatório').max(100),
    segmento: z.string().optional(),
    website: z.string().url('URL inválida').or(z.literal('')).optional(),
    timezone: z.string().min(1, 'Fuso horário é obrigatório'),
    moeda: z.string().optional(),
    phone_format: z.string().optional(),
    email: z.string().email('Email inválido').or(z.literal('')).optional(),
    telefone: z.string().optional(),
    endereco: z.string().optional(),
})

type FormValues = z.infer<typeof formSchema>

export function OrganizationForm({ orgId }: { orgId: string }) {
    const { organization, isLoading, updateOrganization, isUpdating, uploadLogo, removeLogo } = useOrganization(orgId)

    const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            nome: '',
            segmento: '',
            website: '',
            timezone: 'America/Sao_Paulo',
            moeda: 'BRL',
            phone_format: 'BR',
            email: '',
            telefone: '',
            endereco: ''
        }
    })

    // Sync loaded data to form
    useEffect(() => {
        if (organization) {
            reset({
                nome: organization.nome || '',
                segmento: organization.segmento || '',
                website: organization.website || '',
                timezone: organization.timezone || 'America/Sao_Paulo',
                moeda: organization.moeda || 'BRL',
                phone_format: organization.phone_format || 'BR',
                email: organization.email || '',
                telefone: organization.telefone || '',
                endereco: organization.endereco || ''
            })
        }
    }, [organization, reset])

    const onSubmit = async (data: FormValues) => {
        // Convert empty strings to null for optional database fields
        const payload = Object.entries(data).reduce((acc, [key, value]) => {
            acc[key as keyof FormValues] = value === '' ? null : value
            return acc
        }, {} as any)

        await updateOrganization(payload)
    }

    if (isLoading) {
        return (
            <div className="flex justify-center items-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        )
    }

    return (
        <div className="max-w-4xl bg-white border rounded-xl overflow-hidden shadow-sm">
            <div className="p-6 md:p-8 space-y-8">

                {/* Logo Section */}
                <section>
                    <LogoUploader
                        currentLogoUrl={organization?.logo_url}
                        onUpload={uploadLogo}
                        onRemove={removeLogo}
                    />
                </section>

                <form id="org-settings-form" onSubmit={handleSubmit(onSubmit)} className="space-y-8">

                    {/* Dados da Empresa */}
                    <section className="space-y-4">
                        <div className="border-b pb-2">
                            <h2 className="text-lg font-medium text-gray-900">Dados da Empresa</h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-1">
                                <label className="text-sm font-medium text-gray-700">Nome da empresa *</label>
                                <input
                                    {...register('nome')}
                                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    placeholder="Nome Fantasia ou Razão Social"
                                />
                                {errors.nome && <p className="text-sm text-red-500">{errors.nome.message}</p>}
                            </div>

                            <div className="space-y-1">
                                <label className="text-sm font-medium text-gray-700">Segmento</label>
                                <select
                                    {...register('segmento')}
                                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                                >
                                    <option value="">Selecione o segmento...</option>
                                    {SEGMENT_OPTIONS.map(opt => (
                                        <option key={opt} value={opt}>{opt}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-1 md:col-span-2">
                                <label className="text-sm font-medium text-gray-700">Website</label>
                                <input
                                    {...register('website')}
                                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    placeholder="https://suaempresa.com.br"
                                />
                                {errors.website && <p className="text-sm text-red-500">{errors.website.message}</p>}
                            </div>
                        </div>
                    </section>

                    {/* Localização e Formato */}
                    <section className="space-y-4">
                        <div className="border-b pb-2">
                            <h2 className="text-lg font-medium text-gray-900">Localização e Formato</h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="space-y-1 md:col-span-1">
                                <label className="text-sm font-medium text-gray-700">Fuso horário *</label>
                                <select
                                    {...register('timezone')}
                                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                                >
                                    {TIMEZONE_OPTIONS.map(opt => (
                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                    ))}
                                </select>
                                {errors.timezone && <p className="text-sm text-red-500">{errors.timezone.message}</p>}
                            </div>

                            <div className="space-y-1">
                                <label className="text-sm font-medium text-gray-700">Moeda</label>
                                <select
                                    {...register('moeda')}
                                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                                >
                                    <option value="BRL">BRL - Real Brasileiro (R$)</option>
                                    <option value="USD">USD - Dólar Americano ($)</option>
                                    <option value="EUR">EUR - Euro (€)</option>
                                </select>
                            </div>

                            <div className="space-y-1">
                                <label className="text-sm font-medium text-gray-700">Formato de telefone</label>
                                <select
                                    {...register('phone_format')}
                                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                                >
                                    <option value="BR">Brasil (+55)</option>
                                    <option value="US">Estados Unidos (+1)</option>
                                    <option value="PT">Portugal (+351)</option>
                                </select>
                            </div>
                        </div>
                    </section>

                    {/* Informações de Contato */}
                    <section className="space-y-4">
                        <div className="border-b pb-2">
                            <h2 className="text-lg font-medium text-gray-900">Informações de Contato</h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-1">
                                <label className="text-sm font-medium text-gray-700">Email da empresa</label>
                                <input
                                    type="email"
                                    {...register('email')}
                                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    placeholder="contato@empresa.com.br"
                                />
                                {errors.email && <p className="text-sm text-red-500">{errors.email.message}</p>}
                            </div>

                            <div className="space-y-1">
                                <label className="text-sm font-medium text-gray-700">Telefone da empresa</label>
                                <input
                                    type="tel"
                                    {...register('telefone')}
                                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    placeholder="+55 11 99999-0000"
                                />
                            </div>

                            <div className="space-y-1 md:col-span-2">
                                <label className="text-sm font-medium text-gray-700">Endereço</label>
                                <textarea
                                    {...register('endereco')}
                                    rows={3}
                                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    placeholder="R. Exemplo, 123 - Cidade/UF"
                                />
                            </div>
                        </div>
                    </section>
                </form>
            </div>

            {/* Footer Actions */}
            <div className="bg-gray-50 px-6 py-4 md:px-8 border-t flex justify-end">
                <button
                    type="submit"
                    form="org-settings-form"
                    disabled={isUpdating}
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                    {isUpdating ? (
                        <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Salvando...
                        </>
                    ) : 'Salvar alterações'}
                </button>
            </div>
        </div>
    )
}
