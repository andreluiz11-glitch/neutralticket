import { z } from "zod";

/**
 * Coerção numérica tolerante:
 * - "" | null | undefined  → 0
 * - "99,90" → 99.9
 * - "99.90" → 99.9
 */
const numberFromLoose = (intOnly = false) =>
  z.preprocess((val) => {
    if (val === "" || val === null || val === undefined) return 0;
    if (typeof val === "string") {
      const norm = val.replace(/\s+/g, "").replace(",", ".");
      const n = intOnly ? parseInt(norm, 10) : Number(norm);
      return isNaN(n) ? 0 : n;
    }
    if (typeof val === "number") return val;
    return 0;
  }, intOnly ? z.number().int().nonnegative() : z.number().nonnegative());

/** Ticket individual (dados persistidos) */
export const TicketTypeSchema = z.object({
  id: z.string().min(1).default("t" + Math.random().toString(36).slice(2, 6)),
  name: z.string().optional().default(""),
  price: numberFromLoose(false).optional().default(0),
  quantityAvailable: numberFromLoose(true).optional().default(0),
});

/** Itens de FAQ */
export const FaqItemSchema = z.object({
  question: z.string().optional().default(""),
  answer: z.string().optional().default(""),
});

/** Links extras (regulamentos, etc.) */
export const ExtraLinkSchema = z.object({
  label: z.string().optional().default(""),
  url: z.string().optional().default(""),
});

/** Evento persistido no arquivo data/events.json */
export const EventSchema = z.object({
  id: z.string().min(1),
  slug: z.string().min(1),

  title: z.string().optional().default(""),
  date: z.string().optional().default(""),
  time: z.string().optional().default(""),
  location: z.string().optional().default(""),
  city: z.string().optional().default(""),
  description: z.string().optional().default(""),

  /** imagens locais (via /api/events/upload → /public/uploads/...) */
  bannerUrl: z.string().optional().default(""),
  mapImageUrl: z.string().optional().default(""),

  /** ingressos + extras */
  ticketTypes: z.array(TicketTypeSchema).optional().default([]),
  faqs: z.array(FaqItemSchema).optional().default([]),
  extraLinks: z.array(ExtraLinkSchema).optional().default([]),

  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

/** Lista de eventos */
export const EventsArraySchema = z.array(EventSchema);

/* ──────────────────────────────────────────────────────────────
 * Schemas usados pelo FORM (Admin) — tudo opcional
 * Mantemos string nos campos numéricos no front; API faz a coerção.
 * ────────────────────────────────────────────────────────────── */
export const TicketTypeFormSchema = z.object({
  id: z.string().optional(),
  name: z.string().optional(),
  price: z.union([z.string(), z.number()]).optional(),
  quantityAvailable: z.union([z.string(), z.number()]).optional(),
});

export const EventFormSchema = z.object({
  id: z.string().optional(),
  title: z.string().optional(),
  date: z.string().optional(),
  time: z.string().optional(),
  location: z.string().optional(),
  city: z.string().optional(),
  description: z.string().optional(),
  bannerUrl: z.string().optional(),
  mapImageUrl: z.string().optional(),
  ticketTypes: z.array(TicketTypeFormSchema).optional(),
  faqs: z.array(FaqItemSchema).optional(),
  extraLinks: z.array(ExtraLinkSchema).optional(),
});

/* ──────────────────────────────────────────────────────────────
 * Types (úteis no front)
 * ────────────────────────────────────────────────────────────── */
export type Event = z.infer<typeof EventSchema>;
export type TicketType = z.infer<typeof TicketTypeSchema>;
export type FaqItem = z.infer<typeof FaqItemSchema>;
export type ExtraLink = z.infer<typeof ExtraLinkSchema>;
