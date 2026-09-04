"use client";

import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  MapPin,
  ShieldCheck,
  Ticket,
} from "lucide-react";
import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";

type ExtraField = { title: string; content: string };
type TicketTier = { name: string; price: number };

type EventItem = {
  slug?: string;
  id?: string;
  title: string;
  date?: string;
  location?: string;
  category?: string;
  price?: number;
  imageUrl?: string;
  description?: string;
  attractions?: string[];
  tickets?: TicketTier[];
  extras?: ExtraField[];
};

const slugify = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

function getEventId(event: EventItem) {
  return event.slug || event.id || slugify(event.title);
}

function getEventUrl(event: EventItem) {
  return `/events/${getEventId(event)}`;
}

function formatShortDate(value?: string) {
  if (!value) return { day: "—", month: "Em breve" };
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return { day: "—", month: value };
  return {
    day: date.toLocaleDateString("pt-BR", { day: "2-digit" }),
    month: date
      .toLocaleDateString("pt-BR", { month: "short" })
      .replace(".", "")
      .toUpperCase(),
  };
}

function getStartingPrice(event: EventItem) {
  const ticketPrices = event.tickets
    ?.map((ticket) => ticket.price)
    .filter((price) => Number.isFinite(price) && price > 0);
  const value = ticketPrices?.length ? Math.min(...ticketPrices) : event.price;
  if (!value) return null;
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(value);
}

function LoadingState() {
  return (
    <main
      className="min-h-screen bg-white"
      aria-busy="true"
      aria-label="Carregando eventos"
    >
      <section className="mx-auto grid max-w-[1440px] gap-8 px-4 py-8 sm:px-6 lg:grid-cols-2 lg:px-8 lg:py-12">
        <div className="h-[420px] animate-pulse rounded-[2rem] bg-[#f3eff5]" />
        <div className="h-[420px] animate-pulse rounded-[2rem] bg-[#f3eff5]" />
      </section>
    </main>
  );
}

export default function TicketStoreNeutral() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const initialQuery = params.get("q") || "";
    if (initialQuery) setQuery(initialQuery);

    function handleHeaderSearch(event: Event) {
      setQuery(String((event as CustomEvent<string>).detail || ""));
    }

    window.addEventListener("neutralTicketSearch", handleHeaderSearch);
    return () =>
      window.removeEventListener("neutralTicketSearch", handleHeaderSearch);
  }, []);

  useEffect(() => {
    async function loadEvents() {
      try {
        const response = await fetch("/api/events", { cache: "no-store" });
        const data: unknown = await response.json();
        const list = Array.isArray(data) ? data : [];

        setEvents(
          list.map((raw: any) => {
            const base = raw && typeof raw === "object" ? raw : {};
            return {
              slug: typeof base.slug === "string" ? base.slug : undefined,
              id: typeof base.id === "string" ? base.id : undefined,
              title: String(base.title ?? "Evento"),
              date: typeof base.date === "string" ? base.date : undefined,
              location:
                typeof base.location === "string" ? base.location : undefined,
              category:
                typeof base.category === "string" ? base.category : undefined,
              price: typeof base.price === "number" ? base.price : undefined,
              imageUrl:
                typeof base.imageUrl === "string" ? base.imageUrl : undefined,
              description:
                typeof base.description === "string"
                  ? base.description
                  : undefined,
              attractions: Array.isArray(base.attractions)
                ? base.attractions.map(String)
                : [],
              tickets: Array.isArray(base.tickets)
                ? base.tickets
                    .filter(
                      (ticket: any) =>
                        ticket && typeof ticket.name === "string"
                    )
                    .map((ticket: any) => ({
                      name: String(ticket.name),
                      price: Number(ticket.price) || 0,
                    }))
                : [],
              extras: Array.isArray(base.extras) ? base.extras : [],
            };
          })
        );
      } catch (error) {
        console.error("Erro ao carregar eventos:", error);
        setEvents([]);
      } finally {
        setLoading(false);
      }
    }

    loadEvents();
  }, []);

  const filtered = useMemo(() => {
    const search = query.trim().toLocaleLowerCase("pt-BR");
    return events.filter((event) => {
      const content = [event.title, event.location, event.category]
        .filter(Boolean)
        .join(" ")
        .toLocaleLowerCase("pt-BR");
      return search ? content.includes(search) : true;
    });
  }, [events, query]);

  if (loading) return <LoadingState />;

  const featured = events[0];
  const featuredDate = formatShortDate(featured?.date);

  return (
    <main className="overflow-hidden bg-white text-[#17111f]">
      {featured && (
        <section className="mx-auto max-w-[1440px] px-4 pb-12 pt-6 sm:px-6 sm:pt-8 lg:px-8 lg:pb-20 lg:pt-10">
          <div className="grid min-h-[560px] overflow-hidden rounded-[2rem] border border-[#e8e3eb] bg-[#fff8f3] lg:grid-cols-[0.92fr_1.08fr]">
            <div className="relative flex flex-col justify-center px-6 py-12 sm:px-10 lg:px-14 lg:py-16 xl:px-20">
              <div className="absolute left-0 top-10 h-16 w-1 rounded-r-full bg-[#f24423]" />
              <p className="flex items-center gap-2 text-[0.75rem] font-black uppercase tracking-[0.16em] text-[#f24423]">
                <span className="h-2 w-2 rounded-full bg-[#f24423]" />
                {featured.category || "Evento em destaque"}
              </p>
              <h1 className="mt-6 max-w-[10ch] text-[clamp(2.7rem,5.6vw,5.7rem)] font-black uppercase leading-[0.9] tracking-[-0.065em] text-[#17111f]">
                Seu próximo momento começa aqui.
              </h1>
              <p className="mt-7 max-w-xl text-[1rem] leading-relaxed text-[#615969] sm:text-[1.0625rem]">
                Encontre experiências marcantes, escolha seu ingresso e leve tudo
                com você até a entrada do evento.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  href={getEventUrl(featured)}
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#f24423] px-6 text-[0.9375rem] font-bold text-white shadow-[0_14px_34px_rgba(242,68,35,0.24)] transition hover:-translate-y-0.5 hover:bg-[#d93617]"
                >
                  Ver evento
                  <ArrowRight className="size-4" />
                </Link>
                <Link
                  href="#eventos"
                  className="inline-flex min-h-12 items-center justify-center rounded-full border border-[#cfc7d4] bg-white px-6 text-[0.9375rem] font-bold text-[#302936] transition hover:border-[#f24423]"
                >
                  Explorar eventos
                </Link>
              </div>
              <div className="mt-10 flex flex-wrap gap-x-6 gap-y-3 text-[0.8125rem] font-semibold text-[#615969]">
                <span className="flex items-center gap-2">
                  <ShieldCheck className="size-[18px] text-[#f24423]" />
                  Compra protegida
                </span>
                <span className="flex items-center gap-2">
                  <Ticket className="size-[18px] text-[#f24423]" />
                  Ingresso digital
                </span>
              </div>
            </div>

            <Link
              href={getEventUrl(featured)}
              aria-label={`Ver ${featured.title}`}
              className="brand-grid group relative min-h-[500px] overflow-hidden bg-[#f24423] lg:min-h-full"
            >
              <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-[#f24423] opacity-90 blur-[1px]" />
              <div className="absolute -bottom-24 -left-20 h-72 w-72 rounded-full bg-[#ff8a6a]" />
              <div className="absolute inset-0 bg-[linear-gradient(135deg,transparent_0%,rgba(0,0,0,0.28)_100%)]" />
              <div className="absolute inset-0 flex items-center justify-center p-8 sm:p-12 lg:p-10 xl:p-14">
                <div className="relative aspect-[3/4] w-full max-w-[460px] overflow-hidden rounded-[1.5rem] bg-black shadow-[0_35px_90px_rgba(0,0,0,0.42)] transition duration-500 group-hover:-rotate-1 group-hover:scale-[1.015]">
                  <img
                    src={featured.imageUrl || "/uploads/capaingresso.jpg"}
                    alt={`Cartaz do evento ${featured.title}`}
                    className="h-full w-full object-cover"
                    onError={(event) => {
                      event.currentTarget.src = "/uploads/capaingresso.jpg";
                    }}
                  />
                </div>
              </div>
              <div className="absolute left-5 top-5 rounded-2xl bg-white px-3 py-2 text-center shadow-lg sm:left-7 sm:top-7">
                <span className="block text-[1.5rem] font-black leading-none text-[#17111f]">
                  {featuredDate.day}
                </span>
                <span className="mt-1 block text-[0.6875rem] font-black tracking-[0.12em] text-[#f24423]">
                  {featuredDate.month}
                </span>
              </div>
            </Link>
          </div>
        </section>
      )}

      <section
        id="eventos"
        className="scroll-mt-28 border-t border-[#eee9f0] bg-white py-14 sm:py-16 lg:py-20"
      >
        <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between gap-6">
            <div>
              <p className="text-[0.75rem] font-black uppercase tracking-[0.16em] text-[#f24423]">
                Agenda INGRESSE
              </p>
              <h2 className="mt-3 text-[clamp(2rem,4.2vw,4rem)] font-black leading-none tracking-[-0.055em] text-[#17111f]">
                Eventos em destaque
              </h2>
            </div>
            <span className="hidden text-[0.8125rem] font-semibold text-[#837b88] sm:block">
              {filtered.length} {filtered.length === 1 ? "evento" : "eventos"}
            </span>
          </div>

          {filtered.length === 0 ? (
            <div className="mt-10 rounded-[2rem] border border-dashed border-[#cfc7d4] bg-[#f9f7fa] px-6 py-14 text-center">
              <p className="text-[1.125rem] font-bold">Nenhum evento encontrado</p>
              <p className="mt-2 text-[0.9375rem] text-[#6f6875]">
                Tente outro nome, cidade ou categoria.
              </p>
            </div>
          ) : (
            <div className="no-scrollbar -mx-4 mt-9 flex snap-x snap-mandatory gap-5 overflow-x-auto px-4 pb-5 sm:-mx-6 sm:px-6 lg:mx-0 lg:grid lg:grid-cols-3 lg:overflow-visible lg:px-0 xl:grid-cols-4">
              {filtered.map((event, index) => {
                const cardDate = formatShortDate(event.date);
                const price = getStartingPrice(event);

                return (
                  <motion.article
                    key={getEventId(event)}
                    initial={{ opacity: 0, y: 18 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: 0.35,
                      delay: Math.min(index * 0.06, 0.24),
                    }}
                    className="w-[78vw] max-w-[330px] shrink-0 snap-start lg:w-auto lg:max-w-none"
                  >
                    <Link href={getEventUrl(event)} className="group block">
                      <div className="relative aspect-[4/5] overflow-hidden rounded-[1.5rem] bg-[#eee9f0]">
                        <img
                          src={event.imageUrl || "/uploads/capaingresso.jpg"}
                          alt={`Cartaz do evento ${event.title}`}
                          className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.035]"
                          onError={(imageEvent) => {
                            imageEvent.currentTarget.src =
                              "/uploads/capaingresso.jpg";
                          }}
                        />
                        <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black/60 to-transparent" />
                        <span className="absolute bottom-4 left-4 rounded-full bg-white/95 px-3 py-1.5 text-[0.6875rem] font-black uppercase tracking-[0.1em] text-[#f24423] backdrop-blur">
                          {event.category || "Evento"}
                        </span>
                      </div>
                      <div className="grid grid-cols-[48px_1fr] gap-4 py-5">
                        <div className="border-r border-[#e4dee7] pr-3 text-center">
                          <span className="block text-[1.45rem] font-black leading-none text-[#f24423]">
                            {cardDate.day}
                          </span>
                          <span className="mt-1 block text-[0.6875rem] font-black tracking-[0.1em] text-[#f24423]">
                            {cardDate.month}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <h3 className="line-clamp-2 text-[1.05rem] font-extrabold leading-tight text-[#17111f] transition group-hover:text-[#f24423]">
                            {event.title}
                          </h3>
                          <p className="mt-2 flex items-start gap-1.5 text-[0.8125rem] leading-snug text-[#6f6875]">
                            <MapPin className="mt-0.5 size-3.5 shrink-0 text-[#f24423]" />
                            <span className="line-clamp-2">
                              {event.location || "Local em breve"}
                            </span>
                          </p>
                          {price && (
                            <p className="mt-3 text-[0.75rem] font-semibold text-[#837b88]">
                              A partir de{" "}
                              <strong className="text-[#302936]">{price}</strong>
                            </p>
                          )}
                        </div>
                      </div>
                    </Link>
                  </motion.article>
                );
              })}
            </div>
          )}
        </div>
      </section>

      <section className="bg-[#17111f] py-6 text-white">
        <div className="mx-auto flex max-w-[1440px] flex-col gap-5 px-4 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
          <p className="max-w-2xl text-[1.25rem] font-black leading-tight tracking-[-0.025em] sm:text-[1.5rem]">
            Compra simples. Ingresso no celular. Entrada sem complicação.
          </p>
          <div className="flex flex-wrap gap-4 text-[0.75rem] font-bold uppercase tracking-[0.1em] text-white/70">
            <span className="flex items-center gap-2">
              <ShieldCheck className="size-4 text-[#ff6338]" /> Pagamento seguro
            </span>
            <span className="flex items-center gap-2">
              <CalendarDays className="size-4 text-[#ff6338]" /> Tudo em um só
              lugar
            </span>
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden bg-[#fff8f3] py-20 sm:py-28">
        <div className="absolute -left-20 top-10 h-52 w-52 rounded-full border-[42px] border-[#f24423]/10" />
        <div className="absolute -right-16 bottom-0 h-64 w-64 rounded-full bg-[#f24423]/[0.07]" />
        <div className="relative mx-auto max-w-[980px] px-4 text-center sm:px-6">
          <p className="text-[0.75rem] font-black uppercase tracking-[0.16em] text-[#f24423]">
            Do clique à entrada
          </p>
          <h2 className="mt-5 text-[clamp(2.5rem,6vw,5.4rem)] font-black uppercase leading-[0.92] tracking-[-0.065em] text-[#17111f]">
            Viva a experiência. A gente cuida do ingresso.
          </h2>
          <p className="mx-auto mt-6 max-w-2xl text-[1rem] leading-relaxed text-[#615969] sm:text-[1.0625rem]">
            Escolha o evento, finalize sua compra e acompanhe seus ingressos pela
            sua conta — de qualquer tela.
          </p>
          <Link
            href={featured ? getEventUrl(featured) : "#eventos"}
            className="mt-8 inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#f24423] px-7 text-[0.9375rem] font-bold text-white transition hover:-translate-y-0.5 hover:bg-[#d93617]"
          >
            Encontrar meu evento
            <ArrowRight className="size-4" />
          </Link>
        </div>
      </section>
    </main>
  );
}
