/* eslint-disable @next/next/no-img-element */
'use client'

import { useRef, useState } from "react"
import { Building2, UploadCloud, Trash2, Loader2 } from "lucide-react"
import { toast } from "sonner"

interface LogoUploaderProps {
    currentLogoUrl?: string | null
    onUpload: (file: File) => Promise<string>
    onRemove: () => Promise<void>
}

export function LogoUploader({ currentLogoUrl, onUpload, onRemove }: LogoUploaderProps) {
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [isUploading, setIsUploading] = useState(false)
    const [isRemoving, setIsRemoving] = useState(false)

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        // Validações client-side
        const validTypes = ['image/jpeg', 'image/png']
        if (!validTypes.includes(file.type)) {
            toast.error('Apenas arquivos PNG ou JPG são permitidos.')
            return
        }

        if (file.size > 2 * 1024 * 1024) {
            toast.error('A imagem deve ter no máximo 2MB.')
            return
        }

        setIsUploading(true)
        try {
            await onUpload(file)
        } catch (error: unknown) {
            console.error('Upload falhou:', error)
            const msg = error instanceof Error ? error.message : "Erro desconhecido"
            toast.error('Falha ao enviar a logo: ' + msg)
        } finally {
            setIsUploading(false)
            if (fileInputRef.current) {
                fileInputRef.current.value = ''
            }
        }
    }

    const handleRemove = async () => {
        setIsRemoving(true)
        try {
            await onRemove()
        } catch (error: unknown) {
            console.error('Remoção falhou:', error)
            const msg = error instanceof Error ? error.message : "Erro desconhecido"
            toast.error('Falha ao remover a logo: ' + msg)
        } finally {
            setIsRemoving(false)
        }
    }

    return (
        <div className="flex flex-col space-y-4">
            <h3 className="text-sm font-medium text-gray-700">Logo da empresa</h3>
            <div className="flex items-center gap-6">
                {/* Preview Square */}
                <div className="relative w-32 h-32 rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 flex flex-col items-center justify-center overflow-hidden shrink-0 group">
                    {isUploading ? (
                        <div className="absolute inset-0 z-10 bg-white/50 flex flex-col items-center justify-center text-blue-600">
                            <Loader2 className="w-6 h-6 animate-spin mb-2" />
                            <span className="text-xs font-medium">Enviando...</span>
                        </div>
                    ) : isRemoving ? (
                        <div className="absolute inset-0 z-10 bg-white/50 flex flex-col items-center justify-center text-red-600">
                            <Loader2 className="w-6 h-6 animate-spin mb-2" />
                            <span className="text-xs font-medium">Removendo...</span>
                        </div>
                    ) : null}

                    {currentLogoUrl ? (
                        <img
                            src={currentLogoUrl}
                            alt="Logo da empresa"
                            className="w-full h-full object-contain p-2"
                        />
                    ) : (
                        <Building2 className="w-10 h-10 text-gray-400 mb-2" />
                    )}
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2">
                    <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        accept="image/png, image/jpeg"
                        onChange={handleFileChange}
                    />
                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading || isRemoving}
                        className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                    >
                        <UploadCloud className="w-4 h-4 mr-2" />
                        Alterar logo
                    </button>

                    {currentLogoUrl && (
                        <button
                            type="button"
                            onClick={handleRemove}
                            disabled={isUploading || isRemoving}
                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-red-600 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                        >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Remover logo
                        </button>
                    )}

                    <p className="text-xs text-gray-500 mt-2">
                        PNG ou JPG, máximo 2MB<br />Tamanho recomendado: 128x128px
                    </p>
                </div>
            </div>
        </div>
    )
}
