import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { EncomendaAcoes, RemoverPagamentoButton } from "@/components/encomenda-acoes";
import { StatusEncomendaBadge, StatusPagamentoBadge } from "@/components/status-badges";
import { FORMAS_PAGAMENTO } from "@/lib/constants";
import { createClient } from "@/lib/supabase/server";
import type { EncomendaResumo, Historico, Pagamento } from "@/lib/types";
import { formatBRL, formatDate } from "@/lib/utils";

export default async function EncomendaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const [{ data }, { data: pagamentos }, { data: historico }] = await Promise.all([
    supabase.from("encomendas_resumo").select("*").eq("id", id).maybeSingle(),
    supabase.from("pagamentos").select("*").eq("encomenda_id", id).order("data", { ascending: false }),
    supabase.from("historico").select("*").eq("encomenda_id", id).order("created_at", { ascending: false }),
  ]);
  if (!data) notFound();
  const e = data as EncomendaResumo;
  const cancelado = e.status === "cancelado";

  const info: [string, string | null][] = [
    ["Categoria", e.categoria], ["Tamanho", e.tamanho], ["Cor", e.cor],
    ["Quantidade", String(e.quantidade)], ["Data do pedido", formatDate(e.data_pedido)], ["Prazo de entrega", formatDate(e.prazo_entrega)],
  ];

  return (
    <>
      <Link href="/encomendas" className="mb-4 inline-flex items-center gap-1.5 text-sm text-cacau hover:underline">
        <ArrowLeft size={16} /> Voltar para encomendas
      </Link>

      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm text-taupe">Pedido #{e.numero}</p>
          <h1 className="font-serif text-4xl font-semibold">{e.peca}</h1>
          <p className="mt-1 text-cacau">
            para <Link href={`/clientes/${e.cliente_id}`} className="font-medium underline-offset-2 hover:underline">{e.cliente_nome}</Link>
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <StatusEncomendaBadge s={e.status} />
          <StatusPagamentoBadge s={e.status_pagamento} cancelado={cancelado} />
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
        <div className="flex flex-col gap-5">
          <section className="card p-5">
            <div className="grid grid-cols-3 gap-3 text-center">
              {[
                ["Valor total", e.valor_total, ""],
                ["Já pago", e.total_pago, "text-[#53694e]"],
                ["Falta receber", cancelado ? 0 : e.saldo, e.saldo > 0 && !cancelado ? "text-[#a34f4f]" : ""],
              ].map(([l, v, c]) => (
                <div key={l as string} className="panel !p-3">
                  <p className="text-xs text-taupe sm:text-sm">{l}</p>
                  <p className={`mt-1 text-base font-semibold sm:text-xl ${c}`}>{formatBRL(v as number)}</p>
                </div>
              ))}
            </div>
            <div className="mt-5"><EncomendaAcoes e={e} /></div>
          </section>

          <section className="card p-5">
            <h2 className="mb-3 font-serif text-2xl font-semibold">Pagamentos</h2>
            {(pagamentos ?? []).length === 0 ? (
              <p className="text-sm text-taupe">Nenhum pagamento registrado ainda.</p>
            ) : (
              <ul className="divide-y divide-nude/60">
                {(pagamentos as Pagamento[]).map((p) => (
                  <li key={p.id} className="flex items-center justify-between gap-3 py-3">
                    <div>
                      <p className="font-medium">{formatBRL(p.valor)} <span className="font-normal text-taupe">· {FORMAS_PAGAMENTO[p.forma]}</span></p>
                      <p className="text-sm text-taupe">{formatDate(p.data)}{p.observacao && ` · ${p.observacao}`}</p>
                    </div>
                    <RemoverPagamentoButton encomendaId={e.id} pagamentoId={p.id} />
                  </li>
                ))}
              </ul>
            )}
          </section>

          {(e.descricao || e.observacoes) && (
            <section className="card p-5">
              {e.descricao && (<><h2 className="mb-1 font-serif text-2xl font-semibold">Descrição</h2><p className="mb-4 whitespace-pre-line text-cacau">{e.descricao}</p></>)}
              {e.observacoes && (<><h2 className="mb-1 font-serif text-2xl font-semibold">Observações</h2><p className="whitespace-pre-line text-cacau">{e.observacoes}</p></>)}
            </section>
          )}
        </div>

        <div className="flex flex-col gap-5">
          {e.foto_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={e.foto_url} alt={`Foto de referência: ${e.peca}`} className="card w-full object-cover" />
          )}
          <section className="card p-5">
            <h2 className="mb-3 font-serif text-2xl font-semibold">Detalhes</h2>
            <dl className="grid grid-cols-2 gap-x-3 gap-y-3 text-sm">
              {info.map(([k, v]) => (
                <div key={k}><dt className="text-taupe">{k}</dt><dd className="font-medium">{v || "—"}</dd></div>
              ))}
            </dl>
          </section>
          <section className="card p-5">
            <h2 className="mb-3 font-serif text-2xl font-semibold">Histórico</h2>
            <ol className="relative flex flex-col gap-4 border-l border-nude pl-5">
              {((historico ?? []) as Historico[]).map((h) => (
                <li key={h.id} className="relative">
                  <span className="absolute -left-[26px] top-1.5 h-2.5 w-2.5 rounded-full bg-taupe" />
                  <p className="text-sm font-medium">{h.evento}</p>
                  {h.detalhe && <p className="text-sm text-cacau">{h.detalhe}</p>}
                  <p className="text-xs text-taupe">{new Date(h.created_at).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short", timeZone: "America/Sao_Paulo" })}</p>
                </li>
              ))}
            </ol>
          </section>
        </div>
      </div>
    </>
  );
}
