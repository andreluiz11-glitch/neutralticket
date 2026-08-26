import { randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";

export type TicketStatus = "VALID" | "USED" | "CANCELED";

export type Ticket = {
  id: string;
  code: string;
  orderId: string;
  customerName?: string | null;
  customerEmail: string;
  eventSlug: string;
  eventTitle: string;
  ticketName: string;
  status: TicketStatus;
  createdAt: string;
  usedAt?: string | null;
};

function createTicketCode() {
  return `ticket_${randomBytes(18).toString("hex")}`;
}

function statusFromPrisma(status: string): TicketStatus {
  if (status === "used") return "USED";
  if (status === "canceled") return "CANCELED";
  return "VALID";
}

function mapTicket(ticket: any): Ticket {
  return {
    id: ticket.id,
    code: ticket.code,
    orderId: ticket.orderId,
    customerName: ticket.customerName || null,
    customerEmail: ticket.customerEmail,
    eventSlug: ticket.eventSlug,
    eventTitle: ticket.eventTitle,
    ticketName: ticket.ticketName,
    status: statusFromPrisma(ticket.status),
    createdAt: ticket.createdAt.toISOString(),
    usedAt: ticket.usedAt ? ticket.usedAt.toISOString() : null,
  };
}

export async function getTicketsByOrderId(orderId: string): Promise<Ticket[]> {
  const tickets = await prisma.ticket.findMany({
    where: {
      orderId,
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  return tickets.map(mapTicket);
}

export async function generateTicketsForOrder(orderId: string): Promise<Ticket[]> {
  const existingTickets = await prisma.ticket.findMany({
    where: {
      orderId,
    },
  });

  if (existingTickets.length > 0) {
    return existingTickets.map(mapTicket);
  }

  const order = await prisma.order.findUnique({
    where: {
      id: orderId,
    },
    include: {
      items: true,
    },
  });

  if (!order) {
    throw new Error("Pedido não encontrado.");
  }

  if (order.status !== "paid" && order.status !== "ticket_sent") {
    throw new Error("O pedido precisa estar pago para gerar ingresso.");
  }

  const ticketsToCreate = order.items.flatMap((item) => {
    return Array.from({ length: item.qty }).map(() => ({
      code: createTicketCode(),
      orderId: order.id,
      customerName: order.customerName || null,
      customerEmail: order.customerEmail,
      eventSlug: item.eventSlug,
      eventTitle: item.eventTitle || item.eventSlug,
      ticketName: item.ticketName,
      status: "valid" as const,
    }));
  });

  if (ticketsToCreate.length === 0) {
    throw new Error("Este pedido não possui ingressos.");
  }

  await prisma.ticket.createMany({
    data: ticketsToCreate,
  });

  const tickets = await prisma.ticket.findMany({
    where: {
      orderId,
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  return tickets.map(mapTicket);
}

export async function getTicketByCode(code: string): Promise<Ticket | null> {
  const ticket = await prisma.ticket.findUnique({
    where: {
      code,
    },
  });

  if (!ticket) return null;

  return mapTicket(ticket);
}

export async function markTicketAsUsed(code: string): Promise<Ticket | null> {
  const ticket = await prisma.ticket.findUnique({
    where: {
      code,
    },
  });

  if (!ticket) return null;

  if (ticket.status !== "valid") {
    return mapTicket(ticket);
  }

  const updated = await prisma.ticket.update({
    where: {
      code,
    },
    data: {
      status: "used",
      usedAt: new Date(),
    },
  });

  return mapTicket(updated);
}