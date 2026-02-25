import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import * as pdfParseModule from 'pdf-parse'
import mammoth from 'mammoth'

// Handle ESModule / CommonJS interop issues for the PDF-Parse node package
const pdfParse = (typeof pdfParseModule === 'function')
    ? pdfParseModule
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    : (pdfParseModule as any).default || pdfParseModule

export async function POST(request: Request) {
    try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
        }

        const formData = await request.formData()
        const file = formData.get('file') as File | null
        const organization_id = formData.get('organization_id') as string | null

        if (!file || !organization_id) {
            return NextResponse.json({ error: 'Arquivo ou organization_id ausentes.' }, { status: 400 })
        }

        // 1. Extract Text
        let extractedText = ''
        try {
            const arrayBuffer = await file.arrayBuffer()
            const buffer = Buffer.from(arrayBuffer)
            const type = file.type

            if (type === 'application/pdf') {
                const data = await pdfParse(buffer)
                extractedText = data.text
            }
            else if (type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
                const result = await mammoth.extractRawText({ buffer })
                extractedText = result.value
            }
            else if (
                type === 'text/plain' ||
                type === 'text/csv' ||
                file.name.endsWith('.md')
            ) {
                extractedText = new TextDecoder('utf-8').decode(buffer)
            }
            else {
                return NextResponse.json({ error: 'Formato não suportado para extração.' }, { status: 400 })
            }
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (err: any) {
            return NextResponse.json({ error: 'Falha ao ler conteúdo do arquivo: ' + err.message }, { status: 500 })
        }

        // Limpar texto (remover muitos espaços vazios)
        extractedText = extractedText.replace(/\n\s*\n/g, '\n\n').trim()

        // 2. Upload raw file to Supabase Storage (Optional but good for audit/refuse)
        const fileExt = file.name.split('.').pop()
        const fileName = `${organization_id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`

        // Opcional: só fazer upload do arquivo se quiser manter o original.
        // Vamos fazer o upload
        const { data: uploadData } = await supabase.storage
            .from('ai-knowledge-base')
            .upload(fileName, file)

        // Se falhar o upload do storage, prosseguimos mesmo assim pois o importante é o texto extraído no banco.
        // Mas é bom logar.

        // 3. Inserir no banco de dados
        const { data: docData, error: dbError } = await supabase.from('ai_knowledge_docs').insert({
            organization_id,
            filename: file.name,
            file_size: file.size,
            file_path: uploadData?.path || '',
            content: extractedText,
            char_count: extractedText.length,
            status: 'processed'
        }).select().single()

        if (dbError) {
            throw dbError
        }

        return NextResponse.json({ success: true, document: docData })

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
        console.error('OCR/Upload Error:', error)
        return NextResponse.json(
            { error: 'Erro interno ao processar arquivo.', details: error.message },
            { status: 500 }
        )
    }
}
