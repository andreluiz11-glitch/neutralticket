import { NextResponse } from "next/server";
import { getOrderById, updateOrderStatus } from "@/lib/orders";
import { sendTicketEmail } from "@/lib/email";
import { generateTicketsForOrder } from "@/lib/tickets";

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

    const currentOrder = await getOrderById(orderId);

    if (!currentOrder) {
      return NextResponse.json(
        { error: "Pedido não encontrado." },
        { status: 404 }
      );
    }

    if (currentOrder.status === "CANCELED") {
      return NextResponse.json(
        { error: "Este pedido está cancelado." },
        { status: 400 }
      );
    }

    const paidOrder = await updateOrderStatus(orderId, "PAID");

    if (!paidOrder) {
      return NextResponse.json(
        { error: "Não foi possível confirmar o pedido." },
        { status: 500 }
      );
    }

    const tickets = await generateTicketsForOrder(orderId);

    await sendTicketEmail({
      to: paidOrder.customer.email,
      customerName: paidOrder.customer.name,
      orderId: paidOrder.id,
      tickets,
    });

    const finalOrder = await updateOrderStatus(orderId, "TICKET_SENT");

    return NextResponse.json({
      order: finalOrder || paidOrder,
      tickets,
      message: "Pagamento confirmado, ingresso gerado e e-mail enviado.",
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        error:
          error?.message ||
          "Não foi possível confirmar o pagamento, gerar o ingresso e enviar o e-mail.",
      },
      { status: 500 }
    );
  }
}