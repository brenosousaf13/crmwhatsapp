import { SupabaseClient } from '@supabase/supabase-js'

export async function addTagToLead(supabase: SupabaseClient, leadId: string, organizationId: string, tagName: string) {
    // Buscar ou criar a tag
    let { data: tag } = await supabase
        .from('tags')
        .select('id')
        .eq('organization_id', organizationId)
        .ilike('nome', tagName)
        .single()

    if (!tag) {
        // Tag não existe — criar com cor aleatória
        const colors = ['#3B82F6', '#22C55E', '#EAB308', '#F97316', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6']
        const randomColor = colors[Math.floor(Math.random() * colors.length)]

        const { data: newTag } = await supabase
            .from('tags')
            .insert({
                organization_id: organizationId,
                nome: tagName,
                cor: randomColor
            })
            .select()
            .single()

        tag = newTag
    }

    if (!tag) return

    // Verificar se já tem a tag
    const { data: existing } = await supabase
        .from('lead_tags')
        .select('id')
        .eq('lead_id', leadId)
        .eq('tag_id', tag.id)
        .maybeSingle()

    if (existing) return // Já tem

    // Associar
    await supabase.from('lead_tags').insert({
        lead_id: leadId,
        tag_id: tag.id,
        organization_id: organizationId
    })
}

export async function executeToolCall(
    supabase: SupabaseClient,
    toolCall: { name: string; arguments: Record<string, unknown> },
    lead: Record<string, unknown>,
    organizationId: string,
    aiConfig: Record<string, unknown>
) {
    const { name, arguments: args } = toolCall

    switch (name) {

        // ─────────────────────────────────────────────────────
        // MOVER LEAD DE ETAPA
        // ─────────────────────────────────────────────────────
        case 'mover_lead_etapa': {
            // Buscar etapa pelo nome (busca flexível)
            const { data: etapas } = await supabase
                .from('etapas_kanban')
                .select('id, nome')
                .eq('organization_id', organizationId)

            // Encontrar a etapa mais parecida com o nome fornecido pela IA
            const targetStage = etapas?.find(e =>
                e.nome.toLowerCase().includes((args.etapa_nome as string).toLowerCase()) ||
                (args.etapa_nome as string).toLowerCase().includes(e.nome.toLowerCase())
            )

            if (!targetStage) {
                console.warn(`[IA] Etapa "${args.etapa_nome}" não encontrada. Etapas disponíveis:`, etapas?.map(e => e.nome))
                return
            }

            if (targetStage.id === lead.etapa_id) return // Já está nesta etapa

            // Buscar nome da etapa atual para o evento
            const { data: currentStage } = await supabase
                .from('etapas_kanban')
                .select('nome')
                .eq('id', lead.etapa_id)
                .single()

            await supabase
                .from('leads')
                .update({ etapa_id: targetStage.id })
                .eq('id', lead.id)

            await supabase.from('lead_events').insert({
                lead_id: lead.id,
                organization_id: organizationId,
                tipo: 'etapa_alterada',
                descricao: `IA moveu de "${currentStage?.nome}" para "${targetStage.nome}". Motivo: ${args.motivo || 'N/A'}`,
                metadata: { de: currentStage?.nome, para: targetStage.nome, motivo: args.motivo, por: 'ia' }
            })

            console.log(`[IA] Lead ${lead.id} movido para "${targetStage.nome}"`)
            break
        }

        // ─────────────────────────────────────────────────────
        // QUALIFICAR LEAD
        // ─────────────────────────────────────────────────────
        case 'qualificar_lead': {
            // Mover para a etapa de qualificação configurada
            const targetStageId = aiConfig.qualified_stage_id

            if (targetStageId) {
                const { data: currentStage } = await supabase
                    .from('etapas_kanban')
                    .select('nome')
                    .eq('id', lead.etapa_id)
                    .single()

                const { data: targetStage } = await supabase
                    .from('etapas_kanban')
                    .select('nome')
                    .eq('id', targetStageId)
                    .single()

                await supabase
                    .from('leads')
                    .update({ etapa_id: targetStageId })
                    .eq('id', lead.id)

                await supabase.from('lead_events').insert({
                    lead_id: lead.id,
                    organization_id: organizationId,
                    tipo: 'qualificado_ia',
                    descricao: `IA qualificou o lead (score: ${args.score || 'N/A'}). Motivo: ${args.motivo}. Movido para "${targetStage?.nome}".`,
                    metadata: {
                        de: currentStage?.nome,
                        para: targetStage?.nome,
                        score: args.score,
                        motivo: args.motivo,
                        por: 'ia'
                    }
                })

                console.log(`[IA] Lead ${lead.id} qualificado e movido para "${targetStage?.nome}"`)
            } else {
                console.warn('[IA] qualified_stage_id não configurado — qualificação sem movimentação de etapa')
            }

            // Adicionar tag "Qualificado pela IA"
            await addTagToLead(supabase, lead.id as string, organizationId, 'Qualificado pela IA')

            // Salvar nota com o motivo
            await supabase.from('lead_notas').insert({
                lead_id: lead.id,
                organization_id: organizationId,
                conteudo: `🤖 Lead qualificado pela IA.\nScore: ${args.score || 'N/A'}/10\nMotivo: ${args.motivo}`,
                criado_por: null
            })

            break
        }

        // ─────────────────────────────────────────────────────
        // ADICIONAR TAG (REMOVIDO A PEDIDO DO USUÁRIO)
        // ─────────────────────────────────────────────────────
        case 'adicionar_tag': {
            console.log(`[IA] Tool adicionar_tag chamada, mas ignorada (desativada)`)
            break
        }

        // ─────────────────────────────────────────────────────
        // REGISTRAR INFORMAÇÃO
        // ─────────────────────────────────────────────────────
        case 'registrar_info': {
            const campo = args.campo
            const valor = args.valor

            switch (campo) {
                case 'email': {
                    await supabase
                        .from('leads')
                        .update({ email: valor })
                        .eq('id', lead.id)

                    await supabase.from('lead_events').insert({
                        lead_id: lead.id,
                        organization_id: organizationId,
                        tipo: 'info_registrada',
                        descricao: `IA registrou email: ${valor}`,
                        metadata: { campo: 'email', valor, por: 'ia' }
                    })

                    console.log(`[IA] Email "${valor}" registrado no lead ${lead.id}`)
                    break
                }

                case 'observacoes': {
                    // Criar nota no lead
                    await supabase.from('lead_notas').insert({
                        lead_id: lead.id,
                        organization_id: organizationId,
                        conteudo: `🤖 ${valor}`,
                        criado_por: null
                    })

                    await supabase.from('lead_events').insert({
                        lead_id: lead.id,
                        organization_id: organizationId,
                        tipo: 'info_registrada',
                        descricao: `IA registrou observação: ${valor}`,
                        metadata: { campo: 'observacoes', valor, por: 'ia' }
                    })

                    console.log(`[IA] Observação registrada no lead ${lead.id}: ${valor}`)
                    break
                }

                case 'orcamento_monetario_reais': {
                    const numericValue = parseFloat((valor as string).replace(/[^\d.,]/g, '').replace(',', '.')) || 0

                    await supabase
                        .from('leads')
                        .update({ valor_potencial: numericValue })
                        .eq('id', lead.id)

                    // Também salva como nota para histórico
                    await supabase.from('lead_notas').insert({
                        lead_id: lead.id,
                        organization_id: organizationId,
                        conteudo: `Orçamento financeiro informado: R$ ${numericValue}`,
                        criado_por: null
                    })
                    await supabase.from('lead_events').insert({
                        lead_id: lead.id,
                        organization_id: organizationId,
                        tipo: 'info_registrada',
                        descricao: `IA registrou orçamento monetário: R$ ${numericValue.toLocaleString('pt-BR')}`,
                        metadata: { campo: 'orcamento_monetario_reais', valor: numericValue, por: 'ia' }
                    })

                    console.log(`[IA] Orçamento monetário R$${numericValue} registrado no lead ${lead.id}`)
                    break
                }

                case 'produto_interesse': {
                    // Adicionar na aba de Notas apenas
                    await supabase.from('lead_notas').insert({
                        lead_id: lead.id,
                        organization_id: organizationId,
                        conteudo: `Interesse demonstrado: ${valor}`,
                        criado_por: null
                    })

                    await supabase.from('lead_events').insert({
                        lead_id: lead.id,
                        organization_id: organizationId,
                        tipo: 'info_registrada',
                        descricao: `IA detectou interesse em: ${valor}`,
                        metadata: { campo: 'produto_interesse', valor, por: 'ia' }
                    })

                    console.log(`[IA] Interesse "${valor}" registrado no lead ${lead.id}`)
                    break
                }

                default:
                    console.warn(`[IA] Campo desconhecido no registrar_info: ${campo}`)
            }
            break
        }

        // ─────────────────────────────────────────────────────
        // TRANSFERIR PARA HUMANO
        // ─────────────────────────────────────────────────────
        case 'transferir_humano': {
            await supabase
                .from('leads')
                .update({
                    ia_pausada: true,
                    ia_pausada_em: new Date().toISOString(),
                    ia_pausada_por: 'tool'
                })
                .eq('id', lead.id)

            await supabase.from('lead_events').insert({
                lead_id: lead.id,
                organization_id: organizationId,
                tipo: 'transferido_humano',
                descricao: `IA transferiu para humano. Motivo: ${args.motivo}`,
                metadata: { motivo: args.motivo, por: 'ia' }
            })

            console.log(`[IA] Lead ${lead.id} transferido para humano. Motivo: ${args.motivo}`)
            break
        }

        // ─────────────────────────────────────────────────────
        // ENCERRAR CONVERSA
        // ─────────────────────────────────────────────────────
        case 'encerrar_conversa': {
            await supabase.from('lead_events').insert({
                lead_id: lead.id,
                organization_id: organizationId,
                tipo: 'conversa_encerrada',
                descricao: `IA encerrou a conversa. Motivo: ${args.motivo}`,
                metadata: { motivo: args.motivo, por: 'ia' }
            })

            console.log(`[IA] Conversa encerrada para lead ${lead.id}. Motivo: ${args.motivo}`)
            break
        }

        default:
            console.warn(`[IA] Tool desconhecida: ${name}`)
    }
}

// ===============================================
// TOOL DEFINITIONS & PROMPTS INJECTION HELPERS
// ===============================================

export function buildSystemPromptWithToolInstructions(
    userPrompt: string,
    enabledTools: string[],
    aiConfig: Record<string, unknown>
): string {
    let prompt = userPrompt

    if (!enabledTools || enabledTools.length === 0) return prompt

    // Injetar instruções de tools automaticamente
    const toolInstructions: string[] = []

    toolInstructions.push(`\n\n---\n\n## INSTRUÇÕES AUTOMÁTICAS DO SISTEMA (não alterar)\n`)
    toolInstructions.push(`Você tem acesso a ferramentas (tools) que executam ações reais no CRM. Use-as ativamente quando apropriado.\n`)

    if (enabledTools.includes('mover_lead_etapa')) {
        const kanbanNames = Array.isArray(aiConfig.kanban_stages) && aiConfig.kanban_stages.length > 0
            ? aiConfig.kanban_stages.join('", "')
            : 'N/A'

        toolInstructions.push(`
### Tool: mover_lead_etapa
- Use quando identificar mudança no estágio do lead no funil de vendas.
- ETAPAS DO KANBAN DISPONÍVEIS (ordem do funil): ["${kanbanNames}"]
- Exemplos de quando usar:
  - Lead demonstra interesse concreto → avançar no funil
  - Lead finaliza a negociação (comprou, assinou, pagou) → MOVER OBRIGATORIAMENTE para a última etapa de sucesso (ex: "Fechado", "Ganho", "Pagamento Confirmado")
  - Lead não tem interesse → mover para etapa de perda
- IMPORTANTE: Se o cliente enviar comprovantes ou disser claramente "comprei" / "paguei", você deve usar esta tool IMEDIATAMENTE.
- Parâmetros: etapa_nome (o nome EXATO de uma das etapas acima), resposta_para_cliente (a mensagem que você enviará ao cliente)`)
    }

    if (enabledTools.includes('qualificar_lead')) {
        const qualifiedStageName = aiConfig.qualified_stage_name || 'Qualificado'
        toolInstructions.push(`
### Tool: qualificar_lead
- Use quando a conversa indicar que o lead é qualificado para compra/contratação.
- Sinais de qualificação: orçamento disponível, urgência, necessidade clara, cargo de decisor, interesse explícito no produto/serviço.
- IMPORTANTE: Ao detectar QUALQUER dos sinais acima, chame esta tool imediatamente.
- O lead será movido para a etapa "${qualifiedStageName}" e receberá a tag "Qualificado pela IA".
- Parâmetros: motivo (por que qualificou), score (1-10), resposta_para_cliente (a mensagem que você enviará ao cliente)`)
    }

    // The 'adicionar_tag' tool is explicitly disabled and should not be included in instructions.
    // if (enabledTools.includes('adicionar_tag')) {
    //     toolInstructions.push(`
    // ### Tool: adicionar_tag
    // - Use para categorizar o lead com etiquetas baseadas na conversa.
    // - Exemplos: "Interesse em [produto]", "Atacado", "Varejo", "Urgente", "Reclamação", "Indicação"
    // - Pode chamar múltiplas vezes para adicionar várias tags.
    // - Parâmetro: tag_nome (nome da tag a criar/adicionar)`)
    // }

    if (enabledTools.includes('registrar_info')) {
        // eslint-disable-next-line no-useless-escape
        toolInstructions.push(`
### Tool: registrar_info
- Use SEMPRE que o lead mencionar informações pessoais ou relevantes para o negócio.
- IMPORTANTE: Extraia e registre ativamente. Não espere — registre assim que a informação aparecer.
- Campos disponíveis:
  - "email" → quando o lead informar seu email
  - "observacoes" → objeções, preocupações, preferências, necessidades específicas, qualquer detalhe relevante da conversa
  - "orcamento_monetario_reais" → quando o lead mencionar orçamento financeiro ou verba disponível (APENAS VALOR MONETÁRIO. NUNCA REGISTRE códigos de peça, metragens, ou tamanhos como orçamento.)
  - "produto_interesse" → produto, serviço ou item específico que o lead demonstrou interesse
- Exemplos:
  - Lead diz "meu email é contato@email.com" → chamar registrar_info(campo: "email", valor: "contato@email.com", resposta_para_cliente: "Email anotado!")
  - Lead diz "achei o valor alto" → chamar registrar_info(campo: "observacoes", valor: "Objeção de preço", resposta_para_cliente: "Entendo...")
  - Lead diz "posso investir 2 mil reais" → chamar registrar_info(campo: "orcamento_monetario_reais", valor: "2000", resposta_para_cliente: "Certo, R$2.000 anotado!")
  - Lead quer um item específico do catálogo → chamar registrar_info(campo: "produto_interesse", valor: "Nome do Item", resposta_para_cliente: "Ótima escolha!")
- Você pode chamar esta tool JUNTO com a resposta de texto, não precisa ser separado.`)
    }

    if (enabledTools.includes('transferir_humano')) {
        toolInstructions.push(`
### Tool: transferir_humano
- Use quando o lead pedir explicitamente para falar com um humano/atendente.
- Use também quando a conversa ficar travada e você não conseguir resolver.
- Parâmetros: motivo (ex: "Cliente solicitou atendente humano"), resposta_para_cliente (a mensagem que você enviará ao cliente)`)
    }

    if (enabledTools.includes('encerrar_conversa')) {
        toolInstructions.push(`
### Tool: encerrar_conversa
- Use quando o lead se despedir e a conversa estiver resolvida.
- Parâmetros: motivo (ex: "Dúvida resolvida", "Cliente se despediu"), resposta_para_cliente (a mensagem que você enviará ao cliente)`)
    }

    toolInstructions.push(`
### Regras gerais das tools
1. Você PODE chamar tools E responder com texto na mesma mensagem.
2. Você PODE chamar múltiplas tools na mesma resposta.
3. Não mencione o nome das tools na conversa com o cliente. Elas são invisíveis para ele.
4. Sempre que extrair uma informação, registre-a. É melhor registrar demais do que de menos.
5. Seja proativo: não espere o lead dar todas as informações — qualifique e categorize com o que já tem.`)

    prompt += "\n\n---\n" +
        "⚠️ REGRAS CRÍTICAS DE COMUNICAÇÃO (MUITO IMPORTANTE):\n" +
        "1. VOCÊ É O ESPECIALISTA DE ATENDIMENTO.\n" +
        "2. Se você decidir chamar uma ferramenta (ex: registrar_info, mover_lead_etapa), VOCÊ DEVE OBRIGATORIAMENTE preencher o campo 'resposta_para_cliente' dentro da chamada da ferramenta COM O TEXTO QUE O CLIENTE VAI LER.\n" +
        "3. Nunca chame a ferramenta sem responder ao cliente! Se você salvar um dado, confirme de forma natural ou continue a conversa.\n" +
        "4. NÃO USE a ferramenta de adicionar tag. APENAS registre interesses em notas.\n" +
        "5. NÃO confunda números de referência operacionais (como códigos de estoque, CEPs, números de sapato/roupa, metragens) com 'orcamento_monetario_reais'. Orçamento é EXCLUSIVAMENTE valor monetário em dinheiro.\n" +
        "6. Quando o lead pedir um serviço ou item e você o tiver no catálogo (enviado em suas instruções gerais), NÃO simule esperas sistêmicas. Simplesmente ENVIE OS LINKS E PRODUTOS imediatamente no seu texto (ou no campo 'resposta_para_cliente'). Não diga 'vou verificar'.\n---\n"

    return prompt + toolInstructions.join('\n')
}

export function buildToolDefinitions(enabledTools: string[]): Record<string, unknown>[] {
    if (!enabledTools || enabledTools.length === 0) return []

    const ALL_TOOLS: Record<string, Record<string, unknown>> = {
        mover_lead_etapa: {
            type: 'function',
            function: {
                name: 'mover_lead_etapa',
                description: 'Move o lead no kanban de etapas. Use APENAS se houver avanço real na conversa.',
                parameters: {
                    type: 'object',
                    properties: {
                        etapa_nome: { type: 'string', description: 'Nome ou partes do nome da etapa alvo.' },
                        motivo: { type: 'string', description: 'Motivo da movimentação' },
                        resposta_para_cliente: { type: 'string', description: 'A resposta textual em linguagem natural que será enviada ao cliente no WhatsApp simultaneamente.' }
                    },
                    required: ['etapa_nome', 'resposta_para_cliente']
                }
            }
        },
        qualificar_lead: {
            type: 'function',
            function: {
                name: 'qualificar_lead',
                description: 'Qualifica o lead como potencial comprador. Use quando detectar interesse real, orçamento, urgência ou necessidade clara.',
                parameters: {
                    type: 'object',
                    properties: {
                        motivo: { type: 'string', description: 'Por que o lead foi qualificado' },
                        score: { type: 'number', description: 'Score de 1 a 10' },
                        resposta_para_cliente: { type: 'string', description: 'A resposta textual em linguagem natural que será enviada ao cliente no WhatsApp simultaneamente.' }
                    },
                    required: ['motivo', 'resposta_para_cliente']
                }
            }
        },
        // 'adicionar_tag' tool is explicitly disabled and removed from definitions.
        // adicionar_tag: {
        //     type: 'function',
        //     function: {
        //         name: 'adicionar_tag',
        //         description: 'Adiciona uma tag ao lead para categorização.',
        //         parameters: {
        //             type: 'object',
        //             properties: {
        //                 tag_nome: { type: 'string', description: 'Nome da tag (ex: "Urgente", "Atacado", "Interesse Premium")' }
        //             },
        //             required: ['tag_nome']
        //         }
        //     }
        // },
        registrar_info: {
            type: 'function',
            function: {
                name: 'registrar_info',
                description: `📝 REGISTRO DE INFORMAÇÕES:
Use a ferramenta "registrar_info" APENAS quando o cliente fornecer dados muito claros:
- "email": Se enviar um formato válido de email.
- "observacoes": Objeções, preferências, qualquer detalhe relevante.
- "produto_interesse": Se disser o que quer comprar/contratar (adicione como nota).
- "orcamento_monetario_reais": SÓ USE se falar de dinheiro monetário (Ex: orçamento de 500 reais). NUNCA registre códigos operacionais, metragens, referências ou tamanhos (como 42, P, M).`,
                parameters: {
                    type: 'object',
                    properties: {
                        campo: {
                            type: 'string',
                            enum: ['nome', 'email', 'telefone', 'orcamento_monetario_reais', 'produto_interesse', 'objection', 'observacoes'],
                            description: 'O campo a ser atualizado.'
                        },
                        valor: {
                            type: 'string',
                            description: 'O valor extraído. Se for orcamento, apenas números.'
                        },
                        resposta_para_cliente: {
                            type: 'string',
                            description: 'A resposta textual natural enviada ao cliente. IMPORTANTE: Se o cliente pediu um produto, ENVIE O LINK/CATÁLOGO AQUI mesmo. Nunca diga "vou verificar".'
                        }
                    },
                    required: ['campo', 'valor', 'resposta_para_cliente']
                }
            }
        },
        transferir_humano: {
            type: 'function',
            function: {
                name: 'transferir_humano',
                description: 'Pausa a IA e transfere para atendimento humano.',
                parameters: {
                    type: 'object',
                    properties: {
                        motivo: { type: 'string', description: 'Motivo da transferência' }
                    },
                    required: ['motivo']
                }
            }
        },
        encerrar_conversa: {
            type: 'function',
            function: {
                name: 'encerrar_conversa',
                description: 'Marca a conversa como encerrada.',
                parameters: {
                    type: 'object',
                    properties: {
                        motivo: { type: 'string', description: 'Motivo do encerramento' }
                    },
                    required: ['motivo']
                }
            }
        }
    }

    // Retornar apenas as tools habilitadas formadas como Tools (func specification)
    return enabledTools
        .filter(name => ALL_TOOLS[name])
        .map(name => ALL_TOOLS[name])
}
