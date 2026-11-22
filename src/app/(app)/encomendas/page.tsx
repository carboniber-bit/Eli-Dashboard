import { Search } from "lucide-react";
import Link from "next/link";
import { NovaEncomendaButton } from "@/components/nova-encomenda";
import { StatusEncomendaBadge, StatusPagamentoBadge } from "@/components/status-badges";
import { EmptyState } from "@/components/ui/field";
import { STATUS_ENCOMENDA, STATUS_PAGAMENTO } from "@/lib/constants";
import { createClient } from "@/lib/supabase/server";
import type { EncomendaResumo } from "@/lib/types";
import { daysUntil, formatBRL, formatDate } from "@/lib/utils";

type SP = { q?: string; status?: string; pagamento?: string; prazo?: string; ordem?: string };

export default async function EncomendasPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const supabase = await createClient();
  const [{ data }, { data: clientes }] = await Promise.all([
    supabase.from("encomendas_resumo").select("*"),
    supabase.from("clientes").select("id,nome").order("nome"),
  ]);

  let lista = (data ?? []) as EncomendaResumo[];
  const total = lista.length;

  const q = sp.q?.trim().toLowerCase();
  if (q) {
    lista = lista.filter(
      (e) =>
        e.cliente_nome.toLowerCase().includes(q) ||
        e.peca.toLowerCase().includes(q) ||
        String(e.numero) === q.replace("#", "")
    );
  }
  if (sp.status) lista = lista.filter((e) => e.status === sp.status);
  if (sp.pagamento) lista = lista.filter((e) => e.status_pagamento === sp.pagamento && e.status !== "cancelado");
  const aberta = (e: EncomendaResumo) => !["entregue", "cancelado"].includes(e.status);
  if (sp.prazo === "atrasadas") lista = lista.filter((e) => aberta(e) && daysUntil(e.prazo_entrega) < 0);
  if (sp.prazo === "semana")
    lista = lista.filter((e) => aberta(e) && daysUntil(e.prazo_entrega) >= 0 && daysUntil(e.prazo_entrega) <= 7);

  const ordem = sp.ordem ?? "prazo";
  lista.sort((a, b) =>
    ordem === "recente" ? b.numero - a.numero : ordem === "valor" ? b.valor_total - a.valor_total : a.prazo_entrega.localeCompare(b.prazo_entrega)
  );

  const filtrando = Boolean(q || sp.status || sp.pagamento || sp.prazo);

  return (
    <>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-serif text-4xl font-semibold">Encomendas</h1>
        <NovaEncomendaButton clientes={clientes ?? []} />
      </div>

      <form className="card mb-5 grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-[1.6fr_1fr_1fr_1fr_1fr_auto]">
        <div className="relative">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-taupe" />
          <input name="q" defaultValue={sp.q} className="input !pl-10" placeholder="Buscar cliente, peça ou nº" />
        </div>
        <select name="status" defaultValue={sp.status ?? ""} className="input" aria-label="Situação do pedido">
          <option value="">Toda situação</option>
          {Object.entries(STATUS_ENCOMENDA).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
        <select name="pagamento" defaultValue={sp.pagamento ?? ""} className="input" aria-label="Pagamento">
          <option value="">Todo pagamento</option>
          {Object.entries(STATUS_PAGAMENTO).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
        <select name="prazo" defaultValue={sp.prazo ?? ""} className="input" aria-label="Prazo">
          <option value="">Qualquer prazo</option>
          <option value="atrasadas">Atrasadas</option>
          <option value="semana">Vencem em 7 dias</option>
        </select>
        <select name="ordem" defaultValue={ordem} className="input" aria-label="Ordenar">
          <option value="prazo">Por prazo</option>
          <option value="recente">Mais recentes</option>
          <option value="valor">Maior valor</option>
        </select>
        <div className="flex gap-2">
          <button className="btn-primary">Filtrar</button>
          {filtrando && <Link href="/encomendas" className="btn-soft">Limpar</Link>}
        </div>
      </form>

      <div className="card overflow-hidden">
        {lista.length === 0 ? (
          <EmptyState
            title={total === 0 ? "Nenhuma encomenda ainda" : "Nada encontrado"}
            text={total === 0 ? "Quando uma cliente encomendar uma peça, registre aqui em poucos segundos." : "Nenhuma encomenda combina com esses filtros. Tente limpar a busca."}
            action={total === 0 ? <NovaEncomendaButton clientes={clientes ?? []} label="Registrar a primeira" /> : undefined}
          />
        ) : (
          <>
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-nude/70 text-taupe">
                  <tr>
                    {["Nº", "Cliente", "Peça", "Total", "Pago", "Falta", "Pagamento", "Situação", "Pedido", "Entrega"].map((h) => (
                      <th key={h} className="whitespace-nowrap px-4 py-3 font-medium">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-nude/50">
                  {lista.map((e) => {
                    const atrasada = aberta(e) && daysUntil(e.prazo_entrega) < 0;
                    return (
                      <tr key={e.id} className="transition hover:bg-areia/60">
                        <td className="px-4 py-3.5"><Link href={`/encomendas/${e.id}`} className="font-medium underline-offset-2 hover:underline">#{e.numero}</Link></td>
                        <td className="px-4 py-3.5">{e.cliente_nome}</td>
                        <td className="max-w-[200px] truncate px-4 py-3.5">{e.peca}</td>
                        <td className="whitespace-nowrap px-4 py-3.5">{formatBRL(e.valor_total)}</td>
                        <td className="whitespace-nowrap px-4 py-3.5">{formatBRL(e.total_pago)}</td>
                        <td className="whitespace-nowrap px-4 py-3.5 font-medium">{e.status === "cancelado" ? "—" : formatBRL(e.saldo)}</td>
                        <td className="px-4 py-3.5"><StatusPagamentoBadge s={e.status_pagamento} cancelado={e.status === "cancelado"} /></td>
                        <td className="px-4 py-3.5"><StatusEncomendaBadge s={e.status} /></td>
                        <td className="whitespace-nowrap px-4 py-3.5 text-taupe">{formatDate(e.data_pedido)}</td>
                        <td className={`whitespace-nowrap px-4 py-3.5 ${atrasada ? "font-semibold text-[#a34f4f]" : ""}`}>{formatDate(e.prazo_entrega)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <ul className="divide-y divide-nude/60 md:hidden">
              {lista.map((e) => {
                const atrasada = aberta(e) && daysUntil(e.prazo_entrega) < 0;
                return (
                  <li key={e.id}>
                    <Link href={`/encomendas/${e.id}`} className="flex flex-col gap-2.5 px-4 py-4 active:bg-areia/60">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate font-medium">{e.peca}</p>
                          <p className="text-sm text-taupe">#{e.numero} · {e.cliente_nome}</p>
                        </div>
                        <StatusEncomendaBadge s={e.status} />
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span>{formatBRL(e.valor_total)}{e.status !== "cancelado" && e.saldo > 0 && <span className="text-taupe"> · falta {formatBRL(e.saldo)}</span>}</span>
                        <StatusPagamentoBadge s={e.status_pagamento} cancelado={e.status === "cancelado"} />
                      </div>
                      <p className={`text-sm ${atrasada ? "font-semibold text-[#a34f4f]" : "text-taupe"}`}>Entrega: {formatDate(e.prazo_entrega)}{atrasada && " (atrasada)"}</p>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </div>
    </>
  );
}
