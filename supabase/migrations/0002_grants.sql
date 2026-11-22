-- Permissões de uso das tabelas para usuárias logadas (RLS continua valendo).
-- Projetos novos do Supabase podem não conceder isso automaticamente.
grant usage on schema public to authenticated;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant usage, select on all sequences in schema public to authenticated;
grant execute on function public.registrar_venda(uuid, int, public.forma_pagamento) to authenticated;
