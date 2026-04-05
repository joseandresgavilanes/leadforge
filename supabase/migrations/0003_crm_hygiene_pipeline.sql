-- CRM hygiene: opportunity closure, quote lifecycle, import audit trail

-- Opportunities: competitor on loss, explicit close timestamp
alter table public.opportunities
  add column if not exists competitor text,
  add column if not exists closed_at timestamptz;

-- Quote statuses: viewed + cancelled
alter table public.quotes drop constraint if exists quotes_status_check;
alter table public.quotes add constraint quotes_status_check
  check (status in ('draft', 'sent', 'viewed', 'accepted', 'rejected', 'expired', 'cancelled'));

-- Import runs (audit + summary for enterprise CSV imports)
create table if not exists public.import_runs (
  id                uuid primary key default uuid_generate_v4(),
  organization_id   uuid not null references public.organizations(id) on delete cascade,
  created_by        uuid references auth.users(id),
  entity_type       text not null check (entity_type in ('leads', 'contacts', 'companies', 'opportunities')),
  file_name         text,
  dry_run           boolean not null default false,
  summary           jsonb not null default '{}',
  created_at        timestamptz not null default now()
);

create index idx_import_runs_org_id on public.import_runs(organization_id);
create index idx_import_runs_created_at on public.import_runs(created_at desc);

alter table public.import_runs enable row level security;

create policy "Org managers can view import runs"
  on public.import_runs for select
  using (
    public.is_org_member(organization_id)
    and public.get_user_org_role(organization_id) in ('org_admin', 'sales_manager')
  );

create policy "Org managers can insert import runs"
  on public.import_runs for insert
  with check (
    public.is_org_member(organization_id)
    and public.get_user_org_role(organization_id) in ('org_admin', 'sales_manager')
  );

-- Dedupe-friendly search (optional; app enforces uniqueness rules on merge)
create index if not exists idx_contacts_org_email_lower
  on public.contacts (organization_id, lower(trim(email)))
  where email is not null and trim(email) <> '';

create index if not exists idx_leads_org_email_lower
  on public.leads (organization_id, lower(trim(email)))
  where email is not null and trim(email) <> '';

create index if not exists idx_companies_org_domain_lower
  on public.companies (organization_id, lower(trim(domain)))
  where domain is not null and trim(domain) <> '';
