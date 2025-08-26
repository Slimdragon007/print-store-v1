-- Reset existing tables if structure was wrong
drop table if exists print_variants cascade;
drop table if exists prints cascade;

-- ===== Catalog tables =====
-- Ensure the pgcrypto extension is installed for UUID generation
create extension if not exists pgcrypto;

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
create index idx_prints_slug on public.prints (slug);
create index idx_variants_print on public.print_variants (print_id);
create index idx_variants_position on public.print_variants (print_id, position);

-- ===== RLS =====
alter table public.prints enable row level security;
alter table public.print_variants enable row level security;

-- Drop existing policies if they exist
drop policy if exists "prints_select_public" on public.prints;
drop policy if exists "print_variants_select_public" on public.print_variants;

-- Public read-only access to catalog (anon key)
create policy "prints_select_public"
  on public.prints for select using (true);

create policy "print_variants_select_public"
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