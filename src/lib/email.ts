import QRCode from "qrcode";
import { Resend } from "resend";

export type TicketEmailData = {
  baseUrl: string;
  idempotencyKey?: string;
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
    eventDate?: string | null;
    eventDates?: string[] | null;
    eventLocation?: string | null;
    ticketName: string;
    customerName?: string | null;
    customerEmail: string;
  }>;
};

function cleanBaseUrl(url: string) {
  return url.trim().replace(/\/+$/, "");
}

function escapeHtml(value: string) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatEventDate(value?: string | null) {
  if (!value) return "Data a confirmar";

  const localDateTime = value.match(
    /^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2}))?/
  );

  if (localDateTime) {
    const [, year, month, day, hour, minute] = localDateTime;
    return hour && minute
      ? `${day}/${month}/${year} às ${hour}:${minute}`
      : `${day}/${month}/${year}`;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;

  return parsed.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Sao_Paulo",
  });
}

function formatMoney(value?: number | null) {
  if (typeof value !== "number" || !Number.isFinite(value)) return "";

  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function safeTag(value: string) {
  return value.replace(/[^a-zA-Z0-9_-]/g, "-").slice(0, 256);
}

export async function buildTicketEmail({
  baseUrl,
  order,
  tickets,
}: Omit<TicketEmailData, "idempotencyKey">) {
  if (!order.customerEmail) {
    throw new Error("E-mail do cliente não encontrado.");
  }

  if (!tickets.length) {
    throw new Error("Nenhum ingresso encontrado para envio.");
  }

  const siteUrl = cleanBaseUrl(baseUrl);
  const attachments: Array<{
    content: Buffer;
    filename: string;
    contentType: string;
    contentId: string;
  }> = [];

  const renderedTickets = await Promise.all(
    tickets.map(async (ticket, index) => {
      const encodedCode = encodeURIComponent(ticket.code);
      const ticketUrl = `${siteUrl}/tickets/${encodedCode}`;
      const pdfUrl = `${siteUrl}/api/tickets/${encodedCode}/pdf`;
      const contentId = `ticket-qr-${index + 1}`;
      const qrCode = await QRCode.toBuffer(ticketUrl, {
        type: "png",
        width: 360,
        margin: 2,
        errorCorrectionLevel: "H",
      });

      attachments.push({
        content: qrCode,
        filename: `qr-ingresso-${index + 1}.png`,
        contentType: "image/png",
        contentId,
      });

      return {
        ...ticket,
        eventName: ticket.eventTitle || ticket.eventSlug || "Evento",
        eventDateText: (ticket.eventDates?.length
          ? ticket.eventDates
          : [ticket.eventDate]
        )
          .filter((date): date is string => Boolean(date))
          .map(formatEventDate)
          .join(" • ") || "Data a confirmar",
        eventLocationText: ticket.eventLocation || "Local a confirmar",
        ticketUrl,
        pdfUrl,
        contentId,
      };
    })
  );

  const ticketBlocks = renderedTickets
    .map(
      (ticket, index) => `
        <div style="margin-top:20px;padding:20px;border:1px solid #ffd6cc;border-radius:20px;background:#ffffff;">
          <p style="margin:0 0 8px;color:#f24423;font-size:12px;font-weight:800;letter-spacing:1.2px;">
            INGRESSO ${index + 1} DE ${renderedTickets.length}
          </p>
          <h2 style="margin:0;color:#17111f;font-size:22px;line-height:1.2;">
            ${escapeHtml(ticket.eventName)}
          </h2>

          <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="width:100%;margin-top:16px;">
            <tr>
              <td style="width:148px;vertical-align:top;padding:0 18px 0 0;">
                <img src="cid:${ticket.contentId}" width="148" height="148" alt="QR Code do ingresso" style="display:block;width:148px;height:148px;border:1px solid #eee8f0;border-radius:14px;" />
              </td>
              <td style="vertical-align:top;color:#4b4451;font-size:14px;line-height:1.55;">
                <p style="margin:0 0 7px;"><strong style="color:#17111f;">Tipo:</strong> ${escapeHtml(ticket.ticketName)}</p>
                <p style="margin:0 0 7px;"><strong style="color:#17111f;">Data:</strong> ${escapeHtml(ticket.eventDateText)}</p>
                <p style="margin:0 0 7px;"><strong style="color:#17111f;">Local:</strong> ${escapeHtml(ticket.eventLocationText)}</p>
                <p style="margin:0;word-break:break-all;"><strong style="color:#17111f;">Código:</strong> ${escapeHtml(ticket.code)}</p>
              </td>
            </tr>
          </table>

          <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin-top:18px;">
            <tr>
              <td style="padding:0 8px 8px 0;">
                <a href="${ticket.ticketUrl}" style="display:inline-block;background:#f24423;color:#ffffff;text-decoration:none;font-size:15px;font-weight:800;padding:14px 18px;border-radius:999px;">Abrir ingresso</a>
              </td>
              <td style="padding:0 0 8px;">
                <a href="${ticket.pdfUrl}" style="display:inline-block;background:#17111f;color:#ffffff;text-decoration:none;font-size:15px;font-weight:800;padding:14px 18px;border-radius:999px;">Baixar PDF</a>
              </td>
            </tr>
          </table>

          <p style="margin:8px 0 0;color:#766e7b;font-size:12px;line-height:1.5;word-break:break-all;">
            Link alternativo: <a href="${ticket.ticketUrl}" style="color:#d93617;">${ticket.ticketUrl}</a>
          </p>
        </div>
      `
    )
    .join("");

  const total = formatMoney(order.total);
  const html = `
    <div style="margin:0;background:#f7f5f8;padding:24px 12px;font-family:Arial,Helvetica,sans-serif;">
      <div style="max-width:680px;margin:0 auto;overflow:hidden;border:1px solid #eee8f0;border-radius:26px;background:#ffffff;">
        <div style="background:#f24423;padding:32px 28px;color:#ffffff;">
          <p style="margin:0 0 12px;font-size:13px;font-weight:900;letter-spacing:3px;">INGRESSE</p>
          <h1 style="margin:0;font-size:31px;line-height:1.12;">Pagamento confirmado.<br />Seus ingressos chegaram.</h1>
        </div>

        <div style="padding:28px;">
          <p style="margin:0;color:#302936;font-size:17px;line-height:1.55;">
            Olá, <strong>${escapeHtml(order.customerName || "cliente")}</strong>. O pedido <strong>${escapeHtml(order.id)}</strong>${total ? `, no valor de <strong>${escapeHtml(total)}</strong>,` : ""} foi confirmado.
          </p>
          <p style="margin:14px 0 0;color:#615969;font-size:15px;line-height:1.55;">
            Cada ingresso abaixo possui um QR Code individual. Abra-o no celular ou baixe o PDF antes de ir ao evento.
          </p>

          ${ticketBlocks}

          <div style="margin-top:22px;border-radius:18px;background:#fff3ef;padding:18px;color:#4b302a;">
            <p style="margin:0 0 7px;font-size:14px;font-weight:900;">Como fazer o check-in</p>
            <p style="margin:0;font-size:13px;line-height:1.6;">Apresente o QR Code e um documento com foto na entrada. Cada código é pessoal, vale para uma única entrada e será marcado como utilizado após a validação. Não publique nem encaminhe o ingresso para terceiros.</p>
          </div>

          <p style="margin:22px 0 0;color:#837b88;font-size:12px;line-height:1.5;">Guarde este e-mail até o fim do evento. Se um botão não abrir, use o link alternativo exibido no próprio ingresso.</p>
        </div>
      </div>
    </div>
  `;

  const textTickets = renderedTickets
    .map(
      (ticket, index) => [
        `INGRESSO ${index + 1} DE ${renderedTickets.length}`,
        `Evento: ${ticket.eventName}`,
        `Tipo: ${ticket.ticketName}`,
        `Data: ${ticket.eventDateText}`,
        `Local: ${ticket.eventLocationText}`,
        `Código: ${ticket.code}`,
        `Abrir ingresso e QR Code: ${ticket.ticketUrl}`,
        `Baixar PDF: ${ticket.pdfUrl}`,
      ].join("\n")
    )
    .join("\n\n");

  const text = [
    "INGRESSE",
    "",
    `Olá, ${order.customerName || "cliente"}.`,
    `O pagamento do pedido ${order.id}${total ? ` (${total})` : ""} foi confirmado.`,
    "",
    textTickets,
    "",
    "CHECK-IN",
    "Apresente o QR Code e um documento com foto na entrada. Cada código é pessoal, vale para uma única entrada e será marcado como utilizado após a validação.",
  ].join("\n");

  const eventName = renderedTickets[0]?.eventName;
  const subject =
    renderedTickets.length === 1 && eventName
      ? `Seu ingresso para ${eventName} - INGRESSE`
      : "Seus ingressos estão confirmados - INGRESSE";

  return { html, text, subject, attachments };
}

export async function sendTicketEmail(input: TicketEmailData) {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const emailFrom = process.env.EMAIL_FROM?.trim();

  if (!apiKey) {
    throw new Error("RESEND_API_KEY não configurada.");
  }

  if (!emailFrom) {
    throw new Error("EMAIL_FROM não configurado.");
  }

  const email = await buildTicketEmail(input);
  const resend = new Resend(apiKey);
  const result = await resend.emails.send(
    {
      from: emailFrom,
      to: input.order.customerEmail,
      replyTo: process.env.SUPPORT_EMAIL?.trim() || undefined,
      subject: email.subject,
      html: email.html,
      text: email.text,
      attachments: email.attachments,
      tags: [
        { name: "order_id", value: safeTag(input.order.id) },
        { name: "message_type", value: "ticket_confirmation" },
      ],
    },
    { idempotencyKey: input.idempotencyKey }
  );

  if (result.error) {
    throw new Error(result.error.message || "O provedor recusou o envio.");
  }

  if (!result.data?.id) {
    throw new Error("O provedor não confirmou o recebimento do e-mail.");
  }

  return { messageId: result.data.id };
}
