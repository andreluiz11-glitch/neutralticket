import { notFound } from "next/navigation";
import EventBuyBox from "@/components/EventBuyBox";
import MetaViewContent from "@/components/MetaViewContent";
import { getEventBySlug } from "@/lib/events";

export const dynamic = "force-dynamic";

export default async function EventPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  if (!slug) {
    return notFound();
  }

  const event = await getEventBySlug(slug);

  if (!event) {
    return notFound();
  }

  const eventForBuyBox = {
    id: event.id || slug,
    title: event.title,
    date: event.date,
    location: event.location,
    price: event.price,
    imageUrl: event.imageUrl,
    tickets: event.tickets,
  };

  return (
    <main className="min-h-screen bg-zinc-50">
      <MetaViewContent
        eventName={event.title}
        eventSlug={slug}
      />

      <section className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <div className="grid min-w-0 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_390px] xl:gap-8">
          
          {/* INFORMAÇÕES DO EVENTO */}
          <div className="min-w-0 overflow-hidden rounded-3xl bg-white shadow-sm">
            <div className="relative">
              <img
                src={event.imageUrl || "/uploads/default.jpg"}
                alt={event.title}
                className="h-[240px] w-full object-cover sm:h-[420px]"
              />

              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />

              <div className="absolute bottom-0 left-0 right-0 p-5 text-white sm:p-6">
                <p className="text-sm font-black uppercase text-orange-400">
                  Clube do Ingresso
                </p>

                <h1 className="mt-2 break-words text-3xl font-black leading-tight sm:text-5xl">
                  {event.title}
                </h1>
              </div>
            </div>

            <div className="space-y-6 p-4 sm:p-6">
              
              {/* DATA E LOCAL */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="min-w-0 rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
                  <p className="text-xs font-black uppercase text-zinc-500">
                    Data
                  </p>

                  <p className="mt-1 break-words text-sm font-bold text-zinc-950">
                    {event.date
                      ? new Date(event.date).toLocaleString(
                          "pt-BR",
                          {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          }
                        )
                      : "Data não informada"}
                  </p>
                </div>

                <div className="min-w-0 rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
                  <p className="text-xs font-black uppercase text-zinc-500">
                    Local
                  </p>

                  <p className="mt-1 break-words text-sm font-bold text-zinc-950">
                    {event.location || "Local não informado"}
                  </p>
                </div>
              </div>

              {/* SOBRE O EVENTO */}
              <div className="min-w-0 rounded-2xl border border-zinc-200 bg-white p-5">
                <h2 className="text-xl font-black text-zinc-950">
                  Sobre o evento
                </h2>

                <p className="mt-3 whitespace-pre-line break-words text-sm leading-relaxed text-zinc-600">
                  {event.description ||
                    "Confira as opções de ingresso disponíveis para este evento."}
                </p>
              </div>
            </div>
          </div>

          {/* MOBILE */}
          <div className="min-w-0 lg:hidden">
            <EventBuyBox event={eventForBuyBox} />
          </div>

          {/* DESKTOP */}
          <aside className="hidden min-w-0 lg:block">
            <div className="sticky top-6">
              <EventBuyBox event={eventForBuyBox} />
            </div>
          </aside>

        </div>
      </section>
    </main>
  );
}