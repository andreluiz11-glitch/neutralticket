import Link from "next/link";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { ArrowLeft, Download, ShieldCheck, TicketCheck } from "lucide-react";
import QRCode from "qrcode";
import { getTicketByCode } from "@/lib/tickets";

export const dynamic = "force-dynamic";

function getStatus(status: string) {
  if (status === "USED") {
    return {
      label: "Utilizado",
      className: "border-[#f3d49d] bg-[#fff9ed] text-[#9a5600]",
    };
  }

  if (status === "CANCELED") {
    return {
      label: "Cancelado",
      className: "border-[#f3c7bd] bg-[#fff0ed] text-[#bf3217]",
    };
  }

  return {
    label: "Válido",
    className: "border-[#bfe7cf] bg-[#eaf8f0] text-[#126b3e]",
  };
}

function maskEmail(email: string) {
  const [localPart, domain] = email.split("@");

  if (!localPart || !domain) return "E-mail protegido";

  const visible = localPart.slice(0, Math.min(2, localPart.length));
  return `${visible}${"•".repeat(Math.max(3, localPart.length - visible.length))}@${domain}`;
}

async function getCurrentOrigin() {
  const configuredOrigin =
    process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL;

  if (configuredOrigin) {
    try {
      return new URL(configuredOrigin).origin;
    } catch {
      // Continua com a origem da requisição em ambiente local.
    }
  }

  const headerList = await headers();
  const rawHost = headerList.get("x-forwarded-host") || headerList.get("host");
  const host = rawHost?.split(",")[0]?.trim();

  if (!host || !/^[a-z0-9.-]+(?::\d+)?$/i.test(host)) {
    return "http://localhost:3000";
  }

  const rawProtocol = headerList.get("x-forwarded-proto")?.split(",")[0]?.trim();
  const protocol =
    rawProtocol === "http" || rawProtocol === "https"
      ? rawProtocol
      : host.includes("localhost") || host.startsWith("192.168.")
        ? "http"
        : "https";

  return `${protocol}://${host}`;
}

export default async function TicketPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;

  if (!code) return notFound();

  const ticket = await getTicketByCode(code);
  if (!ticket) return notFound();

  const origin = await getCurrentOrigin();
  const ticketUrl = `${origin}/tickets/${encodeURIComponent(ticket.code)}`;
  const pdfUrl = `/api/tickets/${encodeURIComponent(ticket.code)}/pdf`;
  const qrCodeDataUrl = await QRCode.toDataURL(ticketUrl, {
    width: 420,
    margin: 2,
    errorCorrectionLevel: "H",
  });
  const status = getStatus(ticket.status);

  return (
    <main className="min-h-[calc(100dvh-74px)] bg-[#f7f5f8] px-4 py-8 sm:px-6 sm:py-12">
      <section className="mx-auto max-w-5xl overflow-hidden rounded-[2rem] border border-[#e8e3eb] bg-white shadow-[0_24px_70px_rgba(23,17,31,0.1)]">
        <div className="brand-grid bg-[#f24423] px-6 py-8 text-white sm:px-10 sm:py-10">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="flex items-center gap-2 text-[0.75rem] font-black uppercase tracking-[0.16em] text-[#ff8a68]">
                <TicketCheck className="size-4" />
                INGRESSE
              </div>
              <h1 className="mt-4 text-[clamp(2.5rem,7vw,5.25rem)] font-black leading-[0.9] tracking-[-0.06em]">
                Ingresso digital
              </h1>
              <p className="mt-4 max-w-xl text-[0.9375rem] leading-6 text-white/70">
                Apresente este QR Code na entrada. Evite compartilhar esta tela
                com outras pessoas.
              </p>
            </div>

            <div
              className={`w-fit rounded-full border px-4 py-2 text-[0.75rem] font-black uppercase tracking-[0.1em] ${status.className}`}
            >
              {status.label}
            </div>
          </div>
        </div>

        <div className="grid gap-8 p-5 sm:p-8 lg:grid-cols-[360px_minmax(0,1fr)] lg:p-10">
          <div>
            <div className="rounded-[1.75rem] border border-[#e8e3eb] bg-white p-5 shadow-[0_12px_38px_rgba(23,17,31,0.08)]">
              <img
                src={qrCodeDataUrl}
                alt="QR Code de validação do ingresso"
                className="mx-auto aspect-square w-full max-w-[310px] object-contain"
              />
            </div>

            <div className="mt-4 flex items-start gap-3 rounded-2xl bg-[#f7f5f8] p-4 text-[#615969]">
              <ShieldCheck className="mt-0.5 size-5 shrink-0 text-[#f24423]" />
              <p className="text-[0.8125rem] leading-5">
                Este código é individual e será conferido uma única vez na
                entrada do evento.
              </p>
            </div>
          </div>

          <div className="min-w-0">
            <p className="text-[0.75rem] font-black uppercase tracking-[0.14em] text-[#f24423]">
              Seu acesso
            </p>
            <h2 className="mt-2 break-words text-[clamp(1.9rem,5vw,3.3rem)] font-black leading-[1] tracking-[-0.045em] text-[#17111f]">
              {ticket.eventTitle || ticket.eventSlug}
            </h2>

            <dl className="mt-7 grid gap-px overflow-hidden rounded-2xl border border-[#e8e3eb] bg-[#e8e3eb] sm:grid-cols-2">
              <div className="bg-white p-4 sm:p-5">
                <dt className="text-[0.75rem] font-black uppercase tracking-[0.08em] text-[#837b88]">
                  Ingresso
                </dt>
                <dd className="mt-2 break-words text-[0.9375rem] font-black text-[#302936]">
                  {ticket.ticketName}
                </dd>
              </div>
              <div className="bg-white p-4 sm:p-5">
                <dt className="text-[0.75rem] font-black uppercase tracking-[0.08em] text-[#837b88]">
                  Titular
                </dt>
                <dd className="mt-2 break-words text-[0.9375rem] font-black text-[#302936]">
                  {ticket.customerName || "Nome não informado"}
                </dd>
              </div>
              <div className="bg-white p-4 sm:p-5">
                <dt className="text-[0.75rem] font-black uppercase tracking-[0.08em] text-[#837b88]">
                  E-mail protegido
                </dt>
                <dd className="mt-2 break-words text-[0.9375rem] font-black text-[#302936]">
                  {maskEmail(ticket.customerEmail)}
                </dd>
              </div>
              <div className="bg-white p-4 sm:p-5">
                <dt className="text-[0.75rem] font-black uppercase tracking-[0.08em] text-[#837b88]">
                  Código
                </dt>
                <dd className="mt-2 break-all font-mono text-[0.8125rem] font-bold text-[#302936]">
                  {ticket.code}
                </dd>
              </div>
            </dl>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <a
                href={pdfUrl}
                className="inline-flex min-h-[52px] items-center justify-center gap-2 rounded-full bg-[#f24423] px-6 text-[0.9375rem] font-black text-white transition hover:-translate-y-0.5 hover:bg-[#d93617]"
              >
                <Download className="size-4" />
                Baixar PDF
              </a>
              <Link
                href="/account"
                className="inline-flex min-h-[52px] items-center justify-center gap-2 rounded-full border border-[#d8d1dc] px-6 text-[0.9375rem] font-bold text-[#302936] transition hover:border-[#f24423] hover:text-[#f24423]"
              >
                <ArrowLeft className="size-4" />
                Minhas compras
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
