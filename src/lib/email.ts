import { Resend } from "resend";
import type { Ticket } from "@/lib/tickets";

type SendTicketEmailInput = {
  to: string;
  customerName?: string | null;
  orderId: string;
  tickets: Ticket[];
};

function getSiteUrl() {
  return (
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "") ||
    "http://localhost:3000"
  );
}

function getFromEmail() {
  return process.env.EMAIL_FROM || "Clube do Ingresso <onboarding@resend.dev>";
}

function getTicketUrl(code: string) {
  return `${getSiteUrl()}/tickets/${code}`;
}

function getTicketPdfUrl(code: string) {
  return `${getSiteUrl()}/api/tickets/${code}/pdf`;
}

function formatDate(value?: string | null) {
  if (!value) return "Data não informada";

  return new Date(value).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function escapeHtml(value: string) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function buildTicketListHtml(tickets: Ticket[]) {
  return tickets
    .map((ticket, index) => {
      const ticketUrl = getTicketUrl(ticket.code);
      const pdfUrl = getTicketPdfUrl(ticket.code);

      return `
        <div style="border:1px solid #e4e4e7;border-radius:18px;padding:18px;margin-top:16px;background:#ffffff;">
          <p style="margin:0 0 8px;font-size:12px;font-weight:800;text-transform:uppercase;color:#71717a;">
            Ingresso ${index + 1}
          </p>

          <h2 style="margin:0;font-size:20px;color:#18181b;">
            ${escapeHtml(ticket.eventTitle)}
          </h2>

          <p style="margin:10px 0 0;font-size:15px;color:#3f3f46;">
            <strong>Tipo:</strong> ${escapeHtml(ticket.ticketName)}
          </p>

          <p style="margin:8px 0 0;font-size:15px;color:#3f3f46;">
            <strong>Cliente:</strong> ${escapeHtml(
              ticket.customerName || "Nome não informado"
            )}
          </p>

          <p style="margin:8px 0 0;font-size:15px;color:#3f3f46;">
            <strong>E-mail:</strong> ${escapeHtml(ticket.customerEmail)}
          </p>

          <p style="margin:8px 0 0;font-size:15px;color:#3f3f46;">
            <strong>Código:</strong> ${escapeHtml(ticket.code)}
          </p>

          <p style="margin:8px 0 0;font-size:15px;color:#3f3f46;">
            <strong>Gerado em:</strong> ${escapeHtml(formatDate(ticket.createdAt))}
          </p>

          <a href="${ticketUrl}" style="display:block;margin-top:18px;background:#f97316;color:#000000;text-align:center;text-decoration:none;font-weight:900;text-transform:uppercase;border-radius:16px;padding:16px 18px;">
            Abrir ingresso
          </a>

          <a href="${pdfUrl}" style="display:block;margin-top:10px;background:#ffffff;color:#18181b;text-align:center;text-decoration:none;font-weight:900;text-transform:uppercase;border:1px solid #18181b;border-radius:16px;padding:16px 18px;">
            Baixar PDF do ingresso
          </a>

          <p style="margin:14px 0 0;font-size:12px;line-height:1.6;color:#71717a;word-break:break-all;">
            Link direto: ${ticketUrl}
          </p>
        </div>
      `;
    })
    .join("");
}

function buildEmailHtml(input: SendTicketEmailInput) {
  const customerName = input.customerName || "cliente";

  return `
    <div style="margin:0;padding:0;background:#09090b;font-family:Arial,Helvetica,sans-serif;">
      <div style="max-width:680px;margin:0 auto;padding:28px 16px;">
        <div style="background:#ffffff;border-radius:28px;overflow:hidden;">
          <div style="background:#f97316;padding:28px;color:#000000;">
            <p style="margin:0;font-size:13px;font-weight:900;text-transform:uppercase;">
              Clube do Ingresso
            </p>

            <h1 style="margin:8px 0 0;font-size:30px;line-height:1.15;">
              Seu ingresso foi liberado
            </h1>
          </div>

          <div style="padding:26px;">
            <p style="margin:0;font-size:16px;line-height:1.6;color:#27272a;">
              Olá, <strong>${escapeHtml(customerName)}</strong>. Seu pagamento foi confirmado e seu ingresso digital já está disponível.
            </p>

            <p style="margin:14px 0 0;font-size:14px;line-height:1.6;color:#52525b;">
              Pedido: <strong>${escapeHtml(input.orderId)}</strong>
            </p>

            ${buildTicketListHtml(input.tickets)}

            <div style="margin-top:22px;border:1px solid #fed7aa;background:#fff7ed;border-radius:18px;padding:18px;">
              <p style="margin:0;font-size:15px;font-weight:900;color:#18181b;">
                Importante
              </p>

              <p style="margin:8px 0 0;font-size:14px;line-height:1.6;color:#52525b;">
                Apresente o QR Code do ingresso na entrada do evento e leve um documento com foto. Após a validação, o ingresso ficará marcado como utilizado e não poderá ser usado novamente.
              </p>
            </div>

            <p style="margin:22px 0 0;font-size:12px;line-height:1.6;color:#71717a;">
              Este é um e-mail automático. Guarde este e-mail para acessar seu ingresso no dia do evento.
            </p>
          </div>
        </div>
      </div>
    </div>
  `;
}

function buildEmailText(input: SendTicketEmailInput) {
  const lines = [
    "Clube do Ingresso",
    "",
    `Olá, ${input.customerName || "cliente"}.`,
    "Seu pagamento foi confirmado e seu ingresso digital já está disponível.",
    "",
    `Pedido: ${input.orderId}`,
    "",
    ...input.tickets.flatMap((ticket, index) => [
      `Ingresso ${index + 1}`,
      `Evento: ${ticket.eventTitle}`,
      `Tipo: ${ticket.ticketName}`,
      `Código: ${ticket.code}`,
      `Link: ${getTicketUrl(ticket.code)}`,
      `PDF: ${getTicketPdfUrl(ticket.code)}`,
      "",
    ]),
    "Apresente o QR Code do ingresso na entrada do evento e leve um documento com foto.",
  ];

  return lines.join("\n");
}

export async function sendTicketEmail(input: SendTicketEmailInput) {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    throw new Error("RESEND_API_KEY não configurada.");
  }

  if (!input.to) {
    throw new Error("E-mail do cliente não informado.");
  }

  if (!input.tickets.length) {
    throw new Error("Nenhum ingresso para enviar.");
  }

  const resend = new Resend(apiKey);

  const subject =
    input.tickets.length === 1
      ? `Seu ingresso - ${input.tickets[0].eventTitle}`
      : "Seus ingressos - Clube do Ingresso";

  const result = await resend.emails.send({
    from: getFromEmail(),
    to: input.to,
    subject,
    html: buildEmailHtml(input),
    text: buildEmailText(input),
  });

  if (result.error) {
    throw new Error(result.error.message || "Erro ao enviar e-mail.");
  }

  return result.data;
}