import { NextResponse } from "next/server";
import { hasValidAdminSession } from "@/lib/adminAuth";
import {
  fulfillOrderAndSendTickets,
  TicketEmailDeliveryError,
} from "@/lib/orderFulfillment";
import { getOrderById } from "@/lib/orders";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  context: { params: Promise<{ orderId: string }> }
) {
  try {
    if (!(await hasValidAdminSession())) {
      return NextResponse.json(
        { error: "Acesso não autorizado." },
        { status: 401 }
      );
    }

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

    const result = await fulfillOrderAndSendTickets({
      orderId,
      baseUrl: new URL(request.url).origin,
      forceResend:
        currentOrder.status === "TICKET_SENT" ||
        Boolean(currentOrder.emailMessageId),
    });

    return NextResponse.json(result);
  } catch (error: unknown) {
    if (error instanceof TicketEmailDeliveryError) {
      return NextResponse.json(
        {
          error: error.message,
          tickets: error.tickets,
          emailSent: false,
        },
        { status: 502 }
      );
    }

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Não foi possível confirmar o pagamento.",
      },
      { status: 500 }
    );
  }
}
