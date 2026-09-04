"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Copy, RefreshCw, TicketIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

type SessionResponse = {
  authorized?: boolean;
  ok?: boolean;
  isAdmin?: boolean;
};

type OrderItem = {
  id: string;
  title: string;
  date?: string;
  location?: string;
  ticketName: string;
  unitPrice: number;
  qty: number;
};

type Order = {
  id: string;
  status: string;
  customer: {
    name?: string | null;
    email: string;
  };
  items: OrderItem[];
  amount: number;
  paymentMethod: "MANUAL_PIX";
  pixTxid: string;
  createdAt: string;
  updatedAt: string;
  paidAt?: string;
  emailMessageId?: string | null;
  emailDeliveryStatus?: string | null;
  emailSentAt?: string | null;
  emailDeliveredAt?: string | null;
  emailLastError?: string | null;
};

type Ticket = {
  id: string;
  code: string;
  orderId: string;
  customerName?: string | null;
  customerEmail: string;
  eventSlug: string;
  eventTitle: string;
  ticketName: string;
  status: "VALID" | "USED" | "CANCELED";
  createdAt: string;
  usedAt?: string | null;
};

const formatBRL = (value: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);

const formatDate = (iso?: string) =>
  iso
    ? new Date(iso).toLocaleString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "Data não informada";

function getStatusLabel(status: string) {
  if (status === "PENDING_PAYMENT") return "Aguardando pagamento";
  if (status === "PAYMENT_REPORTED") return "Cliente informou pagamento";
  if (status === "PAID") return "Pagamento confirmado";
  if (status === "TICKET_SENT") return "Envio solicitado";
  if (status === "CANCELED") return "Cancelado";
  return status;
}

function getStatusClass(status: string) {
  if (status === "PAYMENT_REPORTED") {
    return "border-orange-200 bg-orange-50 text-orange-700";
  }

  if (status === "PAID" || status === "TICKET_SENT") {
    return "border-green-200 bg-green-50 text-green-700";
  }

  if (status === "CANCELED") {
    return "border-red-200 bg-red-50 text-red-700";
  }

  return "border-zinc-200 bg-zinc-50 text-zinc-700";
}

function getTicketStatusLabel(status: string) {
  if (status === "VALID") return "Válido";
  if (status === "USED") return "Utilizado";
  if (status === "CANCELED") return "Cancelado";
  return status;
}

function getEmailStatus(status?: string | null) {
  if (status === "delivered" || status === "opened" || status === "clicked") {
    return { label: "Entregue", className: "text-green-700" };
  }
  if (status === "sent") {
    return { label: "Enviado pelo provedor", className: "text-green-700" };
  }
  if (status === "accepted") {
    return { label: "Aceito pelo provedor", className: "text-orange-700" };
  }
  if (
    status === "failed" ||
    status === "bounced" ||
    status === "suppressed" ||
    status === "complained"
  ) {
    return { label: "Falha na entrega", className: "text-red-700" };
  }
  if (status === "delayed") {
    return { label: "Entrega atrasada", className: "text-orange-700" };
  }
  return { label: "Ainda não enviado", className: "text-zinc-600" };
}

function getTicketUrl(code: string) {
  if (typeof window === "undefined") {
    return `/tickets/${code}`;
  }

  return `${window.location.origin}/tickets/${code}`;
}

export default function AdminPage() {
  const [pin, setPin] = useState("");
  const [authorized, setAuthorized] = useState(false);
  const [checking, setChecking] = useState(true);
  const [loading, setLoading] = useState(false);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState("");
  const [ticketsLoading, setTicketsLoading] = useState("");
  const [error, setError] = useState("");
  const [orders, setOrders] = useState<Order[]>([]);
  const [ticketsByOrder, setTicketsByOrder] = useState<Record<string, Ticket[]>>(
    {}
  );

  useEffect(() => {
    async function checkSession() {
      try {
        const res = await fetch("/api/admin/session", {
          cache: "no-store",
          credentials: "include",
        });

        const data: SessionResponse = await res.json();

        const isAuthorized = Boolean(data.authorized || data.ok || data.isAdmin);

        setAuthorized(isAuthorized);

        if (isAuthorized) {
          await loadOrders();
        }
      } catch {
        setAuthorized(false);
      } finally {
        setChecking(false);
      }
    }

    checkSession();
  }, []);

  async function loadOrders() {
    try {
      setOrdersLoading(true);

      const res = await fetch("/api/admin/orders", {
        cache: "no-store",
        credentials: "include",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Erro ao carregar pedidos.");
      }

      setOrders(Array.isArray(data.orders) ? data.orders : []);
    } catch (error: any) {
      alert(error?.message || "Não foi possível carregar os pedidos.");
    } finally {
      setOrdersLoading(false);
    }
  }

  async function loadTickets(orderId: string) {
    try {
      setTicketsLoading(orderId);

      const res = await fetch(`/api/admin/orders/${orderId}/tickets`, {
        cache: "no-store",
        credentials: "include",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Não foi possível carregar ingressos.");
      }

      setTicketsByOrder((current) => ({
        ...current,
        [orderId]: Array.isArray(data.tickets) ? data.tickets : [],
      }));
    } catch (error: any) {
      alert(error?.message || "Não foi possível carregar ingressos.");
    } finally {
      setTicketsLoading("");
    }
  }

  async function copyTicketLink(code: string) {
    const url = getTicketUrl(code);

    try {
      await navigator.clipboard.writeText(url);
      alert("Link do ingresso copiado.");
    } catch {
      alert(url);
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!pin.trim()) {
      setError("Digite o PIN do admin.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const res = await fetch("/api/admin/verify-pin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ pin }),
      });

      const data: SessionResponse & { error?: string } = await res.json();

      if (!res.ok || !Boolean(data.authorized || data.ok || data.isAdmin)) {
        throw new Error(data.error || "PIN inválido.");
      }

      setAuthorized(true);
      setPin("");
      await loadOrders();
    } catch (error: any) {
      setError(error?.message || "Não foi possível entrar no painel.");
    } finally {
      setLoading(false);
    }
  }

  async function confirmOrder(order: Order) {
    const isResend =
      order.status === "PAID" || order.status === "TICKET_SENT";
    const ok = confirm(
      isResend
        ? "Deseja reenviar todos os ingressos deste pedido para o e-mail do cliente?"
        : "Confirma que você recebeu esse pagamento no Pix e quer gerar e enviar os ingressos?"
    );

    if (!ok) return;

    try {
      setActionLoading(order.id);

      const res = await fetch(`/api/admin/orders/${order.id}/confirm`, {
        method: "POST",
        credentials: "include",
      });

      const data = await res.json();

      if (Array.isArray(data.tickets)) {
        setTicketsByOrder((current) => ({
          ...current,
          [order.id]: data.tickets,
        }));
      }

      if (!res.ok || !data.emailSent) {
        throw new Error(data?.error || "Erro ao confirmar pedido.");
      }

      setTicketsByOrder((current) => ({
        ...current,
        [order.id]: Array.isArray(data.tickets) ? data.tickets : [],
      }));

      await loadOrders();

      alert(
        isResend
          ? "Reenvio aceito pelo provedor de e-mail."
          : "Pagamento confirmado, ingressos gerados e envio aceito pelo provedor."
      );
    } catch (error: any) {
      alert(error?.message || "Não foi possível confirmar o pedido.");
    } finally {
      setActionLoading("");
    }
  }

  async function cancelOrder(orderId: string) {
    const ok = confirm("Tem certeza que deseja cancelar esse pedido?");

    if (!ok) return;

    try {
      setActionLoading(orderId);

      const res = await fetch(`/api/admin/orders/${orderId}/cancel`, {
        method: "POST",
        credentials: "include",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Erro ao cancelar pedido.");
      }

      await loadOrders();
    } catch (error: any) {
      alert(error?.message || "Não foi possível cancelar o pedido.");
    } finally {
      setActionLoading("");
    }
  }

  if (checking) {
    return (
      <main className="min-h-screen bg-zinc-950 px-4 py-16 text-white">
        <div className="mx-auto max-w-5xl">
          <p className="text-sm font-bold text-zinc-400">
            Verificando acesso...
          </p>
        </div>
      </main>
    );
  }

  if (!authorized) {
    return (
      <main className="min-h-screen bg-zinc-950 px-4 py-16 text-white">
        <section className="mx-auto max-w-md rounded-3xl border border-zinc-800 bg-white p-6 text-zinc-950 shadow-2xl">
          <h1 className="text-2xl font-black">Acesso administrativo</h1>

          <p className="mt-2 text-sm text-zinc-600">
            Digite o PIN para acessar o painel da INGRESSE.
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label className="text-sm font-bold text-zinc-800">
                PIN do admin
              </label>

              <input
                type="password"
                value={pin}
                onChange={(event) => setPin(event.target.value)}
                placeholder="Digite o PIN"
                className="mt-2 h-12 w-full rounded-xl border border-zinc-300 bg-white px-4 text-sm font-semibold text-zinc-950 outline-none focus:border-orange-500"
              />
            </div>

            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-600">
                {error}
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="h-12 w-full rounded-xl bg-orange-500 text-base font-black text-black hover:bg-orange-400"
            >
              {loading ? "Entrando..." : "Entrar no painel"}
            </Button>
          </form>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-zinc-950 px-4 py-10 text-white sm:px-8">
      <section className="mx-auto max-w-7xl">
        <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6 shadow-2xl">
          <p className="text-sm font-bold uppercase text-orange-400">
            Painel administrativo
          </p>

          <h1 className="mt-2 text-3xl font-black">INGRESSE</h1>

          <p className="mt-2 max-w-2xl text-sm text-zinc-400">
            Aqui você confere os pedidos Pix, confirma pagamentos e copia os
            links dos ingressos gerados.
          </p>
        </div>

        <div className="mt-6 grid gap-5 md:grid-cols-3">
          <a
            href="#pedidos"
            className="rounded-3xl border border-zinc-800 bg-white p-6 text-zinc-950 transition hover:-translate-y-1 hover:shadow-2xl"
          >
            <p className="text-sm font-bold text-zinc-500">Pix manual</p>
            <h2 className="mt-2 text-xl font-black">Pedidos</h2>
            <p className="mt-2 text-sm text-zinc-600">
              Ver clientes, ingressos e confirmar pagamentos.
            </p>
          </a>

          <Link
            href="/admin/validar"
            className="rounded-3xl border border-zinc-800 bg-white p-6 text-zinc-950 transition hover:-translate-y-1 hover:shadow-2xl"
          >
            <p className="text-sm font-bold text-zinc-500">Validação</p>
            <h2 className="mt-2 text-xl font-black">Validar ingresso</h2>
            <p className="mt-2 text-sm text-zinc-600">
              Conferir QR Code e marcar ingresso como utilizado.
            </p>
          </Link>

          <Link
            href="/"
            className="rounded-3xl border border-zinc-800 bg-white p-6 text-zinc-950 transition hover:-translate-y-1 hover:shadow-2xl"
          >
            <p className="text-sm font-bold text-zinc-500">Site</p>
            <h2 className="mt-2 text-xl font-black">Ver página inicial</h2>
            <p className="mt-2 text-sm text-zinc-600">
              Abra o site como cliente.
            </p>
          </Link>
        </div>

        <section
          id="pedidos"
          className="mt-8 rounded-3xl border border-zinc-800 bg-white p-4 text-zinc-950 sm:p-6"
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-2xl font-black">Pedidos Pix</h2>

              <p className="mt-1 text-sm text-zinc-600">
                Depois que o cliente informar o pagamento, confira no banco e
                confirme aqui para gerar o ingresso.
              </p>
            </div>

            <Button
              type="button"
              onClick={loadOrders}
              disabled={ordersLoading}
              className="h-11 rounded-xl bg-zinc-950 px-5 text-sm font-black text-white hover:bg-zinc-800"
            >
              <RefreshCw className="mr-2 size-4" />
              {ordersLoading ? "Atualizando..." : "Atualizar"}
            </Button>
          </div>

          {orders.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-zinc-200 bg-zinc-50 p-5">
              <p className="text-sm font-bold text-zinc-950">
                Nenhum pedido encontrado ainda.
              </p>

              <p className="mt-1 text-sm text-zinc-600">
                Faça uma compra teste pelo celular, gere o Pix e clique em “Já
                efetuei o pagamento”.
              </p>
            </div>
          ) : (
            <div className="mt-6 space-y-5">
              {orders.map((order) => {
                const orderTickets = ticketsByOrder[order.id] || [];
                const canShowTickets =
                  order.status === "PAID" || order.status === "TICKET_SENT";
                const emailStatus = getEmailStatus(order.emailDeliveryStatus);

                return (
                  <article
                    key={order.id}
                    className="overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-sm"
                  >
                    <div className="border-b border-zinc-200 bg-zinc-50 p-4 sm:p-5">
                      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                        <div>
                          <p className="text-xs font-bold uppercase text-zinc-500">
                            Pedido
                          </p>

                          <p className="mt-1 break-all text-sm font-black text-zinc-950">
                            {order.id}
                          </p>

                          <p className="mt-2 text-sm text-zinc-600">
                            Criado em {formatDate(order.createdAt)}
                          </p>
                        </div>

                        <div
                          className={`inline-flex w-fit rounded-full border px-3 py-1 text-xs font-black uppercase ${getStatusClass(
                            order.status
                          )}`}
                        >
                          {getStatusLabel(order.status)}
                        </div>
                      </div>
                    </div>

                    <div className="grid gap-5 p-4 sm:p-5 lg:grid-cols-[1fr_300px]">
                      <div className="space-y-5">
                        <div className="grid gap-4 md:grid-cols-3">
                          <div className="rounded-2xl border border-zinc-200 p-4">
                            <p className="text-xs font-bold uppercase text-zinc-500">
                              Cliente
                            </p>

                            <p className="mt-2 text-sm font-black text-zinc-950">
                              {order.customer.name || "Nome não informado"}
                            </p>

                            <p className="mt-1 break-all text-sm text-zinc-600">
                              {order.customer.email}
                            </p>
                          </div>

                          <div className="rounded-2xl border border-zinc-200 p-4">
                            <p className="text-xs font-bold uppercase text-zinc-500">
                              Pagamento
                            </p>

                            <p className="mt-2 text-sm font-black text-zinc-950">
                              Pix manual
                            </p>

                            <p className="mt-1 break-all text-sm text-zinc-600">
                              TXID: {order.pixTxid}
                            </p>
                          </div>

                          <div className="rounded-2xl border border-zinc-200 p-4">
                            <p className="text-xs font-bold uppercase text-zinc-500">
                              Entrega por e-mail
                            </p>

                            <p
                              className={`mt-2 text-sm font-black ${emailStatus.className}`}
                            >
                              {emailStatus.label}
                            </p>

                            {order.emailDeliveredAt && (
                              <p className="mt-1 text-xs text-zinc-600">
                                Entregue em {formatDate(order.emailDeliveredAt)}
                              </p>
                            )}

                            {order.emailLastError && (
                              <p className="mt-2 break-words text-xs leading-5 text-red-700">
                                {order.emailLastError}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="rounded-2xl border border-zinc-200 p-4">
                          <p className="text-xs font-bold uppercase text-zinc-500">
                            Ingressos comprados
                          </p>

                          <div className="mt-3 space-y-3">
                            {order.items.map((item, index) => (
                              <div
                                key={`${order.id}-${item.ticketName}-${index}`}
                                className="rounded-xl bg-zinc-50 p-3"
                              >
                                <p className="text-sm font-black text-zinc-950">
                                  {item.title}
                                </p>

                                <p className="mt-1 text-sm font-semibold text-zinc-700">
                                  {item.ticketName}
                                </p>

                                <p className="mt-1 text-sm text-zinc-600">
                                  Quantidade: {item.qty}
                                </p>

                                <p className="mt-1 text-sm text-zinc-600">
                                  Valor unitário: {formatBRL(item.unitPrice)}
                                </p>

                                {item.location && (
                                  <p className="mt-1 text-sm text-zinc-600">
                                    Local: {item.location}
                                  </p>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>

                        {canShowTickets && (
                          <div className="rounded-2xl border border-green-200 bg-green-50 p-4">
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                              <div>
                                <p className="text-xs font-bold uppercase text-green-700">
                                  Ingressos gerados
                                </p>

                                <p className="mt-1 text-sm text-green-800">
                                  Copie o link e envie para o cliente.
                                </p>
                              </div>

                              <Button
                                type="button"
                                onClick={() => loadTickets(order.id)}
                                disabled={ticketsLoading === order.id}
                                className="h-11 rounded-xl bg-green-600 px-4 text-sm font-black text-white hover:bg-green-500"
                              >
                                <TicketIcon className="mr-2 size-4" />
                                {ticketsLoading === order.id
                                  ? "Carregando..."
                                  : "Ver ingressos"}
                              </Button>
                            </div>

                            {orderTickets.length > 0 && (
                              <div className="mt-4 space-y-3">
                                {orderTickets.map((ticket, index) => (
                                  <div
                                    key={ticket.id}
                                    className="rounded-2xl border border-green-200 bg-white p-4"
                                  >
                                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                                      <div>
                                        <p className="text-xs font-black uppercase text-zinc-500">
                                          Ingresso {index + 1}
                                        </p>

                                        <p className="mt-1 text-sm font-black text-zinc-950">
                                          {ticket.ticketName}
                                        </p>

                                        <p className="mt-1 break-all text-xs text-zinc-600">
                                          {getTicketUrl(ticket.code)}
                                        </p>

                                        <p className="mt-2 text-xs font-bold text-green-700">
                                          Status:{" "}
                                          {getTicketStatusLabel(ticket.status)}
                                        </p>
                                      </div>

                                      <div className="flex flex-col gap-2 sm:flex-row">
                                        <Link
                                          href={`/tickets/${ticket.code}`}
                                          target="_blank"
                                          className="flex h-10 items-center justify-center rounded-xl border border-zinc-900 bg-white px-4 text-xs font-black uppercase text-zinc-950 hover:bg-zinc-100"
                                        >
                                          Abrir
                                        </Link>

                                        <Button
                                          type="button"
                                          onClick={() =>
                                            copyTicketLink(ticket.code)
                                          }
                                          className="h-10 rounded-xl bg-orange-500 px-4 text-xs font-black uppercase text-black hover:bg-orange-400"
                                        >
                                          <Copy className="mr-2 size-4" />
                                          Copiar
                                        </Button>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      <aside className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
                        <p className="text-xs font-bold uppercase text-zinc-500">
                          Total do pedido
                        </p>

                        <p className="mt-2 text-3xl font-black text-zinc-950">
                          {formatBRL(order.amount)}
                        </p>

                        <div className="mt-5 space-y-3">
                          <Button
                            type="button"
                            disabled={
                              actionLoading === order.id ||
                              order.status === "CANCELED"
                            }
                            onClick={() => confirmOrder(order)}
                            className="h-12 w-full rounded-xl bg-orange-500 text-sm font-black uppercase text-black hover:bg-orange-400 disabled:bg-zinc-200 disabled:text-zinc-500"
                          >
                            {order.status === "PAID" ||
                            order.status === "TICKET_SENT"
                              ? "Reenviar ingressos"
                              : "Confirmar pagamento"}
                          </Button>

                          <Button
                            type="button"
                            disabled={
                              actionLoading === order.id ||
                              order.status === "PAID" ||
                              order.status === "TICKET_SENT" ||
                              order.status === "CANCELED"
                            }
                            onClick={() => cancelOrder(order.id)}
                            className="h-12 w-full rounded-xl border border-red-200 bg-white text-sm font-black uppercase text-red-600 hover:bg-red-50 disabled:bg-zinc-100 disabled:text-zinc-400"
                          >
                            Cancelar pedido
                          </Button>
                        </div>

                        <p className="mt-4 text-xs leading-relaxed text-zinc-500">
                          Confirme somente depois de conferir no seu banco se o
                          Pix realmente caiu.
                        </p>
                      </aside>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </section>
    </main>
  );
}
