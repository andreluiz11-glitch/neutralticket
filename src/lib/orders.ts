import { randomBytes } from "crypto";
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
};

function createPixTxid(orderId: string) {
  return orderId.replace(/[^a-zA-Z0-9]/g, "").slice(0, 25).toUpperCase();
}

function normalizeItems(items: unknown): OrderItem[] {
  if (!Array.isArray(items)) return [];

  return items
    .filter(
      (item: any) =>
        item &&
        typeof item === "object" &&
        typeof item.id === "string" &&
        typeof item.title === "string" &&
        typeof item.ticketName === "string" &&
        typeof item.unitPrice === "number" &&
        typeof item.qty === "number"
    )
    .map((item: any) => ({
      id: String(item.id),
      title: String(item.title),
      date: item.date ? String(item.date) : undefined,
      location: item.location ? String(item.location) : undefined,
      ticketName: String(item.ticketName),
      unitPrice: Number(item.unitPrice),
      qty: Math.max(1, Math.floor(Number(item.qty) || 1)),
    }))
    .filter((item) => item.unitPrice > 0 && item.qty > 0);
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
    items: order.items.map((item: any) => ({
      id: item.eventSlug,
      title: item.eventTitle || item.eventSlug,
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

export async function createManualPixOrder(input: {
  customer: OrderCustomer;
  items: unknown;
}): Promise<Order> {
  const email = String(input.customer.email || "").trim().toLowerCase();

  if (!email) {
    throw new Error("E-mail do cliente é obrigatório.");
  }

  const items = normalizeItems(input.items);

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

  let user = await prisma.user.findUnique({
    where: {
      email,
    },
  });

  if (!user) {
    user = await prisma.user.create({
      data: {
        email,
        name: input.customer.name || null,
        passwordHash: randomBytes(16).toString("hex"),
      },
    });
  }

  const created = await prisma.order.create({
    data: {
      userId: user.id,
      customerName: input.customer.name || user.name || null,
      customerEmail: email,
      status: "pending",
      paymentMethod: "manual_pix",
      total: toCents(amount),
      pixTxid: "",
      items: {
        create: items.map((item) => ({
          eventSlug: item.id,
          eventTitle: item.title,
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