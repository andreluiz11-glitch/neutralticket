"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronDown, Minus, Plus, Ticket, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  CART_UPDATED_EVENT,
  CartItem,
  addCartItem,
  getCart,
  openCart,
  removeCartItem,
  updateCartQty,
} from "@/lib/cart";

type TicketTier = {
  name: string;
  price: number;
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
    location?: string;
    price?: number;
    imageUrl?: string;
    tickets?: TicketTier[];
  };
};

type PassportDetail = {
  title: string;
  date: string;
};

type TicketOption = {
  name: string;
  price: number;
  batch: string;
  dates: string[];
  details?: PassportDetail[];
};

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

function isRivieraEvent(title: string) {
  const normalized = normalizeText(title);
  return normalized.includes("reveillon riviera") || normalized.includes("riviera");
}

const rivieraDates = [
  "dom, 27/12/26 • 22h00",
  "seg, 28/12/26 • 22h00",
  "ter, 29/12/26 • 22h00",
  "qua, 30/12/26 • 22h00",
  "qui, 31/12/26 • 22h00",
  "sáb, 02/01/27 • 22h00",
];

const rivieraMaleDetails: PassportDetail[] = [
  {
    title: "27/12 | CRIA SESSIONS C/ OROCHI • MASCULINO (COMBO)",
    date: "dom, 27/12/26 • 22h00",
  },
  {
    title: "28/12 | LUAU C/ MC IG • MASCULINO (COMBO)",
    date: "seg, 28/12/26 • 22h00",
  },
  {
    title: "29/12 | BAILE DO JAPA NK • MASCULINO (COMBO)",
    date: "ter, 29/12/26 • 22h00",
  },
  {
    title: "30/12 | BAILE 360 C/ GP DA ZL & DJ GRAEFF • MASCULINO (COMBO)",
    date: "qua, 30/12/26 • 22h00",
  },
  {
    title: "31/12 | RÉVEILLON RIVIERA C/ MC PAIVA • MASCULINO (COMBO)",
    date: "qui, 31/12/26 • 22h00",
  },
  {
    title: "02/01 | RESSACADA RIVIERA • MASCULINO (COMBO)",
    date: "sáb, 02/01/27 • 22h00",
  },
];

const rivieraFemaleDetails: PassportDetail[] = [
  {
    title: "27/12 | CRIA SESSIONS C/ OROCHI • FEMININO (COMBO)",
    date: "dom, 27/12/26 • 22h00",
  },
  {
    title: "28/12 | LUAU C/ MC IG • FEMININO (COMBO)",
    date: "seg, 28/12/26 • 22h00",
  },
  {
    title: "29/12 | BAILE DO JAPA NK • FEMININO (COMBO)",
    date: "ter, 29/12/26 • 22h00",
  },
  {
    title: "30/12 | BAILE 360 C/ GP DA ZL & DJ GRAEFF • FEMININO (COMBO)",
    date: "qua, 30/12/26 • 22h00",
  },
  {
    title: "31/12 | RÉVEILLON RIVIERA C/ MC PAIVA • FEMININO (COMBO)",
    date: "qui, 31/12/26 • 22h00",
  },
  {
    title: "02/01 | RESSACADA RIVIERA • FEMININO (COMBO)",
    date: "sáb, 02/01/27 • 22h00",
  },
];

const rivieraDayUseDetails: PassportDetail[] = [
  {
    title: "DAY USE | VÁLIDO PARA 1 DIA DA PROGRAMAÇÃO",
    date: "Escolha qualquer um dos dias disponíveis do evento",
  },
  {
    title: "27/12 | CRIA SESSIONS C/ OROCHI",
    date: "dom, 27/12/26 • 22h00",
  },
  {
    title: "28/12 | LUAU C/ MC IG",
    date: "seg, 28/12/26 • 22h00",
  },
  {
    title: "29/12 | BAILE DO JAPA NK",
    date: "ter, 29/12/26 • 22h00",
  },
  {
    title: "30/12 | BAILE 360 C/ GP DA ZL & DJ GRAEFF",
    date: "qua, 30/12/26 • 22h00",
  },
  {
    title: "31/12 | RÉVEILLON RIVIERA C/ MC PAIVA",
    date: "qui, 31/12/26 • 22h00",
  },
  {
    title: "02/01 | RESSACADA RIVIERA",
    date: "sáb, 02/01/27 • 22h00",
  },
];

const rivieraOptions: TicketOption[] = [
  {
    name: "PASSAPORTE FEMININO",
    price: 1300,
    batch: "Lote Promocional",
    dates: rivieraDates,
    details: rivieraFemaleDetails,
  },
  {
    name: "PASSAPORTE MASCULINO",
    price: 1450,
    batch: "Lote Promocional",
    dates: rivieraDates,
    details: rivieraMaleDetails,
  },
  {
    name: "DAY USE",
    price: 300,
    batch: "Válido para 1 dia da programação",
    dates: rivieraDates,
    details: rivieraDayUseDetails,
  },
];

export default function EventBuyBox({ event }: EventBuyBoxProps) {
  const [me, setMe] = useState<MeResponse["user"]>(null);
  const [checkingUser, setCheckingUser] = useState(true);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [expanded, setExpanded] = useState<string | null>("PASSAPORTE FEMININO");
  const [loginPromptOpen, setLoginPromptOpen] = useState(false);

  const options: TicketOption[] = useMemo(() => {
    if (isRivieraEvent(event.title)) {
      return rivieraOptions;
    }

    if (Array.isArray(event.tickets) && event.tickets.length > 0) {
      return event.tickets.map((ticket) => ({
        name: ticket.name,
        price: ticket.price,
        batch: "Lote disponível",
        dates: event.date ? [event.date] : [],
      }));
    }

    if (typeof event.price === "number") {
      return [
        {
          name: "INGRESSO ÚNICO",
          price: event.price,
          batch: "Lote disponível",
          dates: event.date ? [event.date] : [],
        },
      ];
    }

    return [];
  }, [event]);

  const total = cart
    .filter((item) => item.id === event.id)
    .reduce((sum, item) => sum + item.unitPrice * item.qty, 0);

  const totalQty = cart
    .filter((item) => item.id === event.id)
    .reduce((sum, item) => sum + item.qty, 0);

  useEffect(() => {
    setCart(getCart());

    async function loadUser() {
      try {
        const res = await fetch("/api/auth/me", {
          cache: "no-store",
          credentials: "include",
        });

        const data: MeResponse = await res.json();
        setMe(data.user || null);
      } catch {
        setMe(null);
      } finally {
        setCheckingUser(false);
      }
    }

    loadUser();

    function syncCart(event: Event) {
      const customEvent = event as CustomEvent<CartItem[]>;
      setCart(Array.isArray(customEvent.detail) ? customEvent.detail : getCart());
    }

    window.addEventListener(CART_UPDATED_EVENT, syncCart);

    return () => {
      window.removeEventListener(CART_UPDATED_EVENT, syncCart);
    };
  }, []);

  function getQty(ticketName: string) {
    return (
      cart.find((item) => item.id === event.id && item.ticketName === ticketName)
        ?.qty || 0
    );
  }

  async function checkCurrentUser() {
    try {
      const res = await fetch("/api/auth/me", {
        cache: "no-store",
        credentials: "include",
      });

      const data: MeResponse = await res.json();
      const currentUser = data.user || null;

      setMe(currentUser);

      return currentUser;
    } catch {
      setMe(null);
      return null;
    } finally {
      setCheckingUser(false);
    }
  }

  async function handleAdd(option: TicketOption) {
    const currentUser = me || (await checkCurrentUser());

    if (!currentUser) {
      setLoginPromptOpen(true);
      return;
    }

    const updated = addCartItem({
      id: event.id,
      title: event.title,
      date: event.date,
      location: event.location,
      ticketName: option.name,
      unitPrice: option.price,
      qty: 1,
    });

    setCart(updated);
  }

  function handleRemove(option: TicketOption) {
    const currentQty = getQty(option.name);

    if (currentQty <= 1) {
      const updated = removeCartItem(event.id, option.name);
      setCart(updated);
      return;
    }

    const updated = updateCartQty(event.id, option.name, currentQty - 1);
    setCart(updated);
  }

  return (
    <>
      <section className="overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-zinc-200 px-5 py-5 lg:flex-row lg:items-center lg:justify-between">
          <h2 className="text-xl font-black text-zinc-950">{event.title}</h2>

          <div className="flex flex-wrap items-center gap-4 text-sm font-semibold text-zinc-800">
            <button type="button" className="transition hover:text-orange-500">
              Compartilhar
            </button>

            <button type="button" className="transition hover:text-orange-500">
              Preciso de ajuda
            </button>
          </div>
        </div>

        <div className="grid gap-8 bg-zinc-50 p-5 lg:grid-cols-[1fr_400px] lg:p-7">
          <div>
            <div className="mb-6 inline-flex rounded-2xl border border-orange-500 bg-orange-50 px-8 py-8">
              <span className="text-xl font-bold uppercase text-zinc-950">
                Passaportes
              </span>
            </div>

            {options.length === 0 ? (
              <div className="rounded-3xl border border-zinc-200 bg-white p-6">
                <p className="text-sm text-zinc-600">
                  Nenhum ingresso cadastrado para este evento.
                </p>
              </div>
            ) : (
              <div className="space-y-5">
                {options.map((option) => {
                  const qty = getQty(option.name);
                  const isExpanded = expanded === option.name;

                  return (
                    <div
                      key={option.name}
                      className="overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-sm"
                    >
                      <div className="p-5">
                        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                          <div className="min-w-0 flex-1">
                            <h3 className="text-2xl font-black uppercase text-zinc-950">
                              {option.name}
                            </h3>

                            <div className="mt-4 flex flex-wrap gap-x-7 gap-y-2 text-sm font-semibold text-zinc-800">
                              {option.dates.map((date) => (
                                <span key={date}>{date}</span>
                              ))}
                            </div>

                            <p className="mt-4 text-base text-zinc-400">
                              {option.batch}
                            </p>

                            <p className="mt-6 text-2xl font-black text-zinc-950">
                              {formatBRL(option.price)}
                            </p>
                          </div>

                          <div className="flex items-center gap-4">
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              disabled={qty === 0}
                              onClick={() => handleRemove(option)}
                              className="h-12 w-12 rounded-xl"
                            >
                              <Minus className="size-5" />
                            </Button>

                            <span className="w-8 text-center text-2xl font-medium text-zinc-950">
                              {qty}
                            </span>

                            <Button
                              type="button"
                              size="icon"
                              disabled={checkingUser}
                              onClick={() => handleAdd(option)}
                              className="h-12 w-12 rounded-xl bg-orange-500 text-black hover:bg-orange-400 disabled:bg-zinc-200 disabled:text-zinc-500"
                            >
                              <Plus className="size-5" />
                            </Button>
                          </div>
                        </div>
                      </div>

                      {option.details && option.details.length > 0 && (
                        <div className="border-t border-zinc-200">
                          <button
                            type="button"
                            onClick={() =>
                              setExpanded(isExpanded ? null : option.name)
                            }
                            className="flex w-full items-center justify-between px-5 py-4 text-left text-lg font-medium text-zinc-700 transition hover:bg-zinc-50"
                          >
                            <span>Detalhes</span>

                            <ChevronDown
                              className={`size-5 text-orange-500 transition ${
                                isExpanded ? "rotate-180" : ""
                              }`}
                            />
                          </button>

                          {isExpanded && (
                            <div className="space-y-4 border-t border-zinc-200 bg-white px-5 py-5">
                              {option.details.map((detail) => (
                                <div
                                  key={`${option.name}-${detail.title}`}
                                  className="flex gap-4 rounded-2xl border border-zinc-200 p-4"
                                >
                                  <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-orange-500 text-sm font-black text-black">
                                    ✓
                                  </div>

                                  <div>
                                    <p className="text-sm font-black uppercase text-zinc-950">
                                      {detail.title}
                                    </p>

                                    <p className="mt-1 text-sm font-medium text-zinc-500">
                                      {option.name === "DAY USE"
                                        ? "Válido para 1 dia"
                                        : "1 item"}
                                    </p>

                                    <p className="mt-2 text-sm font-semibold text-zinc-800">
                                      {detail.date}
                                    </p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <aside className="space-y-5">
            <button
              type="button"
              className="flex h-16 w-full items-center justify-center rounded-2xl border border-zinc-300 bg-white px-5 text-base font-bold text-zinc-950 transition hover:bg-zinc-100"
            >
              Adicionar código ou cupom
            </button>

            <div className="overflow-hidden rounded-3xl bg-white shadow-sm">
              <img
                src={event.imageUrl || "/uploads/default.jpg"}
                alt={event.title}
                className="max-h-[430px] w-full object-cover"
              />
            </div>

            <div className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
              <p className="text-sm font-semibold text-zinc-500">
                Resumo da compra
              </p>

              <div className="mt-4 flex items-center justify-between text-sm">
                <span>Ingressos selecionados</span>
                <strong>{totalQty}</strong>
              </div>

              <div className="mt-3 flex items-center justify-between border-t border-zinc-200 pt-4 text-lg">
                <span className="font-bold text-zinc-950">Total</span>
                <strong className="text-zinc-950">{formatBRL(total)}</strong>
              </div>

              <Button
                type="button"
                disabled={totalQty === 0}
                onClick={openCart}
                className="mt-5 h-14 w-full rounded-2xl bg-orange-500 text-base font-black uppercase text-black hover:bg-orange-400 disabled:bg-zinc-200 disabled:text-zinc-500"
              >
                <Ticket className="mr-2 size-5" />
                Finalizar compra
              </Button>
            </div>
          </aside>
        </div>
      </section>

      {loginPromptOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 px-4">
          <div className="relative w-full max-w-md rounded-3xl border border-zinc-200 bg-white p-6 text-zinc-950 shadow-2xl">
            <button
              type="button"
              onClick={() => setLoginPromptOpen(false)}
              aria-label="Fechar aviso"
              className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-100"
            >
              <X className="size-5" />
            </button>

            <div className="pr-8">
              <p className="text-xs font-black uppercase text-orange-500">
                Acesso necessário
              </p>

              <h2 className="mt-2 text-2xl font-black text-zinc-950">
                Você precisa estar logado
              </h2>

              <p className="mt-3 text-sm leading-relaxed text-zinc-600">
                Para adicionar ingressos ao carrinho e finalizar sua compra,
                entre com sua conta ou crie um cadastro.
              </p>
            </div>

            <div className="mt-6 space-y-3">
              <Button
                type="button"
                onClick={() => {
                  window.location.href = "/login";
                }}
                className="h-12 w-full rounded-2xl bg-orange-500 text-base font-black uppercase text-black hover:bg-orange-400"
              >
                Entrar
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  window.location.href = "/signup";
                }}
                className="h-12 w-full rounded-2xl border border-zinc-950 bg-white text-base font-black uppercase text-zinc-950 hover:bg-zinc-100"
              >
                Criar conta
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}