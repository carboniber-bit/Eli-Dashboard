-- Gastos da loja (compra de mercadorias etc.) para calcular o lucro do mês
create table public.gastos (
  id uuid primary key default gen_random_uuid(),
  descricao text not null check (char_length(trim(descricao)) > 0),
  valor numeric(10,2) not null check (valor > 0),
  data date not null default current_date,
  categoria text not null default 'Mercadoria',
  observacao text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index gastos_data_idx on public.gastos (data);
create index vendas_data_idx on public.vendas (data);
create trigger gastos_updated before update on public.gastos
  for each row execute function public.set_updated_at();

alter table public.gastos enable row level security;
create policy "autenticadas_tudo" on public.gastos
  for all to authenticated using (true) with check (true);
grant select, insert, update, delete on public.gastos to authenticated;
