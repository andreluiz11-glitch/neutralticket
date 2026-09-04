import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CircleHelp, ShieldCheck, TicketCheck } from "lucide-react";
import EventBuyBox from "@/components/EventBuyBox";
import EventShareButton from "@/components/EventShareButton";
import { getEventBySlug } from "@/lib/events";

export const dynamic = "force-dynamic";

type EventTicketsPageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: EventTicketsPageProps): Promise<Metadata> {
  const { slug } = await params;
  const event = await getEventBySlug(slug);
  if (!event) return { title: "Evento não encontrado | INGRESSE" };
  return {
    title: `Ingressos para ${event.title} | INGRESSE`,
    description: `Escolha seus ingressos para ${event.title}.`,
  };
}

export default async function EventTicketsPage({ params }: EventTicketsPageProps) {
  const { slug } = await params;
  if (!slug) return notFound();
  const event = await getEventBySlug(slug);
  if (!event) return notFound();

  const eventForBuyBox = {
    id: event.slug || slug,
    title: event.title,
    date: event.date,
    dates: event.dates,
    location: event.location,
    price: event.price,
    imageUrl: event.imageUrl,
    tickets: event.tickets,
  };

  return (
    <main className="min-h-screen bg-[#f7f7f8] pb-16 text-[#17111f] sm:pb-20">
      <section className="relative isolate h-24 overflow-hidden bg-[#17111f] sm:h-28">
        <img src={event.imageUrl || "/uploads/capaingresso.jpg"} alt="" aria-hidden="true" className="absolute inset-0 -z-20 h-full w-full scale-110 object-cover opacity-30 blur-xl" />
        <div className="absolute inset-0 -z-10 bg-black/55" />
        <div className="mx-auto flex h-full w-full max-w-[1280px] items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href={`/events/${encodeURIComponent(slug)}`} style={{ color: "#ffffff" }} className="relative z-10 inline-flex min-h-11 items-center gap-2 text-[0.8125rem] font-bold transition hover:opacity-80">
            <ArrowLeft className="size-4" /> Voltar ao evento
          </Link>
          <p className="hidden text-[0.6875rem] font-black uppercase tracking-[0.16em] text-[#ff8a6a] sm:block">Compra de ingressos</p>
        </div>
      </section>

      <section className="border-b border-[#e8e3eb] bg-white">
        <div className="mx-auto flex min-h-[72px] w-full max-w-[1280px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <h1 className="min-w-0 truncate text-[0.9375rem] font-black sm:text-[1.05rem]">{event.title}</h1>
          <div className="flex shrink-0 items-center gap-1">
            <EventShareButton title={event.title} variant="light" />
            <a href="https://wa.me/5511994600686" target="_blank" rel="noreferrer" className="hidden min-h-11 items-center justify-center gap-2 rounded-full px-3 text-[0.8125rem] font-bold text-[#302936] transition hover:bg-[#fff1ec] hover:text-[#f24423] sm:inline-flex">
              <CircleHelp className="size-4" /> Preciso de ajuda
            </a>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-[1280px] px-4 py-7 sm:px-6 sm:py-10 lg:px-8">
        <div className="grid min-w-0 gap-7 lg:grid-cols-[minmax(0,1fr)_330px] lg:items-start xl:gap-10">
          <div className="min-w-0">
            <div className="mb-5 inline-flex min-h-[76px] items-center rounded-2xl border-2 border-[#f24423] bg-[#fff5f1] px-5 text-[0.8125rem] font-black uppercase tracking-[0.06em] text-[#d93617] sm:min-h-[86px] sm:px-6">
              Passaportes e ingressos
            </div>
            <EventBuyBox event={eventForBuyBox} />
          </div>

          <aside className="min-w-0 lg:sticky lg:top-[94px]">
            <div className="overflow-hidden rounded-[1.5rem] border border-[#e2dde5] bg-white shadow-[0_18px_54px_rgba(23,17,31,0.08)]">
              <div className="relative aspect-[3/4] overflow-hidden bg-[#17111f]">
                <img src={event.imageUrl || "/uploads/capaingresso.jpg"} alt={`Cartaz do evento ${event.title}`} className="absolute inset-0 h-full w-full object-cover" />
              </div>
              <div className="p-5">
                <p className="text-[0.6875rem] font-black uppercase tracking-[0.14em] text-[#f24423]">Compra segura</p>
                <h2 className="mt-2 text-[1.15rem] font-black leading-tight">{event.title}</h2>
                <div className="mt-4 space-y-2.5 border-t border-[#eee9f0] pt-4 text-[0.8125rem] font-semibold text-[#615969]">
                  <p className="flex items-center gap-2.5"><ShieldCheck className="size-[17px] shrink-0 text-[#f24423]" /> Pagamento protegido</p>
                  <p className="flex items-center gap-2.5"><TicketCheck className="size-[17px] shrink-0 text-[#f24423]" /> Ingressos na sua conta</p>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}
