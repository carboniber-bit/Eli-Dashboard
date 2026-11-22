import { cn, formatBRL, formatBRLCurto, monthLabel } from "@/lib/utils";

export type PontoMes = { mes: string; recebido: number; gastos: number };

/** Gráfico de barras simples (sem biblioteca): recebido x gastos por mês, com o lucro embaixo. */
export function LucroChart({ dados, selecionado }: { dados: PontoMes[]; selecionado: string }) {
  const max = Math.max(...dados.flatMap((d) => [d.recebido, d.gastos]), 1);
  const altura = (v: number) => (v <= 0 ? "0%" : `${Math.max((v / max) * 100, 2)}%`);

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-x-5 gap-y-1 text-sm text-cacau">
        <span className="flex items-center gap-2"><span className="h-3 w-3 rounded bg-salvia" /> Recebido</span>
        <span className="flex items-center gap-2"><span className="h-3 w-3 rounded bg-rose" /> Gastos</span>
        <span className="text-taupe">O valor embaixo de cada mês é o lucro.</span>
      </div>
      <div className="grid grid-cols-6 gap-1.5 sm:gap-4">
        {dados.map((d) => {
          const lucro = d.recebido - d.gastos;
          return (
            <div
              key={d.mes}
              className={cn("flex flex-col items-center gap-2 rounded-xl px-1 py-2 sm:px-2", d.mes === selecionado && "bg-areia/80")}
            >
              <div
                className="flex h-44 w-full items-end justify-center gap-1 sm:gap-2"
                role="img"
                aria-label={`${monthLabel(d.mes)}: recebido ${formatBRL(d.recebido)}, gastos ${formatBRL(d.gastos)}, lucro ${formatBRL(lucro)}`}
              >
                <div className="w-2/5 max-w-9 rounded-t-md bg-salvia" style={{ height: altura(d.recebido) }} title={`Recebido: ${formatBRL(d.recebido)}`} />
                <div className="w-2/5 max-w-9 rounded-t-md bg-rose" style={{ height: altura(d.gastos) }} title={`Gastos: ${formatBRL(d.gastos)}`} />
              </div>
              <p className="text-xs font-medium capitalize">{monthLabel(d.mes, true)}</p>
              <p className={cn("text-[11px] font-semibold sm:text-xs", lucro < 0 ? "text-[#a34f4f]" : "text-[#53694e]")}>
                {formatBRLCurto(lucro)}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
