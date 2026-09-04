"use client";

import Link from "next/link";
import { Check, ChevronDown, Minus, Plus, ShieldCheck, Ticket } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  CART_UPDATED_EVENT,
  CartItem,
  addCartItem,
  getCart,
  openCart,
  removeCartItem,
  updateCartQty,
} from "@/lib/cart";

type TicketTier = { name: string; price: number };
type PassportDetail = { title: string; date: string };
type TicketOption = {
  name: string;
  price: number;
  batch: string;
  date?: string;
  dateLabels?: string[];
  details?: PassportDetail[];
};

type MeResponse = {
  user: {
    id: string;
    email: string;
    name?: string | null;
  } | null;
};

type EventBuyBoxProps = {
  event: {
    id: string;
    title: string;
    date?: string;
    dates?: string[];
    location?: string;
    price?: number;
    imageUrl?: string;
    tickets?: TicketTier[];
  };
};

const RIVIERA_SCHEDULE = [
  { title: "27/12 | Cria Sessions com Orochi", date: "dom, 27/12/26 • 22h00" },
  { title: "28/12 | Luau com MC IG", date: "seg, 28/12/26 • 22h00" },
  { title: "29/12 | Baile do Japa NK", date: "ter, 29/12/26 • 22h00" },
  {
    title: "30/12 | Baile 360 com GP da ZL & DJ Graeff",
    date: "qua, 30/12/26 • 22h00",
  },
  { title: "31/12 | Réveillon Riviera com MC Paiva", date: "qui, 31/12/26 • 22h00" },
  { title: "02/01 | Ressacada Riviera com DJ GBR", date: "sáb, 02/01/27 • 22h00" },
];

const formatBRL = (value: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);

function normalizeText(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function formatDate(value?: string) {
  if (!value) return undefined;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatCompactDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const weekday = date
    .toLocaleDateString("pt-BR", { weekday: "short" })
    .replace(".", "");
  const calendarDate = date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
  });
  const time = date.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
  return `${weekday}, ${calendarDate} · ${time}`;
}

function getRivieraDetails(ticketName: string): PassportDetail[] | undefined {
  const normalized = normalizeText(ticketName);
  if (!normalized.includes("passaporte") && !normalized.includes("day use")) {
    return undefined;
  }

  const suffix = normalized.includes("feminino")
    ? " • Feminino"
    : normalized.includes("masculino")
      ? " • Masculino"
      : "";

  return RIVIERA_SCHEDULE.map((item) => ({
    title: `${item.title}${suffix}`,
    date: item.date,
  }));
}

export default function EventBuyBox({ event }: EventBuyBoxProps) {
  const [me, setMe] = useState<MeResponse["user"]>(null);
  const [checkingUser, setCheckingUser] = useState(true);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [loginPromptOpen, setLoginPromptOpen] = useState(false);

  const options = useMemo<TicketOption[]>(() => {
    const baseOptions = event.tickets?.length
      ? event.tickets.map((ticket) => ({
          name: ticket.name,
          price: ticket.price,
        }))
      : typeof event.price === "number"
        ? [{ name: "Ingresso único", price: event.price }]
        : [];

    const isRiviera = normalizeText(event.title).includes("riviera");
    return baseOptions.map((ticket) => ({
      ...ticket,
      batch: "1º lote",
      date: formatDate(event.date),
      dateLabels: event.dates?.length
        ? event.dates.map(formatCompactDate)
        : event.date
          ? [formatCompactDate(event.date)]
          : [],
      details: isRiviera ? getRivieraDetails(ticket.name) : undefined,
    }));
  }, [event]);

  const eventCartItems = cart.filter((item) => item.id === event.id);
  const total = eventCartItems.reduce(
    (sum, item) => sum + item.unitPrice * item.qty,
    0
  );
  const totalQty = eventCartItems.reduce((sum, item) => sum + item.qty, 0);

  useEffect(() => {
    setCart(getCart());

    async function loadUser() {
      try {
        const response = await fetch("/api/auth/me", {
          cache: "no-store",
          credentials: "include",
        });
        const data: MeResponse = await response.json();
        setMe(data.user || null);
      } catch {
        setMe(null);
      } finally {
        setCheckingUser(false);
      }
    }

    function syncCart(cartEvent: Event) {
      const customEvent = cartEvent as CustomEvent<CartItem[]>;
      setCart(
        Array.isArray(customEvent.detail) ? customEvent.detail : getCart()
      );
    }

    loadUser();
    window.addEventListener(CART_UPDATED_EVENT, syncCart);
    return () => window.removeEventListener(CART_UPDATED_EVENT, syncCart);
  }, []);

  function getQty(ticketName: string) {
    return (
      cart.find(
        (item) =>
          item.id === event.id && item.ticketName === ticketName
      )?.qty || 0
    );
  }

  function handleAdd(option: TicketOption) {
    if (checkingUser) return;
    if (!me) {
      setLoginPromptOpen(true);
      return;
    }

    setCart(
      addCartItem({
        id: event.id,
        title: event.title,
        date: event.date,
        location: event.location,
        ticketName: option.name,
        unitPrice: option.price,
        qty: 1,
      })
    );
  }

  function handleRemove(option: TicketOption) {
    const currentQty = getQty(option.name);
    if (currentQty <= 1) {
      setCart(removeCartItem(event.id, option.name));
      return;
    }
    setCart(updateCartQty(event.id, option.name, currentQty - 1));
  }

  return (
    <>
      <section className="w-full min-w-0">
        <h2 className="sr-only">Escolha seus ingressos</h2>

        <div className="space-y-3">
          {options.length === 0 ? (
            <div className="rounded-[1.5rem] border border-[#e8e3eb] bg-white p-6 text-center">
              <p className="font-bold text-[#302936]">Ingressos em breve</p>
              <p className="mt-1 text-[0.8125rem] text-[#6f6875]">
                Ainda não há um lote disponível para este evento.
              </p>
            </div>
          ) : (
            options.map((option) => {
              const qty = getQty(option.name);
              const isExpanded = expanded === option.name;

              return (
                <article
                  key={option.name}
                  className="overflow-hidden rounded-[1.25rem] border border-[#ded9e1] bg-white shadow-[0_8px_28px_rgba(23,17,31,0.04)]"
                >
                  <div className="p-5">
                    <p className="break-words text-[1rem] font-black uppercase leading-tight tracking-[-0.015em] text-[#17111f]">
                      {option.name}
                    </p>

                    {!!option.dateLabels?.length && (
                      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-[0.72rem] font-semibold text-[#514a57]">
                        {option.dateLabels.map((label) => (
                          <span key={`${option.name}-${label}`}>{label}</span>
                        ))}
                      </div>
                    )}

                    <p className="mt-4 text-[0.75rem] font-semibold text-[#837b88]">
                      {option.batch}
                    </p>

                    <div className="mt-3 flex items-center justify-between gap-4">
                      <p className="text-[1.15rem] font-black tracking-[-0.025em] text-[#17111f]">
                        {formatBRL(option.price)}
                      </p>
                      <div className="flex shrink-0 items-center gap-2">
                        <button
                          type="button"
                          disabled={qty === 0}
                          onClick={() => handleRemove(option)}
                          aria-label={`Remover uma unidade de ${option.name}`}
                          className="grid size-10 place-items-center rounded-xl border border-[#d8d1dc] bg-white text-[#302936] transition hover:border-[#f24423] disabled:cursor-not-allowed disabled:opacity-30"
                        >
                          <Minus className="size-4" />
                        </button>
                        <span
                          className="w-8 text-center text-[1rem] font-black text-[#17111f]"
                          aria-live="polite"
                        >
                          {qty}
                        </span>
                        <button
                          type="button"
                          disabled={checkingUser}
                          onClick={() => handleAdd(option)}
                          aria-label={`Adicionar uma unidade de ${option.name}`}
                          className="grid size-10 place-items-center rounded-xl bg-[#f24423] text-white shadow-[0_8px_20px_rgba(242,68,35,0.22)] transition hover:-translate-y-0.5 hover:bg-[#d93617] disabled:cursor-wait disabled:opacity-50"
                        >
                          <Plus className="size-4" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {!!option.details?.length && (
                    <div className="border-t border-[#eee9f0]">
                      <button
                        type="button"
                        onClick={() =>
                          setExpanded(isExpanded ? null : option.name)
                        }
                        aria-expanded={isExpanded}
                        className="flex min-h-12 w-full items-center justify-between gap-4 px-5 py-3 text-left text-[0.8125rem] font-bold text-[#f24423] transition hover:bg-[#fff7f4]"
                      >
                        Detalhes
                        <ChevronDown
                          className={`size-4 transition ${
                            isExpanded ? "rotate-180" : ""
                          }`}
                        />
                      </button>

                      {isExpanded && (
                        <div className="space-y-2 border-t border-[#eee9f0] bg-[#f9f7fa] p-3">
                          {option.details.map((detail) => (
                            <div
                              key={`${option.name}-${detail.title}`}
                              className="flex gap-3 rounded-2xl bg-white p-3"
                            >
                              <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-[#fff0eb] text-[#f24423]">
                                <Check className="size-3.5" strokeWidth={3} />
                              </span>
                              <div className="min-w-0">
                                <p className="text-[0.75rem] font-bold leading-snug text-[#302936]">
                                  {detail.title}
                                </p>
                                <p className="mt-1 text-[0.6875rem] text-[#837b88]">
                                  {detail.date}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </article>
              );
            })
          )}
        </div>

        <div className="mt-4 rounded-[1.25rem] border border-[#ded9e1] bg-white p-5 shadow-[0_8px_28px_rgba(23,17,31,0.04)] sm:p-6">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-[0.75rem] font-semibold text-[#837b88]">
                {totalQty
                  ? `${totalQty} ${totalQty === 1 ? "ingresso" : "ingressos"}`
                  : "Nenhum ingresso selecionado"}
              </p>
              <p className="mt-1 text-[0.75rem] font-semibold uppercase tracking-[0.1em] text-[#615969]">
                Total
              </p>
            </div>
            <strong className="text-[1.7rem] font-black tracking-[-0.04em] text-[#17111f]">
              {formatBRL(total)}
            </strong>
          </div>

          <Button
            type="button"
            disabled={totalQty === 0}
            onClick={openCart}
            className="mt-5 min-h-14 w-full rounded-full bg-[#f24423] px-5 text-[0.875rem] font-black uppercase tracking-[0.06em] text-white shadow-[0_12px_30px_rgba(242,68,35,0.22)] hover:bg-[#d93617] disabled:bg-[#e4dee7] disabled:text-[#918997]"
          >
            <Ticket className="mr-2 size-5" />
            Continuar compra
          </Button>

          <p className="mt-4 flex items-center justify-center gap-2 text-center text-[0.6875rem] font-semibold text-[#837b88]">
            <ShieldCheck className="size-4 text-[#f24423]" />
            Seus dados são protegidos durante a compra.
          </p>
        </div>
      </section>

      <Dialog open={loginPromptOpen} onOpenChange={setLoginPromptOpen}>
        <DialogContent className="w-[calc(100%-32px)] max-w-md overflow-hidden rounded-[2rem] border border-[#e8e3eb] bg-white p-0 text-[#17111f] shadow-[0_30px_90px_rgba(23,17,31,0.2)]">
          <div className="px-6 pb-5 pt-8 sm:px-8">
            <div className="mx-auto grid size-12 place-items-center rounded-full bg-[#fff0eb] text-[#f24423]">
              <Ticket className="size-5" />
            </div>
            <DialogHeader className="mt-5 space-y-3 text-center sm:text-center">
              <DialogTitle className="text-center text-[1.7rem] font-black tracking-[-0.04em]">
                Entre para continuar
              </DialogTitle>
              <p className="text-center text-[0.9375rem] leading-relaxed text-[#6f6875]">
                Sua conta mantém a compra e os ingressos disponíveis em um só
                lugar.
              </p>
            </DialogHeader>
          </div>

          <div className="border-t border-[#eee9f0] bg-[#fff7f4] p-5 sm:px-8 sm:py-6">
            <Button
              asChild
              className="h-12 w-full rounded-full bg-[#f24423] text-[0.875rem] font-bold text-white hover:bg-[#d93617]"
            >
              <Link href="/login">Entrar ou criar conta</Link>
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
