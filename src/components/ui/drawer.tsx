"use client";

import { X } from "lucide-react";
import { useEffect } from "react";

/** Painel lateral (no celular ocupa a tela toda): o usuário não sai da página em que está. */
export function Drawer({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true" aria-label={title}>
      <button aria-label="Fechar" className="absolute inset-0 bg-tinta/30" onClick={onClose} />
      <div className="relative flex h-full w-full max-w-lg flex-col bg-creme shadow-2xl sm:rounded-l-xl2">
        <header className="flex items-center justify-between border-b border-nude/70 px-5 py-4">
          <h2 className="font-serif text-2xl font-semibold">{title}</h2>
          <button onClick={onClose} className="btn-ghost !min-h-0 !p-2" aria-label="Fechar">
            <X size={20} />
          </button>
        </header>
        <div className="flex-1 overflow-y-auto px-5 py-5">{children}</div>
      </div>
    </div>
  );
}
