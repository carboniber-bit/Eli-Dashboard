import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ClienteAcoes } from "@/components/cliente-acoes";
import { StatusEncomendaBadge, StatusPagamentoBadge } from "@/components/status-badges";
import { EmptyState } from "@/components/ui/field";
import { createClient } from "@/lib/supabase/server";
import type { Cliente, EncomendaResumo } from "@/lib/types";
import { formatBRL, formatDate } from "@/lib/utils";

export default async function ClientePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const [{ data: cliente }, { data: enc }] = await Promise.all([
    supabase.from("clientes").select("*").eq("id", id).maybeSingle(),
    supabase.from("encomendas_resumo").select("*").eq("cliente_id", id).order("numero", { ascending: false }),
  ]);
  if (!cliente) notFound();
  const c = cliente as Cliente;
  const lista = (enc ?? []) as EncomendaResumo[];
  const validas = lista.filter((e) => e.status !== "cancelado");
  const compras = validas.reduce((s, e) => s + Number(e.valor_total), 0);
  const pendente = validas.reduce((s, e) => s + Number(e.saldo), 0);

  return (
    <>
      <Link href="/clientes" className="mb-4 inline-flex items-center gap-1.5 text-sm text-cacau hover:underline">
        <ArrowLeft size={16} /> Voltar para clientes
      </Link>

      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-serif text-4xl font-semibold">{c.nome}</h1>
          <p className="mt-1 text-cacau">{c.telefone || "Sem telefone"} · cliente desde {formatDate(c.created_at)}</p>
          {c.observacoes && <p className="mt-2 max-w-xl whitespace-pre-line text-sm text-taupe">{c.observacoes}</p>}
        </div>
        <ClienteAcoes cliente={c} />
      </div>

      <div className="mb-5 grid grid-cols-3 gap-3">
        {[
          ["Encomendas", String(validas.length), ""],
          ["Total em compras", formatBRL(compras), ""],
          ["Falta receber", formatBRL(pendente), pendente > 0 ? "text-[#a34f4f]" : ""],
        ].map(([l, v, cls]) => (
          <div key={l} className="card p-4">
            <p className="text-xs text-taupe sm:text-sm">{l}</p>
            <p className={`mt-1 text-lg font-semibold sm:text-2xl ${cls}`}>{v}</p>
          </div>
        ))}
      </div>

      <div className="card overflow-hidden">
        <h2 className="border-b border-nude/60 px-5 py-4 font-serif text-2xl font-semibold">Histórico de encomendas</h2>
        {lista.length === 0 ? (
          <EmptyState title="Sem encomendas" text="Use o botão “Nova encomenda” acima para registrar o primeiro pedido dela." />
        ) : (
          <ul className="divide-y divide-nude/60">
            {lista.map((e) => (
              <li key={e.id}>
                <Link href={`/encomendas/${e.id}`} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 hover:bg-areia/60">
                  <div>
                    <p className="font-medium">{e.peca}</p>
                    <p className="text-sm text-taupe">#{e.numero} · entrega {formatDate(e.prazo_entrega)}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-sm">
                    <span>{formatBRL(e.valor_total)}</span>
                    <StatusPagamentoBadge s={e.status_pagamento} cancelado={e.status === "cancelado"} />
                    <StatusEncomendaBadge s={e.status} />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
