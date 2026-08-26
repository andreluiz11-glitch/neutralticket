import { NextResponse } from "next/server";
import PDFDocument from "pdfkit";
import QRCode from "qrcode";
import { getTicketByCode } from "@/lib/tickets";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function getBaseUrl() {
  return (
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "") ||
    "http://localhost:3000"
  );
}

function getStatusLabel(status: string) {
  if (status === "VALID") return "Valido";
  if (status === "USED") return "Utilizado";
  if (status === "CANCELED") return "Cancelado";
  return status;
}

function formatDate(value?: string | null) {
  if (!value) return "Data nao informada";

  return new Date(value).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function dataUrlToBuffer(dataUrl: string) {
  const base64 = dataUrl.split(",")[1] || "";
  return Buffer.from(base64, "base64");
}

async function createTicketPdfBuffer(input: {
  code: string;
  orderId: string;
  customerName?: string | null;
  customerEmail: string;
  eventTitle: string;
  ticketName: string;
  status: string;
  createdAt: string;
}) {
  const ticketUrl = `${getBaseUrl()}/tickets/${input.code}`;

  const qrDataUrl = await QRCode.toDataURL(ticketUrl, {
    errorCorrectionLevel: "M",
    margin: 2,
    width: 320,
  });

  const qrBuffer = dataUrlToBuffer(qrDataUrl);

  return await new Promise<Buffer>((resolve, reject) => {
    const doc = new PDFDocument({
      size: "A4",
      margin: 48,
      info: {
        Title: "Ingresso Digital",
        Author: "Clube do Ingresso",
      },
    });

    const chunks: Buffer[] = [];

    doc.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    doc.rect(0, 0, 595.28, 140).fill("#f97316");

    doc
      .fillColor("#000000")
      .font("Helvetica-Bold")
      .fontSize(14)
      .text("CLUBE DO INGRESSO", 48, 42);

    doc
      .font("Helvetica-Bold")
      .fontSize(30)
      .text("Ingresso Digital", 48, 68);

    doc
      .fillColor("#18181b")
      .font("Helvetica-Bold")
      .fontSize(22)
      .text(input.eventTitle, 48, 172, {
        width: 500,
      });

    doc
      .fillColor("#52525b")
      .font("Helvetica")
      .fontSize(13)
      .text(`Tipo: ${input.ticketName}`, 48, 220)
      .text(`Cliente: ${input.customerName || "Nome nao informado"}`, 48, 244)
      .text(`Email: ${input.customerEmail}`, 48, 268)
      .text(`Pedido: ${input.orderId}`, 48, 292)
      .text(`Codigo: ${input.code}`, 48, 316)
      .text(`Status: ${getStatusLabel(input.status)}`, 48, 340)
      .text(`Gerado em: ${formatDate(input.createdAt)}`, 48, 364);

    doc
      .roundedRect(48, 405, 500, 260, 20)
      .lineWidth(1)
      .strokeColor("#e4e4e7")
      .stroke();

    doc.image(qrBuffer, 172, 425, {
      width: 250,
      height: 250,
    });

    doc
      .fillColor("#18181b")
      .font("Helvetica-Bold")
      .fontSize(14)
      .text("Apresente este QR Code na entrada do evento", 48, 690, {
        width: 500,
        align: "center",
      });

    doc
      .fillColor("#71717a")
      .font("Helvetica")
      .fontSize(10)
      .text(
        "Este ingresso possui codigo unico. Apos ser validado, nao podera ser utilizado novamente.",
        70,
        720,
        {
          width: 455,
          align: "center",
        }
      );

    doc
      .fillColor("#71717a")
      .fontSize(9)
      .text(ticketUrl, 70, 760, {
        width: 455,
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

    const pdfBuffer = await createTicketPdfBuffer({
      code: ticket.code,
      orderId: ticket.orderId,
      customerName: ticket.customerName,
      customerEmail: ticket.customerEmail,
      eventTitle: ticket.eventTitle,
      ticketName: ticket.ticketName,
      status: ticket.status,
      createdAt: ticket.createdAt,
    });

    return new NextResponse(new Uint8Array(pdfBuffer), {
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