import { AiConfig } from '@/types/ai'

interface FollowupContext {
    tentativa_numero: number
    max_tentativas: number
    contexto: string
}

interface LeadContext {
    nome?: string
    etapa_nome?: string
    tags?: string[]
}

export async function generateFollowupMessage(
    followup: FollowupContext,
    lead: LeadContext,
    aiConfig: AiConfig
): Promise<string> {
    const prompt = `Você é o assistente virtual da empresa. Precisa enviar uma mensagem de follow-up para um lead que parou de responder.

CONTEXTO DA ÚLTIMA CONVERSA (as últimas interações entre lead e IA):
${followup.contexto}

INFORMAÇÕES DO LEAD:
- Nome: ${lead.nome || 'Cliente'}
- Etapa atual: ${lead.etapa_nome || 'N/A'}
- Tags ativas: ${lead.tags?.join(', ') || 'nenhuma'}

TENTATIVA ATUAL: ${followup.tentativa_numero} de um total de ${followup.max_tentativas} tentativas.

REGRAS RÍGIDAS (SEJA IMPECÁVEL NISSO):
- Escreva uma mensagem muito curta, máximo de 30 palavras.
- NÃO use markdown (*, **, etc).
- Tom de voz amigável, acolhedor e genuíno, sem parecer que é span/cobrança.
- FAÇA UMA BREVE REFERÊNCIA à última conversa citada para mostrar que não é uma mensagem genérica de massa.
- NUNCA repita "estou entrando em contato novamente", "estou ligando pra", "escrevendo denovo".
- Se esta é a 1ª tentativa: aborde com extrema e naturalidade (como continuar a frase que estava no ar).
- Se esta é a 2ª tentativa: pergunte sutilmente se a pessoa pôde olhar algo ou se tem interesse em avançar.
- Se esta é a 3ª tentativa: feche dizendo que está sempre à disposição, sem forçar respostas ("Deixarei em aberto quando você estiver pronto...").
- USE UM ÚNICO EMOJI (máximo 1).
- NUNCA assuma nem revele que você é uma "Inteligência Artificial" ou robô.

Escreva APENAS O TEXTO da mensagem final agora.`

    try {
        let responseText = ''

        if (aiConfig.provider === 'openai') {
            const res = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${aiConfig.api_key}`
                },
                body: JSON.stringify({
                    model: aiConfig.model,
                    temperature: 0.8,
                    messages: [
                        { role: 'system', content: prompt },
                        { role: 'user', content: 'Crie e me entregue a mensagem seguindo estritamente as regras acima.' }
                    ]
                })
            })
            const data = await res.json()
            if (data.error) throw new Error(data.error.message)
            responseText = data.choices[0]?.message?.content || ''
        } else if (aiConfig.provider === 'anthropic') {
            const res = await fetch('https://api.anthropic.com/v1/messages', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': aiConfig.api_key,
                    'anthropic-version': '2023-06-01'
                },
                body: JSON.stringify({
                    model: aiConfig.model,
                    max_tokens: 150,
                    temperature: 0.8,
                    system: prompt,
                    messages: [{ role: 'user', content: 'Crie e me entregue a mensagem seguindo estritamente as regras acima.' }]
                })
            })
            const data = await res.json()
            if (data.error) throw new Error(data.error.message)
            responseText = data.content?.[0]?.text || ''
        } else if (aiConfig.provider === 'google') {
            const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${aiConfig.model}:generateContent?key=${aiConfig.api_key}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    systemInstruction: { parts: [{ text: prompt }] },
                    contents: [{ role: 'user', parts: [{ text: 'Crie e me entregue a mensagem seguindo estritamente as regras acima.' }] }],
                    generationConfig: { temperature: 0.8 }
                })
            })
            const data = await res.json()
            if (data.error) throw new Error(data.error.message)
            responseText = data.candidates?.[0]?.content?.parts?.[0]?.text || ''
        }

        return responseText.trim() || 'Oi! Conseguiu verificar nossas últimas informações? Estou à disposição se tiver qualquer dúvida 😊'
    } catch (e: unknown) {
        console.error('Falha ao acionar LLM em generateFollowupMessage:', e)
        return 'Oi! Conseguiu verificar as informações que conversamos? Estou por aqui se tiver alguma dúvida 😊'
    }
}
