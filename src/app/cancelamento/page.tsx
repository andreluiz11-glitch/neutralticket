"use client";

import Link from "next/link";
import { AlertCircle, CheckCircle2, RotateCcw, ShieldCheck } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type Order = {
  id: string;
  status: string;
  total: number;
  createdAt: string;
  cancellationRequestedAt?: string | null;
  items: Array<{ eventTitle?: string | null; eventSlug: string; ticketName: string }>;
};

function money(cents: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(cents / 100);
}

export default function CancellationPage() {
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [reason, setReason] = useState("");
  const [sending, setSending] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const selectedId = useMemo(() => typeof window === "undefined" ? "" : new URLSearchParams(window.location.search).get("orderId") || "", []);

  async function load() {
    const meResponse = await fetch("/api/auth/me", { credentials: "include", cache: "no-store" });
    const meData = await meResponse.json().catch(() => ({}));
    setAuthenticated(Boolean(meData.user));
    if (!meData.user) return;
    const response = await fetch("/api/orders/my", { credentials: "include", cache: "no-store" });
    const data = await response.json().catch(() => ({}));
    setOrders(Array.isArray(data.orders) ? data.orders : []);
  }

  useEffect(() => { void load(); }, []);

  async function requestCancellation(orderId: string) {
    setSending(orderId);
    setMessage("");
    try {
      const response = await fetch(`/api/orders/${encodeURIComponent(orderId)}/cancel`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Não foi possível registrar a solicitação.");
      setMessage(data.result === "canceled" ? "Pedido pendente cancelado com sucesso." : "Solicitação registrada. Nossa equipe analisará o reembolso e entrará em contato pelo e-mail da conta.");
      setReason("");
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Não foi possível registrar a solicitação.");
    } finally {
      setSending(null);
    }
  }

  return (
    <main className="min-h-screen bg-[#f7f5f8] px-4 py-10 text-[#17111f] sm:px-6">
      <div className="mx-auto max-w-5xl">
        <header className="rounded-[2rem] bg-[#f24423] p-7 text-white sm:p-10">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-white/70">Atendimento ao consumidor</p>
          <h1 className="mt-3 text-4xl font-black tracking-[-0.05em] sm:text-6xl">Cancelamento e reembolso</h1>
          <p className="mt-4 max-w-3xl text-sm leading-relaxed text-white/85 sm:text-base">Canal claro para cancelar pedidos pendentes ou solicitar análise de reembolso de compras já pagas.</p>
        </header>

        <section className="mt-6 grid gap-4 md:grid-cols-3">
          {[
            [ShieldCheck, "Revenda independente", "A INGRESSE não é o canal oficial do evento. Os preços podem ser superiores aos do canal oficial."],
            [RotateCcw, "Direito de arrependimento", "Compras online podem ser canceladas dentro do prazo legal aplicável, contado da contratação."],
            [AlertCircle, "Evento alterado", "Em cancelamento, adiamento ou alteração relevante, a solicitação será analisada conforme a legislação."],
          ].map(([Icon, title, text]) => (
            <article key={String(title)} className="rounded-3xl border border-[#e8e3eb] bg-white p-5">
              <Icon className="size-6 text-[#f24423]" />
              <h2 className="mt-4 font-black">{String(title)}</h2>
              <p className="mt-2 text-sm leading-relaxed text-[#6f6875]">{String(text)}</p>
            </article>
          ))}
        </section>

        <section className="mt-6 rounded-[2rem] border border-[#e8e3eb] bg-white p-6 sm:p-8">
          <h2 className="text-2xl font-black tracking-[-0.035em]">Solicite pelo seu pedido</h2>
          {authenticated === false && <p className="mt-4 text-sm text-[#6f6875]">Entre na mesma conta usada na compra para acessar seus pedidos.</p>}
          {authenticated === false && <Link href="/login?next=/cancelamento" className="mt-5 inline-flex rounded-full bg-[#f24423] px-6 py-3 text-sm font-black text-white">Entrar ou criar conta</Link>}
          {authenticated && orders.length === 0 && <p className="mt-4 text-sm text-[#6f6875]">Nenhum pedido foi encontrado nesta conta.</p>}
          {authenticated && orders.length > 0 && (
            <div className="mt-5 space-y-4">
              <textarea value={reason} onChange={(event) => setReason(event.target.value)} maxLength={1000} placeholder="Conte brevemente o motivo (opcional)" className="min-h-24 w-full rounded-2xl border border-[#d9d1dd] p-4 text-sm outline-none focus:border-[#f24423]" />
              {orders.map((order) => (
                <article key={order.id} className={`rounded-2xl border p-4 ${selectedId === order.id ? "border-[#f24423] bg-[#fff5f2]" : "border-[#e8e3eb]"}`}>
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-black">{order.items[0]?.eventTitle || order.items[0]?.eventSlug || "Pedido"}</p>
                      <p className="mt-1 break-all text-xs text-[#6f6875]">{order.id} · {money(order.total)}</p>
                    </div>
                    {order.cancellationRequestedAt || order.status.toLowerCase() === "canceled" ? (
                      <span className="inline-flex items-center gap-2 text-sm font-black text-emerald-700"><CheckCircle2 className="size-4" /> Solicitação registrada</span>
                    ) : (
                      <button onClick={() => requestCancellation(order.id)} disabled={sending === order.id} className="rounded-full bg-[#f24423] px-5 py-3 text-sm font-black text-white disabled:opacity-50">{sending === order.id ? "Enviando..." : "Solicitar cancelamento"}</button>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
          {message && <p className="mt-5 rounded-2xl bg-[#fff2ee] p-4 text-sm font-bold text-[#8a2d17]">{message}</p>}
        </section>

        <p className="mt-6 text-center text-xs leading-relaxed text-[#6f6875]">Pedidos pendentes são cancelados imediatamente. Pagamentos confirmados passam por validação e, quando aprovado, o reembolso é devolvido pelo meio aplicável. Não envie dados bancários ou documentos pelo campo de motivo.</p>
      </div>
    </main>
  );
}
