"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { gastoSchema } from "@/lib/schemas";
import { parseBRL } from "@/lib/utils";

type Result = { ok: true } | { ok: false; error: string };

export async function salvarGasto(id: string | null, raw: unknown): Promise<Result> {
  const parsed = gastoSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  const v = parsed.data;

  const supabase = await createClient();
  const payload = {
    descricao: v.descricao,
    valor: parseBRL(v.valor),
    data: v.data,
    categoria: v.categoria,
    observacao: v.observacao && v.observacao.trim() ? v.observacao.trim() : null,
  };
  const { error } = id
    ? await supabase.from("gastos").update(payload).eq("id", id)
    : await supabase.from("gastos").insert(payload);
  if (error) {
    console.error("[salvarGasto] erro:", error.code, error.message);
    return { ok: false, error: "Não consegui salvar o gasto. Tente de novo." };
  }
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function excluirGasto(id: string): Promise<Result> {
  const supabase = await createClient();
  const { error } = await supabase.from("gastos").delete().eq("id", id);
  if (error) {
    console.error("[excluirGasto] erro:", error.code, error.message);
    return { ok: false, error: "Não consegui excluir o gasto. Tente de novo." };
  }
  revalidatePath("/", "layout");
  return { ok: true };
}
