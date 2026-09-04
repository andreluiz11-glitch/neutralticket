import { NextResponse } from "next/server";
import PDFDocument from "pdfkit";
import QRCode from "qrcode";
import { getEventBySlug } from "@/lib/events";
import { getTicketByCode } from "@/lib/tickets";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function getBaseUrl(request: Request) {
  return new URL(request.url).origin;
}

function formatStatus(status: string) {
  if (status === "USED") return "Utilizado";
  if (status === "CANCELED") return "Cancelado";
  return "Válido";
}

function formatEventDate(value?: string | null) {
  const match = value?.match(
    /^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2}))?/
  );
  if (!match) return value || "Data a confirmar";

  const [, year, month, day, hour, minute] = match;
  return hour && minute
    ? `${day}/${month}/${year} às ${hour}:${minute}`
    : `${day}/${month}/${year}`;
}

function createPdfBuffer(
  ticket: any,
  qrCodeBuffer: Buffer,
  eventDates: string,
  eventLocation: string
) {
  return new Promise<Buffer>((resolve, reject) => {
    const doc = new PDFDocument({
      size: "A4",
      margin: 50,
    });

    const chunks: Buffer[] = [];

    doc.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    doc
      .fontSize(12)
      .fillColor("#f97316")
      .text("CLUBE DO INGRESSO", {
        align: "center",
      });

    doc.moveDown(0.5);

    doc
      .fontSize(26)
      .fillColor("#111111")
      .text("Ingresso Digital", {
        align: "center",
      });

    doc.moveDown(1);

    doc
      .fontSize(12)
      .fillColor("#555555")
      .text("Apresente este QR Code na entrada do evento.", {
        align: "center",
      });

    doc.moveDown(2);

    const pageWidth = doc.page.width;
    const qrSize = 210;
    const qrX = (pageWidth - qrSize) / 2;

    doc.image(qrCodeBuffer, qrX, doc.y, {
      width: qrSize,
      height: qrSize,
    });

    doc.moveDown(15);

    doc
      .fontSize(16)
      .fillColor("#111111")
      .text(ticket.eventTitle || ticket.eventSlug, {
        align: "center",
      });

    doc.moveDown(1);

    doc
      .fontSize(13)
      .fillColor("#111111")
      .text(`Ingresso: ${ticket.ticketName}`);

    doc.moveDown(0.5);

    doc.text(`Cliente: ${ticket.customerName || "Nome não informado"}`);

    doc.moveDown(0.5);

    doc.text(`E-mail: ${ticket.customerEmail}`);

    doc.moveDown(0.5);

    doc.text(`Data e horário: ${eventDates}`);

    doc.moveDown(0.5);

    doc.text(`Local: ${eventLocation}`);

    doc.moveDown(0.5);

    doc.text(`Status: ${formatStatus(ticket.status)}`);

    doc.moveDown(1);

    doc
      .fontSize(10)
      .fillColor("#555555")
      .text("Código do ingresso:");

    doc.moveDown(0.3);

    doc
      .fontSize(9)
      .fillColor("#111111")
      .text(ticket.code, {
        width: 500,
      });

    doc.moveDown(2);

    doc
      .fontSize(10)
      .fillColor("#777777")
      .text("Este ingresso é pessoal e será validado na entrada do evento.", {
        align: "center",
      });

    doc.end();
  });
}

export async function GET(
  request: Request,
  context: {
    params: Promise<{ code: string }>;
  }
) {
  try {
    const { code } = await context.params;

    if (!code) {
      return NextResponse.json(
        { error: "Código do ingresso não informado." },
        { status: 400 }
      );
    }

    const ticket = await getTicketByCode(code);

    if (!ticket) {
      return NextResponse.json(
        { error: "Ingresso não encontrado." },
        { status: 404 }
      );
    }

    const event = await getEventBySlug(ticket.eventSlug);
    const eventDates = event?.dates?.length
      ? event.dates.map(formatEventDate).join(" • ")
      : formatEventDate(ticket.eventDate || event?.date);
    const eventLocation =
      ticket.eventLocation || event?.location || "Local a confirmar";
    const baseUrl = getBaseUrl(request);
    const ticketUrl = `${baseUrl}/tickets/${ticket.code}`;

    const qrCodeDataUrl = await QRCode.toDataURL(ticketUrl, {
      width: 360,
      margin: 2,
    });

    const qrCodeBase64 = qrCodeDataUrl.replace(
      /^data:image\/png;base64,/,
      ""
    );

    const qrCodeBuffer = Buffer.from(qrCodeBase64, "base64");
    const pdfBuffer = await createPdfBuffer(
      ticket,
      qrCodeBuffer,
      eventDates,
      eventLocation
    );

    return new Response(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="ingresso-${ticket.code}.pdf"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        error: error?.message || "Não foi possível gerar o PDF do ingresso.",
      },
      { status: 500 }
    );
  }
}
