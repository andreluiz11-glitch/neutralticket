import { NextResponse } from "next/server";
import PDFDocument from "pdfkit";
import QRCode from "qrcode";
import { getTicketByCode } from "@/lib/tickets";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function getBaseUrl() {
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
  }

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  return "http://localhost:3000";
}

function formatStatus(status: string) {
  if (status === "USED") return "Utilizado";
  if (status === "CANCELED") return "Cancelado";
  return "Válido";
}

function createPdfBuffer(ticket: any, qrCodeBuffer: Buffer) {
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

    const baseUrl = getBaseUrl();
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
    const pdfBuffer = await createPdfBuffer(ticket, qrCodeBuffer);

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