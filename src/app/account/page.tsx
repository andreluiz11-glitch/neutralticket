"use client";

import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  CircleUserRound,
  Mail,
  ReceiptText,
  Ticket,
} from "lucide-react";
import { useEffect, useState } from "react";

type Me = { id: string; email: string; name?: string | null } | null;

type OrderItem = {
  id: string;
  eventSlug: string;
  eventTitle?: string | null;
  ticketName: string;
  unitPrice: number;
  qty: number;
};

type OrderTicket = {
  id: string;
  code: string;
  ticketName: string;
  status: string;
};

type Order = {
  id: string;
  status: string;
  total: number;
  createdAt: string;
  items: OrderItem[];
  tickets: OrderTicket[];
};

function formatBRL(cents: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(cents / 100);
}

function formatDate(value: string) {
  return new Date(value).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function statusLabel(status: string) {
  const normalized = status.toLowerCase();
  if (normalized === "pending") return "Aguardando pagamento";
  if (normalized === "payment_reported") return "Pagamento informado";
  if (normalized === "paid") return "Pagamento confirmado";
  if (normalized === "ticket_sent") return "Ingresso liberado";
  if (normalized === "canceled") return "Cancelado";
  return status;
}

function statusClass(status: string) {
  const normalized = status.toLowerCase();
  if (normalized === "paid" || normalized === "ticket_sent") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }
  if (normalized === "canceled") {
    return "border-red-200 bg-red-50 text-red-700";
  }
  if (normalized === "payment_reported") {
    return "border-[#ffd1c4] bg-[#fff3ef] text-[#bd2d10]";
  }
  return "border-[#ddd6e1] bg-[#f7f5f8] text-[#615969]";
}

export default function AccountPage() {
  const [me, setMe] = useState<Me>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAccount() {
      try {
        const meResponse = await fetch("/api/auth/me", {
          cache: "no-store",
          credentials: "include",
        });
        const meData = await meResponse.json();
        setMe(meData.user || null);

        if (meData.user) {
          const ordersResponse = await fetch("/api/orders/my", {
            cache: "no-store",
            credentials: "include",
          });
          const ordersData = await ordersResponse.json();
          setOrders(Array.isArray(ordersData.orders) ? ordersData.orders : []);
        }
      } catch (error) {
        console.error("Falha ao carregar conta:", error);
      } finally {
        setLoading(false);
      }
    }

    loadAccount();
  }, []);

  if (loading) {
    return (
      <main className="min-h-[calc(100dvh-74px)] bg-[#f7f5f8] px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-[1120px] space-y-5" aria-busy="true">
          <div className="h-40 animate-pulse rounded-[2rem] bg-[#ede8f0]" />
          <div className="h-72 animate-pulse rounded-[2rem] bg-[#ede8f0]" />
        </div>
      </main>
    );
  }

  if (!me) {
    return (
      <main className="flex min-h-[calc(100dvh-74px)] items-center bg-[#f7f5f8] px-4 py-12 sm:px-6">
        <section className="mx-auto w-full max-w-xl rounded-[2rem] border border-[#e8e3eb] bg-white p-7 text-center shadow-[0_24px_70px_rgba(23,17,31,0.08)] sm:p-10">
          <span className="mx-auto grid size-14 place-items-center rounded-full bg-[#fff2ee] text-[#f24423]">
            <CircleUserRound className="size-6" />
          </span>
          <h1 className="mt-6 text-[2.3rem] font-black tracking-[-0.055em]">
            Sua conta está a um passo
          </h1>
          <p className="mx-auto mt-4 max-w-md text-[0.9375rem] leading-relaxed text-[#6f6875]">
            Entre para acompanhar pedidos e abrir seus ingressos digitais.
          </p>
          <div className="mt-7 grid gap-3 sm:grid-cols-2">
            <Link
              href="/login"
              className="flex h-12 items-center justify-center rounded-full bg-[#f24423] text-[0.875rem] font-black text-white hover:bg-[#d93617]"
            >
              Entrar
            </Link>
            <Link
              href="/login"
              className="flex h-12 items-center justify-center rounded-full border border-[#f24423] text-[0.875rem] font-black text-[#f24423] hover:bg-[#fff2ee]"
            >
              Criar conta
            </Link>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-[calc(100dvh-74px)] bg-[#f7f5f8] px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
      <div className="mx-auto max-w-[1120px]">
        <header className="overflow-hidden rounded-[2rem] bg-[#f24423] px-6 py-8 text-white sm:px-9 sm:py-10">
          <p className="text-[0.6875rem] font-black uppercase tracking-[0.16em] text-[#ff9b80]">
            Área do cliente
          </p>
          <div className="mt-3 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="text-[clamp(2.5rem,6vw,4.7rem)] font-black leading-none tracking-[-0.065em]">
                Olá, {me.name?.split(" ")[0] || "cliente"}.
              </h1>
              <p className="mt-3 flex items-center gap-2 text-[0.875rem] text-white/65">
                <Mail className="size-4" /> {me.email}
              </p>
            </div>
            <Link
              href="/#eventos"
              className="inline-flex min-h-12 items-center justify-center gap-2 self-start rounded-full bg-white px-5 text-[0.875rem] font-black text-[#f24423] hover:bg-[#fff2ee] md:self-auto"
            >
              Explorar eventos <ArrowRight className="size-4" />
            </Link>
          </div>
        </header>

        <section className="mt-8">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-[0.6875rem] font-black uppercase tracking-[0.16em] text-[#f24423]">
                Histórico
              </p>
              <h2 className="mt-2 text-[2rem] font-black tracking-[-0.045em]">
                Minhas compras
              </h2>
            </div>
            <span className="text-[0.8125rem] font-semibold text-[#837b88]">
              {orders.length} {orders.length === 1 ? "pedido" : "pedidos"}
            </span>
          </div>

          {orders.length === 0 ? (
            <div className="mt-6 rounded-[2rem] border border-dashed border-[#cfc7d4] bg-white p-8 text-center sm:p-12">
              <ReceiptText className="mx-auto size-8 text-[#f24423]" />
              <p className="mt-4 text-[1.125rem] font-black">Nenhum pedido ainda</p>
              <p className="mt-2 text-[0.875rem] text-[#6f6875]">
                Quando você comprar um ingresso, ele aparecerá aqui.
              </p>
            </div>
          ) : (
            <div className="mt-6 space-y-5">
              {orders.map((order) => (
                <article
                  key={order.id}
                  className="overflow-hidden rounded-[2rem] border border-[#e8e3eb] bg-white"
                >
                  <div className="flex flex-col gap-4 border-b border-[#eee9f0] px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-7">
                    <div className="min-w-0">
                      <p className="text-[0.6875rem] font-black uppercase tracking-[0.12em] text-[#837b88]">
                        Pedido
                      </p>
                      <p className="mt-1 break-all text-[0.8125rem] font-bold text-[#302936]">
                        {order.id}
                      </p>
                    </div>
                    <span
                      className={`w-fit rounded-full border px-3 py-1.5 text-[0.6875rem] font-black uppercase tracking-[0.08em] ${statusClass(order.status)}`}
                    >
                      {statusLabel(order.status)}
                    </span>
                  </div>

                  <div className="grid gap-6 p-5 sm:p-7 lg:grid-cols-[1fr_220px]">
                    <div className="space-y-4">
                      {order.items.map((item) => (
                        <div key={item.id} className="flex gap-3">
                          <span className="mt-0.5 grid size-10 shrink-0 place-items-center rounded-full bg-[#fff2ee] text-[#f24423]">
                            <Ticket className="size-[18px]" />
                          </span>
                          <div className="min-w-0">
                            <p className="font-black text-[#17111f]">
                              {item.eventTitle || item.eventSlug}
                            </p>
                            <p className="mt-1 text-[0.8125rem] text-[#6f6875]">
                              {item.ticketName} · {item.qty}x {formatBRL(item.unitPrice)}
                            </p>
                          </div>
                        </div>
                      ))}

                      {!!order.tickets?.length && (
                        <div className="flex flex-wrap gap-2 border-t border-[#eee9f0] pt-4">
                          {order.tickets.map((ticket) => (
                            <Link
                              key={ticket.id}
                              href={`/tickets/${ticket.code}`}
                              className="inline-flex min-h-10 items-center gap-2 rounded-full bg-[#f24423] px-4 text-[0.75rem] font-black text-white hover:bg-[#d93617]"
                            >
                              <Ticket className="size-4" /> Abrir {ticket.ticketName}
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>

                    <aside className="rounded-2xl bg-[#f9f7fa] p-4">
                      <p className="text-[0.6875rem] font-black uppercase tracking-[0.12em] text-[#837b88]">
                        Total
                      </p>
                      <p className="mt-1 text-[1.7rem] font-black tracking-[-0.04em] text-[#17111f]">
                        {formatBRL(order.total)}
                      </p>
                      <p className="mt-4 flex items-center gap-2 text-[0.75rem] text-[#6f6875]">
                        <CalendarDays className="size-4 text-[#f24423]" />
                        {formatDate(order.createdAt)}
                      </p>
                    </aside>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
