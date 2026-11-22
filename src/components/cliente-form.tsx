"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { salvarCliente } from "@/app/(app)/clientes/actions";
import { Drawer } from "@/components/ui/drawer";
import { Field } from "@/components/ui/field";
import { clienteSchema, type ClienteInput } from "@/lib/schemas";
import type { Cliente } from "@/lib/types";

export function ClienteDrawer({
  open,
  onClose,
  cliente,
}: {
  open: boolean;
  onClose: () => void;
  cliente?: Cliente | null;
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ClienteInput>({
    resolver: zodResolver(clienteSchema),
    values: { nome: cliente?.nome ?? "", telefone: cliente?.telefone ?? "", observacoes: cliente?.observacoes ?? "" },
  });

  async function onSubmit(values: ClienteInput) {
    setSaving(true);
    const res = await salvarCliente(cliente?.id ?? null, values);
    setSaving(false);
    if (!res.ok) return toast.error(res.error);
    toast.success(cliente ? "Cliente atualizada!" : "Cliente cadastrada!");
    reset();
    onClose();
    router.refresh();
  }

  return (
    <Drawer open={open} onClose={onClose} title={cliente ? "Editar cliente" : "Nova cliente"}>
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
        <Field label="Nome" error={errors.nome?.message}>
          <input className="input" autoFocus {...register("nome")} />
        </Field>
        <Field label="Telefone / WhatsApp" hint="Opcional" error={errors.telefone?.message}>
          <input className="input" inputMode="tel" placeholder="(11) 90000-0000" {...register("telefone")} />
        </Field>
        <Field label="Observações" hint="Opcional. Ex.: manequim, gostos, como prefere ser chamada">
          <textarea className="input min-h-24" {...register("observacoes")} />
        </Field>
        <div className="flex gap-3 pt-2">
          <button type="button" className="btn-soft flex-1" onClick={onClose}>Cancelar</button>
          <button className="btn-primary flex-1" disabled={saving}>{saving ? "Salvando…" : "Salvar cliente"}</button>
        </div>
      </form>
    </Drawer>
  );
}
