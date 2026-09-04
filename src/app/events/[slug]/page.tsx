import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, CalendarDays, MapPin, Sparkles } from "lucide-react";
import EventShareButton from "@/components/EventShareButton";
import MetaViewContent from "@/components/MetaViewContent";
import { getEventBySlug } from "@/lib/events";

export const dynamic = "force-dynamic";

type EventPageProps = { params: Promise<{ slug: string }> };

function parseDate(value?: string) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatFullDate(value?: string) {
  const date = parseDate(value);
  if (!date) return value || "Data em breve";
  return date.toLocaleString("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatHeroDates(values: string[]) {
  if (!values.length) return "Data em breve";

  const parsedDates = values.map(parseDate);
  if (parsedDates.some((date) => !date)) return values.join(" • ");

  const groups = new Map<string, { month: string; year: number; days: number[] }>();
  for (const parsed of parsedDates) {
    const date = parsed as Date;
    const key = `${date.getFullYear()}-${date.getMonth()}`;
    const current = groups.get(key) || {
      month: date.toLocaleDateString("pt-BR", { month: "long" }),
      year: date.getFullYear(),
      days: [],
    };
    current.days.push(date.getDate());
    groups.set(key, current);
  }

  return Array.from(groups.values())
    .map(({ days, month, year }) => {
      const dayList = days.length > 1
        ? `${days.slice(0, -1).join(", ")} e ${days.at(-1)}`
        : String(days[0]);
      return `${dayList} de ${month} de ${year}`;
    })
    .join(" • ");
}

function getDateParts(value: string) {
  const date = parseDate(value);
  if (!date) return { weekday: "Data", day: "—", month: "Em breve", time: "" };
  return {
    weekday: date.toLocaleDateString("pt-BR", { weekday: "short" }).replace(".", ""),
    day: date.toLocaleDateString("pt-BR", { day: "2-digit" }),
    month: date.toLocaleDateString("pt-BR", { month: "short" }).replace(".", ""),
    time: date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
  };
}

function getStartingPrice(tickets?: Array<{ name: string; price: number }>, fallback?: number) {
  const prices = tickets?.map((ticket) => ticket.price).filter((price) => Number.isFinite(price) && price > 0);
  const value = prices?.length ? Math.min(...prices) : fallback;
  if (!value) return null;
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(value);
}

export async function generateMetadata({ params }: EventPageProps): Promise<Metadata> {
  const { slug } = await params;
  const event = await getEventBySlug(slug);
  if (!event) return { title: "Evento não encontrado | INGRESSE" };
  return {
    title: `${event.title} | INGRESSE`,
    description: event.description?.replace(/\s+/g, " ").slice(0, 155) || `Garanta seu ingresso para ${event.title}.`,
  };
}

export default async function EventPage({ params }: EventPageProps) {
  const { slug } = await params;
  if (!slug) return notFound();
  const event = await getEventBySlug(slug);
  if (!event) return notFound();

  const eventDates = event.dates?.length ? event.dates : event.date ? [event.date] : [];
  const startingPrice = getStartingPrice(event.tickets, event.price);
  const ticketsUrl = `/events/${encodeURIComponent(slug)}/ingressos`;

  return (
    <main className="min-h-screen overflow-x-hidden bg-white pb-28 text-[#17111f] lg:pb-0">
      <MetaViewContent eventName={event.title} eventSlug={slug} />

      <section className="relative isolate overflow-hidden bg-[#17111f] text-white">
        <img src={event.imageUrl || "/uploads/capaingresso.jpg"} alt="" aria-hidden="true" className="absolute inset-0 -z-20 h-full w-full scale-110 object-cover opacity-40 blur-2xl" />
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(15,11,18,.94)_0%,rgba(23,17,31,.78)_48%,rgba(23,17,31,.52)_100%)]" />

        <div className="mx-auto grid min-h-[610px] w-full max-w-[1280px] items-center gap-10 px-4 py-10 sm:px-6 lg:grid-cols-[minmax(0,1fr)_380px] lg:px-8 lg:py-14">
          <div className="min-w-0 py-4 lg:py-12">
            <Link href="/#eventos" className="mb-10 inline-flex min-h-10 items-center gap-2 rounded-full text-[0.8125rem] font-bold text-white/70 transition hover:text-white">
              <ArrowLeft className="size-4" /> Voltar aos eventos
            </Link>
            <p className="text-[0.75rem] font-black uppercase tracking-[0.18em] text-[#ff8a6a]">{event.category || "Evento"}</p>
            <h1 className="mt-4 max-w-[13ch] break-words text-[clamp(2.75rem,7vw,5.9rem)] font-black uppercase leading-[0.88] tracking-[-0.065em]">{event.title}</h1>

            <div className="mt-8 max-w-3xl space-y-4 text-[0.9375rem] font-semibold text-white/85 sm:text-[1rem]">
              <p className="flex items-start gap-3">
                <CalendarDays className="mt-0.5 size-5 shrink-0 text-[#ff7a58]" />
                <span className="min-w-0 break-words">{eventDates.length > 1 ? formatHeroDates(eventDates) : formatFullDate(event.date)}</span>
              </p>
              <p className="flex items-start gap-3">
                <MapPin className="mt-0.5 size-5 shrink-0 text-[#ff7a58]" />
                <span className="min-w-0 break-words">{event.location || "Local em breve"}</span>
              </p>
            </div>

            <div className="mt-9 flex min-w-0 flex-col items-stretch gap-3 sm:flex-row sm:flex-wrap sm:items-center">
              <Link href={ticketsUrl} className="inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-[#f24423] px-5 text-[0.8125rem] font-black uppercase tracking-[0.045em] text-white shadow-[0_16px_36px_rgba(242,68,35,0.3)] transition hover:-translate-y-0.5 hover:bg-[#ff5a38] sm:w-auto sm:min-w-[230px] sm:px-7 sm:text-[0.875rem] sm:tracking-[0.06em]">
                Comprar ingresso <ArrowRight className="size-5" />
              </Link>
              <EventShareButton title={event.title} />
            </div>
          </div>

          <div className="mx-auto w-full max-w-[350px] lg:mx-0 lg:justify-self-end">
            <div className="relative aspect-[3/4] overflow-hidden rounded-[1.6rem] border border-white/15 bg-black/20 shadow-[0_32px_90px_rgba(0,0,0,.38)]">
              <img src={event.imageUrl || "/uploads/capaingresso.jpg"} alt={`Cartaz do evento ${event.title}`} className="absolute inset-0 h-full w-full object-cover" />
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-[1040px] px-4 py-14 sm:px-6 sm:py-20 lg:px-8 lg:py-24">
        {!!eventDates.length && (
          <div>
            <p className="text-[0.75rem] font-black uppercase tracking-[0.18em] text-[#f24423]">Programação</p>
            <h2 className="mt-2 text-[clamp(1.9rem,4vw,3rem)] font-black uppercase tracking-[-0.045em]">Datas disponíveis</h2>
            <div className="-mx-4 mt-7 flex snap-x gap-3 overflow-x-auto px-4 pb-3 sm:mx-0 sm:px-0">
              {eventDates.map((value) => {
                const parts = getDateParts(value);
                return (
                  <article key={value} className="flex min-h-[132px] min-w-[92px] snap-start flex-col items-center justify-center rounded-2xl border border-[#ff9a82] bg-white px-4 text-center shadow-[0_8px_25px_rgba(23,17,31,.04)]">
                    <p className="text-[0.75rem] font-black capitalize text-[#302936]">{parts.weekday}</p>
                    <p className="my-1 text-[2rem] font-black leading-none text-[#f24423]">{parts.day}</p>
                    <p className="text-[0.75rem] font-bold capitalize text-[#302936]">{parts.month}</p>
                    <p className="mt-1 text-[0.6875rem] font-bold text-[#615969]">{parts.time}</p>
                  </article>
                );
              })}
            </div>
          </div>
        )}

        <div className="mt-16 border-t border-[#ece7ee] pt-12 sm:mt-20 sm:pt-16">
          <p className="text-[0.75rem] font-black uppercase tracking-[0.18em] text-[#f24423]">Sobre</p>
          <h2 className="mt-2 text-[clamp(1.9rem,4vw,3rem)] font-black tracking-[-0.045em]">Tudo o que você precisa saber</h2>
          <p className="mt-7 max-w-4xl whitespace-pre-line text-[1rem] leading-8 text-[#514a57]">{event.description || "Confira as opções disponíveis e escolha o ingresso ideal para viver essa experiência."}</p>
        </div>

        {!!event.attractions?.length && (
          <article className="mt-12 rounded-[1.75rem] bg-[#fff3ef] p-6 sm:p-8">
            <div className="flex items-center gap-3">
              <span className="grid size-11 place-items-center rounded-full bg-white text-[#f24423]"><Sparkles className="size-5" /></span>
              <div>
                <p className="text-[0.6875rem] font-black uppercase tracking-[0.16em] text-[#837b88]">Programação</p>
                <h2 className="text-[1.5rem] font-black tracking-[-0.03em]">Atrações confirmadas</h2>
              </div>
            </div>
            <div className="mt-6 flex flex-wrap gap-2.5">
              {event.attractions.map((attraction) => (
                <span key={attraction} className="rounded-full border border-[#ffc5b6] bg-white px-4 py-2 text-[0.8125rem] font-bold text-[#d93617]">{attraction}</span>
              ))}
            </div>
          </article>
        )}

        {!!event.extras?.length && (
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {event.extras.map((extra, index) => (
              <article key={`${extra.title}-${index}`} className="rounded-[1.5rem] border border-[#e8e3eb] bg-white p-6">
                <h2 className="text-[1.125rem] font-black">{extra.title}</h2>
                <p className="mt-3 whitespace-pre-line text-[0.9375rem] leading-relaxed text-[#6f6875]">{extra.content}</p>
              </article>
            ))}
          </div>
        )}
      </section>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[#ffd8ce] bg-white/95 px-4 py-3 shadow-[0_-14px_40px_rgba(23,17,31,0.12)] backdrop-blur-xl lg:hidden">
        <div className="mx-auto flex max-w-xl items-center gap-4">
          <div className="min-w-0 flex-1">
            <p className="text-[0.6875rem] font-black uppercase tracking-[0.12em] text-[#837b88]">A partir de</p>
            <p className="truncate text-[1.125rem] font-black text-[#17111f]">{startingPrice || "Em breve"}</p>
          </div>
          <Link href={ticketsUrl} className="flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-full bg-[#f24423] px-5 text-[0.875rem] font-black text-white shadow-[0_10px_26px_rgba(242,68,35,0.22)]">
            Comprar <ArrowRight className="size-4" />
          </Link>
        </div>
      </div>
    </main>
  );
}
