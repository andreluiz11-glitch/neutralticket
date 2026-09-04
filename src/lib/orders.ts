import { getEventBySlug } from "@/lib/events";
import { prisma } from "@/lib/prisma";

export type OrderStatus =
  | "PENDING_PAYMENT"
  | "PAYMENT_REPORTED"
  | "PAID"
  | "CANCELED"
  | "TICKET_SENT";

export type OrderItem = {
  id: string;
  title: string;
  date?: string;
  location?: string;
  ticketName: string;
  unitPrice: number;
  qty: number;
};

export type OrderCustomer = {
  name?: string | null;
  email: string;
};

export type Order = {
  id: string;
  status: OrderStatus;
  customer: OrderCustomer;
  items: OrderItem[];
  amount: number;
  paymentMethod: "MANUAL_PIX";
  pixTxid: string;
  createdAt: string;
  updatedAt: string;
  paidAt?: string;
  emailMessageId?: string | null;
  emailDeliveryStatus?: string | null;
  emailSentAt?: string | null;
  emailDeliveredAt?: string | null;
  emailLastError?: string | null;
};

function createPixTxid(orderId: string) {
  return orderId.replace(/[^a-zA-Z0-9]/g, "").slice(0, 25).toUpperCase();
}

type RequestedOrderItem = {
  id: string;
  ticketName: string;
  qty: number;
};

function normalizeRequestedItems(items: unknown): RequestedOrderItem[] {
  if (!Array.isArray(items)) return [];

  return items
    .filter(
      (item: unknown): item is Record<string, unknown> =>
        Boolean(item) && typeof item === "object"
    )
    .map((item) => ({
      id: String(item.id || "").trim(),
      ticketName: String(item.ticketName || "").trim(),
      qty: Math.floor(Number(item.qty) || 0),
    }))
    .filter(
      (item) =>
        item.id.length > 0 &&
        item.ticketName.length > 0 &&
        item.qty > 0 &&
        item.qty <= 10
    )
    .slice(0, 20);
}

async function canonicalizeItems(items: unknown): Promise<OrderItem[]> {
  const requestedItems = normalizeRequestedItems(items);

  if (requestedItems.length === 0) {
    return [];
  }

  const canonicalItems = await Promise.all(
    requestedItems.map(async (requested) => {
      const event = await getEventBySlug(requested.id);

      if (!event) {
        throw new Error("Um dos eventos do carrinho não está mais disponível.");
      }

      const ticket = event.tickets?.find(
        (candidate) =>
          candidate.name.trim().toLocaleLowerCase("pt-BR") ===
          requested.ticketName.toLocaleLowerCase("pt-BR")
      );
      const fallbackPrice = Number(event.price || 0);
      const unitPrice = Number(ticket?.price ?? fallbackPrice);

      if ((!ticket && (event.tickets?.length || 0) > 0) || unitPrice <= 0) {
        throw new Error("Um dos ingressos do carrinho não está mais disponível.");
      }

      return {
        id: event.slug || requested.id,
        title: event.title,
        date: event.date,
        location: event.location,
        ticketName: ticket?.name || requested.ticketName,
        unitPrice,
        qty: requested.qty,
      } satisfies OrderItem;
    })
  );

  return canonicalItems.reduce<OrderItem[]>((result, item) => {
    const existing = result.find(
      (candidate) =>
        candidate.id === item.id && candidate.ticketName === item.ticketName
    );

    if (!existing) {
      result.push({ ...item });
      return result;
    }

    if (existing.qty + item.qty > 10) {
      throw new Error("O limite é de 10 ingressos por tipo em cada pedido.");
    }

    existing.qty += item.qty;
    return result;
  }, []);
}

function toCents(value: number) {
  return Math.round(value * 100);
}

function fromCents(value: number) {
  return value / 100;
}

function statusToPrisma(status: OrderStatus) {
  if (status === "PENDING_PAYMENT") return "pending";
  if (status === "PAYMENT_REPORTED") return "payment_reported";
  if (status === "PAID") return "paid";
  if (status === "CANCELED") return "canceled";
  if (status === "TICKET_SENT") return "ticket_sent";
  return "pending";
}

function statusFromPrisma(status: string): OrderStatus {
  if (status === "pending") return "PENDING_PAYMENT";
  if (status === "payment_reported") return "PAYMENT_REPORTED";
  if (status === "paid") return "PAID";
  if (status === "canceled") return "CANCELED";
  if (status === "ticket_sent") return "TICKET_SENT";
  return "PENDING_PAYMENT";
}

function mapOrder(order: any): Order {
  return {
    id: order.id,
    status: statusFromPrisma(order.status),
    customer: {
      name: order.customerName || null,
      email: order.customerEmail,
    },
    amount: fromCents(order.total),
    paymentMethod: "MANUAL_PIX",
    pixTxid: order.pixTxid || "",
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
    paidAt: order.paidAt ? order.paidAt.toISOString() : undefined,
    emailMessageId: order.emailMessageId || null,
    emailDeliveryStatus: order.emailDeliveryStatus || null,
    emailSentAt: order.emailSentAt ? order.emailSentAt.toISOString() : null,
    emailDeliveredAt: order.emailDeliveredAt
      ? order.emailDeliveredAt.toISOString()
      : null,
    emailLastError: order.emailLastError || null,
    items: order.items.map((item: any) => ({
      id: item.eventSlug,
      title: item.eventTitle || item.eventSlug,
      date: item.eventDate || undefined,
      location: item.eventLocation || undefined,
      ticketName: item.ticketName,
      unitPrice: fromCents(item.unitPrice),
      qty: item.qty,
    })),
  };
}

export async function getOrders(): Promise<Order[]> {
  const orders = await prisma.order.findMany({
    orderBy: {
      createdAt: "desc",
    },
    include: {
      items: true,
    },
  });

  return orders.map(mapOrder);
}

export async function getOrderById(id: string): Promise<Order | null> {
  const order = await prisma.order.findUnique({
    where: {
      id,
    },
    include: {
      items: true,
    },
  });

  if (!order) return null;

  return mapOrder(order);
}

export async function getOrderByIdForUser(
  id: string,
  userId: string
): Promise<Order | null> {
  const order = await prisma.order.findFirst({
    where: {
      id,
      userId,
    },
    include: {
      items: true,
    },
  });

  return order ? mapOrder(order) : null;
}

export async function createManualPixOrder(input: {
  userId: string;
  items: unknown;
}): Promise<Order> {
  const user = await prisma.user.findUnique({
    where: {
      id: input.userId,
    },
  });

  if (!user) {
    throw new Error("Sessão inválida. Entre novamente para continuar.");
  }

  const items = await canonicalizeItems(input.items);

  if (items.length === 0) {
    throw new Error("Carrinho vazio.");
  }

  const amount = items.reduce(
    (total, item) => total + item.unitPrice * item.qty,
    0
  );

  if (amount <= 0) {
    throw new Error("Valor inválido.");
  }

  const created = await prisma.order.create({
    data: {
      userId: user.id,
      customerName: user.name || null,
      customerEmail: user.email,
      status: "pending",
      paymentMethod: "manual_pix",
      total: toCents(amount),
      pixTxid: "",
      items: {
        create: items.map((item) => ({
          eventSlug: item.id,
          eventTitle: item.title,
          eventDate: item.date || null,
          eventLocation: item.location || null,
          ticketName: item.ticketName,
          unitPrice: toCents(item.unitPrice),
          qty: item.qty,
        })),
      },
    },
    include: {
      items: true,
    },
  });

  const pixTxid = createPixTxid(created.id);

  const updated = await prisma.order.update({
    where: {
      id: created.id,
    },
    data: {
      pixTxid,
    },
    include: {
      items: true,
    },
  });

  return mapOrder(updated);
}

export async function updateOrderStatus(
  orderId: string,
  status: OrderStatus
): Promise<Order | null> {
  const currentOrder = await prisma.order.findUnique({
    where: {
      id: orderId,
    },
  });

  if (!currentOrder) {
    return null;
  }

  const order = await prisma.order.update({
    where: {
      id: orderId,
    },
    data: {
      status: statusToPrisma(status),
      paidAt: status === "PAID" ? new Date() : currentOrder.paidAt,
    },
    include: {
      items: true,
    },
  });

  return mapOrder(order);
}

export async function recordOrderEmailAccepted(
  orderId: string,
  messageId: string
): Promise<Order | null> {
  const order = await prisma.order.update({
    where: { id: orderId },
    data: {
      status: "ticket_sent",
      emailMessageId: messageId,
      emailDeliveryStatus: "accepted",
      emailSentAt: new Date(),
      emailDeliveredAt: null,
      emailLastError: null,
    },
    include: { items: true },
  });

  return mapOrder(order);
}

export async function recordOrderEmailFailure(
  orderId: string,
  message: string
): Promise<Order | null> {
  const order = await prisma.order.update({
    where: { id: orderId },
    data: {
      emailDeliveryStatus: "failed",
      emailLastError: message.slice(0, 1000),
    },
    include: { items: true },
  });

  return mapOrder(order);
}

export async function updateOrderEmailDelivery(input: {
  messageId: string;
  status: string;
  deliveredAt?: Date | null;
  error?: string | null;
}) {
  return prisma.order.updateMany({
    where: { emailMessageId: input.messageId },
    data: {
      emailDeliveryStatus: input.status,
      emailDeliveredAt: input.deliveredAt || undefined,
      emailLastError: input.error ? input.error.slice(0, 1000) : null,
    },
  });
}
