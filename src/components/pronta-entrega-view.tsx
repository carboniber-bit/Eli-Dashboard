"use client";

import { ImageOff, Pencil, Plus, Search, ShoppingBag, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { alterarReserva, excluirPeca, salvarPeca, venderPeca } from "@/app/(app)/pronta-entrega/actions";
import { StatusPecaBadge } from "@/components/status-badges";
import { Drawer } from "@/components/ui/drawer";
import { EmptyState, Field } from "@/components/ui/field";
import { CATEGORIAS, FORMAS_PAGAMENTO, TAMANHOS, type FormaPagamento } from "@/lib/constants";
import type { Peca } from "@/lib/types";
import { formatBRL } from "@/lib/utils";

export function ProntaEntregaView({ pecas, abrirNova }: { pecas: Peca[]; abrirNova?: boolean }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [busca, setBusca] = useState("");
  const [tam, setTam] = useState("");
  const [cat, setCat] = useState("");
  const [statusF, setStatusF] = useState("");
  const [form, setForm] = useState<Peca | "nova" | null>(abrirNova ? "nova" : null);
  const [venda, setVenda] = useState<Peca | null>(null);

  const lista = useMemo(() => {
    const q = busca.trim().toLowerCase();
    return pecas.filter(
      (p) =>
        (!q || p.nome.toLowerCase().includes(q) || (p.cor ?? "").toLowerCase().includes(q)) &&
        (!tam || p.tamanho === tam) &&
        (!cat || p.categoria === cat) &&
        (!statusF || p.status === statusF)
    );
  }, [pecas, busca, tam, cat, statusF]);

  function reservar(p: Peca) {
    start(async () => {
      const r = await alterarReserva(p.id, p.status !== "reservada");
      if (!r.ok) {
        toast.error(r.error);
        return;
      }
      toast.success(p.status === "reservada" ? "Reserva desfeita." : "Peça reservada!");
      router.refresh();
    });
  }

  function excluir(p: Peca) {
    if (!confirm(`Excluir “${p.nome}”? Essa ação não pode ser desfeita.`)) return;
    start(async () => {
      const r = await excluirPeca(p.id);
      if (!r.ok) {
        toast.error(r.error);
        return;
      }
      toast.success("Peça excluída.");
      router.refresh();
    });
  }

  return (
    <>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-serif text-4xl font-semibold">Pronta-entrega</h1>
        <button className="btn-primary" onClick={() => setForm("nova")}><Plus size={18} /> Adicionar peça</button>
      </div>

      <div className="card mb-5 grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-[1.6fr_1fr_1fr_1fr]">
        <div className="relative">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-taupe" />
          <input className="input !pl-10" placeholder="Buscar peça ou cor" value={busca} onChange={(e) => setBusca(e.target.value)} />
        </div>
        <select className="input" value={cat} onChange={(e) => setCat(e.target.value)} aria-label="Categoria">
          <option value="">Toda categoria</option>
          {CATEGORIAS.map((c) => <option key={c}>{c}</option>)}
        </select>
        <select className="input" value={tam} onChange={(e) => setTam(e.target.value)} aria-label="Tamanho">
          <option value="">Todo tamanho</option>
          {TAMANHOS.map((t) => <option key={t}>{t}</option>)}
        </select>
        <select className="input" value={statusF} onChange={(e) => setStatusF(e.target.value)} aria-label="Situação">
          <option value="">Toda situação</option>
          <option value="disponivel">Disponível</option>
          <option value="reservada">Reservada</option>
          <option value="vendida">Vendida</option>
        </select>
      </div>

      {lista.length === 0 ? (
        <div className="card">
          <EmptyState
            title={pecas.length === 0 ? "Nenhuma peça cadastrada" : "Nada encontrado"}
            text={pecas.length === 0 ? "Cadastre as peças que estão prontas para levar e acompanhe o estoque." : "Tente limpar os filtros ou buscar por outro nome."}
            action={pecas.length === 0 && <button className="btn-primary" onClick={() => setForm("nova")}>Adicionar a primeira peça</button>}
          />
        </div>
      ) : (
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {lista.map((p) => (
            <li key={p.id} className="card overflow-hidden">
              <div className="flex aspect-[4/3] items-center justify-center bg-areia">
                {p.foto_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.foto_url} alt={p.nome} className="h-full w-full object-cover" />
                ) : (
                  <ImageOff className="text-taupe/60" size={32} />
                )}
              </div>
              <div className="flex flex-col gap-3 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{p.nome}</p>
                    <p className="text-sm text-taupe">{[p.categoria, p.tamanho, p.cor].filter(Boolean).join(" · ") || "—"}</p>
                  </div>
                  <StatusPecaBadge s={p.status} />
                </div>
                <div className="flex items-end justify-between">
                  <p className="text-xl font-semibold">{formatBRL(p.preco_venda)}</p>
                  <p className="text-sm text-cacau">{p.quantidade} em estoque</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button className="btn-primary !px-3" disabled={pending || p.quantidade < 1} onClick={() => setVenda(p)}>
                    <ShoppingBag size={16} /> Vender
                  </button>
                  <button className="btn-soft !px-3" disabled={pending || p.quantidade < 1} onClick={() => reservar(p)}>
                    {p.status === "reservada" ? "Desfazer reserva" : "Reservar"}
                  </button>
                  <button className="btn-ghost !px-3" onClick={() => setForm(p)} aria-label="Editar"><Pencil size={16} /></button>
                  <button className="btn-ghost !px-3" onClick={() => excluir(p)} aria-label="Excluir"><Trash2 size={16} /></button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {form && <PecaDrawer peca={form === "nova" ? null : form} onClose={() => setForm(null)} />}
      {venda && <VendaDrawer peca={venda} onClose={() => setVenda(null)} />}
    </>
  );
}

function PecaDrawer({ peca, onClose }: { peca: Peca | null; onClose: () => void }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  return (
    <Drawer open onClose={onClose} title={peca ? "Editar peça" : "Adicionar peça"}>
      <form
        className="flex flex-col gap-4"
        action={async (fd) => {
          setSaving(true);
          const r = await salvarPeca(peca?.id ?? null, fd);
          setSaving(false);
          if (!r.ok) {
        toast.error(r.error);
        return;
      }
          toast.success(peca ? "Peça atualizada!" : "Peça adicionada!");
          onClose();
          router.refresh();
        }}
      >
        <Field label="Nome da peça"><input name="nome" className="input" defaultValue={peca?.nome} required autoFocus /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Preço de venda"><input name="preco_venda" className="input" inputMode="decimal" placeholder="R$ 0,00" defaultValue={peca ? String(peca.preco_venda).replace(".", ",") : ""} required /></Field>
          <Field label="Quantidade"><input name="quantidade" type="number" min={0} className="input" defaultValue={peca?.quantidade ?? 1} required /></Field>
          <Field label="Categoria">
            <select name="categoria" className="input" defaultValue={peca?.categoria ?? ""}>
              <option value="">—</option>{CATEGORIAS.map((c) => <option key={c}>{c}</option>)}
            </select>
          </Field>
          <Field label="Tamanho">
            <select name="tamanho" className="input" defaultValue={peca?.tamanho ?? ""}>
              <option value="">—</option>{TAMANHOS.map((t) => <option key={t}>{t}</option>)}
            </select>
          </Field>
          <Field label="Cor"><input name="cor" className="input" defaultValue={peca?.cor ?? ""} /></Field>
          <Field label="Custo" hint="Opcional"><input name="custo" className="input" inputMode="decimal" defaultValue={peca?.custo != null ? String(peca.custo).replace(".", ",") : ""} /></Field>
        </div>
        <Field label="Descrição"><textarea name="descricao" className="input min-h-20" defaultValue={peca?.descricao ?? ""} /></Field>
        <Field label="Foto" hint="JPG ou PNG, até 5 MB"><input name="foto" type="file" accept="image/*" className="input" /></Field>
        <div className="flex gap-3 pt-2">
          <button type="button" className="btn-soft flex-1" onClick={onClose}>Cancelar</button>
          <button className="btn-primary flex-[2]" disabled={saving}>{saving ? "Salvando…" : "Salvar peça"}</button>
        </div>
      </form>
    </Drawer>
  );
}

function VendaDrawer({ peca, onClose }: { peca: Peca; onClose: () => void }) {
  const router = useRouter();
  const [qtd, setQtd] = useState(1);
  const [forma, setForma] = useState<FormaPagamento>("pix");
  const [saving, setSaving] = useState(false);

  return (
    <Drawer open onClose={onClose} title="Registrar venda">
      <div className="flex flex-col gap-5">
        <p className="panel text-sm">
          <strong>{peca.nome}</strong> · {formatBRL(peca.preco_venda)} cada · {peca.quantidade} em estoque
        </p>
        <Field label="Quantidade vendida" error={qtd > peca.quantidade ? `Só há ${peca.quantidade} em estoque` : undefined}>
          <input type="number" min={1} max={peca.quantidade} className="input" value={qtd} onChange={(e) => setQtd(Number(e.target.value))} />
        </Field>
        <Field label="Forma de pagamento">
          <select className="input" value={forma} onChange={(e) => setForma(e.target.value as FormaPagamento)}>
            {Object.entries(FORMAS_PAGAMENTO).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
          </select>
        </Field>
        <p className="text-lg">Total: <strong>{formatBRL(peca.preco_venda * (qtd || 0))}</strong></p>
        <div className="flex gap-3">
          <button className="btn-soft flex-1" onClick={onClose}>Cancelar</button>
          <button
            className="btn-primary flex-[2]"
            disabled={saving || qtd < 1 || qtd > peca.quantidade}
            onClick={async () => {
              setSaving(true);
              const r = await venderPeca(peca.id, qtd, forma);
              setSaving(false);
              if (!r.ok) {
        toast.error(r.error);
        return;
      }
              toast.success("Venda registrada e estoque atualizado!");
              onClose();
              router.refresh();
            }}
          >
            {saving ? "Registrando…" : "Confirmar venda"}
          </button>
        </div>
      </div>
    </Drawer>
  );
}
