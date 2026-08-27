import { Resend } from "resend";

function getBaseUrl() {
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
  }

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  return "http://localhost:3000";
}

type TicketEmailData = {
  order: {
    id: string;
    customerName?: string | null;
    customerEmail: string;
    total?: number | null;
  };
  tickets: Array<{
    code: string;
    eventTitle?: string | null;
    eventSlug?: string | null;
    ticketName: string;
    customerName?: string | null;
    customerEmail: string;
  }>;
};

export async function sendTicketEmail({ order, tickets }: TicketEmailData) {
  const apiKey = process.env.RESEND_API_KEY;
  const emailFrom =
    process.env.EMAIL_FROM || "Clube do Ingresso <onboarding@resend.dev>";

  if (!apiKey) {
    throw new Error("RESEND_API_KEY não configurada.");
  }

  if (!tickets.length) {
    throw new Error("Nenhum ingresso encontrado para envio.");
  }

  const resend = new Resend(apiKey);
  const baseUrl = getBaseUrl();

  const firstTicket = tickets[0];
  const mainTicketUrl = `${baseUrl}/tickets/${firstTicket.code}`;
  const mainPdfUrl = `${baseUrl}/api/tickets/${firstTicket.code}/pdf`;

  const ticketListHtml = tickets
    .map((ticket, index) => {
      const ticketUrl = `${baseUrl}/tickets/${ticket.code}`;
      const pdfUrl = `${baseUrl}/api/tickets/${ticket.code}/pdf`;

      return `
        <div style="border:1px solid #e5e7eb;border-radius:18px;padding:18px;margin-top:14px;background:#ffffff;">
          <p style="margin:0 0 6px;font-size:12px;color:#71717a;font-weight:800;text-transform:uppercase;">
            Ingresso ${index + 1}
          </p>

          <h2 style="margin:0 0 8px;font-size:18px;color:#111827;">
            ${ticket.eventTitle || ticket.eventSlug || "Evento"}
          </h2>

          <p style="margin:0 0 6px;color:#374151;">
            <strong>Tipo:</strong> ${ticket.ticketName}
          </p>

          <p style="margin:0 0 14px;color:#374151;">
            <strong>Código:</strong> ${ticket.code}
          </p>

          <a href="${ticketUrl}" target="_blank" style="display:inline-block;background:#f97316;color:#000000;text-decoration:none;font-weight:900;padding:12px 18px;border-radius:14px;margin-right:8px;">
            Visualizar ingresso
          </a>

          <a href="${pdfUrl}" target="_blank" style="display:inline-block;background:#111827;color:#ffffff;text-decoration:none;font-weight:900;padding:12px 18px;border-radius:14px;">
            Baixar PDF
          </a>
        </div>
      `;
    })
    .join("");

  const textTickets = tickets
    .map((ticket, index) => {
      const ticketUrl = `${baseUrl}/tickets/${ticket.code}`;
      const pdfUrl = `${baseUrl}/api/tickets/${ticket.code}/pdf`;

      return `
Ingresso ${index + 1}
Evento: ${ticket.eventTitle || ticket.eventSlug || "Evento"}
Tipo: ${ticket.ticketName}
Código: ${ticket.code}
Visualizar: ${ticketUrl}
PDF: ${pdfUrl}
`;
    })
    .join("\n");

  const html = `
    <div style="font-family:Arial, sans-serif;background:#f4f4f5;padding:24px;">
      <div style="max-width:680px;margin:0 auto;background:#ffffff;border-radius:24px;overflow:hidden;">
        <div style="background:#111827;padding:28px;color:#ffffff;">
          <p style="margin:0 0 8px;color:#f97316;font-size:12px;font-weight:900;letter-spacing:3px;text-transform:uppercase;">
            Clube do Ingresso
          </p>

          <h1 style="margin:0;font-size:28px;">
            Seu ingresso foi confirmado
          </h1>

          <p style="margin:10px 0 0;color:#d1d5db;">
            O pagamento do pedido ${order.id} foi confirmado.
          </p>
        </div>

        <div style="padding:24px;">
          <p style="font-size:16px;color:#374151;">
            Olá, ${order.customerName || firstTicket.customerName || "cliente"}.
          </p>

          <p style="font-size:16px;color:#374151;">
            Seus ingressos estão disponíveis abaixo. Você pode visualizar o QR Code ou baixar o PDF.
          </p>

          <div style="margin:22px 0;">
            <a href="${mainTicketUrl}" target="_blank" style="display:inline-block;background:#f97316;color:#000000;text-decoration:none;font-weight:900;padding:14px 20px;border-radius:16px;margin-right:8px;">
              Visualizar ingresso
            </a>

            <a href="${mainPdfUrl}" target="_blank" style="display:inline-block;background:#111827;color:#ffffff;text-decoration:none;font-weight:900;padding:14px 20px;border-radius:16px;">
              Baixar PDF
            </a>
          </div>

          ${ticketListHtml}

          <p style="margin-top:24px;font-size:13px;color:#71717a;">
            Apresente o QR Code na entrada do evento. Este e-mail é automático.
          </p>
        </div>
      </div>
    </div>
  `;

  const text = `
Clube do Ingresso

Seu ingresso foi confirmado.

Pedido: ${order.id}

${textTickets}

Apresente o QR Code na entrada do evento.
`;

  return resend.emails.send({
    from: emailFrom,
    to: order.customerEmail,
    subject: "Seu ingresso - Clube do Ingresso",
    html,
    text,
  });
}