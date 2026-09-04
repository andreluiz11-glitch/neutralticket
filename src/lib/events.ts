import { promises as fs } from "fs";
import path from "path";

export type ExtraField = {
  title: string;
  content: string;
};

export type TicketTier = {
  name: string;
  price: number;
};

export type EventItem = {
  slug?: string;
  id?: string;
  title: string;
  date?: string;
  dates?: string[];
  location?: string;
  category?: string;
  price?: number;
  imageUrl?: string;
  description?: string;
  attractions?: string[];
  tickets?: TicketTier[];
  extras?: ExtraField[];
};

const DATA_PATH = path.join(process.cwd(), "data", "events.json");

export function slugify(value?: string | null) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

async function ensureDataFile() {
  try {
    await fs.access(DATA_PATH);
  } catch {
    await fs.mkdir(path.dirname(DATA_PATH), { recursive: true });
    await fs.writeFile(DATA_PATH, "[]", "utf-8");
  }
}

async function readRaw(): Promise<any[]> {
  await ensureDataFile();

  try {
    const raw = await fs.readFile(DATA_PATH, "utf-8");
    const json = JSON.parse(raw);

    return Array.isArray(json) ? json : [];
  } catch {
    return [];
  }
}

async function writeRaw(events: any[]) {
  await ensureDataFile();
  await fs.writeFile(DATA_PATH, JSON.stringify(events, null, 2), "utf-8");
}

function parseNumber(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const normalized = value
      .replace("R$", "")
      .replace(/\./g, "")
      .replace(",", ".")
      .trim();

    const parsed = Number(normalized);

    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return undefined;
}

function normalize(event: any): EventItem {
  const title = String(event?.title || "").trim();
  const slugFromInput = String(event?.slug || "").trim();
  const slug = slugFromInput || slugify(title);

  const tickets = Array.isArray(event?.tickets)
    ? event.tickets
        .filter((ticket: any) => ticket && ticket.name)
        .map((ticket: any) => ({
          name: String(ticket.name).trim(),
          price: parseNumber(ticket.price) ?? 0,
        }))
        .filter((ticket: TicketTier) => ticket.name.length > 0)
    : [];

  const extras = Array.isArray(event?.extras)
    ? event.extras
        .filter((extra: any) => extra && (extra.title || extra.content))
        .map((extra: any) => ({
          title: extra.title ? String(extra.title).trim() : "",
          content: extra.content ? String(extra.content).trim() : "",
        }))
    : [];

  return {
    slug: slug || undefined,
    id: event?.id ? String(event.id) : undefined,
    title,
    date: event?.date ? String(event.date) : undefined,
    dates: Array.isArray(event?.dates)
      ? event.dates
          .map((date: unknown) => String(date || "").trim())
          .filter(Boolean)
      : [],
    location: event?.location ? String(event.location) : undefined,
    category: event?.category ? String(event.category) : undefined,
    price: parseNumber(event?.price),
    imageUrl: event?.imageUrl ? String(event.imageUrl).trim() : undefined,
    description: event?.description ? String(event.description) : undefined,
    attractions: Array.isArray(event?.attractions)
      ? event.attractions.map((attraction: any) => String(attraction))
      : [],
    tickets,
    extras,
  };
}

export async function getEvents(): Promise<EventItem[]> {
  const raw = await readRaw();

  return raw
    .map(normalize)
    .filter((event) => event.title.trim().length > 0);
}

export async function getEventBySlug(
  slug?: string | null
): Promise<EventItem | null> {
  if (!slug || typeof slug !== "string") {
    return null;
  }

  const normalizedSlug = slug.toLowerCase();
  const all = await getEvents();

  const found = all.find((event) => {
    const eventSlug =
      typeof event.slug === "string" && event.slug.length > 0
        ? event.slug
        : slugify(event.title);

    return eventSlug.toLowerCase() === normalizedSlug;
  });

  return found || null;
}

export async function saveEvents(events: EventItem[]): Promise<void> {
  const normalized = events
    .map(normalize)
    .filter((event) => event.title.trim().length > 0);

  await writeRaw(normalized);
}

export async function upsertEventBySlug(input: EventItem): Promise<EventItem> {
  const all = await getEvents();

  const title = String(input.title || "").trim();
  const slug = String(input.slug || slugify(title)).trim();

  if (!title) {
    throw new Error("Título obrigatório para salvar o evento.");
  }

  if (!slug) {
    throw new Error("Slug obrigatório para salvar o evento.");
  }

  const normalized = normalize({
    ...input,
    title,
    slug,
  });

  const index = all.findIndex((event) => {
    const eventSlug =
      typeof event.slug === "string" && event.slug.length > 0
        ? event.slug
        : slugify(event.title);

    return eventSlug.toLowerCase() === slug.toLowerCase();
  });

  if (index >= 0) {
    all[index] = {
      ...all[index],
      ...normalized,
      slug,
    };
  } else {
    all.push({
      ...normalized,
      slug,
    });
  }

  await writeRaw(all);

  return normalized;
}

export async function deleteEventBySlug(
  slug?: string | null
): Promise<boolean> {
  if (!slug || typeof slug !== "string") {
    return false;
  }

  const all = await getEvents();
  const normalizedSlug = slug.toLowerCase();

  const next = all.filter((event) => {
    const eventSlug =
      typeof event.slug === "string" && event.slug.length > 0
        ? event.slug
        : slugify(event.title);

    return eventSlug.toLowerCase() !== normalizedSlug;
  });

  const changed = next.length !== all.length;

  if (changed) {
    await writeRaw(next);
  }

  return changed;
}
