import { Badge } from "@/components/ui/badge";
import {
  STATUS_ENCOMENDA, STATUS_PAGAMENTO, STATUS_PECA,
  type StatusEncomenda, type StatusPagamento, type StatusPeca,
} from "@/lib/constants";

export const StatusEncomendaBadge = ({ s }: { s: StatusEncomenda }) => (
  <Badge tone={STATUS_ENCOMENDA[s].tone}>{STATUS_ENCOMENDA[s].label}</Badge>
);

export const StatusPagamentoBadge = ({ s, cancelado }: { s: StatusPagamento; cancelado?: boolean }) =>
  cancelado ? <span className="text-sm text-taupe">—</span> : <Badge tone={STATUS_PAGAMENTO[s].tone}>{STATUS_PAGAMENTO[s].label}</Badge>;

export const StatusPecaBadge = ({ s }: { s: StatusPeca }) => (
  <Badge tone={STATUS_PECA[s].tone}>{STATUS_PECA[s].label}</Badge>
);
