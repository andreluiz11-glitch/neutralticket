import { notFound } from "next/navigation";
import { headers } from "next/headers";
import QRCode from "qrcode";
import { getTicketByCode } from "@/lib/tickets";

export const dynamic = "force-dynamic";

function formatStatus(status: string) {
  if (status === "USED") {
    return "Utilizado";
  }

  if (status === "CANCELED") {
    return "Cancelado";
  }

  return "Válido";
}

async function getCurrentOrigin() {
  const headerList = await headers();

  const host =
    headerList.get("x-forwarded-host") ||
    headerList.get("host");

  const forwardedProtocol =
    headerList.get("x-forwarded-proto");

  if (!host) {
    return "http://localhost:3000";
  }

  let protocol = forwardedProtocol;

  if (!protocol) {
    if (
      host.includes("localhost") ||
      host.startsWith("192.168.")
    ) {
      protocol = "http";
    } else {
      protocol = "https";
    }
  }

  return `${protocol}://${host}`;
}

export default async function TicketPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;

  if (!code) {
    return notFound();
  }

  const ticket = await getTicketByCode(code);

  if (!ticket) {
    return notFound();
  }

  const origin = await getCurrentOrigin();

  const ticketUrl = `${origin}/tickets/${encodeURIComponent(
    ticket.code
  )}`;

  const pdfUrl = `/api/tickets/${encodeURIComponent(
    ticket.code
  )}/pdf`;

  const qrCodeDataUrl = await QRCode.toDataURL(ticketUrl, {
    width: 420,
    margin: 2,
    errorCorrectionLevel: "H",
  });

  return (
    <main className="min-h-screen bg-zinc-100 px-4 py-8">
      <section className="mx-auto max-w-2xl overflow-hidden rounded-3xl bg-white shadow-sm">
        <div className="bg-zinc-950 px-6 py-8 text-white">
          <p className="text-xs font-black uppercase tracking-[0.25em] text-orange-400">
            Clube do Ingresso
          </p>

          <h1 className="mt-3 text-3xl font-black">
            Ingresso Digital
          </h1>

          <p className="mt-2 text-sm text-zinc-300">
            Apresente este QR Code na entrada do evento.
          </p>
        </div>

        <div className="space-y-6 p-6">
          <div className="flex justify-center">
            <div className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
              <img
                src={qrCodeDataUrl}
                alt="QR Code do ingresso"
                className="h-64 w-64 object-contain"
              />
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-5 text-center">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">
              Status do ingresso
            </p>

            <p className="mt-2 text-2xl font-black text-zinc-950">
              {formatStatus(ticket.status)}
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-zinc-200 p-5">
              <p className="text-xs font-black uppercase text-zinc-500">
                Evento
              </p>

              <p className="mt-2 break-words font-black text-zinc-950">
                {ticket.eventTitle || ticket.eventSlug}
              </p>
            </div>

            <div className="rounded-2xl border border-zinc-200 p-5">
              <p className="text-xs font-black uppercase text-zinc-500">
                Ingresso
              </p>

              <p className="mt-2 break-words font-black text-zinc-950">
                {ticket.ticketName}
              </p>
            </div>

            <div className="rounded-2xl border border-zinc-200 p-5">
              <p className="text-xs font-black uppercase text-zinc-500">
                Cliente
              </p>

              <p className="mt-2 break-words font-black text-zinc-950">
                {ticket.customerName || "Nome não informado"}
              </p>
            </div>

            <div className="rounded-2xl border border-zinc-200 p-5">
              <p className="text-xs font-black uppercase text-zinc-500">
                E-mail
              </p>

              <p className="mt-2 break-words font-black text-zinc-950">
                {ticket.customerEmail}
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-5">
            <p className="text-xs font-black uppercase text-zinc-500">
              Código do ingresso
            </p>

            <p className="mt-2 break-all text-sm font-black text-zinc-950">
              {ticket.code}
            </p>
          </div>

          <a
            href={pdfUrl}
            className="flex min-h-14 w-full items-center justify-center rounded-2xl bg-orange-500 px-5 text-center font-black text-black transition hover:bg-orange-400"
          >
            Baixar ingresso em PDF
          </a>

          <a
            href="/"
            className="flex min-h-14 w-full items-center justify-center rounded-2xl border border-zinc-300 bg-white px-5 text-center font-black text-zinc-950"
          >
            Voltar ao site
          </a>
        </div>
      </section>
    </main>
  );
}