-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Define Custom Types
create type member_role as enum ('owner', 'admin', 'member');
create type whatsapp_status as enum ('connected', 'disconnected', 'pending');
create type message_direction as enum ('entrada', 'saida');
create type message_type as enum ('texto', 'imagem', 'audio', 'video', 'documento');
create type atendimento_status as enum ('aberto', 'em_andamento', 'finalizado');

-- ==========================================
-- MULTI-TENANT CORE
-- ==========================================

-- Organizations
create table organizations (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  slug text not null unique,
  criado_em timestamp with time zone default now() not null,
  atualizado_em timestamp with time zone default now() not null
);

-- User Profiles (sync with auth.users)
create table user_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nome text not null,
  email text not null,
  avatar_url text,
  criado_em timestamp with time zone default now() not null
);

-- Organization Members (N:N relationship)
create table organization_members (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  user_id uuid not null references user_profiles(id) on delete cascade,
  role member_role not null default 'member',
  criado_em timestamp with time zone default now() not null,
  unique (organization_id, user_id)
);

-- ==========================================
-- INTEGRATIONS
-- ==========================================

-- WhatsApp Configs
create table whatsapp_configs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  instance_name text not null,
  api_url text not null,
  api_token text not null, -- Note: Vault is recommended, but kept as text for now with strict RLS
  webhook_secret text,
  status whatsapp_status not null default 'pending',
  criado_em timestamp with time zone default now() not null,
  atualizado_em timestamp with time zone default now() not null,
  unique (organization_id)
);

-- ==========================================
-- CRM DATA
-- ==========================================

-- Etapas Kanban
create table etapas_kanban (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  nome text not null,
  ordem integer not null,
  cor text not null,
  unique(organization_id, nome)
);

-- Tags
create table tags (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  nome text not null,
  cor text not null,
  unique(organization_id, nome)
);

-- Leads
create table leads (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  nome text not null,
  telefone text not null,
  email text,
  etapa_id uuid not null references etapas_kanban(id) on delete restrict,
  avatar_url text,
  notas text,
  criado_em timestamp with time zone default now() not null,
  atualizado_em timestamp with time zone default now() not null
);

-- Lead Tags (N:N relationship)
create table lead_tags (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references leads(id) on delete cascade,
  tag_id uuid not null references tags(id) on delete cascade,
  unique (lead_id, tag_id)
);

-- Mensagens
create table mensagens (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  lead_id uuid not null references leads(id) on delete cascade,
  direcao message_direction not null,
  conteudo text not null,
  tipo message_type not null default 'texto',
  media_url text,
  whatsapp_message_id text,
  timestamp timestamp with time zone default now() not null,
  lida boolean not null default false
);

-- Atendimentos
create table atendimentos (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  lead_id uuid not null references leads(id) on delete cascade,
  atendente_id uuid references user_profiles(id) on delete set null,
  status atendimento_status not null default 'aberto',
  criado_em timestamp with time zone default now() not null,
  finalizado_em timestamp with time zone
);

-- ==========================================
-- INDEXES
-- ==========================================
create index idx_org_members_org_id on organization_members(organization_id);
create index idx_org_members_user_id on organization_members(user_id);
create index idx_whatsapp_configs_org_id on whatsapp_configs(organization_id);
create index idx_etapas_kanban_org_id on etapas_kanban(organization_id);
create index idx_tags_org_id on tags(organization_id);
create index idx_leads_org_id on leads(organization_id);
create index idx_leads_etapa_id on leads(etapa_id);
create index idx_mensagens_org_id on mensagens(organization_id);
create index idx_mensagens_lead_id on mensagens(lead_id);
create index idx_atendimentos_org_id on atendimentos(organization_id);
create index idx_atendimentos_lead_id on atendimentos(lead_id);

-- ==========================================
-- ROW LEVEL SECURITY (RLS)
-- ==========================================

-- Enable RLS
alter table organizations enable row level security;
alter table user_profiles enable row level security;
alter table organization_members enable row level security;
alter table whatsapp_configs enable row level security;
alter table etapas_kanban enable row level security;
alter table tags enable row level security;
alter table leads enable row level security;
alter table lead_tags enable row level security;
alter table mensagens enable row level security;
alter table atendimentos enable row level security;

-- Setup RLS Policies

-- User Profiles: Users can read their own profile, and profile of anyone in their organizations
create policy "User can view profiles in same organization" on user_profiles
  for select using (
    id = auth.uid() or 
    exists (
      select 1 from organization_members m1
      join organization_members m2 on m1.organization_id = m2.organization_id
      where m1.user_id = auth.uid() and m2.user_id = user_profiles.id
    )
  );

create policy "User can update their own profile" on user_profiles
  for update using (id = auth.uid());

-- Organizations: Users can view their organizations
create policy "Users can view their own organizations" on organizations
  for select using (
    exists (
      select 1 from organization_members
      where organization_members.organization_id = id
      and organization_members.user_id = auth.uid()
    )
  );

-- Organization Members: Users can view members of their organizations
create policy "Users can view members of their organizations" on organization_members
  for select using (
    exists (
      select 1 from organization_members om
      where om.organization_id = organization_members.organization_id
      and om.user_id = auth.uid()
    )
  );

-- CRM Data (Generic Policy Template applied to all dependent tables)
-- For whatsapp_configs
create policy "Users can view org whatsapp configs" on whatsapp_configs
  for select using (
    exists (
      select 1 from organization_members
      where organization_members.organization_id = whatsapp_configs.organization_id
      and organization_members.user_id = auth.uid()
    )
  );

create policy "Only owner/admin can update whatsapp configs" on whatsapp_configs
  for all using (
    exists (
      select 1 from organization_members
      where organization_members.organization_id = whatsapp_configs.organization_id
      and organization_members.user_id = auth.uid()
      and organization_members.role in ('owner', 'admin')
    )
  );

-- For etapas_kanban
create policy "Users can view org etapas" on etapas_kanban
  for select using (exists (select 1 from organization_members where organization_id = etapas_kanban.organization_id and user_id = auth.uid()));
create policy "Users can insert org etapas" on etapas_kanban
  for insert with check (exists (select 1 from organization_members where organization_id = etapas_kanban.organization_id and user_id = auth.uid()));
create policy "Users can update org etapas" on etapas_kanban
  for update using (exists (select 1 from organization_members where organization_id = etapas_kanban.organization_id and user_id = auth.uid()));
create policy "Users can delete org etapas" on etapas_kanban
  for delete using (exists (select 1 from organization_members where organization_id = etapas_kanban.organization_id and user_id = auth.uid()));

-- For tags
create policy "Users can view org tags" on tags
  for select using (exists (select 1 from organization_members where organization_id = tags.organization_id and user_id = auth.uid()));
create policy "Users can insert org tags" on tags
  for insert with check (exists (select 1 from organization_members where organization_id = tags.organization_id and user_id = auth.uid()));
create policy "Users can update org tags" on tags
  for update using (exists (select 1 from organization_members where organization_id = tags.organization_id and user_id = auth.uid()));
create policy "Users can delete org tags" on tags
  for delete using (exists (select 1 from organization_members where organization_id = tags.organization_id and user_id = auth.uid()));

-- For leads
create policy "Users can view org leads" on leads
  for select using (exists (select 1 from organization_members where organization_id = leads.organization_id and user_id = auth.uid()));
create policy "Users can insert org leads" on leads
  for insert with check (exists (select 1 from organization_members where organization_id = leads.organization_id and user_id = auth.uid()));
create policy "Users can update org leads" on leads
  for update using (exists (select 1 from organization_members where organization_id = leads.organization_id and user_id = auth.uid()));
create policy "Users can delete org leads" on leads
  for delete using (exists (select 1 from organization_members where organization_id = leads.organization_id and user_id = auth.uid()));

-- For lead_tags
create policy "Users can view org lead tags" on lead_tags
  for select using (
    exists (
      select 1 from leads 
      join organization_members on organization_members.organization_id = leads.organization_id
      where leads.id = lead_tags.lead_id and organization_members.user_id = auth.uid()
    )
  );
create policy "Users can insert org lead tags" on lead_tags
  for insert with check (
    exists (
      select 1 from leads 
      join organization_members on organization_members.organization_id = leads.organization_id
      where leads.id = lead_tags.lead_id and organization_members.user_id = auth.uid()
    )
  );
create policy "Users can delete org lead tags" on lead_tags
  for delete using (
    exists (
      select 1 from leads 
      join organization_members on organization_members.organization_id = leads.organization_id
      where leads.id = lead_tags.lead_id and organization_members.user_id = auth.uid()
    )
  );

-- For mensagens
create policy "Users can view org mensagens" on mensagens
  for select using (exists (select 1 from organization_members where organization_id = mensagens.organization_id and user_id = auth.uid()));
create policy "Users can insert org mensagens" on mensagens
  for insert with check (exists (select 1 from organization_members where organization_id = mensagens.organization_id and user_id = auth.uid()));

-- For atendimentos
create policy "Users can view org atendimentos" on atendimentos
  for select using (exists (select 1 from organization_members where organization_id = atendimentos.organization_id and user_id = auth.uid()));
create policy "Users can insert org atendimentos" on atendimentos
  for insert with check (exists (select 1 from organization_members where organization_id = atendimentos.organization_id and user_id = auth.uid()));
create policy "Users can update org atendimentos" on atendimentos
  for update using (exists (select 1 from organization_members where organization_id = atendimentos.organization_id and user_id = auth.uid()));


-- ==========================================
-- TRIGGERS & FUNCTIONS
-- ==========================================

-- Trigger: auto update 'atualizado_em'
create or replace function update_updated_at_column()
returns trigger as $$
begin
    new.atualizado_em = now();
    return new;
end;
$$ language 'plpgsql';

create trigger update_organizations_updated_at before update on organizations for each row execute procedure update_updated_at_column();
create trigger update_whatsapp_configs_updated_at before update on whatsapp_configs for each row execute procedure update_updated_at_column();
create trigger update_leads_updated_at before update on leads for each row execute procedure update_updated_at_column();

-- Trigger: create default org and profile on signup
create or replace function public.handle_new_user() 
returns trigger as $$
declare
  new_org_id uuid;
begin
  -- 1. Create User Profile
  insert into public.user_profiles (id, nome, email, avatar_url)
  values (
    new.id, 
    coalesce(new.raw_user_meta_data->>'full_name', coalesce(new.raw_user_meta_data->>'name', 'Usuário_' || substr(new.id::text, 1, 6))),
    new.email,
    new.raw_user_meta_data->>'avatar_url'
  );

  -- 2. Create Default Organization
  insert into public.organizations (nome, slug)
  values (
    'Minha Empresa', 
    'empresa-' || substr(new.id::text, 1, 8)
  ) returning id into new_org_id;

  -- 3. Link User as Owner of Organization
  insert into public.organization_members (organization_id, user_id, role)
  values (new_org_id, new.id, 'owner');

  -- 4. Create Default Kanban Stages for this new organization
  insert into public.etapas_kanban (organization_id, nome, ordem, cor) values
    (new_org_id, 'Novo', 1, '#16A34A'),           -- Green
    (new_org_id, 'Em contato', 2, '#EA580C'),      -- Orange
    (new_org_id, 'Negociando', 3, '#2563EB'),      -- Blue
    (new_org_id, 'Fechado/Ganho', 4, '#16A34A'),   -- Green
    (new_org_id, 'Fechado/Perdido', 5, '#EF4444'); -- Red

  return new;
end;
$$ language plpgsql security definer;

-- Bind the trigger to auth.users
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

