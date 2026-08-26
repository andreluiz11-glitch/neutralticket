"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export default function SignupPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const router = useRouter();

  async function handleSignup(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!name.trim()) {
      alert("Digite seu nome.");
      return;
    }

    if (!email.trim()) {
      alert("Digite seu e-mail.");
      return;
    }

    if (!password.trim()) {
      alert("Digite sua senha.");
      return;
    }

    try {
      setLoading(true);

      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          name,
          email,
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Erro ao cadastrar.");
      }

      alert("Cadastro realizado com sucesso!");
      router.push("/");
      router.refresh();
    } catch (error: any) {
      alert(error?.message || "Erro ao cadastrar.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-white px-4 py-12">
      <section className="mx-auto flex min-h-[calc(100vh-180px)] w-full max-w-md flex-col justify-center">
        <h1 className="mb-8 text-center text-4xl font-black text-zinc-950">
          Criar conta
        </h1>

        <form onSubmit={handleSignup} className="space-y-4">
          <div>
            <Label className="text-lg font-semibold text-zinc-950">Nome</Label>
            <Input
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="mt-2 h-14 rounded-xl border border-zinc-950 bg-white px-4 text-lg text-zinc-950"
            />
          </div>

          <div>
            <Label className="text-lg font-semibold text-zinc-950">Email</Label>
            <Input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="mt-2 h-14 rounded-xl border border-zinc-950 bg-white px-4 text-lg text-zinc-950"
            />
          </div>

          <div>
            <Label className="text-lg font-semibold text-zinc-950">Senha</Label>
            <Input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="mt-2 h-14 rounded-xl border border-zinc-950 bg-white px-4 text-lg text-zinc-950"
            />
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="mt-8 h-14 w-full rounded-xl border border-zinc-950 bg-white text-lg font-bold text-zinc-950 transition hover:bg-zinc-100 disabled:cursor-not-allowed disabled:border-zinc-300 disabled:bg-white disabled:text-zinc-400"
          >
            {loading ? "Cadastrando..." : "Cadastrar"}
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/login")}
            className="h-14 w-full rounded-xl border border-zinc-950 bg-white text-lg font-bold text-zinc-950 transition hover:bg-zinc-100"
          >
            Já tenho conta
          </Button>
        </form>
      </section>
    </main>
  );
}