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

                case 'valor_potencial': {
                    const numericValue = parseFloat((valor as string).replace(/[^\d.,]/g, '').replace(',', '.')) || 0

                    await supabase
                        .from('leads')
                        .update({ valor_venda: numericValue })
                        .eq('id', lead.id)

                    await supabase.from('lead_events').insert({
                        lead_id: lead.id,
                        organization_id: organizationId,
                        tipo: 'info_registrada',
                        descricao: `IA registrou valor potencial: R$ ${numericValue.toLocaleString('pt-BR')}`,
                        metadata: { campo: 'valor_venda', valor: numericValue, por: 'ia' }
                    })

                    console.log(`[IA] Valor potencial R$${numericValue} registrado no lead ${lead.id}`)
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
        toolInstructions.push(`
### Tool: mover_lead_etapa
- Use quando identificar mudança no estágio do lead no funil de vendas.
- Exemplos de quando usar:
  - Lead demonstra interesse concreto → mover para "Negociando"
  - Lead quer fechar negócio → mover para etapa de fechamento
  - Lead não tem interesse → mover para etapa de perda
- Parâmetro: etapa_nome (o nome da etapa, ex: "Negociando", "Fechado/Ganho")`)
    }

    if (enabledTools.includes('qualificar_lead')) {
        const qualifiedStageName = aiConfig.qualified_stage_name || 'Qualificado'
        toolInstructions.push(`
### Tool: qualificar_lead
- Use quando a conversa indicar que o lead é qualificado para compra/contratação.
- Sinais de qualificação: orçamento disponível, urgência, necessidade clara, cargo de decisor, interesse explícito no produto/serviço.
- IMPORTANTE: Ao detectar QUALQUER dos sinais acima, chame esta tool imediatamente.
- O lead será movido para a etapa "${qualifiedStageName}" e receberá a tag "Qualificado pela IA".
- Parâmetros: motivo (por que qualificou), score (1-10)`)
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
  - "valor_potencial" → quando o lead mencionar orçamento, quanto quer gastar, ou valor do negócio
  - "produto_interesse" → produto ou serviço específico que o lead demonstrou interesse
- Exemplos:
  - Lead diz "meu email é joao@email.com" → chamar registrar_info(campo: "email", valor: "joao@email.com")
  - Lead diz "achei meio caro" → chamar registrar_info(campo: "observacoes", valor: "Objeção de preço: achou caro")
  - Lead diz "quero gastar uns 500 reais" → chamar registrar_info(campo: "valor_potencial", valor: "500")
  - Lead diz "to procurando calça skinny" → chamar registrar_info(campo: "produto_interesse", valor: "Calça Skinny")
- Você pode chamar esta tool JUNTO com a resposta de texto, não precisa ser separado.`)
    }

    if (enabledTools.includes('transferir_humano')) {
        toolInstructions.push(`
### Tool: transferir_humano
- Use quando o lead pedir explicitamente para falar com um humano/atendente.
- Use também quando a conversa ficar travada e você não conseguir resolver.
- Parâmetro: motivo (ex: "Cliente solicitou atendente humano")`)
    }

    if (enabledTools.includes('encerrar_conversa')) {
        toolInstructions.push(`
### Tool: encerrar_conversa
- Use quando o lead se despedir e a conversa estiver resolvida.
- Parâmetro: motivo (ex: "Dúvida resolvida", "Cliente se despediu")`)
    }

    toolInstructions.push(`
### Regras gerais das tools
1. Você PODE chamar tools E responder com texto na mesma mensagem.
2. Você PODE chamar múltiplas tools na mesma resposta.
3. Não mencione o nome das tools na conversa com o cliente. Elas são invisíveis para ele.
4. Sempre que extrair uma informação, registre-a. É melhor registrar demais do que de menos.
5. Seja proativo: não espere o lead dar todas as informações — qualifique e categorize com o que já tem.`)

    prompt += "\n\n---\n" +
        "⚠️ REGRAS CRÍTICAS DE EXECUÇÃO DE FERRAMENTAS (MUITO IMPORTANTE):\n" +
        "1. Você atua como o VENDEDOR no WhatsApp. O cliente vai receber a sua resposta textual.\n" +
        "2. Você DEVE SEMPRE gerar uma resposta em formato de texto NORMAL (para o cliente ler) NA MESMA MENSAGEM em que executa uma ferramenta.\n" +
        "3. NUNCA chame uma ferramenta sem responder simultaneamente ao cliente! As ferramentas são utilitários invisíveis de backoffice. O cliente não pode ficar no vácuo.\n" +
        "4. As chamadas de ferramentas rodam em background. Não diga ao cliente 'Vou registrar seu email' ou 'Estou te movendo de etapa'. Apenas faça e continue a conversa normalmente.\n" +
        "5. NÃO crie tags sob nenhuma hipótese (foi desativado). Deixe a classificação humana.\n---\n"

    return prompt + toolInstructions.join('\n')
}

export function buildToolDefinitions(enabledTools: string[]): Record<string, unknown>[] {
    if (!enabledTools || enabledTools.length === 0) return []

    const ALL_TOOLS: Record<string, Record<string, unknown>> = {
        mover_lead_etapa: {
            type: 'function',
            function: {
                name: 'mover_lead_etapa',
                description: 'Move o lead para uma etapa específica do pipeline de vendas. Use quando identificar mudança no estágio do funil.',
                parameters: {
                    type: 'object',
                    properties: {
                        etapa_nome: { type: 'string', description: 'Nome da etapa destino (ex: "Em contato", "Negociando", "Fechado/Ganho")' },
                        motivo: { type: 'string', description: 'Motivo da movimentação' }
                    },
                    required: ['etapa_nome']
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
                        score: { type: 'number', description: 'Score de 1 a 10' }
                    },
                    required: ['motivo']
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
- "observacoes": Objeções, preocupações, preferências, necessidades específicas, qualquer detalhe relevante da conversa.
- "produto_interesse": Se disser o que quer comprar (adicione como nota).
- "valor_potencial": REGRA ESTRITA - SÓ USE se ele falar de dinheiro/orçamento (Ex: R$ 500,00, 20 mil). NUNCA registre tamanhos de roupa (ex: 42, P, M, 38), quantidades ou modelos como se fosse valor financeiro! Isso é dinheiro.`,
                parameters: {
                    type: 'object',
                    properties: {
                        campo: {
                            type: 'string',
                            enum: ['email', 'observacoes', 'valor_potencial', 'produto_interesse'],
                            description: 'Tipo de informação: email, observacoes (objeções/preferências), valor_potencial (orçamento/valor), produto_interesse'
                        },
                        valor: { type: 'string', description: 'O valor a registrar' }
                    },
                    required: ['campo', 'valor']
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
