'use client'

import { useState, useEffect } from 'react'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Check, Loader2, QrCode, Smartphone, CheckCircle2, MessageCircle } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useOrganization } from '@/components/providers/organization-provider'

interface WhatsAppSetupStepperProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onComplete: () => void
}

type Step = 1 | 2 | 3

export function WhatsAppSetupStepper({ open, onOpenChange, onComplete }: WhatsAppSetupStepperProps) {
    const [step, setStep] = useState<Step>(1)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [successMessage, setSuccessMessage] = useState<string | null>(null)

    // Step 1: Credentials
    const [apiUrl, setApiUrl] = useState('')
    const [apiToken, setApiToken] = useState('')

    // Step 2: Connection
    const [connectMode, setConnectMode] = useState<'qr' | 'pair'>('qr')
    const [qrCode, setQrCode] = useState<string | null>(null)
    const [pairCode, setPairCode] = useState<string | null>(null)
    const [phoneNumber, setPhoneNumber] = useState('')
    const [pollingActive, setPollingActive] = useState(false)

    // Step 3: Webhook
    const { organization } = useOrganization()
    const [copied, setCopied] = useState(false)
    const [webhookBaseUrl, setWebhookBaseUrl] = useState('')
    const [configuringWebhook, setConfiguringWebhook] = useState(false)

    // Pre-fill with current origin when the modal opens on step 3
    useEffect(() => {
        if (step === 3 && !webhookBaseUrl && typeof window !== 'undefined') {
            setWebhookBaseUrl(window.location.origin)
        }
    }, [step, webhookBaseUrl])

    const fullWebhookUrl = webhookBaseUrl && organization
        ? `${webhookBaseUrl.replace(/\/$/, '')}/api/webhooks/whatsapp?org=${organization.id}`
        : ''

    // Reset state when modal opens/closes
    useEffect(() => {
        if (!open) {
            setStep(1)
            setError(null)
            setSuccessMessage(null)
            setPollingActive(false)
            setQrCode(null)
            setPairCode(null)
        }
    }, [open])

    // Polling logic for connection status
    useEffect(() => {
        let interval: NodeJS.Timeout

        if (pollingActive && step === 2) {
            interval = setInterval(async () => {
                try {
                    const res = await fetch('/api/whatsapp/status')
                    if (res.ok) {
                        const data = await res.json()
                        if (data?.instance?.status === 'connected') {
                            setPollingActive(false)
                            setSuccessMessage(`Conectado como ${data?.instance?.profileName || 'WhatsApp'}`)
                            setTimeout(() => {
                                setStep(3)
                                setSuccessMessage(null)
                                setError(null)
                            }, 2000)
                        }
                    }
                } catch (e) {
                    console.error('Polling error', e)
                }
            }, 3000)
        }

        return () => {
            if (interval) clearInterval(interval)
        }
    }, [pollingActive, step])

    const handleTestCredentials = async () => {
        setLoading(true)
        setError(null)
        setSuccessMessage(null)

        try {
            // First we need to save the credentials so the proxy can use them,
            // but wait, we need an endpoint to save without validating, or we validate first?
            // Since the user asked to save and advance:
            // The /api/whatsapp/status depends on whatsapp_configs.
            // We need a way to pass them directly or save them first.
            // Let's create an endpoint to save the credentials first, or let's use a specialized save endpoint.

            // To be robust, let's assume we have an endpoint /api/whatsapp/credentials
            const res = await fetch('/api/whatsapp/credentials', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ apiUrl, apiToken })
            })

            if (!res.ok) throw new Error('Falha ao salvar credenciais')

            // Now test status
            const statusRes = await fetch('/api/whatsapp/status')
            if (statusRes.ok) {
                const data = await statusRes.json()
                if (data?.instance?.status === 'connected') {
                    setSuccessMessage('Conexão válida! Já está conectado.')
                    setTimeout(() => setStep(3), 1500)
                } else {
                    setSuccessMessage('Credenciais válidas! Vamos conectar.')
                    setTimeout(() => {
                        setStep(2)
                        setSuccessMessage(null)
                        startConnection('qr') // auto start QR
                    }, 1500)
                }
            } else {
                setError('Token inválido ou expirado')
            }
        } catch (err) {
            const error = err as Error
            setError(error.message || 'Erro de rede. Verifique a URL.')
        } finally {
            setLoading(false)
        }
    }

    const startConnection = async (mode: 'qr' | 'pair') => {
        setLoading(true)
        setError(null)
        setQrCode(null)
        setPairCode(null)
        setPollingActive(false)

        try {
            const body = mode === 'pair' ? { phone: phoneNumber } : {}
            const res = await fetch('/api/whatsapp/connect', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            })

            if (!res.ok) throw new Error('Não foi possível gerar código')

            const data = await res.json()
            if (data?.instance?.qrcode) setQrCode(data.instance.qrcode)
            if (data?.instance?.paircode) setPairCode(data.instance.paircode)

            setPollingActive(true)
        } catch (err) {
            const error = err as Error
            setError(error.message)
        } finally {
            setLoading(false)
        }
    }

    const handleCopyWebhook = async () => {
        try {
            await navigator.clipboard.writeText(fullWebhookUrl)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
            setSuccessMessage('URL copiada para a área de transferência!')
        } catch {
            setError('Falha ao copiar URL')
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>Configurar WhatsApp</DialogTitle>
                    <DialogDescription>
                        Integre o CRM com sua instância da uazapi em 3 passos simples.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex items-center justify-between mb-8 mt-4">
                    <div className={`flex flex-col items-center flex-1 ${step >= 1 ? 'text-blue-600' : 'text-gray-400'}`}>
                        <div className="w-8 h-8 rounded-full flex items-center justify-center border-2 border-current bg-white z-10 font-bold mb-2">
                            {step > 1 ? <Check className="w-4 h-4" /> : '1'}
                        </div>
                        <span className="text-xs font-medium">Credenciais</span>
                    </div>
                    <div className="h-[2px] w-full bg-gray-200 absolute -z-10 mt-[-20px]" />
                    <div className={`flex flex-col items-center flex-1 ${step >= 2 ? 'text-blue-600' : 'text-gray-400'}`}>
                        <div className="w-8 h-8 rounded-full flex items-center justify-center border-2 border-current bg-white z-10 font-bold mb-2">
                            {step > 2 ? <Check className="w-4 h-4" /> : '2'}
                        </div>
                        <span className="text-xs font-medium">Conexão</span>
                    </div>
                    <div className={`flex flex-col items-center flex-1 ${step >= 3 ? 'text-blue-600' : 'text-gray-400'}`}>
                        <div className="w-8 h-8 rounded-full flex items-center justify-center border-2 border-current bg-white z-10 font-bold mb-2">
                            {step > 3 ? <Check className="w-4 h-4" /> : '3'}
                        </div>
                        <span className="text-xs font-medium">Webhook</span>
                    </div>
                </div>

                {error && (
                    <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm mb-4 border border-red-100">
                        {error}
                    </div>
                )}
                {successMessage && (
                    <div className="bg-green-50 text-green-700 p-3 rounded-md text-sm mb-4 border border-green-100 flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4" />
                        {successMessage}
                    </div>
                )}

                {step === 1 && (
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="apiUrl">URL da API *</Label>
                            <Input
                                id="apiUrl"
                                placeholder="https://api.uazapi.com"
                                value={apiUrl}
                                onChange={e => setApiUrl(e.target.value)}
                            />
                            <p className="text-xs text-gray-500">Ex: https://free.uazapi.com ou sua URL customizada</p>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="apiToken">Token da Instância *</Label>
                            <Input
                                id="apiToken"
                                type="password"
                                placeholder="..."
                                value={apiToken}
                                onChange={e => setApiToken(e.target.value)}
                            />
                            <p className="text-xs text-gray-500">Token fornecido ao criar a instância na uazapi</p>
                        </div>

                        <div className="flex justify-end pt-4">
                            <Button
                                onClick={handleTestCredentials}
                                disabled={!apiUrl || !apiToken || loading}
                            >
                                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                Testar conexão e Próximo
                            </Button>
                        </div>
                    </div>
                )}

                {step === 2 && (
                    <div className="space-y-4">
                        <Tabs defaultValue={connectMode} onValueChange={(v) => {
                            const mode = v as 'qr' | 'pair'
                            setConnectMode(mode)
                            startConnection(mode)
                        }}>
                            <TabsList className="grid w-full grid-cols-2">
                                <TabsTrigger value="qr" className="flex items-center gap-2">
                                    <QrCode className="w-4 h-4" /> QR Code
                                </TabsTrigger>
                                <TabsTrigger value="pair" className="flex items-center gap-2">
                                    <Smartphone className="w-4 h-4" /> Pareamento
                                </TabsTrigger>
                            </TabsList>

                            <TabsContent value="qr" className="flex flex-col items-center justify-center p-6 border rounded-lg mt-4 bg-slate-50 min-h-[300px]">
                                {qrCode ? (
                                    <>
                                        <img src={qrCode} alt="WhatsApp QR Code" className="w-64 h-64 border p-2 bg-white rounded-md shadow-sm" />
                                        <p className="text-sm font-medium text-gray-600 mt-4 animate-pulse">Aguardando leitura...</p>
                                    </>
                                ) : (
                                    <div className="flex flex-col items-center text-gray-400">
                                        <Loader2 className="w-8 h-8 animate-spin mb-4" />
                                        <p>Gerando QR Code...</p>
                                    </div>
                                )}
                                <Button variant="outline" size="sm" className="mt-6" onClick={() => startConnection('qr')}>
                                    🔄 Gerar novo QR Code
                                </Button>
                            </TabsContent>

                            <TabsContent value="pair" className="space-y-4 pt-4">
                                <div className="space-y-2">
                                    <Label>Número do WhatsApp (com DDD e DDI) *</Label>
                                    <div className="flex gap-2">
                                        <Input
                                            placeholder="Ex: 5511999999999"
                                            value={phoneNumber}
                                            onChange={e => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                                        />
                                        <Button onClick={() => startConnection('pair')} disabled={loading || phoneNumber.length < 10}>
                                            Gerar Código
                                        </Button>
                                    </div>
                                </div>

                                {pairCode && (
                                    <div className="flex flex-col items-center justify-center p-6 border rounded-lg bg-slate-50 mt-4">
                                        <p className="text-sm text-gray-500 mb-2">Seu código de pareamento:</p>
                                        <div className="text-4xl font-black text-blue-600 tracking-widest bg-white px-8 py-4 rounded-lg shadow-sm border border-blue-100">
                                            {pairCode.slice(0, 4)} - {pairCode.slice(4)}
                                        </div>
                                        <p className="text-sm font-medium text-gray-600 mt-6 animate-pulse">Aguardando pareamento...</p>
                                    </div>
                                )}
                            </TabsContent>
                        </Tabs>
                    </div>
                )}

                {step === 3 && (
                    <div className="space-y-6">
                        <div className="bg-slate-50 p-4 border rounded-lg">
                            <h4 className="font-semibold text-gray-900 flex items-center gap-2 mb-2">
                                <MessageCircle className="w-4 h-4 text-primary" />
                                Configuração do Webhook
                            </h4>
                            <p className="text-sm text-gray-600">
                                O webhook permite que o CRM receba mensagens do WhatsApp em tempo real.
                            </p>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label>URL base do seu CRM (precisa ser pública)</Label>
                                <Input
                                    placeholder="https://seudominio.vercel.app"
                                    value={webhookBaseUrl}
                                    onChange={e => setWebhookBaseUrl(e.target.value)}
                                />
                                <p className="text-xs text-gray-500">
                                    Se estiver rodando local, use uma URL pública (ngrok ou deploy). Ex: https://meucrm.vercel.app
                                </p>
                            </div>

                            {fullWebhookUrl && (
                                <div className="space-y-2">
                                    <Label>URL completa do webhook</Label>
                                    <div className="flex gap-2">
                                        <Input value={fullWebhookUrl} readOnly className="bg-gray-100 font-mono text-xs" />
                                        <Button variant="secondary" size="sm" onClick={handleCopyWebhook} className="shrink-0">
                                            {copied ? '✓' : 'Copiar'}
                                        </Button>
                                    </div>
                                </div>
                            )}

                            <Button
                                className="w-full bg-green-600 hover:bg-green-700"
                                onClick={async () => {
                                    if (!fullWebhookUrl) return
                                    setConfiguringWebhook(true)
                                    setError(null)
                                    try {
                                        const res = await fetch('/api/whatsapp/webhook', {
                                            method: 'POST',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({ webhookUrl: fullWebhookUrl })
                                        })
                                        if (!res.ok) {
                                            const err = await res.json().catch(() => ({}))
                                            throw new Error(err.error || 'Falha ao configurar webhook')
                                        }
                                        setSuccessMessage('Webhook configurado com sucesso na uazapi!')
                                    } catch (err) {
                                        const error = err as Error
                                        setError(error.message)
                                    } finally {
                                        setConfiguringWebhook(false)
                                    }
                                }}
                                disabled={!fullWebhookUrl || configuringWebhook || webhookBaseUrl.includes('localhost')}
                            >
                                {configuringWebhook && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                Configurar Webhook Automaticamente
                            </Button>

                            {webhookBaseUrl.includes('localhost') && (
                                <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-md text-sm text-yellow-800">
                                    ⚠️ URLs localhost não podem receber webhooks externos. Use a URL do seu deploy (Vercel, etc.) ou configure um túnel com ngrok.
                                </div>
                            )}
                        </div>

                        <div className="flex justify-between pt-4 border-t">
                            <Button variant="outline" onClick={() => {
                                onComplete()
                                onOpenChange(false)
                            }}>
                                Pular por agora
                            </Button>

                            <Button onClick={() => {
                                onComplete()
                                onOpenChange(false)
                            }}>
                                Concluir Configuração
                            </Button>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    )
}
