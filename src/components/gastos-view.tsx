"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { excluirGasto, salvarGasto } from "@/app/(app)/financeiro/actions";
import { Badge } from "@/components/ui/badge";
import { Drawer } from "@/components/ui/drawer";
import { EmptyState, Field } from "@/components/ui/field";
import { CATEGORIAS_GASTO } from "@/lib/constants";
import { gastoSchema, type GastoInput } from "@/lib/schemas";
import type { Gasto } from "@/lib/types";
import { formatBRL, formatDate } from "@/lib/utils";

export function GastosView({ gastos, dataPadrao }: { gastos: Gasto[]; dataPadrao: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [form, setForm] = useState<Gasto | "novo" | null>(null);

  function excluir(g: Gasto) {
    if (!confirm(`Excluir o gasto “${g.descricao}”? Ele deixará de entrar na conta do lucro.`)) return;
    start(async () => {
      const r = await excluirGasto(g.id);
      if (!r.ok) {
        toast.error(r.error);
        return;
      }
      toast.success("Gasto excluído.");
      router.refresh();
    });
  }

  return (
    <section className="card overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-nude/60 px-5 py-4">
        <h2 className="font-serif text-2xl font-semibold">Gastos do mês</h2>
        <button className="btn-primary" onClick={() => setForm("novo")}>
          <Plus size={18} /> Registrar gasto
        </button>
      </div>

      {gastos.length === 0 ? (
        <EmptyState
          title="Nenhum gasto neste mês"
          text="Quando comprar mercadorias, tecidos ou embalagens, registre aqui para o sistema calcular o lucro."
          action={<button className="btn-primary" onClick={() => setForm("novo")}>Registrar o primeiro gasto</button>}
        />
      ) : (
        <ul className="divide-y divide-nude/60">
          {gastos.map((g) => (
            <li key={g.id} className="flex items-center justify-between gap-3 px-5 py-4">
              <div className="min-w-0">
                <p className="truncate font-medium">{g.descricao}</p>
                <p className="mt-0.5 flex flex-wrap items-center gap-2 text-sm text-taupe">
                  {formatDate(g.data)} <Badge tone="taupe">{g.categoria}</Badge>
                </p>
                {g.observacao && <p className="mt-1 text-sm text-cacau">{g.observacao}</p>}
              </div>
              <div className="flex items-center gap-1">
                <p className="mr-2 whitespace-nowrap font-semibold">{formatBRL(g.valor)}</p>
                <button className="btn-ghost !min-h-0 !p-2" onClick={() => setForm(g)} aria-label="Editar gasto"><Pencil size={16} /></button>
                <button className="btn-ghost !min-h-0 !p-2" disabled={pending} onClick={() => excluir(g)} aria-label="Excluir gasto"><Trash2 size={16} /></button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {form && <GastoDrawer gasto={form === "novo" ? null : form} dataPadrao={dataPadrao} onClose={() => setForm(null)} />}
    </section>
  );
}

function GastoDrawer({ gasto, dataPadrao, onClose }: { gasto: Gasto | null; dataPadrao: string; onClose: () => void }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<GastoInput>({
    resolver: zodResolver(gastoSchema),
    defaultValues: {
      descricao: gasto?.descricao ?? "",
      valor: gasto ? String(gasto.valor).replace(".", ",") : "",
      data: gasto?.data ?? dataPadrao,
      categoria: gasto?.categoria ?? CATEGORIAS_GASTO[0],
      observacao: gasto?.observacao ?? "",
    },
  });

  async function onSubmit(values: GastoInput) {
    setSaving(true);
    const r = await salvarGasto(gasto?.id ?? null, values);
    setSaving(false);
    if (!r.ok) {
      toast.error(r.error);
      return;
    }
    toast.success(gasto ? "Gasto atualizado!" : "Gasto registrado!");
    onClose();
    router.refresh();
  }

  return (
    <Drawer open onClose={onClose} title={gasto ? "Editar gasto" : "Registrar gasto"}>
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
        <Field label="O que foi comprado" error={errors.descricao?.message}>
          <input className="input" autoFocus placeholder="Ex.: Tecido de linho, 10 vestidos…" {...register("descricao")} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Quanto gastou" error={errors.valor?.message}>
            <input className="input" inputMode="decimal" placeholder="R$ 0,00" {...register("valor")} />
          </Field>
          <Field label="Data da compra" error={errors.data?.message}>
            <input type="date" className="input" {...register("data")} />
          </Field>
        </div>
        <Field label="Categoria">
          <select className="input" {...register("categoria")}>
            {CATEGORIAS_GASTO.map((c) => <option key={c}>{c}</option>)}
          </select>
        </Field>
        <Field label="Observação" hint="Opcional. Ex.: fornecedor, forma de pagamento">
          <textarea className="input min-h-20" {...register("observacao")} />
        </Field>
        <div className="flex gap-3 pt-2">
          <button type="button" className="btn-soft flex-1" onClick={onClose}>Cancelar</button>
          <button className="btn-primary flex-[2]" disabled={saving}>{saving ? "Salvando…" : "Salvar gasto"}</button>
        </div>
      </form>
    </Drawer>
  );
}
