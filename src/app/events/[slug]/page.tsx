import { notFound } from "next/navigation";
import EventBuyBox from "@/components/EventBuyBox";
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
      <section className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-3xl bg-white shadow-sm">
          <div className="relative h-[260px] w-full overflow-hidden sm:h-[380px] lg:h-[440px]">
            <img
              src={event.imageUrl || "/uploads/default.jpg"}
              alt={event.title}
              className="h-full w-full object-cover"
            />

            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

            <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-8">
              <p className="text-xs font-black uppercase tracking-[0.25em] text-orange-400">
                Clube do Ingresso
              </p>

              <h1 className="mt-3 max-w-5xl break-words text-3xl font-black leading-tight text-white sm:text-5xl">
                {event.title}
              </h1>
            </div>
          </div>

          <div className="space-y-6 p-5 sm:p-8">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-5">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-zinc-500">
                  Data
                </p>

                <p className="mt-2 break-words text-base font-black text-zinc-950">
                  {event.date
                    ? new Date(event.date).toLocaleString("pt-BR", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "Data não informada"}
                </p>
              </div>

              <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-5">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-zinc-500">
                  Local
                </p>

                <p className="mt-2 break-words text-base font-black text-zinc-950">
                  {event.location || "Local não informado"}
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-zinc-200 bg-white p-5 sm:p-6">
              <h2 className="text-2xl font-black text-zinc-950">
                Sobre o evento
              </h2>

              <p className="mt-4 whitespace-pre-line break-words text-base leading-8 text-zinc-700">
                {event.description ||
                  "Confira as opções de ingresso disponíveis para este evento."}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-8 rounded-3xl bg-white p-4 shadow-sm sm:p-6">
          <div className="mb-5">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-orange-500">
              Ingressos
            </p>

            <h2 className="mt-2 text-2xl font-black text-zinc-950 sm:text-3xl">
              Escolha seu ingresso
            </h2>

            <p className="mt-2 text-sm font-medium text-zinc-500">
              Selecione a quantidade desejada e finalize pelo Pix.
            </p>
          </div>

          <EventBuyBox event={eventForBuyBox} />
        </div>
      </section>
    </main>
  );
}