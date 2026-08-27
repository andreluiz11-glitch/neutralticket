import { NextResponse } from "next/server";
import { generateTicketsForOrder } from "@/lib/tickets";
import { sendTicketEmail } from "@/lib/email";
import { getOrderById, updateOrderStatus } from "@/lib/orders";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  context: {
    params: Promise<{ orderId: string }>;
  }
) {
  try {
    const { orderId } = await context.params;

    if (!orderId) {
      return NextResponse.json(
        { error: "Pedido não informado." },
        { status: 400 }
      );
    }

    const order = await getOrderById(orderId);

    if (!order) {
      return NextResponse.json(
        { error: "Pedido não encontrado." },
        { status: 404 }
      );
    }

    const paidOrder = await updateOrderStatus(orderId, "PAID");

    if (!paidOrder) {
      return NextResponse.json(
        { error: "Não foi possível atualizar o pedido." },
        { status: 500 }
      );
    }

    const tickets = await generateTicketsForOrder(orderId);

    let emailSent = false;
    let emailError: string | null = null;

    const orderData: any = paidOrder;
    const customerName =
      orderData.customerName || orderData.customer?.name || "Cliente";
    const customerEmail =
      orderData.customerEmail || orderData.customer?.email || "";

    if (!customerEmail) {
      return NextResponse.json(
        { error: "E-mail do cliente não encontrado no pedido." },
        { status: 400 }
      );
    }

    try {
      await sendTicketEmail({
        order: {
          id: orderData.id,
          customerName,
          customerEmail,
          total: orderData.total || 0,
        },
        tickets: tickets.map((ticket: any) => ({
          code: ticket.code,
          eventTitle: ticket.eventTitle,
          eventSlug: ticket.eventSlug,
          ticketName: ticket.ticketName,
          customerName: ticket.customerName || customerName,
          customerEmail: ticket.customerEmail || customerEmail,
        })),
      });

      emailSent = true;
    } catch (error: any) {
      emailSent = false;
      emailError = error?.message || "Não foi possível enviar o e-mail.";
    }

    const finalOrder = emailSent
      ? await updateOrderStatus(orderId, "TICKET_SENT")
      : paidOrder;

    return NextResponse.json({
      order: finalOrder,
      tickets,
      emailSent,
      emailError,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        error: error?.message || "Não foi possível confirmar o pagamento.",
      },
      { status: 500 }
    );
  }
}