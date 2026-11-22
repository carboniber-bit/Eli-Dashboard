"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Check, Pencil, Trash2, Wallet } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import {
  alterarStatus, atualizarEncomenda, registrarPagamento, removerPagamento,
} from "@/app/(app)/encomendas/actions";
import { Drawer } from "@/components/ui/drawer";
import { Field } from "@/components/ui/field";
import { CATEGORIAS, FORMAS_PAGAMENTO, STATUS_ENCOMENDA, TAMANHOS, type StatusEncomenda } from "@/lib/constants";
import { pagamentoSchema } from "@/lib/schemas";
import type { EncomendaResumo } from "@/lib/types";
import { formatBRL, todayISO } from "@/lib/utils";

export function EncomendaAcoes({ e }: { e: EncomendaResumo }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [pagar, setPagar] = useState(false);
  const [editar, setEditar] = useState(false);
  const encerrada = e.status === "entregue" || e.status === "cancelado";

  function mudar(status: StatusEncomenda, msg: string) {
    start(async () => {
      const r = await alterarStatus(e.id, status);
      if (!r.ok) return toast.error(r.error);
      toast.success(msg);
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-2">
        {e.status !== "cancelado" && e.saldo > 0 && (
          <button className="btn-primary" onClick={() => setPagar(true)}>
            <Wallet size={18} /> Registrar pagamento
          </button>
        )}
        {!encerrada && e.status !== "pronto" && (
          <button className="btn-soft" disabled={pending} onClick={() => mudar("pronto", "Marcada como pronta para entrega!")}>
            <Check size={18} /> Marcar como pronta
          </button>
        )}
        {!encerrada && (
          <button className="btn-soft" disabled={pending} onClick={() => mudar("entregue", "Marcada como entregue!")}>
            Marcar como entregue
          </button>
        )}
        <button className="btn-soft" onClick={() => setEditar(true)}>
          <Pencil size={18} /> Editar pedido
        </button>
      </div>

      {!encerrada && (
        <label className="flex max-w-xs flex-col gap-1.5">
          <span className="label">Alterar situação</span>
          <select
            className="input"
            value={e.status}
            disabled={pending}
            onChange={(ev) => mudar(ev.target.value as StatusEncomenda, "Situação atualizada!")}
          >
            {Object.entries(STATUS_ENCOMENDA)
              .filter(([k]) => k !== "cancelado")
              .map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
        </label>
      )}

      {e.status !== "cancelado" && e.status !== "entregue" && (
        <button
          className="btn-danger self-start"
          disabled={pending}
          onClick={() => {
            if (confirm("Cancelar este pedido? Os pagamentos já registrados continuam salvos, mas o pedido sai das contas a receber.")) {
              mudar("cancelado", "Pedido cancelado.");
            }
          }}
        >
          Cancelar pedido
        </button>
      )}
      {e.status === "cancelado" && (
        <button className="btn-soft self-start" disabled={pending} onClick={() => mudar("recebido", "Pedido reativado!")}>
          Reativar pedido
        </button>
      )}

      {pagar && <PagamentoDrawer e={e} onClose={() => setPagar(false)} />}
      {editar && <EditarDrawer e={e} onClose={() => setEditar(false)} />}
    </div>
  );
}

function PagamentoDrawer({ e, onClose }: { e: EncomendaResumo; onClose: () => void }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const { register, handleSubmit, setValue, formState: { errors } } = useForm({
    resolver: zodResolver(pagamentoSchema),
    defaultValues: { valor: "", data: todayISO(), forma: "pix" as const, observacao: "" },
  });

  return (
    <Drawer open onClose={onClose} title="Registrar pagamento">
      <form
        className="flex flex-col gap-5"
        onSubmit={handleSubmit(async (v) => {
          setSaving(true);
          const r = await registrarPagamento(e.id, v);
          setSaving(false);
          if (!r.ok) return toast.error(r.error);
          toast.success("Pagamento registrado!");
          onClose();
          router.refresh();
        })}
      >
        <p className="panel text-sm">
          Falta receber <strong>{formatBRL(e.saldo)}</strong> de {formatBRL(e.valor_total)}.{" "}
          <button type="button" className="font-medium underline" onClick={() => setValue("valor", String(e.saldo).replace(".", ","))}>
            Receber tudo
          </button>
        </p>
        <Field label="Valor recebido" error={errors.valor?.message}>
          <input className="input" inputMode="decimal" placeholder="R$ 0,00" autoFocus {...register("valor")} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Data" error={errors.data?.message}>
            <input type="date" className="input" {...register("data")} />
          </Field>
          <Field label="Forma de pagamento">
            <select className="input" {...register("forma")}>
              {Object.entries(FORMAS_PAGAMENTO).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
            </select>
          </Field>
        </div>
        <Field label="Observação" hint="Opcional. Ex.: segunda parcela">
          <input className="input" {...register("observacao")} />
        </Field>
        <div className="flex gap-3">
          <button type="button" className="btn-soft flex-1" onClick={onClose}>Cancelar</button>
          <button className="btn-primary flex-[2]" disabled={saving}>{saving ? "Salvando…" : "Salvar pagamento"}</button>
        </div>
      </form>
    </Drawer>
  );
}

function EditarDrawer({ e, onClose }: { e: EncomendaResumo; onClose: () => void }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  return (
    <Drawer open onClose={onClose} title={`Editar pedido #${e.numero}`}>
      <form
        className="flex flex-col gap-4"
        action={async (fd) => {
          setSaving(true);
          const r = await atualizarEncomenda(e.id, fd);
          setSaving(false);
          if (!r.ok) return toast.error(r.error);
          toast.success("Pedido atualizado!");
          onClose();
          router.refresh();
        }}
      >
        <Field label="Peça"><input name="peca" className="input" defaultValue={e.peca} required /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Valor total"><input name="valor_total" className="input" inputMode="decimal" defaultValue={String(e.valor_total).replace(".", ",")} required /></Field>
          <Field label="Prazo de entrega"><input name="prazo_entrega" type="date" className="input" defaultValue={e.prazo_entrega} required /></Field>
          <Field label="Categoria">
            <select name="categoria" className="input" defaultValue={e.categoria ?? ""}>
              <option value="">—</option>
              {CATEGORIAS.map((c) => <option key={c}>{c}</option>)}
            </select>
          </Field>
          <Field label="Tamanho">
            <select name="tamanho" className="input" defaultValue={e.tamanho ?? ""}>
              <option value="">—</option>
              {TAMANHOS.map((t) => <option key={t}>{t}</option>)}
            </select>
          </Field>
          <Field label="Cor"><input name="cor" className="input" defaultValue={e.cor ?? ""} /></Field>
        </div>
        <Field label="Descrição"><textarea name="descricao" className="input min-h-20" defaultValue={e.descricao ?? ""} /></Field>
        <Field label="Observações"><textarea name="observacoes" className="input min-h-20" defaultValue={e.observacoes ?? ""} /></Field>
        <Field label="Trocar foto de referência" hint="Opcional"><input name="foto" type="file" accept="image/*" className="input" /></Field>
        <div className="flex gap-3 pt-2">
          <button type="button" className="btn-soft flex-1" onClick={onClose}>Cancelar</button>
          <button className="btn-primary flex-[2]" disabled={saving}>{saving ? "Salvando…" : "Salvar alterações"}</button>
        </div>
      </form>
    </Drawer>
  );
}

export function RemoverPagamentoButton({ encomendaId, pagamentoId }: { encomendaId: string; pagamentoId: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <button
      className="btn-ghost !min-h-0 !p-2 text-taupe"
      aria-label="Remover pagamento"
      disabled={pending}
      onClick={() => {
        if (!confirm("Remover este pagamento? O valor voltará para \"falta receber\".")) return;
        start(async () => {
          const r = await removerPagamento(encomendaId, pagamentoId);
          if (!r.ok) return toast.error(r.error);
          toast.success("Pagamento removido.");
          router.refresh();
        });
      }}
    >
      <Trash2 size={16} />
    </button>
  );
}
