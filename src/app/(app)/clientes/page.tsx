import { ClientesView, type ClienteLinha } from "@/components/clientes-view";
import { createClient } from "@/lib/supabase/server";

export default async function ClientesPage({ searchParams }: { searchParams: Promise<{ nova?: string }> }) {
  const sp = await searchParams;
  const supabase = await createClient();
  const [{ data: clientes }, { data: enc }] = await Promise.all([
    supabase.from("clientes").select("*").order("nome"),
    supabase.from("encomendas_resumo").select("cliente_id, valor_total, saldo, status"),
  ]);

  const linhas: ClienteLinha[] = (clientes ?? []).map((c) => {
    const dela = (enc ?? []).filter((e) => e.cliente_id === c.id && e.status !== "cancelado");
    return {
      ...c,
      qtd: dela.length,
      total_compras: dela.reduce((s, e) => s + Number(e.valor_total), 0),
      pendente: dela.reduce((s, e) => s + Number(e.saldo), 0),
    };
  });

  return (
    <>
      <h1 className="mb-6 font-serif text-4xl font-semibold">Clientes</h1>
      <ClientesView clientes={linhas} abrirNovo={sp.nova === "1"} />
    </>
  );
}
