"use client";

import { Pencil, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { excluirCliente } from "@/app/(app)/clientes/actions";
import { ClienteDrawer } from "@/components/cliente-form";
import { NovaEncomendaButton } from "@/components/nova-encomenda";
import type { Cliente } from "@/lib/types";

export function ClienteAcoes({ cliente }: { cliente: Cliente }) {
  const router = useRouter();
  const [editar, setEditar] = useState(false);
  const [pending, start] = useTransition();

  return (
    <div className="flex flex-wrap gap-2">
      <NovaEncomendaButton clientes={[{ id: cliente.id, nome: cliente.nome }]} clienteId={cliente.id} label="Nova encomenda" />
      <button className="btn-soft" onClick={() => setEditar(true)}>
        <Pencil size={18} /> Editar
      </button>
      <button
        className="btn-danger"
        disabled={pending}
        onClick={() => {
          if (!confirm(`Excluir ${cliente.nome}? Essa ação não pode ser desfeita.`)) return;
          start(async () => {
            const r = await excluirCliente(cliente.id);
            if (!r.ok) {
        toast.error(r.error);
        return;
      }
            toast.success("Cliente excluída.");
            router.push("/clientes");
          });
        }}
      >
        <Trash2 size={18} /> Excluir
      </button>
      <ClienteDrawer open={editar} onClose={() => setEditar(false)} cliente={cliente} />
    </div>
  );
}
