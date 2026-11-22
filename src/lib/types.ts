import type { FormaPagamento, StatusEncomenda, StatusPagamento, StatusPeca } from "./constants";

export type Cliente = {
  id: string;
  nome: string;
  telefone: string | null;
  observacoes: string | null;
  created_at: string;
};

export type EncomendaResumo = {
  id: string;
  numero: number;
  cliente_id: string;
  cliente_nome: string;
  cliente_telefone: string | null;
  peca: string;
  categoria: string | null;
  tamanho: string | null;
  cor: string | null;
  quantidade: number;
  valor_total: number;
  total_pago: number;
  saldo: number;
  status: StatusEncomenda;
  status_pagamento: StatusPagamento;
  data_pedido: string;
  prazo_entrega: string;
  descricao: string | null;
  observacoes: string | null;
  foto_url: string | null;
};

export type Pagamento = {
  id: string;
  encomenda_id: string;
  valor: number;
  data: string;
  forma: FormaPagamento;
  observacao: string | null;
};

export type Historico = {
  id: string;
  evento: string;
  detalhe: string | null;
  created_at: string;
};

export type Peca = {
  id: string;
  nome: string;
  foto_url: string | null;
  categoria: string | null;
  descricao: string | null;
  tamanho: string | null;
  cor: string | null;
  quantidade: number;
  preco_venda: number;
  custo: number | null;
  status: StatusPeca;
};

export type Gasto = {
  id: string;
  descricao: string;
  valor: number;
  data: string;
  categoria: string;
  observacao: string | null;
};
