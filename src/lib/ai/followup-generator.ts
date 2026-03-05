import { AiConfig } from '@/types/ai'
import { callLlm } from './tools'

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
        const response = await callLlm(aiConfig, {
            systemPrompt: prompt,
            messages: [{ role: 'user', content: 'Crie e me entregue a mensagem seguindo estritamente as regras acima.' }],
            tools: [],
            temperature: 0.8
        })

        return response.text || 'Oi! Conseguiu verificar nossas últimas informações? Estou à disposição se tiver qualquer dúvida 😊'
    } catch (e: unknown) {
        console.error('Falha ao acionar LLM em generateFollowupMessage:', e)
        return 'Oi! Conseguiu verificar as informações que conversamos? Estou por aqui se tiver alguma dúvida 😊'
    }
}
