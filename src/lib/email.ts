import { Resend } from "resend";

type TicketEmailData = {
  baseUrl: string;

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

export async function sendTicketEmail({
  baseUrl,
  order,
  tickets,
}: TicketEmailData) {
  const apiKey = process.env.RESEND_API_KEY;
  const emailFrom = process.env.EMAIL_FROM;

  if (!apiKey) {
    throw new Error("RESEND_API_KEY não configurada.");
  }

  if (!emailFrom) {
    throw new Error("EMAIL_FROM não configurado.");
  }

  if (!order.customerEmail) {
    throw new Error("E-mail do cliente não encontrado.");
  }

  if (!tickets.length) {
    throw new Error("Nenhum ingresso encontrado para envio.");
  }

  const resend = new Resend(apiKey);
  const siteUrl = cleanBaseUrl(baseUrl);

  const ticketBlocks = tickets
    .map((ticket, index) => {
      const code = encodeURIComponent(ticket.code);

      const ticketUrl = `${siteUrl}/tickets/${code}`;
      const pdfUrl = `${siteUrl}/api/tickets/${code}/pdf`;

      return `
        <div style="
          margin-top:20px;
          padding:22px;
          border:1px solid #3f3f46;
          border-radius:20px;
          background:#242424;
        ">

          <p style="
            margin:0 0 8px;
            color:#a1a1aa;
            font-size:12px;
            font-weight:bold;
          ">
            INGRESSO ${index + 1}
          </p>

          <h2 style="
            margin:0 0 14px;
            color:#ffffff;
            font-size:21px;
          ">
            ${escapeHtml(
              ticket.eventTitle ||
                ticket.eventSlug ||
                "Evento"
            )}
          </h2>

          <p style="
            margin:0 0 8px;
            color:#e4e4e7;
            font-size:16px;
          ">
            <strong>Tipo:</strong>
            ${escapeHtml(ticket.ticketName)}
          </p>

          <p style="
            margin:0 0 18px;
            color:#e4e4e7;
            font-size:14px;
            word-break:break-all;
          ">
            <strong>Código:</strong>
            ${escapeHtml(ticket.code)}
          </p>

          <table
            role="presentation"
            cellspacing="0"
            cellpadding="0"
            border="0"
            style="margin-bottom:15px;"
          >
            <tr>
              <td style="padding:0 8px 8px 0;">
                <a
                  href="${ticketUrl}"
                  style="
                    display:inline-block;
                    background:#c65b21;
                    color:#ffffff;
                    text-decoration:none;
                    font-size:16px;
                    font-weight:bold;
                    padding:15px 20px;
                    border-radius:14px;
                  "
                >
                  Visualizar ingresso
                </a>
              </td>

              <td style="padding:0 0 8px 0;">
                <a
                  href="${pdfUrl}"
                  style="
                    display:inline-block;
                    background:#ffffff;
                    color:#111111;
                    text-decoration:none;
                    font-size:16px;
                    font-weight:bold;
                    padding:15px 20px;
                    border-radius:14px;
                  "
                >
                  Baixar PDF
                </a>
              </td>
            </tr>
          </table>

          <p style="
            margin:10px 0 5px;
            color:#a1a1aa;
            font-size:12px;
          ">
            Link direto do ingresso:
          </p>

          <p style="
            margin:0 0 14px;
            font-size:12px;
            word-break:break-all;
          ">
            <a
              href="${ticketUrl}"
              style="color:#f97316;"
            >
              ${ticketUrl}
            </a>
          </p>

          <p style="
            margin:0 0 5px;
            color:#a1a1aa;
            font-size:12px;
          ">
            Link direto do PDF:
          </p>

          <p style="
            margin:0;
            font-size:12px;
            word-break:break-all;
          ">
            <a
              href="${pdfUrl}"
              style="color:#f97316;"
            >
              ${pdfUrl}
            </a>
          </p>
        </div>
      `;
    })
    .join("");

  const textTickets = tickets
    .map((ticket, index) => {
      const code = encodeURIComponent(ticket.code);

      const ticketUrl = `${siteUrl}/tickets/${code}`;
      const pdfUrl = `${siteUrl}/api/tickets/${code}/pdf`;

      return `
INGRESSO ${index + 1}

Evento:
${ticket.eventTitle || ticket.eventSlug || "Evento"}

Tipo:
${ticket.ticketName}

Código:
${ticket.code}

Visualizar ingresso:
${ticketUrl}

Baixar PDF:
${pdfUrl}
`;
    })
    .join("\n");

  const html = `
    <div style="
      background:#181818;
      padding:25px;
      font-family:Arial,sans-serif;
    ">

      <div style="
        max-width:680px;
        margin:0 auto;
        background:#202020;
        border-radius:25px;
        overflow:hidden;
      ">

        <div style="
          background:#f1f3ff;
          padding:35px 30px;
        ">

          <p style="
            margin:0 0 14px;
            color:#c65b21;
            font-size:13px;
            font-weight:bold;
            letter-spacing:4px;
          ">
            CLUBE DO INGRESSO
          </p>

          <h1 style="
            margin:0;
            color:#151515;
            font-size:34px;
            line-height:1.2;
          ">
            Seu ingresso foi confirmado
          </h1>

          <p style="
            margin:20px 0 0;
            color:#52525b;
            font-size:17px;
          ">
            O pagamento do pedido
            ${escapeHtml(order.id)}
            foi confirmado.
          </p>

        </div>

        <div style="padding:30px;">

          <p style="
            color:#e4e4e7;
            font-size:17px;
          ">
            Olá, ${escapeHtml(
              order.customerName || "cliente"
            )}.
          </p>

          <p style="
            color:#e4e4e7;
            font-size:17px;
            line-height:1.5;
          ">
            Seu ingresso já está disponível.
            Clique em Visualizar ingresso para abrir seu
            QR Code ou em Baixar PDF para obter seu arquivo.
          </p>

          ${ticketBlocks}

          <p style="
            margin-top:25px;
            color:#a1a1aa;
            font-size:13px;
          ">
            Apresente o QR Code na entrada do evento.
          </p>

        </div>
      </div>
    </div>
  `;

  const text = `
CLUBE DO INGRESSO

Seu ingresso foi confirmado.

Pedido:
${order.id}

${textTickets}
`;

  const result = await resend.emails.send({
    from: emailFrom,
    to: order.customerEmail,
    subject: "Seu ingresso - Clube do Ingresso",
    html,
    text,
  });

  if (result.error) {
    throw new Error(result.error.message);
  }

  return result;
}