"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { encomendaSchema, pagamentoSchema } from "@/lib/schemas";
import { uploadFoto } from "@/lib/storage";
import { FORMAS_PAGAMENTO, STATUS_ENCOMENDA, type StatusEncomenda } from "@/lib/constants";
import { formatBRL, parseBRL, todayISO } from "@/lib/utils";

type Result = { ok: true; id?: string } | { ok: false; error: string };

const clean = (v?: string | null) => (v && String(v).trim() ? String(v).trim() : null);
const refresh = () => revalidatePath("/", "layout");

async function logEvento(
  supabase: Awaited<ReturnType<typeof createClient>>,
  encomenda_id: string,
  evento: string,
  detalhe?: string
) {
  await supabase.from("historico").insert({ encomenda_id, evento, detalhe: detalhe ?? null });
}

export async function criarEncomenda(formData: FormData): Promise<Result> {
  const raw = Object.fromEntries([...formData.entries()].filter(([, v]) => typeof v === "string"));
  const parsed = encomendaSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  const v = parsed.data;

  const supabase = await createClient();

  let clienteId = clean(v.cliente_id);
  if (!clienteId) {
    const { data, error } = await supabase
      .from("clientes")
      .insert({ nome: v.novo_cliente_nome!.trim(), telefone: clean(v.novo_cliente_telefone) })
      .select("id")
      .single();
    if (error) {
      console.error("[criarEncomenda] erro ao criar cliente:", error.code, error.message);
      return { ok: false, error: "Não consegui cadastrar a cliente nova. Tente de novo." };
    }
    clienteId = data.id;
  }

  let fotoUrl: string | null = null;
  try {
    fotoUrl = await uploadFoto(supabase, formData.get("foto"), "encomendas");
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }

  const { data: enc, error } = await supabase
    .from("encomendas")
    .insert({
      cliente_id: clienteId,
      peca: v.peca,
      categoria: clean(v.categoria),
      tamanho: clean(v.tamanho),
      cor: clean(v.cor),
      quantidade: v.quantidade,
      valor_total: parseBRL(v.valor_total),
      data_pedido: clean(v.data_pedido) ?? todayISO(),
      prazo_entrega: v.prazo_entrega,
      descricao: clean(v.descricao),
      observacoes: clean(v.observacoes),
      foto_url: fotoUrl,
    })
    .select("id")
    .single();
  if (error) return { ok: false, error: "Não consegui salvar a encomenda. Tente de novo." };

  await logEvento(supabase, enc.id, "Pedido cadastrado");

  const pago = parseBRL(v.valor_pago);
  if (pago > 0) {
    await supabase.from("pagamentos").insert({
      encomenda_id: enc.id,
      valor: pago,
      forma: v.forma_pagamento,
      data: todayISO(),
      observacao: "Sinal",
    });
    await logEvento(supabase, enc.id, "Pagamento registrado", `${formatBRL(pago)} via ${FORMAS_PAGAMENTO[v.forma_pagamento]}`);
  }

  refresh();
  return { ok: true, id: enc.id };
}

export async function atualizarEncomenda(id: string, formData: FormData): Promise<Result> {
  const peca = String(formData.get("peca") ?? "").trim();
  const prazo = String(formData.get("prazo_entrega") ?? "");
  const valor = parseBRL(String(formData.get("valor_total") ?? ""));
  if (peca.length < 2) return { ok: false, error: "Digite o nome da peça" };
  if (!prazo) return { ok: false, error: "Escolha o prazo de entrega" };
  if (valor <= 0) return { ok: false, error: "Digite o valor total" };

  const supabase = await createClient();

  const { data: atual } = await supabase.from("encomendas_resumo").select("prazo_entrega,total_pago").eq("id", id).single();
  if (atual && valor < Number(atual.total_pago)) {
    return { ok: false, error: `O valor total não pode ser menor que o já pago (${formatBRL(atual.total_pago)}).` };
  }

  let fotoUrl: string | null = null;
  try {
    fotoUrl = await uploadFoto(supabase, formData.get("foto"), "encomendas");
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }

  const patch: Record<string, unknown> = {
    peca,
    valor_total: valor,
    prazo_entrega: prazo,
    categoria: clean(String(formData.get("categoria") ?? "")),
    tamanho: clean(String(formData.get("tamanho") ?? "")),
    cor: clean(String(formData.get("cor") ?? "")),
    descricao: clean(String(formData.get("descricao") ?? "")),
    observacoes: clean(String(formData.get("observacoes") ?? "")),
  };
  if (fotoUrl) patch.foto_url = fotoUrl;

  const { error } = await supabase.from("encomendas").update(patch).eq("id", id);
  if (error) return { ok: false, error: "Não consegui salvar as alterações. Tente de novo." };

  if (atual && atual.prazo_entrega !== prazo) {
    await logEvento(supabase, id, "Prazo alterado", `Novo prazo: ${prazo.split("-").reverse().join("/")}`);
  } else {
    await logEvento(supabase, id, "Pedido editado");
  }
  refresh();
  return { ok: true };
}

export async function alterarStatus(id: string, status: StatusEncomenda): Promise<Result> {
  if (!(status in STATUS_ENCOMENDA)) return { ok: false, error: "Situação inválida" };
  const supabase = await createClient();
  const { error } = await supabase.from("encomendas").update({ status }).eq("id", id);
  if (error) return { ok: false, error: "Não consegui alterar a situação. Tente de novo." };
  const evento =
    status === "pronto" ? "Pedido pronto para entrega" : status === "entregue" ? "Pedido entregue" : status === "cancelado" ? "Pedido cancelado" : "Situação alterada";
  await logEvento(supabase, id, evento, STATUS_ENCOMENDA[status].label);
  refresh();
  return { ok: true };
}

export async function registrarPagamento(encomendaId: string, raw: unknown): Promise<Result> {
  const parsed = pagamentoSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  const v = parsed.data;
  const valor = parseBRL(v.valor);

  const supabase = await createClient();
  const { data: enc } = await supabase
    .from("encomendas_resumo")
    .select("saldo,status")
    .eq("id", encomendaId)
    .single();
  if (!enc) return { ok: false, error: "Encomenda não encontrada" };
  if (enc.status === "cancelado") return { ok: false, error: "Esta encomenda foi cancelada e não recebe pagamentos." };
  if (valor > Number(enc.saldo) + 0.001) {
    return { ok: false, error: `O valor passa do que falta receber (${formatBRL(enc.saldo)}).` };
  }

  const { error } = await supabase.from("pagamentos").insert({
    encomenda_id: encomendaId,
    valor,
    data: v.data,
    forma: v.forma,
    observacao: clean(v.observacao),
  });
  if (error) return { ok: false, error: "Não consegui registrar o pagamento. Tente de novo." };

  await logEvento(supabase, encomendaId, "Pagamento registrado", `${formatBRL(valor)} via ${FORMAS_PAGAMENTO[v.forma]}`);
  refresh();
  return { ok: true };
}

export async function removerPagamento(encomendaId: string, pagamentoId: string): Promise<Result> {
  const supabase = await createClient();
  const { error } = await supabase.from("pagamentos").delete().eq("id", pagamentoId);
  if (error) return { ok: false, error: "Não consegui remover o pagamento. Tente de novo." };
  await logEvento(supabase, encomendaId, "Pagamento removido");
  refresh();
  return { ok: true };
}
