"use client";

import { Plus, Search } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { ClienteDrawer } from "@/components/cliente-form";
import { EmptyState } from "@/components/ui/field";
import { formatBRL } from "@/lib/utils";
import type { Cliente } from "@/lib/types";

export type ClienteLinha = Cliente & { total_compras: number; pendente: number; qtd: number };

export function ClientesView({ clientes, abrirNovo }: { clientes: ClienteLinha[]; abrirNovo?: boolean }) {
  const [busca, setBusca] = useState("");
  const [novo, setNovo] = useState(Boolean(abrirNovo));

  const lista = useMemo(() => {
    const q = busca.trim().toLowerCase();
    return q
      ? clientes.filter((c) => c.nome.toLowerCase().includes(q) || (c.telefone ?? "").includes(q))
      : clientes;
  }, [clientes, busca]);

  return (
    <>
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[220px] flex-1">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-taupe" />
          <input
            className="input !pl-10"
            placeholder="Buscar por nome ou telefone"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
        </div>
        <button className="btn-primary" onClick={() => setNovo(true)}>
          <Plus size={18} /> Nova cliente
        </button>
      </div>

      <div className="card mt-5 overflow-hidden">
        {lista.length === 0 ? (
          <EmptyState
            title={clientes.length === 0 ? "Nenhuma cliente ainda" : "Ninguém encontrada"}
            text={
              clientes.length === 0
                ? "Cadastre sua primeira cliente para começar a registrar encomendas."
                : "Confira se o nome está certo ou tente buscar só um pedaço dele."
            }
            action={clientes.length === 0 && <button className="btn-primary" onClick={() => setNovo(true)}>Cadastrar cliente</button>}
          />
        ) : (
          <ul className="divide-y divide-nude/60">
            {lista.map((c) => (
              <li key={c.id}>
                <Link href={`/clientes/${c.id}`} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 transition hover:bg-areia/60">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{c.nome}</p>
                    <p className="text-sm text-taupe">{c.telefone || "Sem telefone"}</p>
                  </div>
                  <div className="flex gap-6 text-right text-sm">
                    <div>
                      <p className="text-taupe">Compras</p>
                      <p className="font-medium">{formatBRL(c.total_compras)}</p>
                    </div>
                    <div>
                      <p className="text-taupe">Falta receber</p>
                      <p className={c.pendente > 0 ? "font-medium text-[#a34f4f]" : "font-medium"}>{formatBRL(c.pendente)}</p>
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      <ClienteDrawer open={novo} onClose={() => setNovo(false)} />
    </>
  );
}
