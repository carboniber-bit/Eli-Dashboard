import { z } from "zod";
import { parseBRL } from "./utils";

const opt = z.string().trim().optional().or(z.literal(""));
const dinheiroPositivo = (msg: string) =>
  z.string().refine((v) => parseBRL(v) > 0, { message: msg });

export const clienteSchema = z.object({
  nome: z.string().trim().min(2, "Digite o nome da cliente"),
  telefone: opt,
  observacoes: opt,
});
export type ClienteInput = z.infer<typeof clienteSchema>;

export const encomendaSchema = z
  .object({
    cliente_id: opt,
    novo_cliente_nome: opt,
    novo_cliente_telefone: opt,
    peca: z.string().trim().min(2, "Digite o nome da peça"),
    valor_total: dinheiroPositivo("Digite o valor total (ex.: 180,00)"),
    prazo_entrega: z.string().min(1, "Escolha o prazo de entrega"),
    categoria: opt,
    tamanho: opt,
    cor: opt,
    quantidade: z.coerce.number().int().min(1, "Mínimo 1").default(1),
    valor_pago: opt,
    forma_pagamento: z.enum(["pix", "dinheiro", "cartao", "transferencia", "outro"]).default("pix"),
    data_pedido: opt,
    descricao: opt,
    observacoes: opt,
  })
  .superRefine((v, ctx) => {
    if (!v.cliente_id && !v.novo_cliente_nome) {
      ctx.addIssue({ code: "custom", path: ["cliente_id"], message: "Escolha a cliente ou cadastre uma nova" });
    }
    if (parseBRL(v.valor_pago) > parseBRL(v.valor_total)) {
      ctx.addIssue({ code: "custom", path: ["valor_pago"], message: "O valor pago não pode passar do valor total" });
    }
  });
export type EncomendaInput = z.input<typeof encomendaSchema>;

export const pagamentoSchema = z.object({
  valor: dinheiroPositivo("Digite o valor recebido"),
  data: z.string().min(1, "Escolha a data"),
  forma: z.enum(["pix", "dinheiro", "cartao", "transferencia", "outro"]),
  observacao: opt,
});

export const pecaSchema = z.object({
  nome: z.string().trim().min(2, "Digite o nome da peça"),
  categoria: opt,
  descricao: opt,
  tamanho: opt,
  cor: opt,
  quantidade: z.coerce.number().int().min(0, "Não pode ser negativo"),
  preco_venda: dinheiroPositivo("Digite o preço de venda"),
  custo: opt,
});

export const gastoSchema = z.object({
  descricao: z.string().trim().min(2, "Diga o que foi comprado"),
  valor: dinheiroPositivo("Digite o valor gasto (ex.: 250,00)"),
  data: z.string().min(1, "Escolha a data da compra"),
  categoria: z.string().min(1, "Escolha a categoria"),
  observacao: opt,
});
export type GastoInput = z.infer<typeof gastoSchema>;
