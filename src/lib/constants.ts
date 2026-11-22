export const STATUS_ENCOMENDA = {
  recebido: { label: "Pedido recebido", tone: "neutro" },
  producao: { label: "Em produção", tone: "ambar" },
  finalizacao: { label: "Aguardando finalização", tone: "ambar" },
  pronto: { label: "Pronto para entrega", tone: "salvia" },
  entregue: { label: "Entregue", tone: "taupe" },
  cancelado: { label: "Cancelado", tone: "rose" },
} as const;
export type StatusEncomenda = keyof typeof STATUS_ENCOMENDA;

export const STATUS_PAGAMENTO = {
  nao_pago: { label: "Não pago", tone: "rose" },
  sinal: { label: "Sinal pago", tone: "ambar" },
  parcial: { label: "Parcialmente pago", tone: "ambar" },
  pago: { label: "Pago", tone: "salvia" },
} as const;
export type StatusPagamento = keyof typeof STATUS_PAGAMENTO;

export const FORMAS_PAGAMENTO = {
  pix: "Pix",
  dinheiro: "Dinheiro",
  cartao: "Cartão",
  transferencia: "Transferência",
  outro: "Outro",
} as const;
export type FormaPagamento = keyof typeof FORMAS_PAGAMENTO;

export const STATUS_PECA = {
  disponivel: { label: "Disponível", tone: "salvia" },
  reservada: { label: "Reservada", tone: "ambar" },
  vendida: { label: "Vendida", tone: "taupe" },
} as const;
export type StatusPeca = keyof typeof STATUS_PECA;

export const CATEGORIAS = [
  "Vestido", "Blusa", "Saia", "Calça", "Conjunto", "Short", "Macacão", "Casaco", "Outro",
];
export const TAMANHOS = ["PP", "P", "M", "G", "GG", "Único"];
