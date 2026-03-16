-- ============================================================
-- EXIM DASHBOARD — DATABASE SCHEMA
-- Run this in the Supabase SQL Editor
-- ============================================================

create extension if not exists "uuid-ossp";

-- ============================================================
-- HELPER: updated_at trigger
-- ============================================================
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- ============================================================
-- PROFILES
-- Extends auth.users. Created automatically via trigger.
-- ============================================================
create table public.profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  email        text not null unique,
  full_name    text not null default '',
  avatar_url   text,
  role         text not null default 'client' check (role in ('admin', 'editor', 'client')),
  company_name text,
  phone        text,
  stripe_customer_id text unique,
  is_active    boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create trigger profiles_updated_at before update on public.profiles
  for each row execute procedure public.set_updated_at();

alter table public.profiles enable row level security;

create policy "admins_editors_read_all_profiles" on public.profiles
  for select using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin','editor'))
  );
create policy "clients_read_own_profile" on public.profiles
  for select using (id = auth.uid());
create policy "users_update_own_profile" on public.profiles
  for update using (id = auth.uid()) with check (id = auth.uid());
create policy "admins_write_profiles" on public.profiles
  for all using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.raw_user_meta_data->>'role', 'client')
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- SUBSCRIPTION PLANS
-- ============================================================
create table public.subscription_plans (
  id              uuid primary key default uuid_generate_v4(),
  name            text not null,
  description     text,
  price           numeric(10,2) not null,
  currency        text not null default 'MXN',
  interval        text not null default 'monthly' check (interval in ('monthly','yearly')),
  features        text[] not null default '{}',
  is_active       boolean not null default true,
  stripe_price_id text unique,
  created_at      timestamptz not null default now()
);

alter table public.subscription_plans enable row level security;

create policy "authenticated_read_active_plans" on public.subscription_plans
  for select to authenticated using (
    is_active = true
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin','editor'))
  );
create policy "admins_write_plans" on public.subscription_plans
  for all using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

-- ============================================================
-- CLIENT SUBSCRIPTIONS
-- ============================================================
create table public.client_subscriptions (
  id                     uuid primary key default uuid_generate_v4(),
  client_id              uuid not null references public.profiles(id) on delete cascade,
  plan_id                uuid not null references public.subscription_plans(id),
  status                 text not null check (status in ('active','inactive','cancelled','past_due')),
  stripe_subscription_id text unique,
  current_period_start   timestamptz,
  current_period_end     timestamptz,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);

create trigger client_subscriptions_updated_at before update on public.client_subscriptions
  for each row execute procedure public.set_updated_at();

alter table public.client_subscriptions enable row level security;

create policy "admins_editors_read_all_subs" on public.client_subscriptions
  for select using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin','editor'))
  );
create policy "clients_read_own_sub" on public.client_subscriptions
  for select using (client_id = auth.uid());
create policy "admins_write_subs" on public.client_subscriptions
  for all using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

-- ============================================================
-- INVOICES
-- ============================================================
create table public.invoices (
  id                uuid primary key default uuid_generate_v4(),
  client_id         uuid not null references public.profiles(id) on delete cascade,
  subscription_id   uuid not null references public.client_subscriptions(id),
  amount            numeric(10,2) not null,
  currency          text not null default 'MXN',
  status            text not null check (status in ('paid','pending','failed','void')),
  stripe_invoice_id text unique,
  period_start      timestamptz not null,
  period_end        timestamptz not null,
  paid_at           timestamptz,
  created_at        timestamptz not null default now()
);

alter table public.invoices enable row level security;

create policy "admins_editors_read_all_invoices" on public.invoices
  for select using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin','editor'))
  );
create policy "clients_read_own_invoices" on public.invoices
  for select using (client_id = auth.uid());
create policy "admins_write_invoices" on public.invoices
  for all using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

-- ============================================================
-- REQUEST STATUSES (configurable by admin)
-- ============================================================
create table public.request_statuses (
  id          uuid primary key default uuid_generate_v4(),
  name        text not null,
  color       text not null default '#6b7280',
  order_index int not null default 0,
  is_default  boolean not null default false,
  created_at  timestamptz not null default now()
);

alter table public.request_statuses enable row level security;

create policy "authenticated_read_statuses" on public.request_statuses
  for select to authenticated using (true);
create policy "admins_write_statuses" on public.request_statuses
  for all using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

-- Seed default statuses
insert into public.request_statuses (name, color, order_index, is_default) values
  ('Nuevo', '#6b7280', 0, true),
  ('En revisión', '#f59e0b', 1, false),
  ('En progreso', '#3b82f6', 2, false),
  ('En pruebas', '#8b5cf6', 3, false),
  ('Completado', '#10b981', 4, false),
  ('Cancelado', '#ef4444', 5, false);

-- ============================================================
-- REQUESTS
-- ============================================================
create table public.requests (
  id                         uuid primary key default uuid_generate_v4(),
  client_id                  uuid not null references public.profiles(id) on delete cascade,
  type                       text not null check (type in ('page_change','product')),
  status_id                  uuid not null references public.request_statuses(id),
  urgency                    text check (urgency in ('normal','urgent')),
  -- page_change fields
  page_section               text,
  change_description         text,
  -- product fields
  product_title              text,
  product_price              numeric(10,2),
  product_category           text,
  product_description        text,
  implementation_description text,
  -- common
  admin_notes                text,
  assigned_to                uuid references public.profiles(id),
  created_at                 timestamptz not null default now(),
  updated_at                 timestamptz not null default now()
);

create trigger requests_updated_at before update on public.requests
  for each row execute procedure public.set_updated_at();

alter table public.requests enable row level security;

create policy "admins_editors_read_all_requests" on public.requests
  for select using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin','editor'))
  );
create policy "clients_read_own_requests" on public.requests
  for select using (client_id = auth.uid());
create policy "clients_insert_own_requests" on public.requests
  for insert with check (client_id = auth.uid());
create policy "admins_editors_update_requests" on public.requests
  for update using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin','editor'))
  );
create policy "admins_delete_requests" on public.requests
  for delete using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

-- ============================================================
-- REQUEST ATTACHMENTS
-- ============================================================
create table public.request_attachments (
  id         uuid primary key default uuid_generate_v4(),
  request_id uuid not null references public.requests(id) on delete cascade,
  file_url   text not null,
  file_name  text not null,
  file_type  text,
  file_size  bigint,
  created_at timestamptz not null default now()
);

alter table public.request_attachments enable row level security;

create policy "read_request_attachments" on public.request_attachments
  for select using (
    exists (
      select 1 from public.requests r
      join public.profiles p on p.id = auth.uid()
      where r.id = request_attachments.request_id
        and (p.role in ('admin','editor') or r.client_id = auth.uid())
    )
  );
create policy "clients_insert_attachments" on public.request_attachments
  for insert with check (
    exists (select 1 from public.requests r where r.id = request_id and r.client_id = auth.uid())
  );
create policy "admins_delete_attachments" on public.request_attachments
  for delete using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

-- ============================================================
-- FILES (metadata; actual bytes in Supabase Storage)
-- ============================================================
create table public.files (
  id               uuid primary key default uuid_generate_v4(),
  name             text not null,
  type             text not null check (type in ('file','folder')),
  mime_type        text,
  size             bigint,
  storage_path     text,
  thumbnail_path   text,
  parent_folder_id uuid references public.files(id) on delete cascade,
  section          text not null check (section in ('social','web')),
  client_id        uuid not null references public.profiles(id) on delete cascade,
  created_by       uuid not null references public.profiles(id),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create trigger files_updated_at before update on public.files
  for each row execute procedure public.set_updated_at();

alter table public.files enable row level security;

create policy "admins_editors_read_all_files" on public.files
  for select using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin','editor'))
  );
create policy "clients_read_own_files" on public.files
  for select using (client_id = auth.uid());
create policy "admins_editors_write_files" on public.files
  for all using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin','editor'))
  );

-- ============================================================
-- POSTS
-- ============================================================
create table public.posts (
  id             uuid primary key default uuid_generate_v4(),
  client_id      uuid not null references public.profiles(id) on delete cascade,
  title          text,
  content        text not null default '',
  media_urls     text[] not null default '{}',
  platforms      text[] not null default '{}',
  scheduled_date date,
  scheduled_time time,
  status         text not null default 'draft'
    check (status in ('draft','pending_approval','approved','scheduled','published','rejected')),
  approved_by    uuid references public.profiles(id),
  notes          text,
  created_by     uuid not null references public.profiles(id),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create trigger posts_updated_at before update on public.posts
  for each row execute procedure public.set_updated_at();

alter table public.posts enable row level security;

create policy "admins_editors_read_all_posts" on public.posts
  for select using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin','editor'))
  );
create policy "clients_read_own_posts" on public.posts
  for select using (client_id = auth.uid());
create policy "admins_editors_write_posts" on public.posts
  for all using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin','editor'))
  );
create policy "clients_update_post_status" on public.posts
  for update using (client_id = auth.uid()) with check (client_id = auth.uid());

-- ============================================================
-- SOCIAL STRATEGIES
-- ============================================================
create table public.social_strategies (
  id         uuid primary key default uuid_generate_v4(),
  client_id  uuid not null references public.profiles(id) on delete cascade,
  title      text not null,
  content    text not null,
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger social_strategies_updated_at before update on public.social_strategies
  for each row execute procedure public.set_updated_at();

alter table public.social_strategies enable row level security;

create policy "admins_editors_read_all_strategies" on public.social_strategies
  for select using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin','editor'))
  );
create policy "clients_read_own_strategies" on public.social_strategies
  for select using (client_id = auth.uid());
create policy "admins_editors_write_strategies" on public.social_strategies
  for all using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin','editor'))
  );

-- ============================================================
-- WEB PAGES
-- ============================================================
create table public.web_pages (
  id               uuid primary key default uuid_generate_v4(),
  client_id        uuid not null references public.profiles(id) on delete cascade,
  url              text,
  domain           text,
  status           text not null default 'draft'
    check (status in ('draft','in_development','review','published','maintenance')),
  last_deployed_at timestamptz,
  ssl_expiry       timestamptz,
  plan_id          uuid references public.subscription_plans(id),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create trigger web_pages_updated_at before update on public.web_pages
  for each row execute procedure public.set_updated_at();

alter table public.web_pages enable row level security;

create policy "admins_editors_read_all_web_pages" on public.web_pages
  for select using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin','editor'))
  );
create policy "clients_read_own_web_pages" on public.web_pages
  for select using (client_id = auth.uid());
create policy "admins_editors_write_web_pages" on public.web_pages
  for all using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin','editor'))
  );

-- ============================================================
-- WEB PAGE CHANGES
-- ============================================================
create table public.web_page_changes (
  id           uuid primary key default uuid_generate_v4(),
  web_page_id  uuid not null references public.web_pages(id) on delete cascade,
  title        text not null,
  description  text not null default '',
  status       text not null default 'pending'
    check (status in ('pending','in_progress','completed')),
  request_id   uuid references public.requests(id),
  created_at   timestamptz not null default now(),
  completed_at timestamptz
);

alter table public.web_page_changes enable row level security;

create policy "admins_editors_read_all_changes" on public.web_page_changes
  for select using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin','editor'))
  );
create policy "clients_read_own_changes" on public.web_page_changes
  for select using (
    exists (
      select 1 from public.web_pages wp
      where wp.id = web_page_changes.web_page_id and wp.client_id = auth.uid()
    )
  );
create policy "admins_editors_write_changes" on public.web_page_changes
  for all using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin','editor'))
  );

-- ============================================================
-- FORM TEMPLATES
-- ============================================================
create table public.form_templates (
  id          uuid primary key default uuid_generate_v4(),
  name        text not null,
  description text,
  schema      jsonb not null default '{"fields": []}',
  created_by  uuid not null references public.profiles(id),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create trigger form_templates_updated_at before update on public.form_templates
  for each row execute procedure public.set_updated_at();

alter table public.form_templates enable row level security;

create policy "authenticated_read_form_templates" on public.form_templates
  for select to authenticated using (true);
create policy "admins_write_form_templates" on public.form_templates
  for all using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

-- ============================================================
-- FLOW TEMPLATES
-- ============================================================
create table public.flow_templates (
  id          uuid primary key default uuid_generate_v4(),
  name        text not null,
  description text,
  type        text not null check (type in ('web','social')),
  is_active   boolean not null default true,
  created_by  uuid not null references public.profiles(id),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create trigger flow_templates_updated_at before update on public.flow_templates
  for each row execute procedure public.set_updated_at();

alter table public.flow_templates enable row level security;

create policy "authenticated_read_flow_templates" on public.flow_templates
  for select to authenticated using (true);
create policy "admins_write_flow_templates" on public.flow_templates
  for all using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

-- ============================================================
-- FLOW STAGES
-- ============================================================
create table public.flow_stages (
  id                  uuid primary key default uuid_generate_v4(),
  flow_template_id    uuid not null references public.flow_templates(id) on delete cascade,
  name                text not null,
  description         text,
  order_index         int not null default 0,
  popup_content       jsonb,
  depends_on_stage_id uuid references public.flow_stages(id),
  form_ids            uuid[] not null default '{}',
  created_at          timestamptz not null default now()
);

alter table public.flow_stages enable row level security;

create policy "authenticated_read_flow_stages" on public.flow_stages
  for select to authenticated using (true);
create policy "admins_write_flow_stages" on public.flow_stages
  for all using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

-- ============================================================
-- CLIENT FLOWS
-- ============================================================
create table public.client_flows (
  id               uuid primary key default uuid_generate_v4(),
  client_id        uuid not null references public.profiles(id) on delete cascade,
  flow_template_id uuid not null references public.flow_templates(id),
  status           text not null default 'not_started'
    check (status in ('not_started','in_progress','completed')),
  assigned_by      uuid not null references public.profiles(id),
  started_at       timestamptz,
  completed_at     timestamptz,
  created_at       timestamptz not null default now()
);

alter table public.client_flows enable row level security;

create policy "admins_editors_read_all_client_flows" on public.client_flows
  for select using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin','editor'))
  );
create policy "clients_read_own_flows" on public.client_flows
  for select using (client_id = auth.uid());
create policy "admins_write_client_flows" on public.client_flows
  for all using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

-- ============================================================
-- CLIENT STAGE PROGRESS
-- ============================================================
create table public.client_stage_progress (
  id             uuid primary key default uuid_generate_v4(),
  client_flow_id uuid not null references public.client_flows(id) on delete cascade,
  stage_id       uuid not null references public.flow_stages(id),
  status         text not null default 'locked'
    check (status in ('locked','available','in_progress','completed')),
  completed_at   timestamptz,
  unique (client_flow_id, stage_id)
);

alter table public.client_stage_progress enable row level security;

create policy "admins_editors_read_all_stage_progress" on public.client_stage_progress
  for select using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin','editor'))
  );
create policy "clients_read_own_stage_progress" on public.client_stage_progress
  for select using (
    exists (
      select 1 from public.client_flows cf
      where cf.id = client_stage_progress.client_flow_id and cf.client_id = auth.uid()
    )
  );
create policy "clients_update_own_stage_progress" on public.client_stage_progress
  for update using (
    exists (
      select 1 from public.client_flows cf
      where cf.id = client_stage_progress.client_flow_id and cf.client_id = auth.uid()
    )
  );
create policy "admins_editors_write_stage_progress" on public.client_stage_progress
  for all using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin','editor'))
  );

-- ============================================================
-- FORM SUBMISSIONS
-- ============================================================
create table public.form_submissions (
  id               uuid primary key default uuid_generate_v4(),
  client_flow_id   uuid not null references public.client_flows(id) on delete cascade,
  form_template_id uuid not null references public.form_templates(id),
  stage_id         uuid not null references public.flow_stages(id),
  client_id        uuid not null references public.profiles(id) on delete cascade,
  data             jsonb not null default '{}',
  submitted_at     timestamptz not null default now()
);

alter table public.form_submissions enable row level security;

create policy "admins_editors_read_all_submissions" on public.form_submissions
  for select using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin','editor'))
  );
create policy "clients_read_own_submissions" on public.form_submissions
  for select using (client_id = auth.uid());
create policy "clients_insert_submissions" on public.form_submissions
  for insert with check (client_id = auth.uid());

-- ============================================================
-- STORAGE BUCKETS
-- Run separately in Supabase Storage dashboard or via CLI:
--
-- supabase storage create social-files --public false
-- supabase storage create web-files --public false
--
-- Then add storage policies:
-- Admins/editors: full access to all paths
-- Clients: access only to {client_id}/* paths
-- ============================================================
