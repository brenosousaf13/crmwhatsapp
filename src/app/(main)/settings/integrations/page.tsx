import { WhatsAppIntegrationCard } from './_components/whatsapp-integration-card'

export default function IntegrationsPage() {
  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Integrações</h1>

      <div className="grid gap-6">
        <WhatsAppIntegrationCard />

        {/* Outras possíveis integrações no futuro */}
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm opacity-50 relative overflow-hidden">
          <div className="p-6">
            <h3 className="text-xl font-semibold flex items-center justify-between">
              ✉️ Email
              <span className="text-xs font-semibold px-2 py-1 rounded bg-slate-100 text-slate-500 border">Em breve</span>
            </h3>
            <p className="text-sm text-muted-foreground mt-2">
              Envie e receba e-mails diretamente pela linha do tempo do CRM.
            </p>
          </div>
        </div>

        <div className="rounded-lg border bg-card text-card-foreground shadow-sm opacity-50 relative overflow-hidden">
          <div className="p-6">
            <h3 className="text-xl font-semibold flex items-center justify-between">
              📱 Instagram
              <span className="text-xs font-semibold px-2 py-1 rounded bg-slate-100 text-slate-500 border">Em breve</span>
            </h3>
            <p className="text-sm text-muted-foreground mt-2">
              Integração com Direct Messages do Instagram via Meta Cloud API.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
