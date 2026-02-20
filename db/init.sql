create extension if not exists "uuid-ossp";

create table if not exists tenants (
  id uuid primary key default uuid_generate_v4(),
  name varchar(255) not null,
  slug varchar(120) unique not null,
  status varchar(40) not null default 'active',
  onboarding_current_step int not null default 1,
  onboarding_completed_steps int[] not null default '{}',
  onboarding_metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists roles (
  id serial primary key,
  code varchar(50) unique not null,
  name varchar(120) not null
);

insert into roles (code, name)
values ('super_admin', 'Super Admin'), ('company_admin', 'Company Admin'), ('agent', 'Agent')
on conflict (code) do nothing;

create table if not exists users (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid references tenants(id) on delete cascade,
  role_id int not null references roles(id),
  email varchar(255) not null,
  password_hash varchar(255) not null,
  full_name varchar(255) not null,
  preferred_language varchar(10) not null default 'en',
  status varchar(30) not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, email)
);

create table if not exists plans (
  id serial primary key,
  code varchar(50) unique not null,
  name varchar(100) not null,
  price_monthly numeric(10,2) not null default 0,
  limits_json jsonb not null,
  features_json jsonb not null,
  created_at timestamptz not null default now()
);

insert into plans (code, name, price_monthly, limits_json, features_json)
values
('free','Free',0,'{"numbers":1,"agents":1,"conversations":300}'::jsonb,'{"quick_replies":false,"assignment":false,"advanced_analytics":false,"ai_enabled":false}'::jsonb),
('pro','Pro',49,'{"numbers":3,"agents":5,"conversations":-1}'::jsonb,'{"quick_replies":true,"assignment":true,"advanced_analytics":false,"ai_enabled":false}'::jsonb),
('business','Business',149,'{"numbers":-1,"agents":-1,"conversations":-1}'::jsonb,'{"quick_replies":true,"assignment":true,"advanced_analytics":true,"ai_enabled":false}'::jsonb)
on conflict (code) do nothing;

create table if not exists subscriptions (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  plan_id int not null references plans(id),
  status varchar(30) not null,
  current_period_start timestamptz not null,
  current_period_end timestamptz not null,
  cancel_at_period_end boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists usage_tracking (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  period_key varchar(20) not null,
  conversations_used int not null default 0,
  agents_used int not null default 0,
  numbers_used int not null default 0,
  unique (tenant_id, period_key)
);

create table if not exists channels (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  type varchar(30) not null default 'whatsapp',
  external_account_id varchar(255),
  display_name varchar(255) not null,
  waba_id varchar(255),
  access_token text,
  verify_token varchar(255),
  status varchar(30) not null default 'connected',
  created_at timestamptz not null default now()
);

create table if not exists conversations (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  channel_id uuid not null references channels(id) on delete cascade,
  customer_external_id varchar(255) not null,
  assigned_user_id uuid references users(id),
  status varchar(30) not null default 'open',
  last_message_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists messages (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  conversation_id uuid not null references conversations(id) on delete cascade,
  sender_type varchar(20) not null,
  sender_user_id uuid references users(id),
  body text not null,
  direction varchar(20) not null,
  sent_at timestamptz not null default now()
);

create table if not exists quick_replies (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  title varchar(255) not null,
  shortcut varchar(60) not null,
  category varchar(30) not null default 'general',
  content text not null,
  language varchar(10) not null default 'en',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (tenant_id, shortcut)
);

alter table quick_replies
  add column if not exists category varchar(30) not null default 'general';

create index if not exists idx_users_tenant on users(tenant_id);
create index if not exists idx_subscriptions_tenant on subscriptions(tenant_id);
create index if not exists idx_channels_tenant on channels(tenant_id);
create index if not exists idx_conversations_tenant on conversations(tenant_id);
create index if not exists idx_messages_tenant on messages(tenant_id);
create index if not exists idx_quick_replies_tenant on quick_replies(tenant_id);
