"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ImagePlus, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { criarEncomenda } from "@/app/(app)/encomendas/actions";
import { Drawer } from "@/components/ui/drawer";
import { Field } from "@/components/ui/field";
import { CATEGORIAS, FORMAS_PAGAMENTO, TAMANHOS } from "@/lib/constants";
import { encomendaSchema, type EncomendaInput } from "@/lib/schemas";
import { formatBRL, parseBRL, todayISO } from "@/lib/utils";

type ClienteOpt = { id: string; nome: string };

export function NovaEncomendaButton({
  clientes,
  clienteId,
  label = "Nova encomenda",
  variant = "btn-primary",
}: {
  clientes: ClienteOpt[];
  clienteId?: string;
  label?: string;
  variant?: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button className={variant} onClick={() => setOpen(true)}>
        <Plus size={18} /> {label}
      </button>
      {open && <NovaEncomendaDrawer clientes={clientes} clienteId={clienteId} onClose={() => setOpen(false)} />}
    </>
  );
}

function NovaEncomendaDrawer({
  clientes,
  clienteId,
  onClose,
}: {
  clientes: ClienteOpt[];
  clienteId?: string;
  onClose: () => void;
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [novaCliente, setNovaCliente] = useState(clientes.length === 0);
  const [mais, setMais] = useState(false);
  const [foto, setFoto] = useState<File | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<EncomendaInput>({
    resolver: zodResolver(encomendaSchema),
    defaultValues: {
      cliente_id: clienteId ?? "",
      quantidade: 1,
      forma_pagamento: "pix",
      data_pedido: todayISO(),
    },
  });

  const total = parseBRL(watch("valor_total"));
  const pago = parseBRL(watch("valor_pago"));
  const restante = Math.max(total - pago, 0);

  async function onSubmit(values: EncomendaInput) {
    setSaving(true);
    const fd = new FormData();
    Object.entries(values).forEach(([k, v]) => v !== undefined && v !== null && fd.append(k, String(v)));
    if (foto) fd.append("foto", foto);
    const res = await criarEncomenda(fd);
    setSaving(false);
    if (!res.ok) {
        toast.error(res.error);
        return;
      }
    toast.success("Encomenda salva! Já está na lista e no resumo.");
    onClose();
    router.refresh();
  }

  return (
    <Drawer open onClose={onClose} title="Nova encomenda">
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
        <section className="flex flex-col gap-4">
          {!novaCliente ? (
            <Field label="Cliente" error={errors.cliente_id?.message}>
              <select className="input" {...register("cliente_id")}>
                <option value="">Escolha a cliente…</option>
                {clientes.map((c) => (
                  <option key={c.id} value={c.id}>{c.nome}</option>
                ))}
              </select>
              <button type="button" className="mt-1 self-start text-sm font-medium text-cacau underline" onClick={() => setNovaCliente(true)}>
                + Cadastrar cliente nova
              </button>
            </Field>
          ) : (
            <div className="panel flex flex-col gap-3">
              <Field label="Nome da cliente nova" error={errors.cliente_id?.message}>
                <input className="input" autoFocus {...register("novo_cliente_nome")} />
              </Field>
              <Field label="Telefone / WhatsApp" hint="Opcional">
                <input className="input" inputMode="tel" {...register("novo_cliente_telefone")} />
              </Field>
              {clientes.length > 0 && (
                <button type="button" className="self-start text-sm font-medium text-cacau underline" onClick={() => setNovaCliente(false)}>
                  Escolher cliente já cadastrada
                </button>
              )}
            </div>
          )}

          <Field label="Peça" error={errors.peca?.message}>
            <input className="input" placeholder="Ex.: Vestido midi de linho" {...register("peca")} />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Valor total" error={errors.valor_total?.message}>
              <input className="input" inputMode="decimal" placeholder="R$ 0,00" {...register("valor_total")} />
            </Field>
            <Field label="Prazo de entrega" error={errors.prazo_entrega?.message}>
              <input type="date" className="input" {...register("prazo_entrega")} />
            </Field>
          </div>
        </section>

        <section className="panel flex flex-col gap-3">
          <p className="font-medium">Sinal ou pagamento</p>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Valor já pago" hint="Opcional" error={errors.valor_pago?.message}>
              <input className="input" inputMode="decimal" placeholder="R$ 0,00" {...register("valor_pago")} />
            </Field>
            <Field label="Forma de pagamento">
              <select className="input" {...register("forma_pagamento")}>
                {Object.entries(FORMAS_PAGAMENTO).map(([k, l]) => (
                  <option key={k} value={k}>{l}</option>
                ))}
              </select>
            </Field>
          </div>
          <p className="text-sm text-cacau">
            Falta receber: <strong>{formatBRL(restante)}</strong>
          </p>
        </section>

        <button type="button" className="self-start text-sm font-medium text-cacau underline" onClick={() => setMais((m) => !m)}>
          {mais ? "Esconder detalhes" : "+ Adicionar detalhes (tamanho, cor, foto, observações)"}
        </button>

        {mais && (
          <section className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Categoria">
                <select className="input" {...register("categoria")}>
                  <option value="">—</option>
                  {CATEGORIAS.map((c) => <option key={c}>{c}</option>)}
                </select>
              </Field>
              <Field label="Tamanho">
                <select className="input" {...register("tamanho")}>
                  <option value="">—</option>
                  {TAMANHOS.map((t) => <option key={t}>{t}</option>)}
                </select>
              </Field>
              <Field label="Cor">
                <input className="input" {...register("cor")} />
              </Field>
              <Field label="Quantidade" error={errors.quantidade?.message}>
                <input type="number" min={1} className="input" {...register("quantidade")} />
              </Field>
            </div>
            <Field label="Data do pedido">
              <input type="date" className="input" {...register("data_pedido")} />
            </Field>
            <Field label="Descrição">
              <textarea className="input min-h-20" {...register("descricao")} />
            </Field>
            <Field label="Observações">
              <textarea className="input min-h-20" {...register("observacoes")} />
            </Field>
            <Field label="Foto de referência" hint={foto ? foto.name : "JPG ou PNG, até 5 MB"}>
              <span className="btn-soft cursor-pointer"><ImagePlus size={18} /> Escolher foto
                <input type="file" accept="image/*" className="sr-only" onChange={(e) => setFoto(e.target.files?.[0] ?? null)} />
              </span>
            </Field>
          </section>
        )}

        <div className="sticky bottom-0 -mx-5 flex gap-3 border-t border-nude/70 bg-creme px-5 py-4">
          <button type="button" className="btn-soft flex-1" onClick={onClose}>Cancelar</button>
          <button className="btn-primary flex-[2]" disabled={saving}>{saving ? "Salvando…" : "Salvar encomenda"}</button>
        </div>
      </form>
    </Drawer>
  );
}
