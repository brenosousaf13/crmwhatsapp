'use client'

import { useRef, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { FileText, Loader2, Trash2, UploadCloud, AlertTriangle } from 'lucide-react'
import { useAiKnowledge } from '@/hooks/ai/useAiKnowledge'
import { toast } from 'sonner'
import { useOrganization } from '@/components/providers/organization-provider'

export function AiKnowledgeTab() {
    const { documents, isLoading, deleteDoc, isDeleting, totalChars } = useAiKnowledge()
    const { organization } = useOrganization()
    const [isUploading, setIsUploading] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        // Validate size (10MB)
        if (file.size > 10 * 1024 * 1024) {
            toast.error('O arquivo não pode exceder 10MB.')
            return
        }

        const allowedTypes = [
            'application/pdf',
            'text/plain',
            'text/csv',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'text/markdown'
        ]

        if (!allowedTypes.includes(file.type) && !file.name.endsWith('.md')) {
            toast.error('Formato não suportado. Envie PDF, TXT, DOCX, CSV ou MD.')
            return
        }

        try {
            setIsUploading(true)
            const formData = new FormData()
            formData.append('file', file)
            formData.append('organization_id', organization?.id || '')

            const res = await fetch('/api/ai/knowledge', {
                method: 'POST',
                body: formData
            })

            if (!res.ok) {
                const errData = await res.json()
                throw new Error(errData.error || 'Erro no upload')
            }

            toast.success('Documento processado com sucesso!')
            if (fileInputRef.current) fileInputRef.current.value = ''

            // The hook will auto-refresh if we invalidate or trigger a re-fetch,
            // but let's just force a window reload or rely on react query polling if needed.
            // Easiest hook-friendly way: just let it refetch on window focus or we can export a refetch fn.
            window.location.reload() // Or ideally we return a refetch() from the hook

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (err: any) {
            toast.error(err.message)
        } finally {
            setIsUploading(false)
        }
    }

    const handleDelete = async (id: string, filename: string) => {
        if (!confirm(`Tem certeza que deseja apagar "${filename}" da mória da IA?`)) return
        try {
            await deleteDoc(id)
            toast.success('Documento removido.')
        } catch {
            toast.error('Erro ao remover documento.')
        }
    }

    return (
        <div className="space-y-8 pb-12">
            <Card>
                <CardHeader>
                    <CardTitle>Base de Conhecimento RAG</CardTitle>
                    <CardDescription>
                        Faça upload de documentos (Catálogos, FAQs, Políticas) que a IA pode consultar durante o atendimento. O conteúdo será extraído em texto e embutido no contexto cerebral do Agente.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">

                    {/* UPLOADER */}
                    <div
                        onClick={() => !isUploading && fileInputRef.current?.click()}
                        className={`flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-xl transition-colors cursor-pointer ${isUploading ? 'bg-gray-100 border-gray-300 dark:bg-gray-800/50 dark:border-gray-700 opacity-70' : 'bg-gray-50 border-gray-300 hover:bg-gray-100 dark:bg-[#1B1F3B]/30 dark:border-gray-700 dark:hover:border-blue-500'
                            }`}
                    >
                        <input
                            type="file"
                            className="hidden"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            accept=".pdf,.txt,.docx,.csv,.md"
                        />
                        {isUploading ? (
                            <div className="flex flex-col items-center text-blue-500">
                                <Loader2 className="w-10 h-10 animate-spin mb-4" />
                                <Label className="font-semibold">Lendo documento e extraindo vetores de texto...</Label>
                                <p className="text-xs text-muted-foreground mt-2">Isso pode levar alguns segundos dependendo do tamanho.</p>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center text-gray-500 hover:text-blue-500 transition-colors">
                                <UploadCloud className="w-10 h-10 mb-4" />
                                <Label className="font-semibold text-base cursor-pointer">Arraste arquivos aqui ou clique para selecionar</Label>
                                <div className="flex gap-2 mt-3 text-xs font-mono bg-gray-200 dark:bg-gray-800 px-3 py-1 rounded-full">
                                    <span>PDF</span> • <span>TXT</span> • <span>DOCX</span> • <span>CSV</span> • <span>MD</span>
                                </div>
                                <p className="text-xs text-muted-foreground mt-3">Tamanho máximo: 10MB por arquivo.</p>
                            </div>
                        )}
                    </div>

                    {/* DOCUMENT LIST */}
                    <div className="space-y-4">
                        <Label className="text-lg font-semibold">Documentos Carregados ({documents?.length || 0})</Label>

                        {isLoading ? (
                            <div className="flex justify-center p-4"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>
                        ) : documents?.length === 0 ? (
                            <div className="p-8 text-center text-muted-foreground bg-gray-50 dark:bg-[#1B1F3B]/10 rounded-lg border border-dashed">
                                Nenhum documento na base de conhecimento.
                            </div>
                        ) : (
                            <div className="grid gap-3">
                                {documents?.map(doc => (
                                    <div key={doc.id} className="flex items-center justify-between p-4 border rounded-lg bg-white dark:bg-[#0B0E1E] shadow-sm">
                                        <div className="flex items-start gap-3">
                                            <div className="mt-1 p-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded">
                                                <FileText size={20} />
                                            </div>
                                            <div>
                                                <h4 className="font-medium text-sm text-gray-900 dark:text-gray-100">{doc.filename}</h4>
                                                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                                                    <span>{(doc.file_size / 1024).toFixed(1)} KB</span>
                                                    <span>•</span>
                                                    <span>Criado em {new Date(doc.criado_em!).toLocaleDateString('pt-BR')}</span>
                                                    <span>•</span>
                                                    <span className="font-mono">{doc.char_count?.toLocaleString()} caracteres</span>
                                                </div>
                                                <div className="mt-2 text-xs flex items-center gap-1">
                                                    Status:
                                                    {doc.status === 'processed' && <span className="text-green-500 font-medium">✅ Processado</span>}
                                                    {doc.status === 'error' && <span className="text-red-500 font-medium">❌ Erro: {doc.error}</span>}
                                                    {doc.status === 'processing' && <span className="text-yellow-500 font-medium">⏳ Processando...</span>}
                                                </div>
                                            </div>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleDelete(doc.id, doc.filename)}
                                            disabled={isDeleting}
                                            className="text-red-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30"
                                        >
                                            <Trash2 size={18} />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="pt-6 border-t flex flex-col items-center sm:flex-row sm:justify-between sm:items-start gap-4">
                        <div>
                            <Label className="text-base">Massa Total da Base:</Label>
                            <p className="text-2xl font-mono font-bold text-blue-600 dark:text-blue-400 mt-1">
                                {totalChars.toLocaleString()} <span className="text-sm font-sans font-normal text-muted-foreground">caracteres (~{Math.round(totalChars / 4)} tokens)</span>
                            </p>
                        </div>

                        {totalChars > 30000 && (
                            <div className="flex items-start gap-3 bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-700 p-3 rounded-lg max-w-md">
                                <AlertTriangle className="w-5 h-5 text-yellow-600 shrink-0 mt-0.5" />
                                <p className="text-xs text-yellow-800 dark:text-yellow-200">
                                    <strong className="block mb-1">Aviso de Performance</strong>
                                    Bases maiores que 30.000 caracteres podem impactar duramente a latência da resposta da IA e inflacionar extremamente seu custo por mensagem. Mantenha apenas os documentos estritamente essenciais para evitar timeout do LLM.
                                </p>
                            </div>
                        )}
                    </div>

                </CardContent>
            </Card>
        </div>
    )
}
