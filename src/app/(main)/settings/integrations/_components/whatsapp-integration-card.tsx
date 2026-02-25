'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { MessageCircle, Settings, LogOut, CheckCircle2 } from 'lucide-react'
import { WhatsAppSetupStepper } from './whatsapp-setup-stepper'

export function WhatsAppIntegrationCard() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [status, setStatus] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [isStepperOpen, setIsStepperOpen] = useState(false)

    const fetchStatus = async () => {
        setLoading(true)
        try {
            const res = await fetch('/api/whatsapp/status')
            if (res.ok) {
                const data = await res.json()
                setStatus(data)
            } else {
                setStatus(null)
            }
        } catch (e) {
            console.error('Failed to fetch whatsapp status', e)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchStatus()
    }, [])

    const handleDisconnect = async () => {
        if (!confirm('Tem certeza? O CRM deixará de receber mensagens do WhatsApp.')) return

        try {
            await fetch('/api/whatsapp/disconnect', { method: 'POST' })
            fetchStatus()
        } catch (e) {
            console.error('Error disconnecting', e)
        }
    }

    const getConnectionBadge = () => {
        if (loading) return <Badge variant="outline" className="text-gray-500 bg-gray-50">Carregando...</Badge>
        if (!status) return <Badge variant="outline" className="text-gray-500 bg-gray-50">⚫ Não configurado</Badge>

        const state = status?.instance?.status
        if (state === 'connected') return <Badge className="bg-green-500 hover:bg-green-600">🟢 Conectado</Badge>
        if (state === 'connecting') return <Badge className="bg-yellow-500 hover:bg-yellow-600 text-white">🟡 Conectando...</Badge>
        return <Badge variant="destructive">🔴 Desconectado</Badge>
    }

    const isConnected = status?.instance?.status === 'connected'

    return (
        <Card className="w-full">
            <CardHeader className="flex flex-row items-start justify-between pb-2">
                <div>
                    <CardTitle className="text-xl flex items-center gap-2">
                        <MessageCircle className="w-5 h-5 text-green-500" />
                        WhatsApp (via uazapi)
                    </CardTitle>
                    <CardDescription className="mt-2 text-sm max-w-lg">
                        Conecte sua conta do WhatsApp para receber e enviar mensagens diretamente pelo CRM.
                        Recomendamos usar WhatsApp Business para maior estabilidade.
                    </CardDescription>
                </div>
                {getConnectionBadge()}
            </CardHeader>
            <CardContent className="mt-4">
                {isConnected ? (
                    <div className="bg-slate-50 border border-slate-100 rounded-lg p-4 space-y-4">
                        <div className="flex items-center gap-4">
                            {status?.instance?.profilePicUrl ? (
                                <>
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src={status.instance.profilePicUrl} alt="Profile" className="w-12 h-12 rounded-full border border-gray-200" />
                                </>
                            ) : (
                                <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
                                    <MessageCircle className="w-6 h-6 text-gray-400" />
                                </div>
                            )}
                            <div>
                                <p className="font-semibold text-gray-900">{status?.instance?.profileName || 'WhatsApp Profil'}</p>
                                <p className="text-sm text-gray-500">
                                    {status?.status?.jid?.user ? `+${status.status.jid.user}` : 'Número não disponível'}
                                </p>
                                {status?.instance?.isBusiness && (
                                    <Badge variant="secondary" className="mt-1 text-xs">WhatsApp Business</Badge>
                                )}
                            </div>
                        </div>

                        <div className="flex items-center gap-2 text-sm text-gray-600 bg-green-50 text-green-700 px-3 py-2 rounded-md border border-green-100">
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Webhook: Ativo e monitorando eventos de mensagens</span>
                        </div>

                        <div className="flex items-center gap-2 pt-2">
                            <Button variant="outline" size="sm" onClick={() => setIsStepperOpen(true)}>
                                <Settings className="w-4 h-4 mr-2" />
                                Reconfigurar
                            </Button>
                            <Button variant="destructive" size="sm" onClick={handleDisconnect}>
                                <LogOut className="w-4 h-4 mr-2" />
                                Desconectar
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div>
                        <Button onClick={() => setIsStepperOpen(true)} disabled={loading}>
                            Configurar Integração
                        </Button>
                    </div>
                )}
            </CardContent>

            <WhatsAppSetupStepper
                open={isStepperOpen}
                onOpenChange={setIsStepperOpen}
                onComplete={fetchStatus}
            />
        </Card>
    )
}
