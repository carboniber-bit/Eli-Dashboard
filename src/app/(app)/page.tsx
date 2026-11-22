import { AlertTriangle, CheckCircle2, Clock, Plus, UserPlus, Wallet } from "lucide-react";
import Link from "next/link";
import { NovaEncomendaButton } from "@/components/nova-encomenda";
import { StatusEncomendaBadge, StatusPagamentoBadge } from "@/components/status-badges";
import { EmptyState } from "@/components/ui/field";
import { createClient } from "@/lib/supabase/server";
import type { EncomendaResumo } from "@/lib/types";
import { daysUntil, formatBRL, formatDate, todayISO } from "@/lib/utils";

export default async function DashboardPage() {
  const supabase = await createClient();
  const inicioMes = todayISO().slice(0, 8) + "01";

  const [{ data }, { data: pagMes }, { data: vendasMes }, { data: gastosMes }, { data: clientes }] = await Promise.all([
    supabase.from("encomendas_resumo").select("*").order("numero", { ascending: false }),
    supabase.from("pagamentos").select("valor").gte("data", inicioMes),
    supabase.from("vendas").select("valor").gte("data", inicioMes),
    supabase.from("gastos").select("valor").gte("data", inicioMes),
    supabase.from("clientes").select("id,nome").order("nome"),
  ]);

  const todas = (data ?? []) as EncomendaResumo[];
  const abertas = todas.filter((e) => !["entregue", "cancelado"].includes(e.status));
  const emAndamento = abertas.filter((e) => e.status !== "pronto");
  const aguardandoPgto = abertas.filter((e) => e.status_pagamento === "nao_pago");
  const prontas = todas.filter((e) => e.status === "pronto");
  const faltaReceber = todas.filter((e) => e.status !== "cancelado").reduce((s, e) => s + Number(e.saldo), 0);
  const recebidoMes =
    (pagMes ?? []).reduce((s, p) => s + Number(p.valor), 0) +
    (vendasMes ?? []).reduce((s, v) => s + Number(v.valor), 0);
  const gastosTotalMes = (gastosMes ?? []).reduce((s, g) => s + Number(g.valor), 0);
  const lucroMes = recebidoMes - gastosTotalMes;

  const atrasadas = abertas.filter((e) => daysUntil(e.prazo_entrega) < 0);
  const proximas = abertas.filter((e) => daysUntil(e.prazo_entrega) >= 0 && daysUntil(e.prazo_entrega) <= 3);
  const devedoras = new Map<string, { nome: string; saldo: number }>();
  todas
    .filter((e) => e.status !== "cancelado" && e.saldo > 0)
    .forEach((e) => {
      const cur = devedoras.get(e.cliente_id) ?? { nome: e.cliente_nome, saldo: 0 };
      cur.saldo += Number(e.saldo);
      devedoras.set(e.cliente_id, cur);
    });

  const stats = [
    { label: "Em andamento", value: String(emAndamento.length), href: "/encomendas?ordem=prazo" },
    { label: "Aguardando pagamento", value: String(aguardandoPgto.length), href: "/encomendas?pagamento=nao_pago" },
    { label: "Prontas para entrega", value: String(prontas.length), href: "/encomendas?status=pronto" },
    { label: "Falta receber", value: formatBRL(faltaReceber), href: "/encomendas" },
    { label: "Recebido no mês", value: formatBRL(recebidoMes), href: "/encomendas" },
  ];

  const alertas = [
    atrasadas.length > 0 && { icon: AlertTriangle, tone: "bg-roseclaro text-[#8c4a4a]", text: `${atrasadas.length} pedido(s) atrasado(s)`, href: "/encomendas?prazo=atrasadas" },
    proximas.length > 0 && { icon: Clock, tone: "bg-ambarclaro text-[#8a6a2f]", text: `${proximas.length} pedido(s) vencem em até 3 dias`, href: "/encomendas?prazo=semana" },
    prontas.length > 0 && { icon: CheckCircle2, tone: "bg-salviaclaro text-[#53694e]", text: `${prontas.length} pronto(s) esperando retirada`, href: "/encomendas?status=pronto" },
    devedoras.size > 0 && { icon: Wallet, tone: "bg-areia text-cacau", text: `${devedoras.size} cliente(s) com pagamento pendente`, href: "/clientes" },
  ].filter(Boolean) as { icon: typeof Clock; tone: string; text: string; href: string }[];

  const recentes = todas.slice(0, 6);

  return (
    <>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-taupe">Bem-vinda de volta</p>
          <h1 className="font-serif text-4xl font-semibold">Resumo da loja</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <NovaEncomendaButton clientes={clientes ?? []} />
          <Link href="/clientes?nova=1" className="btn-soft"><UserPlus size={18} /> Nova cliente</Link>
          <Link href="/pronta-entrega?nova=1" className="btn-soft"><Plus size={18} /> Adicionar peça</Link>
        </div>
      </div>

      <section className="card mb-5 grid grid-cols-2 gap-px overflow-hidden bg-nude/50 lg:grid-cols-5">
        {stats.map((s) => (
          <Link key={s.label} href={s.href} className="bg-creme p-4 transition hover:bg-white sm:p-5">
            <p className="text-sm text-taupe">{s.label}</p>
            <p className="mt-1.5 text-2xl font-semibold">{s.value}</p>
          </Link>
        ))}
      </section>

      <Link href="/financeiro" className="card mb-5 flex flex-wrap items-center justify-between gap-x-6 gap-y-2 p-5 transition hover:bg-white">
        <div>
          <p className="text-sm text-taupe">Lucro do mês</p>
          <p className={`mt-1 text-2xl font-semibold ${lucroMes < 0 ? "text-[#a34f4f]" : ""}`}>{formatBRL(lucroMes)}</p>
        </div>
        <p className="text-sm text-cacau">
          Recebido {formatBRL(recebidoMes)} − Gastos {formatBRL(gastosTotalMes)}
        </p>
        <span className="text-sm font-medium text-cacau underline">Ver gráfico e registrar gastos</span>
      </Link>

      <div className="grid gap-5 lg:grid-cols-[1.6fr_1fr]">
        <section className="card overflow-hidden">
          <div className="flex items-center justify-between border-b border-nude/60 px-5 py-4">
            <h2 className="font-serif text-2xl font-semibold">Encomendas recentes</h2>
            <Link href="/encomendas" className="text-sm font-medium text-cacau hover:underline">Ver todas</Link>
          </div>
          {recentes.length === 0 ? (
            <EmptyState title="Tudo calmo por aqui" text="Quando você registrar a primeira encomenda, ela aparece neste resumo." />
          ) : (
            <ul className="divide-y divide-nude/60">
              {recentes.map((e) => (
                <li key={e.id}>
                  <Link href={`/encomendas/${e.id}`} className="flex flex-wrap items-center justify-between gap-2 px-5 py-4 hover:bg-areia/60">
                    <div className="min-w-0">
                      <p className="truncate font-medium">{e.peca}</p>
                      <p className="text-sm text-taupe">{e.cliente_nome} · entrega {formatDate(e.prazo_entrega)}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-sm">
                      <span className="font-medium">{formatBRL(e.valor_total)}</span>
                      <StatusPagamentoBadge s={e.status_pagamento} cancelado={e.status === "cancelado"} />
                      <StatusEncomendaBadge s={e.status} />
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="card p-5">
          <h2 className="mb-4 font-serif text-2xl font-semibold">Atenção</h2>
          {alertas.length === 0 ? (
            <p className="text-sm text-taupe">Nenhum alerta no momento. Está tudo em dia 🌿</p>
          ) : (
            <ul className="flex flex-col gap-2.5">
              {alertas.map((a) => (
                <li key={a.text}>
                  <Link href={a.href} className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium ${a.tone}`}>
                    <a.icon size={18} /> {a.text}
                  </Link>
                </li>
              ))}
            </ul>
          )}
          {devedoras.size > 0 && (
            <div className="mt-5">
              <p className="mb-2 text-sm text-taupe">Quem ainda deve</p>
              <ul className="flex flex-col gap-1.5 text-sm">
                {[...devedoras.entries()].slice(0, 5).map(([id, d]) => (
                  <li key={id}>
                    <Link href={`/clientes/${id}`} className="flex justify-between rounded-lg px-2 py-1.5 hover:bg-areia">
                      <span>{d.nome}</span><span className="font-medium">{formatBRL(d.saldo)}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      </div>
    </>
  );
}
