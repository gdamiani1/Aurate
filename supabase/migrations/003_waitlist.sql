create table public.waitlist (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  source text default 'mogster.app',
  user_agent text,
  created_at timestamptz default now(),
  constraint waitlist_email_unique unique (email),
  constraint waitlist_email_valid check (email ~ '^[^@]+@[^@]+\.[^@]+$')
);

alter table public.waitlist enable row level security;

-- Anonymous clients (the public web site) can INSERT only.
-- Nobody can SELECT/UPDATE/DELETE through RLS; reads happen via
-- Supabase dashboard or service-role key.
create policy "waitlist_insert_anon"
  on public.waitlist for insert
  to anon
  with check (true);
