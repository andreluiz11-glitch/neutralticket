import Link from "next/link";
import QRCode from "qrcode";
import { notFound } from "next/navigation";
import { getTicketByCode } from "@/lib/tickets";

export const dynamic = "force-dynamic";

function getBaseUrl() {
  return (
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "") ||
    "http://localhost:3000"
  );
}

function getStatusLabel(status: string) {
  if (status === "VALID") return "Válido";
  if (status === "USED") return "Utilizado";
  if (status === "CANCELED") return "Cancelado";
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

  const ticketUrl = `${getBaseUrl()}/tickets/${ticket.code}`;
  const pdfUrl = `/api/tickets/${ticket.code}/pdf`;

  const qrCodeDataUrl = await QRCode.toDataURL(ticketUrl, {
    errorCorrectionLevel: "M",
    margin: 2,
    width: 340,
  });

  return (
    <main className="min-h-screen bg-zinc-950 px-4 py-10 text-white">
      <section className="mx-auto max-w-2xl overflow-hidden rounded-3xl bg-white text-zinc-950 shadow-2xl">
        <div className="bg-orange-500 px-6 py-6 text-black">
          <p className="text-sm font-black uppercase">Clube do Ingresso</p>

          <h1 className="mt-2 text-3xl font-black">Ingresso Digital</h1>
        </div>

        <div className="p-6 sm:p-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase text-zinc-500">
                Evento
              </p>

              <h2 className="mt-1 text-2xl font-black text-zinc-950">
                {ticket.eventTitle}
              </h2>

              <p className="mt-3 text-sm font-semibold text-zinc-700">
                {ticket.ticketName}
              </p>
            </div>

            <div
              className={`w-fit rounded-full border px-4 py-2 text-xs font-black uppercase ${getStatusClass(
                ticket.status
              )}`}
            >
              {getStatusLabel(ticket.status)}
            </div>
          </div>

          <div className="mt-8 rounded-3xl border border-zinc-200 bg-zinc-50 p-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-xs font-bold uppercase text-zinc-500">
                  Cliente
                </p>

                <p className="mt-1 text-sm font-black text-zinc-950">
                  {ticket.customerName || "Nome não informado"}
                </p>
              </div>

              <div>
                <p className="text-xs font-bold uppercase text-zinc-500">
                  E-mail
                </p>

                <p className="mt-1 break-all text-sm font-black text-zinc-950">
                  {ticket.customerEmail}
                </p>
              </div>

              <div>
                <p className="text-xs font-bold uppercase text-zinc-500">
                  Pedido
                </p>

                <p className="mt-1 break-all text-sm font-black text-zinc-950">
                  {ticket.orderId}
                </p>
              </div>

              <div>
                <p className="text-xs font-bold uppercase text-zinc-500">
                  Código
                </p>

                <p className="mt-1 break-all text-sm font-black text-zinc-950">
                  {ticket.code}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-8 text-center">
            <p className="text-sm font-bold text-zinc-700">
              Apresente este QR Code na entrada do evento
            </p>

            <img
              src={qrCodeDataUrl}
              alt="QR Code do ingresso"
              className="mx-auto mt-5 h-72 w-72 rounded-3xl border border-zinc-200 bg-white p-4"
            />

            <p className="mx-auto mt-4 max-w-md text-xs leading-relaxed text-zinc-500">
              Este ingresso é pessoal e possui código único. Após ser validado
              na entrada, não poderá ser utilizado novamente.
            </p>
          </div>

          <div className="mt-8 rounded-2xl border border-orange-200 bg-orange-50 p-4">
            <p className="text-sm font-black text-zinc-950">Importante</p>

            <p className="mt-2 text-sm leading-relaxed text-zinc-700">
              Leve um documento com foto. A organização poderá solicitar a
              conferência dos dados do titular do ingresso.
            </p>
          </div>

          <div className="mt-8 grid gap-3">
            <a
              href={pdfUrl}
              className="flex h-12 items-center justify-center rounded-2xl bg-orange-500 text-sm font-black uppercase text-black hover:bg-orange-400"
            >
              Baixar ingresso em PDF
            </a>

            <Link
              href="/account"
              className="flex h-12 items-center justify-center rounded-2xl border border-zinc-900 bg-white text-sm font-black uppercase text-zinc-950 hover:bg-zinc-100"
            >
              Minhas compras
            </Link>

            <Link
              href="/"
              className="flex h-12 items-center justify-center rounded-2xl border border-zinc-300 bg-white text-sm font-black uppercase text-zinc-950 hover:bg-zinc-100"
            >
              Voltar ao site
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}