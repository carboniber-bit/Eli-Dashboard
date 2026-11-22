# Eli-Dash — gestão da Eliclothing (MVP)

Sistema interno para organizar **encomendas, clientes, pagamentos e peças de pronta-entrega**.
Next.js (App Router) · TypeScript · Tailwind · Supabase · Vercel.

## Telas
- **Dashboard** — números do dia, alertas (atrasados, vencendo, prontos, quem deve) e atalhos.
- **Encomendas** — lista com busca/filtros, cadastro rápido em painel lateral, detalhes, pagamentos e histórico.
- **Clientes** — cadastro, perfil com histórico, total de compras e valores pendentes.
- **Pronta-entrega** — estoque com foto, reserva e venda (atualiza o estoque).

## Como rodar
1. Crie um projeto no [Supabase](https://supabase.com) (plano gratuito).
2. No **SQL Editor**, cole e execute `supabase/migrations/0001_init.sql`.
3. Em **Authentication → Users**, crie o usuário (e-mail e senha) de quem vai usar o sistema.
   Em **Authentication → Providers → Email**, desative "Allow new users to sign up" para o cadastro ficar fechado.
4. Copie `.env.example` para `.env.local` e preencha `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   (Project Settings → API). Nenhuma chave secreta é usada no código.
5. `npm install` e `npm run dev` → http://localhost:3000

## Deploy (Vercel)
Importe o repositório, adicione as duas variáveis de ambiente acima e publique.

## Regras de negócio
- Saldo = valor total − soma dos pagamentos registrados (calculado na view `encomendas_resumo`).
- Situação do pagamento é automática: não pago → sinal pago → parcialmente pago → pago.
- Pedidos cancelados não entram em "falta receber".
- Venda de pronta-entrega é atômica (função SQL `registrar_venda`) e baixa o estoque.
- RLS ligada em todas as tabelas; só usuárias autenticadas acessam.
