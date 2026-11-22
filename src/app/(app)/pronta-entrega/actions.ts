"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { pecaSchema } from "@/lib/schemas";
import { uploadFoto } from "@/lib/storage";
import { FORMAS_PAGAMENTO, type FormaPagamento, type StatusPeca } from "@/lib/constants";
import { parseBRL } from "@/lib/utils";

type Result = { ok: true } | { ok: false; error: string };
const clean = (v?: string) => (v && v.trim() ? v.trim() : null);
const refresh = () => revalidatePath("/", "layout");

export async function salvarPeca(id: string | null, formData: FormData): Promise<Result> {
  const raw = Object.fromEntries([...formData.entries()].filter(([, v]) => typeof v === "string"));
  const parsed = pecaSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  const v = parsed.data;

  const supabase = await createClient();
  let foto: string | null = null;
  try {
    foto = await uploadFoto(supabase, formData.get("foto"), "pronta-entrega");
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }

  const payload: Record<string, unknown> = {
    nome: v.nome,
    categoria: clean(v.categoria),
    descricao: clean(v.descricao),
    tamanho: clean(v.tamanho),
    cor: clean(v.cor),
    quantidade: v.quantidade,
    preco_venda: parseBRL(v.preco_venda),
    custo: clean(v.custo) ? parseBRL(v.custo) : null,
  };
  if (foto) payload.foto_url = foto;
  // estoque coerente: sem unidades = vendida; voltou estoque = disponível
  if (!id) payload.status = v.quantidade === 0 ? "vendida" : "disponivel";

  const { error } = id
    ? await supabase.from("pronta_entrega").update(payload).eq("id", id)
    : await supabase.from("pronta_entrega").insert(payload);
  if (error) return { ok: false, error: "Não consegui salvar a peça. Tente de novo." };
  refresh();
  return { ok: true };
}

export async function excluirPeca(id: string): Promise<Result> {
  const supabase = await createClient();
  const { count } = await supabase.from("vendas").select("id", { count: "exact", head: true }).eq("peca_id", id);
  if (count && count > 0) {
    return { ok: false, error: "Esta peça já tem vendas registradas e não pode ser excluída. Deixe o estoque em 0." };
  }
  const { error } = await supabase.from("pronta_entrega").delete().eq("id", id);
  if (error) return { ok: false, error: "Não consegui excluir a peça. Tente de novo." };
  refresh();
  return { ok: true };
}

export async function alterarReserva(id: string, reservar: boolean): Promise<Result> {
  const supabase = await createClient();
  const { data: p } = await supabase.from("pronta_entrega").select("quantidade").eq("id", id).single();
  if (!p || p.quantidade < 1) return { ok: false, error: "Esta peça não tem unidades em estoque." };
  const { error } = await supabase
    .from("pronta_entrega")
    .update({ status: (reservar ? "reservada" : "disponivel") satisfies StatusPeca })
    .eq("id", id);
  if (error) return { ok: false, error: "Não consegui atualizar a peça. Tente de novo." };
  refresh();
  return { ok: true };
}

export async function venderPeca(id: string, quantidade: number, forma: FormaPagamento): Promise<Result> {
  if (!Number.isInteger(quantidade) || quantidade < 1) return { ok: false, error: "Digite uma quantidade válida." };
  if (!(forma in FORMAS_PAGAMENTO)) return { ok: false, error: "Forma de pagamento inválida." };
  const supabase = await createClient();
  const { error } = await supabase.rpc("registrar_venda", { p_peca: id, p_quantidade: quantidade, p_forma: forma });
  if (error) return { ok: false, error: error.message.replace(/^.*?: /, "") || "Não consegui registrar a venda." };
  refresh();
  return { ok: true };
}
