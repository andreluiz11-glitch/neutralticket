"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut, ShieldCheck, TicketCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AdminHeader() {
  const router = useRouter();

  async function handleLogout() {
    try {
      await fetch("/api/admin/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch {}

    router.push("/admin/login");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-50 border-b border-zinc-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/admin" className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-orange-500 text-black shadow-sm">
            <ShieldCheck className="size-6" />
          </div>

          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-orange-500">
              Admin
            </p>

            <p className="text-lg font-black text-zinc-950">
              Clube do Ingresso
            </p>
          </div>
        </Link>

        <nav className="hidden items-center gap-2 lg:flex">
          <Link
            href="/admin"
            className="rounded-xl px-4 py-2 text-sm font-bold text-zinc-700 transition hover:bg-zinc-100 hover:text-zinc-950"
          >
            Painel principal
          </Link>

          <Link
            href="/admin"
            className="rounded-xl px-4 py-2 text-sm font-bold text-zinc-700 transition hover:bg-zinc-100 hover:text-zinc-950"
          >
            Pedidos Pix
          </Link>

          <Link
            href="/admin/validar"
            className="rounded-xl px-4 py-2 text-sm font-bold text-zinc-700 transition hover:bg-zinc-100 hover:text-zinc-950"
          >
            Validar ingressos
          </Link>

          <Link
            href="/admin/events"
            className="rounded-xl px-4 py-2 text-sm font-bold text-zinc-700 transition hover:bg-zinc-100 hover:text-zinc-950"
          >
            Eventos
          </Link>

          <Link
            href="/"
            className="rounded-xl px-4 py-2 text-sm font-bold text-zinc-700 transition hover:bg-zinc-100 hover:text-zinc-950"
          >
            Ver site
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href="/admin/validar"
            className="flex h-11 items-center justify-center rounded-xl bg-zinc-950 px-4 text-sm font-black text-white transition hover:bg-zinc-800 lg:hidden"
          >
            <TicketCheck className="mr-2 size-4" />
            Validar
          </Link>

          <Button
            type="button"
            onClick={handleLogout}
            className="h-11 rounded-xl border border-zinc-300 bg-white px-4 text-sm font-black text-zinc-950 hover:bg-zinc-100"
          >
            <LogOut className="mr-2 size-4" />
            Sair
          </Button>
        </div>
      </div>

      <div className="border-t border-zinc-200 bg-white px-4 py-3 lg:hidden">
        <div className="mx-auto flex max-w-7xl gap-2 overflow-x-auto">
          <Link
            href="/admin"
            className="whitespace-nowrap rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-bold text-zinc-700"
          >
            Painel
          </Link>

          <Link
            href="/admin/validar"
            className="whitespace-nowrap rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-bold text-zinc-700"
          >
            Validar ingressos
          </Link>

          <Link
            href="/admin/events"
            className="whitespace-nowrap rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-bold text-zinc-700"
          >
            Eventos
          </Link>

          <Link
            href="/"
            className="whitespace-nowrap rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-bold text-zinc-700"
          >
            Ver site
          </Link>
        </div>
      </div>
    </header>
  );
}