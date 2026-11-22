import { ProntaEntregaView } from "@/components/pronta-entrega-view";
import { createClient } from "@/lib/supabase/server";
import type { Peca } from "@/lib/types";

export default async function ProntaEntregaPage({ searchParams }: { searchParams: Promise<{ nova?: string }> }) {
  const sp = await searchParams;
  const supabase = await createClient();
  const { data } = await supabase.from("pronta_entrega").select("*").order("created_at", { ascending: false });
  return <ProntaEntregaView pecas={(data ?? []) as Peca[]} abrirNova={sp.nova === "1"} />;
}
