"use client";

import Link from "next/link";

type LoginRequiredModalProps = {
  open: boolean;
  onClose: () => void;
};

export default function LoginRequiredModal({
  open,
  onClose,
}: LoginRequiredModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/45 px-4">
      <div className="relative w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-2xl leading-none text-zinc-500 hover:text-zinc-800"
          aria-label="Fechar"
        >
          ×
        </button>

        <div className="pr-8">
          <h2 className="text-2xl font-bold text-zinc-950">
            Você precisa estar logado
          </h2>

          <p className="mt-3 text-sm leading-relaxed text-zinc-600">
            Para adicionar ingressos ao carrinho e finalizar sua compra, entre
            com sua conta ou crie um cadastro.
          </p>
        </div>

        <div className="mt-6 flex flex-col gap-3">
          <Link
            href="/login"
            className="inline-flex h-12 items-center justify-center rounded-xl bg-zinc-950 px-4 text-sm font-semibold text-white transition hover:bg-zinc-800"
          >
            Entrar
          </Link>

          <Link
            href="/signup"
            className="inline-flex h-12 items-center justify-center rounded-xl border border-zinc-950 bg-white px-4 text-sm font-semibold text-zinc-950 transition hover:bg-zinc-100"
          >
            Criar conta
          </Link>
        </div>
      </div>
    </div>
  );
}