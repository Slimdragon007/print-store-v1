-- Reset existing tables if structure was wrong
drop table if exists print_variants cascade;
drop table if exists prints cascade;

-- ===== Catalog tables =====
-- Ensure the pgcrypto extension is installed for UUID generation
create extension if not exists pgcrypto schema public; -- for gen_random_uuid()

create table public.prints (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  -- Use R2 object key rather than a public URL so we can swap CDN later
  r2_key text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.print_variants (
  id uuid primary key default gen_random_uuid(),
  print_id uuid not null references public.prints(id) on delete cascade,
  code text not null,         -- e.g. 8x10
  label text not null,        -- e.g. "8 x 10 in"
  stripe_price_id text,       -- nullable while drafting
  price_cents integer not null check (price_cents >= 0),
  position int not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (print_id, code)
);

-- Helpful indexes
create index if not exists idx_prints_slug on public.prints (slug);
create index if not exists idx_variants_print on public.print_variants (print_id);
create index if not exists idx_variants_position on public.print_variants (print_id, position);

-- ===== RLS =====
alter table public.prints enable row level security;
alter table public.print_variants enable row level security;

-- Public read-only access to catalog (anon key)
create policy if not exists "prints_select_public"
  on public.prints for select using (true);

create policy if not exists "print_variants_select_public"
  on public.print_variants for select using (true);

-- No public insert/update/delete policies so writes require the service role key on the server.

-- ===== updated_at triggers =====
create or replace function public.set_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_prints_updated_at on public.prints;
create trigger trg_prints_updated_at
before update on public.prints
for each row execute function public.set_updated_at();

drop trigger if exists trg_print_variants_updated_at on public.print_variants;
create trigger trg_print_variants_updated_at
before update on public.print_variants
for each row execute function public.set_updated_at();

-- ===== Optional: create a public bucket in Supabase Storage (only if you plan to use Supabase Storage)
-- NOTE: you are currently serving images from Cloudflare R2 via a Next.js proxy.
-- Ensure the storage.buckets table exists before inserting
do $$
begin
  if not exists (select 1 from information_schema.tables where table_schema = 'storage' and table_name = 'buckets') then
    raise exception 'Table storage.buckets does not exist. Please create it before running this script.';
  end if;
end;
$$;

insert into storage.buckets (id, name, public)
values ('prints', 'prints', true)
on conflict (id) do nothing;true)
on conflict (id) do nothing;