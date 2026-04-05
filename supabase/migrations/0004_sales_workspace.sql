-- Sales workspace: communications inbox, sequences, saved views, pipeline timing

-- Track how long opportunity has been in current stage (governance / deal health)
alter table public.opportunities
  add column if not exists stage_entered_at timestamptz not null default now();

update public.opportunities o
set stage_entered_at = coalesce(o.updated_at, o.created_at)
where stage_entered_at is null;

create or replace function public.opportunity_stage_entered_reset()
returns trigger language plpgsql as $$
begin
  if tg_op = 'UPDATE' and (old.stage_id is distinct from new.stage_id) then
    new.stage_entered_at := now();
  end if;
  return new;
end;
$$;

drop trigger if exists trg_opp_stage_entered on public.opportunities;
create trigger trg_opp_stage_entered
  before update on public.opportunities
  for each row execute function public.opportunity_stage_entered_reset();

-- ---------------------------------------------------------------------------
-- Communication threads (manual logging + future email sync)
-- ---------------------------------------------------------------------------
create table if not exists public.communication_threads (
  id                uuid primary key default uuid_generate_v4(),
  organization_id   uuid not null references public.organizations(id) on delete cascade,
  subject           text not null,
  lead_id           uuid references public.leads(id) on delete set null,
  contact_id        uuid references public.contacts(id) on delete set null,
  company_id        uuid references public.companies(id) on delete set null,
  opportunity_id    uuid references public.opportunities(id) on delete set null,
  last_message_at   timestamptz not null default now(),
  created_by        uuid references auth.users(id),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  constraint communication_threads_at_least_one_record check (
    lead_id is not null or contact_id is not null or company_id is not null or opportunity_id is not null
  )
);

create index idx_comm_threads_org on public.communication_threads(organization_id);
create index idx_comm_threads_lead on public.communication_threads(lead_id) where lead_id is not null;
create index idx_comm_threads_contact on public.communication_threads(contact_id) where contact_id is not null;
create index idx_comm_threads_opp on public.communication_threads(opportunity_id) where opportunity_id is not null;

alter table public.communication_threads enable row level security;

create policy "Org members manage communication threads"
  on public.communication_threads for all using (public.is_org_member(organization_id));

create trigger update_communication_threads_updated_at
  before update on public.communication_threads
  for each row execute function public.update_updated_at();

create table if not exists public.communication_messages (
  id                uuid primary key default uuid_generate_v4(),
  thread_id         uuid not null references public.communication_threads(id) on delete cascade,
  direction         text not null check (direction in ('inbound', 'outbound')),
  channel           text not null check (channel in ('email', 'call', 'meeting', 'demo', 'note')),
  subject           text,
  body              text not null,
  external_ref      text,
  logged_at         timestamptz not null default now(),
  created_by        uuid references auth.users(id),
  created_at        timestamptz not null default now()
);

create index idx_comm_messages_thread on public.communication_messages(thread_id);

alter table public.communication_messages enable row level security;

create policy "Org members manage communication messages"
  on public.communication_messages for all
  using (
    exists (
      select 1 from public.communication_threads t
      where t.id = communication_messages.thread_id
        and public.is_org_member(t.organization_id)
    )
  );

-- ---------------------------------------------------------------------------
-- Email templates & snippets (compose + future send)
-- ---------------------------------------------------------------------------
create table if not exists public.email_templates (
  id                uuid primary key default uuid_generate_v4(),
  organization_id   uuid not null references public.organizations(id) on delete cascade,
  name              text not null,
  category          text,
  subject           text not null,
  body              text not null,
  created_by        uuid references auth.users(id),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index idx_email_templates_org on public.email_templates(organization_id);

alter table public.email_templates enable row level security;

create policy "Org members manage email templates"
  on public.email_templates for all using (public.is_org_member(organization_id));

create trigger update_email_templates_updated_at
  before update on public.email_templates
  for each row execute function public.update_updated_at();

create table if not exists public.email_snippets (
  id                uuid primary key default uuid_generate_v4(),
  organization_id   uuid not null references public.organizations(id) on delete cascade,
  name              text not null,
  shortcut          text,
  body              text not null,
  created_by        uuid references auth.users(id),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index idx_email_snippets_org on public.email_snippets(organization_id);

alter table public.email_snippets enable row level security;

create policy "Org members manage email snippets"
  on public.email_snippets for all using (public.is_org_member(organization_id));

create trigger update_email_snippets_updated_at
  before update on public.email_snippets
  for each row execute function public.update_updated_at();

-- ---------------------------------------------------------------------------
-- Sequences (cadences)
-- ---------------------------------------------------------------------------
create table if not exists public.sequences (
  id                      uuid primary key default uuid_generate_v4(),
  organization_id         uuid not null references public.organizations(id) on delete cascade,
  name                    text not null,
  description             text,
  active                  boolean not null default true,
  exit_on_terminal_stage  boolean not null default true,
  created_by              uuid references auth.users(id),
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);

create index idx_sequences_org on public.sequences(organization_id);

alter table public.sequences enable row level security;

create policy "Org members manage sequences"
  on public.sequences for all using (public.is_org_member(organization_id));

create trigger update_sequences_updated_at
  before update on public.sequences
  for each row execute function public.update_updated_at();

create table if not exists public.sequence_steps (
  id              uuid primary key default uuid_generate_v4(),
  sequence_id     uuid not null references public.sequences(id) on delete cascade,
  position        int not null,
  step_type       text not null check (step_type in ('email', 'task', 'wait')),
  email_subject   text,
  email_body      text,
  task_title      text,
  task_due_days   int,
  wait_hours      int not null default 24,
  unique (sequence_id, position)
);

create index idx_sequence_steps_seq on public.sequence_steps(sequence_id);

alter table public.sequence_steps enable row level security;

create policy "Org members manage sequence steps"
  on public.sequence_steps for all
  using (
    exists (
      select 1 from public.sequences s
      where s.id = sequence_steps.sequence_id
        and public.is_org_member(s.organization_id)
    )
  );

create table if not exists public.sequence_enrollments (
  id                  uuid primary key default uuid_generate_v4(),
  organization_id     uuid not null references public.organizations(id) on delete cascade,
  sequence_id         uuid not null references public.sequences(id) on delete cascade,
  lead_id             uuid references public.leads(id) on delete cascade,
  contact_id          uuid references public.contacts(id) on delete cascade,
  opportunity_id      uuid references public.opportunities(id) on delete cascade,
  status              text not null default 'active' check (status in ('active', 'paused', 'completed', 'cancelled')),
  current_step_index  int not null default 0,
  next_run_at         timestamptz not null default now(),
  enrolled_by         uuid references auth.users(id),
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  constraint sequence_enrollments_one_target check (
    (lead_id is not null)::int + (contact_id is not null)::int + (opportunity_id is not null)::int = 1
  )
);

create index idx_seq_enroll_org on public.sequence_enrollments(organization_id);
create index idx_seq_enroll_seq on public.sequence_enrollments(sequence_id);
create index idx_seq_enroll_status on public.sequence_enrollments(status, next_run_at);

alter table public.sequence_enrollments enable row level security;

create policy "Org members manage sequence enrollments"
  on public.sequence_enrollments for all using (public.is_org_member(organization_id));

create trigger update_sequence_enrollments_updated_at
  before update on public.sequence_enrollments
  for each row execute function public.update_updated_at();

-- ---------------------------------------------------------------------------
-- Saved views (smart lists)
-- ---------------------------------------------------------------------------
create table if not exists public.saved_views (
  id                uuid primary key default uuid_generate_v4(),
  organization_id   uuid not null references public.organizations(id) on delete cascade,
  user_id           uuid not null references auth.users(id) on delete cascade,
  entity_type       text not null check (entity_type in ('leads', 'contacts', 'companies', 'opportunities', 'tasks', 'quotes')),
  name              text not null,
  is_shared         boolean not null default false,
  is_pinned         boolean not null default false,
  filters           jsonb not null default '{}',
  sort              jsonb,
  columns           jsonb,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index idx_saved_views_org_entity on public.saved_views(organization_id, entity_type);
create index idx_saved_views_user on public.saved_views(user_id);

alter table public.saved_views enable row level security;

create policy "Users read saved views in org"
  on public.saved_views for select
  using (
    public.is_org_member(organization_id)
    and (user_id = auth.uid() or is_shared = true)
  );

create policy "Users insert own saved views"
  on public.saved_views for insert
  with check (public.is_org_member(organization_id) and user_id = auth.uid());

create policy "Users update own saved views"
  on public.saved_views for update
  using (public.is_org_member(organization_id) and user_id = auth.uid());

create policy "Users delete own saved views"
  on public.saved_views for delete
  using (public.is_org_member(organization_id) and user_id = auth.uid());

create trigger update_saved_views_updated_at
  before update on public.saved_views
  for each row execute function public.update_updated_at();
