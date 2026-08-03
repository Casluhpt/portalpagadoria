-- 1. Create permissions table
create table public.app_permissions (
    id uuid primary key default gen_random_uuid(),
    role public.app_role not null,
    resource text not null, -- module name, e.g., 'pagamentos', 'provisao'
    action text not null, -- 'view', 'create', 'edit', 'delete', 'import', 'export', 'execute'
    is_allowed boolean default false,
    unique (role, resource, action)
);

-- 2. Grants
grant select on public.app_permissions to authenticated;
grant all on public.app_permissions to service_role;

-- 3. RLS
alter table public.app_permissions enable row level security;

create policy "Admins can manage permissions"
on public.app_permissions
for all
to authenticated
using (public.has_role(auth.uid(), 'admin'));

create policy "Authenticated users can read permissions"
on public.app_permissions
for select
to authenticated
using (true);

-- 4. Initial Seed
-- Note: 'admin' role usually has everything, but for this system we'll define explicit overrides.
-- Default for User/Viewer/Visitante will be defined in code but can be overridden here.
insert into public.app_permissions (role, resource, action, is_allowed)
values 
  ('admin', 'configuracoes', 'view', true),
  ('admin', 'configuracoes', 'edit', true),
  ('viewer', 'pagamentos', 'view', true),
  ('viewer', 'pagamentos', 'export', true),
  ('visitante', 'pagamentos', 'view', true);
