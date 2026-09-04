"use client";

import { ArrowRight, LoaderCircle, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import AuthShell from "@/components/AuthShell";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  async function handleLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Não foi possível entrar.");
      }

      router.replace("/");
      router.refresh();
    } catch (loginError) {
      setError(
        loginError instanceof Error
          ? loginError.message
          : "Não foi possível entrar."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      eyebrow="Seu acesso"
      title="Entre ou crie sua conta"
      description="Informe e-mail e senha. Se este for seu primeiro acesso, sua conta será criada automaticamente."
    >
      <form onSubmit={handleLogin} className="space-y-5">
        <div>
          <label
            htmlFor="login-email"
            className="text-[0.8125rem] font-bold text-[#302936]"
          >
            E-mail
          </label>
          <input
            id="login-email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="voce@exemplo.com"
            className="mt-2 h-14 w-full rounded-2xl border border-[#d8d1dc] bg-white px-4 text-[1rem] text-[#17111f] outline-none transition placeholder:text-[#a49ca8] focus:border-[#f24423]"
          />
        </div>

        <div>
          <label
            htmlFor="login-password"
            className="text-[0.8125rem] font-bold text-[#302936]"
          >
            Senha
          </label>
          <input
            id="login-password"
            name="password"
            type="password"
            autoComplete="current-password"
            minLength={6}
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Sua senha"
            className="mt-2 h-14 w-full rounded-2xl border border-[#d8d1dc] bg-white px-4 text-[1rem] text-[#17111f] outline-none transition placeholder:text-[#a49ca8] focus:border-[#f24423]"
          />
        </div>

        {error && (
          <p
            role="alert"
            className="rounded-2xl border border-[#ffd1c4] bg-[#fff3ef] px-4 py-3 text-[0.8125rem] font-semibold text-[#bd2d10]"
          >
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="flex h-14 w-full items-center justify-center gap-2 rounded-full bg-[#f24423] px-6 text-[0.9375rem] font-black text-white shadow-[0_12px_30px_rgba(242,68,35,0.24)] transition hover:-translate-y-0.5 hover:bg-[#d93617] disabled:cursor-wait disabled:opacity-60"
        >
          {loading ? (
            <LoaderCircle className="size-5 animate-spin" />
          ) : (
            <ArrowRight className="size-5" />
          )}
          {loading ? "Acessando..." : "Entrar ou criar conta"}
        </button>

        <p className="flex items-center justify-center gap-2 text-center text-[0.8125rem] text-[#6f6875]">
          <Sparkles className="size-4 shrink-0 text-[#f24423]" />
          Primeiro acesso? Basta usar um e-mail e uma senha com 6 caracteres.
        </p>
      </form>
    </AuthShell>
  );
}
