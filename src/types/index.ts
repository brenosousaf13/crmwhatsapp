export type Organization = {
    id: string;
    nome: string;
    slug: string;
    criado_em: string;
    atualizado_em: string;
};

export type OrganizationMember = {
    id: string;
    organization_id: string;
    user_id: string;
    role: 'owner' | 'admin' | 'member';
    criado_em: string;
};

export type UserProfile = {
    id: string;
    nome: string;
    email: string;
    avatar_url?: string;
    criado_em: string;
};

export type WhatsAppConfig = {
    id: string;
    organization_id: string;
    instance_name: string;
    api_url: string;
    api_token: string;
    webhook_secret?: string;
    status: 'connected' | 'disconnected' | 'pending';
    criado_em: string;
    atualizado_em: string;
};

export type Lead = {
    id: string;
    organization_id: string;
    nome: string;
    telefone: string;
    email?: string;
    etapa_id: string;
    avatar_url?: string;
    notas?: string;
    criado_em: string;
    atualizado_em: string;
};

export type LeadTag = {
    id: string;
    lead_id: string;
    tag_id: string;
};

export type EtapaKanban = {
    id: string;
    organization_id: string;
    nome: string;
    ordem: number;
    cor: string;
};

export type Mensagem = {
    id: string;
    organization_id: string;
    lead_id: string;
    direcao: 'entrada' | 'saida';
    conteudo: string;
    tipo: 'texto' | 'imagem' | 'audio' | 'video' | 'documento';
    media_url?: string;
    whatsapp_message_id?: string;
    timestamp: string;
    lida: boolean;
};

export type Tag = {
    id: string;
    organization_id: string;
    nome: string;
    cor: string;
};

export type Atendimento = {
    id: string;
    organization_id: string;
    lead_id: string;
    atendente_id: string;
    status: 'aberto' | 'em_andamento' | 'finalizado';
    criado_em: string;
    finalizado_em?: string;
};
