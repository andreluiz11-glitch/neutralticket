"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronDown, Minus, Plus, Ticket } from "lucide-react";
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

  return (
    normalized.includes("reveillon riviera") ||
    normalized.includes("riviera")
  );
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

export default function EventBuyBox({
  event,
}: EventBuyBoxProps) {
  const [me, setMe] =
    useState<MeResponse["user"]>(null);

  const [checkingUser, setCheckingUser] =
    useState(true);

  const [cart, setCart] =
    useState<CartItem[]>([]);

  const [expanded, setExpanded] =
    useState<string | null>(null);

  const [loginPromptOpen, setLoginPromptOpen] =
    useState(false);

  const options: TicketOption[] = useMemo(() => {
    if (isRivieraEvent(event.title)) {
      return rivieraOptions;
    }

    if (
      Array.isArray(event.tickets) &&
      event.tickets.length > 0
    ) {
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

  const eventCartItems = cart.filter(
    (item) => item.id === event.id
  );

  const total = eventCartItems.reduce(
    (sum, item) =>
      sum + item.unitPrice * item.qty,
    0
  );

  const totalQty = eventCartItems.reduce(
    (sum, item) => sum + item.qty,
    0
  );

  useEffect(() => {
    setCart(getCart());

    async function loadUser() {
      try {
        const res = await fetch("/api/auth/me", {
          cache: "no-store",
          credentials: "include",
        });

        const data: MeResponse =
          await res.json();

        setMe(data.user || null);
      } catch {
        setMe(null);
      } finally {
        setCheckingUser(false);
      }
    }

    loadUser();

    function syncCart(event: Event) {
      const customEvent =
        event as CustomEvent<CartItem[]>;

      setCart(
        Array.isArray(customEvent.detail)
          ? customEvent.detail
          : getCart()
      );
    }

    window.addEventListener(
      CART_UPDATED_EVENT,
      syncCart
    );

    return () => {
      window.removeEventListener(
        CART_UPDATED_EVENT,
        syncCart
      );
    };
  }, []);

  function getQty(ticketName: string) {
    return (
      cart.find(
        (item) =>
          item.id === event.id &&
          item.ticketName === ticketName
      )?.qty || 0
    );
  }

  function handleAdd(option: TicketOption) {
    if (!checkingUser && !me) {
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
      const updated = removeCartItem(
        event.id,
        option.name
      );

      setCart(updated);
      return;
    }

    const updated = updateCartQty(
      event.id,
      option.name,
      currentQty - 1
    );

    setCart(updated);
  }

  return (
    <>
      <section className="w-full min-w-0 overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm sm:rounded-3xl">
        
        {/* CABEÇALHO */}
        <div className="flex flex-col gap-3 border-b border-zinc-200 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
          <h2 className="text-lg font-black uppercase text-zinc-950 sm:text-xl">
            Ingressos
          </h2>

          <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm font-semibold text-zinc-700">
            <button
              type="button"
              className="transition hover:text-orange-500"
            >
              Compartilhar
            </button>

            <button
              type="button"
              className="transition hover:text-orange-500"
            >
              Preciso de ajuda
            </button>
          </div>
        </div>

        {/* CONTEÚDO */}
        <div className="min-w-0 bg-zinc-50 p-3 sm:p-5 lg:p-6">
          <div className="space-y-5">
            
            {/* CATEGORIA */}
            <div className="min-w-0">
              <div className="mb-4 inline-flex rounded-xl border border-orange-500 bg-orange-50 px-5 py-3">
                <span className="text-sm font-black uppercase tracking-wide text-zinc-950 sm:text-base">
                  Passaportes
                </span>
              </div>

              {/* OPÇÕES */}
              {options.length === 0 ? (
                <div className="rounded-2xl border border-zinc-200 bg-white p-5">
                  <p className="text-sm text-zinc-600">
                    Nenhum ingresso cadastrado
                    para este evento.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {options.map((option) => {
                    const qty = getQty(option.name);

                    const isExpanded =
                      expanded === option.name;

                    return (
                      <div
                        key={option.name}
                        className="min-w-0 overflow-hidden rounded-2xl border border-zinc-200 bg-white"
                      >
                        
                        {/* INGRESSO */}
                        <div className="p-4 sm:p-5">
                          <div className="flex min-w-0 flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                            
                            <div className="min-w-0 flex-1">
                              <h3 className="break-words text-lg font-black uppercase leading-tight text-zinc-950 sm:text-xl">
                                {option.name}
                              </h3>

                              <div className="mt-3 grid min-w-0 gap-1.5 text-xs font-semibold text-zinc-700 sm:text-sm">
                                {option.dates.map(
                                  (date) => (
                                    <span
                                      key={date}
                                      className="break-words"
                                    >
                                      {date}
                                    </span>
                                  )
                                )}
                              </div>

                              <p className="mt-3 break-words text-sm text-zinc-500">
                                {option.batch}
                              </p>

                              <p className="mt-4 text-xl font-black text-zinc-950 sm:text-2xl">
                                {formatBRL(option.price)}
                              </p>
                            </div>

                            {/* QUANTIDADE */}
                            <div className="flex shrink-0 items-center justify-between gap-3 sm:justify-end">
                              <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                disabled={qty === 0}
                                onClick={() =>
                                  handleRemove(option)
                                }
                                className="h-11 w-11 shrink-0 rounded-xl border border-zinc-400 bg-white text-zinc-950"
                              >
                                <Minus className="size-4" />
                              </Button>

                              <span className="w-8 text-center text-xl font-semibold text-zinc-950">
                                {qty}
                              </span>

                              <Button
                                type="button"
                                size="icon"
                                onClick={() =>
                                  handleAdd(option)
                                }
                                className="h-11 w-11 shrink-0 rounded-xl bg-orange-500 text-black hover:bg-orange-400"
                              >
                                <Plus className="size-4" />
                              </Button>
                            </div>
                          </div>
                        </div>

                        {/* DETALHES */}
                        {option.details &&
                          option.details.length > 0 && (
                            <div className="border-t border-zinc-200">
                              <button
                                type="button"
                                onClick={() =>
                                  setExpanded(
                                    isExpanded
                                      ? null
                                      : option.name
                                  )
                                }
                                className="flex min-h-12 w-full items-center justify-between gap-4 px-4 py-3 text-left text-sm font-bold text-zinc-700 transition hover:bg-zinc-50 sm:px-5"
                              >
                                <span>
                                  Ver detalhes
                                </span>

                                <ChevronDown
                                  className={`size-5 shrink-0 text-orange-500 transition ${
                                    isExpanded
                                      ? "rotate-180"
                                      : ""
                                  }`}
                                />
                              </button>

                              {isExpanded && (
                                <div className="grid min-w-0 gap-3 border-t border-zinc-200 bg-zinc-50 p-3 sm:p-4">
                                  {option.details.map(
                                    (detail) => (
                                      <div
                                        key={`${option.name}-${detail.title}`}
                                        className="flex min-w-0 gap-3 rounded-xl border border-zinc-200 bg-white p-3"
                                      >
                                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-orange-500 text-xs font-black text-black">
                                          ✓
                                        </div>

                                        <div className="min-w-0">
                                          <p className="break-words text-xs font-black uppercase leading-relaxed text-zinc-950 sm:text-sm">
                                            {detail.title}
                                          </p>

                                          <p className="mt-1 text-xs font-medium text-zinc-500">
                                            {option.name ===
                                            "DAY USE"
                                              ? "Válido para 1 dia"
                                              : "1 item"}
                                          </p>

                                          <p className="mt-2 break-words text-xs font-semibold text-zinc-700 sm:text-sm">
                                            {detail.date}
                                          </p>
                                        </div>
                                      </div>
                                    )
                                  )}
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

            {/* ÁREA INFERIOR */}
            <div className="min-w-0 border-t border-zinc-200 pt-5">
              <div className="space-y-4">
                
                {/* CUPOM */}
                <button
                  type="button"
                  className="flex min-h-12 w-full items-center justify-center rounded-xl border border-zinc-300 bg-white px-4 py-3 text-center text-sm font-bold text-zinc-950 transition hover:bg-zinc-100"
                >
                  Adicionar código ou cupom
                </button>

                {/* RESUMO */}
                <div className="min-w-0 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm sm:p-5">
                  <p className="text-sm font-semibold text-zinc-500">
                    Resumo da compra
                  </p>

                  <div className="mt-4 flex items-center justify-between gap-4 text-sm">
                    <span className="min-w-0 break-words">
                      Ingressos selecionados
                    </span>

                    <strong className="shrink-0">
                      {totalQty}
                    </strong>
                  </div>

                  <div className="mt-4 flex items-center justify-between gap-4 border-t border-zinc-200 pt-4">
                    <span className="font-bold text-zinc-950">
                      Total
                    </span>

                    <strong className="shrink-0 text-lg text-zinc-950">
                      {formatBRL(total)}
                    </strong>
                  </div>

                  <Button
                    type="button"
                    disabled={totalQty === 0}
                    onClick={openCart}
                    className="mt-5 min-h-12 w-full rounded-xl bg-orange-500 px-4 text-sm font-black uppercase text-black hover:bg-orange-400 disabled:bg-zinc-200 disabled:text-zinc-500"
                  >
                    <Ticket className="mr-2 size-5" />
                    Finalizar compra
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* LOGIN */}
      <Dialog
        open={loginPromptOpen}
        onOpenChange={setLoginPromptOpen}
      >
        <DialogContent className="w-[calc(100%-32px)] max-w-md overflow-hidden rounded-2xl border-2 border-zinc-300 bg-white p-0 text-zinc-950 opacity-100 shadow-2xl sm:rounded-3xl">
          
          <div className="bg-white px-5 pb-5 pt-7 sm:px-7 sm:pb-6 sm:pt-8">
            <DialogHeader className="space-y-3 text-center sm:text-center">
              <DialogTitle className="text-center text-2xl font-black text-zinc-950">
                Entre para continuar
              </DialogTitle>

              <p className="text-center text-sm leading-6 text-zinc-600 sm:text-base">
                Entre com seu e-mail e
                senha ou crie uma conta
                para continuar sua compra.
              </p>
            </DialogHeader>
          </div>

          <div className="grid gap-3 border-t border-zinc-200 bg-white px-5 py-5 sm:grid-cols-2 sm:px-7">
            
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                window.location.href = "/login";
              }}
              className="h-12 w-full rounded-xl border-2 border-zinc-900 bg-white text-base font-bold text-zinc-950 shadow-none hover:bg-zinc-100"
            >
              Entrar
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={() => {
                window.location.href = "/signup";
              }}
              className="h-12 w-full rounded-xl border-2 border-zinc-900 bg-white text-base font-bold text-zinc-950 shadow-none hover:bg-zinc-100"
            >
              Criar conta
            </Button>

          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}