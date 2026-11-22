import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { GastosView } from "@/components/gastos-view";
import { LucroChart } from "@/components/lucro-chart";
import { createClient } from "@/lib/supabase/server";
import type { Gasto } from "@/lib/types";
import { addMonths, formatBRL, monthLabel, todayISO } from "@/lib/utils";

type Linha = { valor: number | string; data: string };
const soma = (rows: Linha[] | null, m: string) =>
  (rows ?? []).filter((r) => r.data.slice(0, 7) === m).reduce((s, r) => s + Number(r.valor), 0);

export default async function FinanceiroPage({ searchParams }: { searchParams: Promise<{ mes?: string }> }) {
  const sp = await searchParams;
  const hoje = todayISO();
  const atual = hoje.slice(0, 7);
  const mes = /^\d{4}-(0[1-9]|1[0-2])$/.test(sp.mes ?? "") ? (sp.mes as string) : atual;

  const inicio = addMonths(mes, -5) + "-01";
  const fim = addMonths(mes, 1) + "-01";

  const supabase = await createClient();
  const [{ data: pags }, { data: vendas }, { data: gastos }] = await Promise.all([
    supabase.from("pagamentos").select("valor,data").gte("data", inicio).lt("data", fim),
    supabase.from("vendas").select("valor,data").gte("data", inicio).lt("data", fim),
    supabase.from("gastos").select("*").gte("data", inicio).lt("data", fim).order("data", { ascending: false }),
  ]);

  const meses = Array.from({ length: 6 }, (_, i) => addMonths(mes, i - 5));
  const serie = meses.map((m) => ({
    mes: m,
    recebido: soma(pags, m) + soma(vendas, m),
    gastos: soma(gastos, m),
  }));

  const recEncomendas = soma(pags, mes);
  const recProntaEntrega = soma(vendas, mes);
  const recebido = recEncomendas + recProntaEntrega;
  const gasto = soma(gastos, mes);
  const lucro = recebido - gasto;
  const gastosDoMes = ((gastos ?? []) as Gasto[]).filter((g) => g.data.slice(0, 7) === mes);
  const dataPadrao = mes === atual ? hoje : `${mes}-01`;

  return (
    <>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <h1 className="font-serif text-4xl font-semibold">Financeiro</h1>
        <nav className="flex items-center gap-1 rounded-xl border border-nude bg-white px-1 py-1" aria-label="Escolher mês">
          <Link href={`/financeiro?mes=${addMonths(mes, -1)}`} className="btn-ghost !min-h-0 !p-2" aria-label="Mês anterior">
            <ChevronLeft size={20} />
          </Link>
          <span className="min-w-[10rem] text-center font-medium capitalize">{monthLabel(mes)}</span>
          {mes < atual ? (
            <Link href={`/financeiro?mes=${addMonths(mes, 1)}`} className="btn-ghost !min-h-0 !p-2" aria-label="Próximo mês">
              <ChevronRight size={20} />
            </Link>
          ) : (
            <span className="p-2 text-nude"><ChevronRight size={20} /></span>
          )}
        </nav>
      </div>

      <section className="mb-5 grid gap-3 sm:grid-cols-3">
        <div className="card p-5">
          <p className="text-sm text-taupe">Recebido no mês</p>
          <p className="mt-1 text-2xl font-semibold">{formatBRL(recebido)}</p>
          <p className="mt-1 text-xs text-taupe">
            Encomendas {formatBRL(recEncomendas)} · Pronta-entrega {formatBRL(recProntaEntrega)}
          </p>
        </div>
        <div className="card p-5">
          <p className="text-sm text-taupe">Gastos no mês</p>
          <p className="mt-1 text-2xl font-semibold">{formatBRL(gasto)}</p>
          <p className="mt-1 text-xs text-taupe">{gastosDoMes.length} compra(s) registrada(s)</p>
        </div>
        <div className={`card p-5 ${lucro < 0 ? "bg-roseclaro/70" : "bg-salviaclaro/70"}`}>
          <p className="text-sm text-cacau">Lucro do mês</p>
          <p className={`mt-1 text-2xl font-semibold ${lucro < 0 ? "text-[#8c4a4a]" : "text-[#3f5a3a]"}`}>{formatBRL(lucro)}</p>
          <p className="mt-1 text-xs text-cacau">{lucro < 0 ? "Gastou mais do que recebeu neste mês" : "Recebido menos gastos"}</p>
        </div>
      </section>

      <section className="card mb-5 p-5">
        <h2 className="mb-4 font-serif text-2xl font-semibold">Últimos 6 meses</h2>
        <LucroChart dados={serie} selecionado={mes} />
      </section>

      <GastosView gastos={gastosDoMes} dataPadrao={dataPadrao} />

      <p className="mt-4 text-sm text-taupe">
        O lucro considera só o dinheiro que realmente entrou (pagamentos das encomendas e vendas da pronta-entrega) menos os gastos
        registrados. Se você compra a mercadoria num mês e recebe no outro, o lucro de cada mês pode ficar diferente do esperado.
      </p>
    </>
  );
}
