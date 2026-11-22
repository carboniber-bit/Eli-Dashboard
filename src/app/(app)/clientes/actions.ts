"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { clienteSchema } from "@/lib/schemas";

type Result = { ok: true; id?: string } | { ok: false; error: string };

const clean = (v?: string) => (v && v.trim() ? v.trim() : null);

export async function salvarCliente(id: string | null, raw: unknown): Promise<Result> {
  const parsed = clienteSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  const { nome, telefone, observacoes } = parsed.data;

  const supabase = await createClient();
  const payload = { nome, telefone: clean(telefone), observacoes: clean(observacoes) };
  const q = id
    ? supabase.from("clientes").update(payload).eq("id", id).select("id").single()
    : supabase.from("clientes").insert(payload).select("id").single();
  const { data, error } = await q;
  if (error) {
    console.error("[salvarCliente] erro:", error.code, error.message);
    return { ok: false, error: "Não consegui salvar a cliente. Tente de novo." };
  }

  revalidatePath("/", "layout");
  return { ok: true, id: data.id };
}

export async function excluirCliente(id: string): Promise<Result> {
  const supabase = await createClient();
  const { count } = await supabase
    .from("encomendas")
    .select("id", { count: "exact", head: true })
    .eq("cliente_id", id);
  if (count && count > 0) {
    return {
      ok: false,
      error: `Esta cliente tem ${count} encomenda(s) e não pode ser excluída. Cancele ou entregue os pedidos primeiro.`,
    };
  }
  const { error } = await supabase.from("clientes").delete().eq("id", id);
  if (error) return { ok: false, error: "Não consegui excluir a cliente. Tente de novo." };
  revalidatePath("/", "layout");
  return { ok: true };
}
