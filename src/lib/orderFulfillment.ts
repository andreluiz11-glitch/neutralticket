import { sendTicketEmail } from "@/lib/email";
import { getEventBySlug } from "@/lib/events";
import {
  getOrderById,
  recordOrderEmailAccepted,
  recordOrderEmailFailure,
  updateOrderStatus,
} from "@/lib/orders";
import { generateTicketsForOrder } from "@/lib/tickets";

export class TicketEmailDeliveryError extends Error {
  constructor(
    message: string,
    public readonly tickets: Awaited<ReturnType<typeof generateTicketsForOrder>>
  ) {
    super(message);
    this.name = "TicketEmailDeliveryError";
  }
}

export async function fulfillOrderAndSendTickets(input: {
  orderId: string;
  baseUrl: string;
  forceResend?: boolean;
}) {
  const existingOrder = await getOrderById(input.orderId);

  if (!existingOrder) {
    throw new Error("Pedido não encontrado.");
  }

  if (existingOrder.status === "CANCELED") {
    throw new Error("Este pedido está cancelado.");
  }

  const paidOrder =
    existingOrder.status === "PAID" || existingOrder.status === "TICKET_SENT"
      ? existingOrder
      : await updateOrderStatus(input.orderId, "PAID");

  if (!paidOrder) {
    throw new Error("Não foi possível atualizar o pedido.");
  }

  const tickets = await generateTicketsForOrder(input.orderId);
  const eventDetails = new Map<
    string,
    Awaited<ReturnType<typeof getEventBySlug>>
  >();

  await Promise.all(
    [...new Set(tickets.map((ticket) => ticket.eventSlug))].map(
      async (eventSlug) => {
        eventDetails.set(eventSlug, await getEventBySlug(eventSlug));
      }
    )
  );

  const idempotencyKey = input.forceResend
    ? `ticket-${input.orderId}-retry-${Date.now()}`
    : `ticket-${input.orderId}-initial`;

  try {
    const result = await sendTicketEmail({
      baseUrl: input.baseUrl,
      idempotencyKey,
      order: {
        id: paidOrder.id,
        customerName: paidOrder.customer.name,
        customerEmail: paidOrder.customer.email,
        total: paidOrder.amount,
      },
      tickets: tickets.map((ticket) => {
        const event = eventDetails.get(ticket.eventSlug);

        return {
          code: ticket.code,
          eventTitle: ticket.eventTitle,
          eventSlug: ticket.eventSlug,
          eventDate: ticket.eventDate || event?.date || null,
          eventDates: event?.dates || null,
          eventLocation: ticket.eventLocation || event?.location || null,
          ticketName: ticket.ticketName,
          customerName: ticket.customerName || paidOrder.customer.name,
          customerEmail: ticket.customerEmail || paidOrder.customer.email,
        };
      }),
    });

    const order = await recordOrderEmailAccepted(
      input.orderId,
      result.messageId
    );

    return { order, tickets, emailSent: true, messageId: result.messageId };
  } catch (error: unknown) {
    const message =
      error instanceof Error
        ? error.message
        : "Não foi possível enviar o e-mail.";

    await recordOrderEmailFailure(input.orderId, message);

    throw new TicketEmailDeliveryError(
      `Pagamento confirmado e ingresso gerado, mas o e-mail falhou: ${message}`,
      tickets
    );
  }
}
