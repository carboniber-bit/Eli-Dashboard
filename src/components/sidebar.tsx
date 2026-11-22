"use client";

import { ChevronsLeft, ChevronsRight, LayoutGrid, LogOut, Menu, Shirt, Tag, TrendingUp, Users, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { signOut } from "@/app/login/actions";

const links = [
  { href: "/", label: "Dashboard", icon: LayoutGrid },
  { href: "/encomendas", label: "Encomendas", icon: Shirt },
  { href: "/clientes", label: "Clientes", icon: Users },
  { href: "/pronta-entrega", label: "Pronta-entrega", icon: Tag },
  { href: "/financeiro", label: "Financeiro", icon: TrendingUp },
];

function Nav({ collapsed, onNavigate }: { collapsed: boolean; onNavigate?: () => void }) {
  const path = usePathname();
  return (
    <nav className="flex flex-col gap-1">
      {links.map(({ href, label, icon: Icon }) => {
        const active = href === "/" ? path === "/" : path.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            title={label}
            className={cn(
              "flex min-h-[46px] items-center gap-3 rounded-xl px-3.5 text-[15px] transition",
              active ? "bg-white font-semibold text-tinta shadow-suave" : "text-taupe hover:bg-white/60 hover:text-tinta",
              collapsed && "justify-center px-0"
            )}
          >
            <Icon size={20} strokeWidth={1.8} />
            {!collapsed && label}
          </Link>
        );
      })}
    </nav>
  );
}

function Brand({ collapsed }: { collapsed?: boolean }) {
  return (
    <Link href="/" className="font-serif text-[28px] font-semibold leading-none tracking-tight">
      {collapsed ? "E." : <>Eli<span className="text-rose">.</span>Dash</>}
    </Link>
  );
}

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* desktop */}
      <aside
        className={cn(
          "sticky top-0 hidden h-screen shrink-0 flex-col justify-between border-r border-nude/60 bg-areia/50 p-4 transition-all md:flex",
          collapsed ? "w-[84px]" : "w-64"
        )}
      >
        <div className="flex flex-col gap-8">
          <div className={cn("px-2 pt-2", collapsed && "text-center")}>
            <Brand collapsed={collapsed} />
          </div>
          <Nav collapsed={collapsed} />
        </div>
        <div className="flex flex-col gap-1">
          <form action={signOut}>
            <button
              className={cn("flex min-h-[46px] w-full items-center gap-3 rounded-xl px-3.5 text-taupe hover:bg-white/60 hover:text-tinta", collapsed && "justify-center px-0")}
              title="Sair"
            >
              <LogOut size={20} strokeWidth={1.8} />
              {!collapsed && "Sair"}
            </button>
          </form>
          <button
            onClick={() => setCollapsed((c) => !c)}
            className={cn("flex min-h-[46px] items-center gap-3 rounded-xl px-3.5 text-taupe hover:bg-white/60 hover:text-tinta", collapsed && "justify-center px-0")}
            aria-label={collapsed ? "Expandir menu" : "Recolher menu"}
          >
            {collapsed ? <ChevronsRight size={20} /> : <><ChevronsLeft size={20} /> Recolher</>}
          </button>
        </div>
      </aside>

      {/* celular */}
      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-nude/60 bg-creme/90 px-4 py-3 backdrop-blur md:hidden">
        <Brand />
        <button onClick={() => setOpen(true)} className="btn-ghost !min-h-0 !p-2" aria-label="Abrir menu">
          <Menu size={24} />
        </button>
      </header>
      {open && (
        <div className="fixed inset-0 z-50 md:hidden">
          <button className="absolute inset-0 bg-tinta/30" aria-label="Fechar menu" onClick={() => setOpen(false)} />
          <div className="relative flex h-full w-72 flex-col justify-between bg-creme p-4 shadow-2xl">
            <div className="flex flex-col gap-8">
              <div className="flex items-center justify-between px-2 pt-2">
                <Brand />
                <button onClick={() => setOpen(false)} className="btn-ghost !min-h-0 !p-2" aria-label="Fechar menu">
                  <X size={22} />
                </button>
              </div>
              <Nav collapsed={false} onNavigate={() => setOpen(false)} />
            </div>
            <form action={signOut}>
              <button className="flex min-h-[46px] w-full items-center gap-3 rounded-xl px-3.5 text-taupe hover:bg-white/60">
                <LogOut size={20} /> Sair
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
