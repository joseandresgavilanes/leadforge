-- Organization creator audit + invitations RLS
-- Safe membership onboarding uses service role in app code; these policies unblock team UI reads/writes.

alter table public.organizations
  add column if not exists created_by uuid references auth.users(id);

-- Demo org (fixed id from seed) — attribute to admin user when present
update public.organizations
set created_by = '00000000-0000-0000-0000-000000000101'
where id = '00000000-0000-0000-0000-000000000001'
  and created_by is null;

-- Invitations: members of the org can see pending invites
create policy "Org members can view invitations"
  on public.invitations for select
  using (public.is_org_member(organization_id));

-- Admins and managers can invite
create policy "Admins and managers can create invitations"
  on public.invitations for insert
  with check (
    public.get_user_org_role(organization_id) in ('org_admin', 'sales_manager')
  );

-- Admins and managers can cancel/update invites (e.g. mark accepted via app)
create policy "Admins and managers can update invitations"
  on public.invitations for update
  using (
    public.get_user_org_role(organization_id) in ('org_admin', 'sales_manager')
  );
