"use client";

import { useActionState } from "react";
import { Field } from "@/components/ui/field";
import { signIn } from "./actions";

export default function LoginPage() {
  const [state, action, pending] = useActionState(signIn, undefined);

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <div className="card w-full max-w-md p-8 sm:p-10">
        <p className="font-serif text-4xl font-semibold">
          Eli<span className="text-rose">.</span>Dash
        </p>
        <p className="mt-2 text-taupe">Entre para ver as encomendas da Eliclothing.</p>

        <form action={action} className="mt-8 flex flex-col gap-5">
          <Field label="E-mail">
            <input name="email" type="email" autoComplete="email" className="input" required />
          </Field>
          <Field label="Senha">
            <input name="password" type="password" autoComplete="current-password" className="input" required />
          </Field>
          {state?.error && (
            <p role="alert" className="rounded-xl bg-roseclaro px-4 py-3 text-sm text-[#8c4a4a]">
              {state.error}
            </p>
          )}
          <button className="btn-primary w-full" disabled={pending}>
            {pending ? "Entrando…" : "Entrar"}
          </button>
        </form>
      </div>
    </main>
  );
}
