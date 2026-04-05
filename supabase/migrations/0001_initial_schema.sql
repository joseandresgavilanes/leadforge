-- LeadForge CRM — Initial Schema Migration
-- Run: supabase db push

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================================
-- PROFILES (extends Supabase auth.users)
-- ============================================================
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  first_name  text,
  last_name   text,
  email       text not null,
  phone       text,
  job_title   text,
  avatar_url  text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Users can view their own profile"
  on public.profiles for select using (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update using (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, first_name, last_name)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'first_name',
    new.raw_user_meta_data->>'last_name'
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- ORGANIZATIONS
-- ============================================================
create table if not exists public.organizations (
  id                      uuid primary key default uuid_generate_v4(),
  name                    text not null,
  slug                    text unique,
  domain                  text,
  industry                text,
  timezone                text not null default 'UTC',
  currency                text not null default 'USD',
  logo_url                text,
  plan                    text not null default 'starter' check (plan in ('starter', 'growth', 'pro')),
  stripe_customer_id      text unique,
  stripe_subscription_id  text unique,
  subscription_status     text check (subscription_status in ('trialing', 'active', 'past_due', 'cancelled')),
  trial_ends_at           timestamptz,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);

alter table public.organizations enable row level security;

-- ============================================================
-- MEMBERSHIPS
-- ============================================================
create table if not exists public.memberships (
  id               uuid primary key default uuid_generate_v4(),
  organization_id  uuid not null references public.organizations(id) on delete cascade,
  user_id          uuid not null references auth.users(id) on delete cascade,
  role             text not null default 'sales_rep' check (role in ('org_admin', 'sales_manager', 'sales_rep', 'viewer')),
  invited_by       uuid references auth.users(id),
  invited_at       timestamptz,
  accepted_at      timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  unique (organization_id, user_id)
);

create index idx_memberships_user_id on public.memberships(user_id);
create index idx_memberships_org_id on public.memberships(organization_id);

alter table public.memberships enable row level security;

-- Helper function: check membership
create or replace function public.get_user_org_role(org_id uuid)
returns text language sql stable security definer as $$
  select role from public.memberships
  where organization_id = org_id
    and user_id = auth.uid()
    and accepted_at is not null
  limit 1;
$$;

create or replace function public.is_org_member(org_id uuid)
returns boolean language sql stable security definer as $$
  select exists (
    select 1 from public.memberships
    where organization_id = org_id
      and user_id = auth.uid()
      and accepted_at is not null
  );
$$;

-- Org RLS policies
create policy "Org members can view organization"
  on public.organizations for select
  using (public.is_org_member(id));

create policy "Org admins can update organization"
  on public.organizations for update
  using (public.get_user_org_role(id) = 'org_admin');

-- Membership policies
create policy "Members can view their memberships"
  on public.memberships for select
  using (user_id = auth.uid() or public.is_org_member(organization_id));

-- ============================================================
-- INVITATIONS
-- ============================================================
create table if not exists public.invitations (
  id               uuid primary key default uuid_generate_v4(),
  organization_id  uuid not null references public.organizations(id) on delete cascade,
  email            text not null,
  role             text not null default 'sales_rep' check (role in ('org_admin', 'sales_manager', 'sales_rep', 'viewer')),
  token            text not null unique default encode(gen_random_bytes(32), 'hex'),
  invited_by       uuid references auth.users(id),
  accepted_at      timestamptz,
  expires_at       timestamptz not null default (now() + interval '7 days'),
  created_at       timestamptz not null default now()
);

alter table public.invitations enable row level security;

-- ============================================================
-- LEADS
-- ============================================================
create table if not exists public.leads (
  id                        uuid primary key default uuid_generate_v4(),
  organization_id           uuid not null references public.organizations(id) on delete cascade,
  first_name                text not null,
  last_name                 text,
  email                     text,
  phone                     text,
  company                   text,
  job_title                 text,
  source                    text,
  status                    text not null default 'new' check (status in ('new', 'contacted', 'qualified', 'unqualified', 'converted')),
  score                     integer not null default 50 check (score >= 0 and score <= 100),
  owner_id                  uuid references auth.users(id),
  tags                      text[] not null default '{}',
  notes                     text,
  website                   text,
  industry                  text,
  budget                    numeric(15,2),
  converted_at              timestamptz,
  converted_contact_id      uuid,
  converted_company_id      uuid,
  converted_opportunity_id  uuid,
  created_by                uuid references auth.users(id),
  created_at                timestamptz not null default now(),
  updated_at                timestamptz not null default now()
);

create index idx_leads_org_id on public.leads(organization_id);
create index idx_leads_status on public.leads(status);
create index idx_leads_owner_id on public.leads(owner_id);
create index idx_leads_created_at on public.leads(created_at);

alter table public.leads enable row level security;

create policy "Org members can view leads"
  on public.leads for select using (public.is_org_member(organization_id));

create policy "Org members can insert leads"
  on public.leads for insert with check (public.is_org_member(organization_id));

create policy "Org members can update leads"
  on public.leads for update using (public.is_org_member(organization_id));

create policy "Managers and admins can delete leads"
  on public.leads for delete using (
    public.get_user_org_role(organization_id) in ('org_admin', 'sales_manager')
  );

-- ============================================================
-- COMPANIES
-- ============================================================
create table if not exists public.companies (
  id               uuid primary key default uuid_generate_v4(),
  organization_id  uuid not null references public.organizations(id) on delete cascade,
  name             text not null,
  domain           text,
  industry         text,
  size             text,
  annual_revenue   numeric(15,2),
  phone            text,
  address          text,
  city             text,
  country          text,
  website          text,
  owner_id         uuid references auth.users(id),
  notes            text,
  created_by       uuid references auth.users(id),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index idx_companies_org_id on public.companies(organization_id);
create index idx_companies_name on public.companies(name);

alter table public.companies enable row level security;

create policy "Org members can manage companies"
  on public.companies for all using (public.is_org_member(organization_id));

-- ============================================================
-- CONTACTS
-- ============================================================
create table if not exists public.contacts (
  id               uuid primary key default uuid_generate_v4(),
  organization_id  uuid not null references public.organizations(id) on delete cascade,
  first_name       text not null,
  last_name        text,
  email            text,
  phone            text,
  job_title        text,
  company_id       uuid references public.companies(id),
  owner_id         uuid references auth.users(id),
  tags             text[] not null default '{}',
  notes            text,
  linkedin_url     text,
  created_by       uuid references auth.users(id),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index idx_contacts_org_id on public.contacts(organization_id);
create index idx_contacts_company_id on public.contacts(company_id);
create index idx_contacts_email on public.contacts(email);

alter table public.contacts enable row level security;

create policy "Org members can manage contacts"
  on public.contacts for all using (public.is_org_member(organization_id));

-- ============================================================
-- OPPORTUNITY STAGES
-- ============================================================
create table if not exists public.opportunity_stages (
  id               uuid primary key default uuid_generate_v4(),
  organization_id  uuid not null references public.organizations(id) on delete cascade,
  name             text not null,
  position         integer not null default 0,
  probability      integer not null default 50 check (probability >= 0 and probability <= 100),
  color            text not null default '#6366f1',
  is_closed_won    boolean not null default false,
  is_closed_lost   boolean not null default false,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index idx_opportunity_stages_org_id on public.opportunity_stages(organization_id);

alter table public.opportunity_stages enable row level security;

create policy "Org members can manage opportunity stages"
  on public.opportunity_stages for all using (public.is_org_member(organization_id));

-- ============================================================
-- OPPORTUNITIES
-- ============================================================
create table if not exists public.opportunities (
  id               uuid primary key default uuid_generate_v4(),
  organization_id  uuid not null references public.organizations(id) on delete cascade,
  name             text not null,
  value            numeric(15,2) not null default 0,
  stage_id         uuid not null references public.opportunity_stages(id),
  probability      integer not null default 50,
  close_date       date,
  owner_id         uuid references auth.users(id),
  contact_id       uuid references public.contacts(id),
  company_id       uuid references public.companies(id),
  source           text,
  next_action      text,
  lost_reason      text,
  notes            text,
  created_by       uuid references auth.users(id),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index idx_opportunities_org_id on public.opportunities(organization_id);
create index idx_opportunities_stage_id on public.opportunities(stage_id);
create index idx_opportunities_owner_id on public.opportunities(owner_id);
create index idx_opportunities_close_date on public.opportunities(close_date);

alter table public.opportunities enable row level security;

create policy "Org members can manage opportunities"
  on public.opportunities for all using (public.is_org_member(organization_id));

-- ============================================================
-- ACTIVITIES
-- ============================================================
create table if not exists public.activities (
  id               uuid primary key default uuid_generate_v4(),
  organization_id  uuid not null references public.organizations(id) on delete cascade,
  type             text not null check (type in ('call', 'meeting', 'email', 'note', 'demo', 'task')),
  subject          text not null,
  description      text,
  duration_minutes integer,
  outcome          text,
  activity_date    timestamptz not null default now(),
  lead_id          uuid references public.leads(id) on delete set null,
  contact_id       uuid references public.contacts(id) on delete set null,
  company_id       uuid references public.companies(id) on delete set null,
  opportunity_id   uuid references public.opportunities(id) on delete set null,
  created_by       uuid references auth.users(id),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index idx_activities_org_id on public.activities(organization_id);
create index idx_activities_opportunity_id on public.activities(opportunity_id);
create index idx_activities_contact_id on public.activities(contact_id);
create index idx_activities_activity_date on public.activities(activity_date);

alter table public.activities enable row level security;

create policy "Org members can manage activities"
  on public.activities for all using (public.is_org_member(organization_id));

-- ============================================================
-- TASKS
-- ============================================================
create table if not exists public.tasks (
  id               uuid primary key default uuid_generate_v4(),
  organization_id  uuid not null references public.organizations(id) on delete cascade,
  title            text not null,
  description      text,
  priority         text not null default 'medium' check (priority in ('low', 'medium', 'high', 'urgent')),
  due_date         timestamptz,
  completed_at     timestamptz,
  owner_id         uuid references auth.users(id),
  lead_id          uuid references public.leads(id) on delete set null,
  contact_id       uuid references public.contacts(id) on delete set null,
  company_id       uuid references public.companies(id) on delete set null,
  opportunity_id   uuid references public.opportunities(id) on delete set null,
  created_by       uuid references auth.users(id),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index idx_tasks_org_id on public.tasks(organization_id);
create index idx_tasks_owner_id on public.tasks(owner_id);
create index idx_tasks_due_date on public.tasks(due_date);
create index idx_tasks_completed_at on public.tasks(completed_at);

alter table public.tasks enable row level security;

create policy "Org members can manage tasks"
  on public.tasks for all using (public.is_org_member(organization_id));

-- ============================================================
-- QUOTES
-- ============================================================
create table if not exists public.quotes (
  id               uuid primary key default uuid_generate_v4(),
  organization_id  uuid not null references public.organizations(id) on delete cascade,
  quote_number     text not null,
  title            text not null,
  opportunity_id   uuid references public.opportunities(id) on delete set null,
  contact_id       uuid references public.contacts(id) on delete set null,
  company_id       uuid references public.companies(id) on delete set null,
  status           text not null default 'draft' check (status in ('draft', 'sent', 'accepted', 'rejected', 'expired')),
  issue_date       date not null default current_date,
  expiry_date      date,
  subtotal         numeric(15,2) not null default 0,
  tax_rate         numeric(5,2) not null default 0,
  tax_amount       numeric(15,2) not null default 0,
  discount         numeric(15,2) not null default 0,
  total            numeric(15,2) not null default 0,
  notes            text,
  terms            text,
  created_by       uuid references auth.users(id),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  unique (organization_id, quote_number)
);

create index idx_quotes_org_id on public.quotes(organization_id);
create index idx_quotes_opportunity_id on public.quotes(opportunity_id);

alter table public.quotes enable row level security;

create policy "Org members can manage quotes"
  on public.quotes for all using (public.is_org_member(organization_id));

-- ============================================================
-- QUOTE ITEMS
-- ============================================================
create table if not exists public.quote_items (
  id           uuid primary key default uuid_generate_v4(),
  quote_id     uuid not null references public.quotes(id) on delete cascade,
  description  text not null,
  quantity     numeric(10,2) not null default 1,
  unit_price   numeric(15,2) not null default 0,
  amount       numeric(15,2) not null default 0,
  position     integer not null default 0,
  created_at   timestamptz not null default now()
);

create index idx_quote_items_quote_id on public.quote_items(quote_id);

alter table public.quote_items enable row level security;

create policy "Org members can manage quote items via quotes"
  on public.quote_items for all
  using (
    exists (
      select 1 from public.quotes q
      where q.id = quote_id
        and public.is_org_member(q.organization_id)
    )
  );

-- ============================================================
-- NOTES
-- ============================================================
create table if not exists public.notes (
  id               uuid primary key default uuid_generate_v4(),
  organization_id  uuid not null references public.organizations(id) on delete cascade,
  content          text not null,
  lead_id          uuid references public.leads(id) on delete cascade,
  contact_id       uuid references public.contacts(id) on delete cascade,
  company_id       uuid references public.companies(id) on delete cascade,
  opportunity_id   uuid references public.opportunities(id) on delete cascade,
  created_by       uuid references auth.users(id),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

alter table public.notes enable row level security;

create policy "Org members can manage notes"
  on public.notes for all using (public.is_org_member(organization_id));

-- ============================================================
-- AUDIT LOGS
-- ============================================================
create table if not exists public.audit_logs (
  id               uuid primary key default uuid_generate_v4(),
  organization_id  uuid references public.organizations(id) on delete cascade,
  actor_id         uuid references auth.users(id),
  action           text not null,
  entity_type      text not null,
  entity_id        uuid,
  metadata         jsonb not null default '{}',
  created_at       timestamptz not null default now()
);

create index idx_audit_logs_org_id on public.audit_logs(organization_id);
create index idx_audit_logs_created_at on public.audit_logs(created_at);

alter table public.audit_logs enable row level security;

create policy "Admins can view audit logs"
  on public.audit_logs for select
  using (public.get_user_org_role(organization_id) in ('org_admin', 'sales_manager'));

create policy "System can insert audit logs"
  on public.audit_logs for insert with check (true);

-- ============================================================
-- ANALYTICS EVENTS
-- ============================================================
create table if not exists public.analytics_events (
  id               uuid primary key default uuid_generate_v4(),
  organization_id  uuid references public.organizations(id) on delete cascade,
  user_id          uuid references auth.users(id),
  event            text not null,
  properties       jsonb not null default '{}',
  created_at       timestamptz not null default now()
);

create index idx_analytics_events_org_id on public.analytics_events(organization_id);
create index idx_analytics_events_event on public.analytics_events(event);

alter table public.analytics_events enable row level security;

create policy "Admins can view analytics"
  on public.analytics_events for select
  using (public.get_user_org_role(organization_id) in ('org_admin', 'sales_manager'));

create policy "System can insert analytics"
  on public.analytics_events for insert with check (true);

-- ============================================================
-- UPDATED_AT TRIGGER
-- ============================================================
create or replace function public.update_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger update_organizations_updated_at before update on public.organizations for each row execute function public.update_updated_at();
create trigger update_profiles_updated_at before update on public.profiles for each row execute function public.update_updated_at();
create trigger update_memberships_updated_at before update on public.memberships for each row execute function public.update_updated_at();
create trigger update_leads_updated_at before update on public.leads for each row execute function public.update_updated_at();
create trigger update_contacts_updated_at before update on public.contacts for each row execute function public.update_updated_at();
create trigger update_companies_updated_at before update on public.companies for each row execute function public.update_updated_at();
create trigger update_opportunity_stages_updated_at before update on public.opportunity_stages for each row execute function public.update_updated_at();
create trigger update_opportunities_updated_at before update on public.opportunities for each row execute function public.update_updated_at();
create trigger update_activities_updated_at before update on public.activities for each row execute function public.update_updated_at();
create trigger update_tasks_updated_at before update on public.tasks for each row execute function public.update_updated_at();
create trigger update_quotes_updated_at before update on public.quotes for each row execute function public.update_updated_at();
create trigger update_notes_updated_at before update on public.notes for each row execute function public.update_updated_at();
