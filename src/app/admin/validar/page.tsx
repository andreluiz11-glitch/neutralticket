"use client";

import { useState } from "react";
import { CheckCircle2, Search, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

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

function cleanCode(value: string) {
  const trimmed = value.trim();

  if (trimmed.includes("/tickets/")) {
    const parts = trimmed.split("/tickets/");
    return parts[1]?.split("?")[0]?.split("#")[0] || trimmed;
  }

  return trimmed;
}

function getStatusLabel(status: string) {
  if (status === "VALID") return "Ingresso válido";
  if (status === "USED") return "Ingresso já utilizado";
  if (status === "CANCELED") return "Ingresso cancelado";
  return status;
}

function getStatusClass(status: string) {
  if (status === "VALID") {
    return "border-green-200 bg-green-50 text-green-700";
  }

  if (status === "USED") {
    return "border-orange-200 bg-orange-50 text-orange-700";
  }

  if (status === "CANCELED") {
    return "border-red-200 bg-red-50 text-red-700";
  }

  return "border-zinc-200 bg-zinc-50 text-zinc-700";
}

export default function AdminValidateTicketPage() {
  const [code, setCode] = useState("");
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(false);
  const [usingTicket, setUsingTicket] = useState(false);
  const [error, setError] = useState("");

  async function searchTicket(event?: React.FormEvent<HTMLFormElement>) {
    event?.preventDefault();

    const ticketCode = cleanCode(code);

    if (!ticketCode) {
      setError("Digite ou cole o código do ingresso.");
      setTicket(null);
      return;
    }

    try {
      setLoading(true);
      setError("");
      setTicket(null);

      const res = await fetch(`/api/tickets/${encodeURIComponent(ticketCode)}`, {
        cache: "no-store",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Ingresso não encontrado.");
      }

      setTicket(data.ticket);
    } catch (error: any) {
      setError(error?.message || "Não foi possível buscar o ingresso.");
    } finally {
      setLoading(false);
    }
  }

  async function markAsUsed() {
    if (!ticket) return;

    const ok = confirm(
      "Confirmar uso deste ingresso? Depois disso ele ficará marcado como utilizado."
    );

    if (!ok) return;

    try {
      setUsingTicket(true);
      setError("");

      const res = await fetch(
        `/api/admin/tickets/${encodeURIComponent(ticket.code)}/use`,
        {
          method: "POST",
          credentials: "include",
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Não foi possível validar o ingresso.");
      }

      setTicket(data.ticket);
      alert("Ingresso validado com sucesso.");
    } catch (error: any) {
      alert(error?.message || "Não foi possível validar o ingresso.");
    } finally {
      setUsingTicket(false);
    }
  }

  return (
    <main className="min-h-screen bg-zinc-950 px-4 py-10 text-white sm:px-8">
      <section className="mx-auto max-w-4xl">
        <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
          <p className="text-sm font-bold uppercase text-orange-400">
            Validação de ingresso
          </p>

          <h1 className="mt-2 text-3xl font-black">
            Conferir QR Code
          </h1>

          <p className="mt-2 text-sm text-zinc-400">
            Cole o código do ingresso ou o link completo para conferir se ele é
            válido.
          </p>
        </div>

        <form
          onSubmit={searchTicket}
          className="mt-6 rounded-3xl border border-zinc-800 bg-white p-5 text-zinc-950 sm:p-6"
        >
          <label className="text-sm font-black uppercase text-zinc-500">
            Código ou link do ingresso
          </label>

          <div className="mt-3 flex flex-col gap-3 sm:flex-row">
            <input
              value={code}
              onChange={(event) => setCode(event.target.value)}
              placeholder="Cole aqui o código ou link /tickets/..."
              className="h-14 flex-1 rounded-2xl border border-zinc-300 bg-white px-4 text-sm font-semibold text-zinc-950 outline-none focus:border-orange-500"
            />

            <Button
              type="submit"
              disabled={loading}
              className="h-14 rounded-2xl bg-orange-500 px-6 text-sm font-black uppercase text-black hover:bg-orange-400"
            >
              <Search className="mr-2 size-5" />
              {loading ? "Buscando..." : "Buscar"}
            </Button>
          </div>

          {error && (
            <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-600">
              {error}
            </div>
          )}
        </form>

        {ticket && (
          <section className="mt-6 overflow-hidden rounded-3xl border border-zinc-800 bg-white text-zinc-950">
            <div className="border-b border-zinc-200 bg-zinc-50 p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-xs font-bold uppercase text-zinc-500">
                    Resultado da validação
                  </p>

                  <h2 className="mt-1 text-2xl font-black">
                    {ticket.eventTitle}
                  </h2>
                </div>

                <div
                  className={`w-fit rounded-full border px-4 py-2 text-xs font-black uppercase ${getStatusClass(
                    ticket.status
                  )}`}
                >
                  {getStatusLabel(ticket.status)}
                </div>
              </div>
            </div>

            <div className="grid gap-5 p-5 sm:p-6 md:grid-cols-2">
              <div className="rounded-2xl border border-zinc-200 p-4">
                <p className="text-xs font-bold uppercase text-zinc-500">
                  Cliente
                </p>

                <p className="mt-2 text-lg font-black text-zinc-950">
                  {ticket.customerName || "Nome não informado"}
                </p>

                <p className="mt-1 break-all text-sm text-zinc-600">
                  {ticket.customerEmail}
                </p>
              </div>

              <div className="rounded-2xl border border-zinc-200 p-4">
                <p className="text-xs font-bold uppercase text-zinc-500">
                  Ingresso
                </p>

                <p className="mt-2 text-lg font-black text-zinc-950">
                  {ticket.ticketName}
                </p>

                <p className="mt-1 break-all text-sm text-zinc-600">
                  {ticket.code}
                </p>
              </div>

              <div className="rounded-2xl border border-zinc-200 p-4">
                <p className="text-xs font-bold uppercase text-zinc-500">
                  Pedido
                </p>

                <p className="mt-2 break-all text-sm font-black text-zinc-950">
                  {ticket.orderId}
                </p>
              </div>

              <div className="rounded-2xl border border-zinc-200 p-4">
                <p className="text-xs font-bold uppercase text-zinc-500">
                  Uso
                </p>

                <p className="mt-2 text-sm font-black text-zinc-950">
                  {ticket.usedAt
                    ? new Date(ticket.usedAt).toLocaleString("pt-BR")
                    : "Ainda não utilizado"}
                </p>
              </div>
            </div>

            <div className="border-t border-zinc-200 bg-zinc-50 p-5 sm:p-6">
              {ticket.status === "VALID" ? (
                <Button
                  type="button"
                  onClick={markAsUsed}
                  disabled={usingTicket}
                  className="h-14 w-full rounded-2xl bg-orange-500 text-base font-black uppercase text-black hover:bg-orange-400"
                >
                  <CheckCircle2 className="mr-2 size-5" />
                  {usingTicket ? "Validando..." : "Marcar como utilizado"}
                </Button>
              ) : (
                <div className="flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">
                  <XCircle className="size-6 shrink-0" />

                  <p className="text-sm font-black">
                    Este ingresso não pode ser utilizado novamente.
                  </p>
                </div>
              )}
            </div>
          </section>
        )}
      </section>
    </main>
  );
}