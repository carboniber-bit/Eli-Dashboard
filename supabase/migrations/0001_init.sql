-- Eliclothing — schema inicial (MVP)
create extension if not exists "pgcrypto";

-- ---------- utilidades ----------
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

-- ---------- clientes ----------
create table public.clientes (
  id uuid primary key default gen_random_uuid(),
  nome text not null check (char_length(trim(nome)) > 0),
  telefone text,
  observacoes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index clientes_nome_idx on public.clientes (lower(nome));
create trigger clientes_updated before update on public.clientes
  for each row execute function public.set_updated_at();

-- ---------- encomendas ----------
create type public.status_encomenda as enum (
  'recebido', 'producao', 'finalizacao', 'pronto', 'entregue', 'cancelado'
);

create table public.encomendas (
  id uuid primary key default gen_random_uuid(),
  numero bigint generated always as identity,
  cliente_id uuid not null references public.clientes (id) on delete restrict,
  peca text not null check (char_length(trim(peca)) > 0),
  categoria text,
  tamanho text,
  cor text,
  quantidade integer not null default 1 check (quantidade > 0),
  valor_total numeric(10,2) not null check (valor_total >= 0),
  data_pedido date not null default current_date,
  prazo_entrega date not null,
  descricao text,
  observacoes text,
  foto_url text,
  status public.status_encomenda not null default 'recebido',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index encomendas_cliente_idx on public.encomendas (cliente_id);
create index encomendas_status_idx on public.encomendas (status);
create index encomendas_prazo_idx on public.encomendas (prazo_entrega);
create trigger encomendas_updated before update on public.encomendas
  for each row execute function public.set_updated_at();

-- ---------- pagamentos ----------
create type public.forma_pagamento as enum ('pix', 'dinheiro', 'cartao', 'transferencia', 'outro');

create table public.pagamentos (
  id uuid primary key default gen_random_uuid(),
  encomenda_id uuid not null references public.encomendas (id) on delete cascade,
  valor numeric(10,2) not null check (valor > 0),
  data date not null default current_date,
  forma public.forma_pagamento not null default 'pix',
  observacao text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index pagamentos_encomenda_idx on public.pagamentos (encomenda_id);
create index pagamentos_data_idx on public.pagamentos (data);
create trigger pagamentos_updated before update on public.pagamentos
  for each row execute function public.set_updated_at();

-- ---------- histórico da encomenda ----------
create table public.historico (
  id uuid primary key default gen_random_uuid(),
  encomenda_id uuid not null references public.encomendas (id) on delete cascade,
  evento text not null,
  detalhe text,
  created_at timestamptz not null default now()
);
create index historico_encomenda_idx on public.historico (encomenda_id, created_at desc);

-- ---------- pronta-entrega ----------
create type public.status_peca as enum ('disponivel', 'reservada', 'vendida');

create table public.pronta_entrega (
  id uuid primary key default gen_random_uuid(),
  nome text not null check (char_length(trim(nome)) > 0),
  foto_url text,
  categoria text,
  descricao text,
  tamanho text,
  cor text,
  quantidade integer not null default 1 check (quantidade >= 0),
  preco_venda numeric(10,2) not null check (preco_venda >= 0),
  custo numeric(10,2) check (custo >= 0),
  status public.status_peca not null default 'disponivel',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index pronta_entrega_status_idx on public.pronta_entrega (status);
create trigger pronta_entrega_updated before update on public.pronta_entrega
  for each row execute function public.set_updated_at();

create table public.vendas (
  id uuid primary key default gen_random_uuid(),
  peca_id uuid not null references public.pronta_entrega (id) on delete restrict,
  quantidade integer not null check (quantidade > 0),
  valor numeric(10,2) not null check (valor >= 0),
  forma public.forma_pagamento not null default 'pix',
  data date not null default current_date,
  created_at timestamptz not null default now()
);
create index vendas_peca_idx on public.vendas (peca_id);

-- ---------- visão: encomendas com situação financeira ----------
create view public.encomendas_resumo
with (security_invoker = true) as
select
  e.*,
  c.nome as cliente_nome,
  c.telefone as cliente_telefone,
  coalesce(p.total_pago, 0)::numeric(10,2) as total_pago,
  greatest(e.valor_total - coalesce(p.total_pago, 0), 0)::numeric(10,2) as saldo,
  case
    when coalesce(p.total_pago, 0) <= 0 then 'nao_pago'
    when coalesce(p.total_pago, 0) >= e.valor_total then 'pago'
    when p.qtd = 1 then 'sinal'
    else 'parcial'
  end as status_pagamento
from public.encomendas e
join public.clientes c on c.id = e.cliente_id
left join (
  select encomenda_id, sum(valor) as total_pago, count(*) as qtd
  from public.pagamentos
  group by encomenda_id
) p on p.encomenda_id = e.id;

-- ---------- RLS: loja de uso interno, só usuárias autenticadas ----------
alter table public.clientes enable row level security;
alter table public.encomendas enable row level security;
alter table public.pagamentos enable row level security;
alter table public.historico enable row level security;
alter table public.pronta_entrega enable row level security;
alter table public.vendas enable row level security;

do $$
declare t text;
begin
  foreach t in array array['clientes','encomendas','pagamentos','historico','pronta_entrega','vendas']
  loop
    execute format(
      'create policy "autenticadas_tudo" on public.%I for all to authenticated using (true) with check (true)', t);
  end loop;
end $$;

-- ---------- storage de fotos ----------
insert into storage.buckets (id, name, public)
values ('fotos', 'fotos', true)
on conflict (id) do nothing;

create policy "fotos_leitura" on storage.objects
  for select using (bucket_id = 'fotos');
create policy "fotos_envio" on storage.objects
  for insert to authenticated with check (bucket_id = 'fotos');
create policy "fotos_remocao" on storage.objects
  for delete to authenticated using (bucket_id = 'fotos');

-- ---------- venda de pronta-entrega (atômica) ----------
create or replace function public.registrar_venda(
  p_peca uuid, p_quantidade int, p_forma public.forma_pagamento
) returns void language plpgsql as $$
declare v public.pronta_entrega;
begin
  select * into v from public.pronta_entrega where id = p_peca for update;
  if not found then raise exception 'Peça não encontrada'; end if;
  if v.quantidade < p_quantidade then
    raise exception 'Só há % unidade(s) desta peça', v.quantidade;
  end if;
  insert into public.vendas (peca_id, quantidade, valor, forma)
    values (p_peca, p_quantidade, v.preco_venda * p_quantidade, p_forma);
  update public.pronta_entrega
    set quantidade = quantidade - p_quantidade,
        status = case when quantidade - p_quantidade = 0 then 'vendida' else 'disponivel' end
    where id = p_peca;
end $$;
