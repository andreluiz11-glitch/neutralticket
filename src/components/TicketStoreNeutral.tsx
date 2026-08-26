"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";

type ExtraField = {
  title: string;
  content: string;
};

type TicketTier = {
  name: string;
  price: number;
};

type EventItem = {
  slug?: string;
  id?: string;
  title: string;
  date?: string;
  location?: string;
  category?: string;
  price?: number;
  imageUrl?: string;
  description?: string;
  attractions?: string[];
  tickets?: TicketTier[];
  extras?: ExtraField[];
};

const slugify = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

function getEventId(event: EventItem) {
  return event.slug || event.id || slugify(event.title);
}

function getEventUrl(event: EventItem) {
  return `/events/${getEventId(event)}`;
}

export default function TicketStoreNeutral() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  useEffect(() => {
    function handleHeaderSearch(event: Event) {
      const customEvent = event as CustomEvent<string>;
      setQuery(String(customEvent.detail || ""));
    }

    window.addEventListener("neutralTicketSearch", handleHeaderSearch);

    return () => {
      window.removeEventListener("neutralTicketSearch", handleHeaderSearch);
    };
  }, []);

  useEffect(() => {
    async function loadEvents() {
      try {
        const res = await fetch("/api/events", {
          cache: "no-store",
        });

        const data: unknown = await res.json();
        const list = Array.isArray(data) ? data : [];

        const normalized: EventItem[] = list.map((raw: any) => {
          const base = raw && typeof raw === "object" ? raw : {};

          const tickets = Array.isArray(base.tickets)
            ? base.tickets
                .filter(
                  (ticket: any) =>
                    ticket &&
                    typeof ticket.name === "string" &&
                    typeof ticket.price === "number"
                )
                .map((ticket: any) => ({
                  name: String(ticket.name),
                  price: Number(ticket.price),
                }))
            : [];

          const extras = Array.isArray(base.extras)
            ? base.extras
                .filter((extra: any) => extra && (extra.title || extra.content))
                .map((extra: any) => ({
                  title: String(extra.title ?? ""),
                  content: String(extra.content ?? ""),
                }))
            : [];

          return {
            slug: typeof base.slug === "string" ? base.slug : undefined,
            id: typeof base.id === "string" ? base.id : undefined,
            title: String(base.title ?? "Evento"),
            date: typeof base.date === "string" ? base.date : undefined,
            location:
              typeof base.location === "string" ? base.location : undefined,
            category:
              typeof base.category === "string" ? base.category : undefined,
            price: typeof base.price === "number" ? base.price : undefined,
            imageUrl:
              typeof base.imageUrl === "string" ? base.imageUrl : undefined,
            description:
              typeof base.description === "string"
                ? base.description
                : undefined,
            attractions: Array.isArray(base.attractions)
              ? base.attractions.map(String)
              : [],
            tickets,
            extras,
          };
        });

        setEvents(normalized);
      } catch (error) {
        console.error("Erro ao carregar eventos:", error);
        setEvents([]);
      } finally {
        setLoading(false);
      }
    }

    loadEvents();
  }, []);

  const filtered = useMemo(() => {
    const search = query.trim().toLowerCase();

    return events.filter((event) => {
      const text = [event.title, event.location, event.category]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return search ? text.includes(search) : true;
    });
  }, [events, query]);

  function handleImgError(event: React.SyntheticEvent<HTMLImageElement>) {
    const img = event.currentTarget;

    if (!img.src.endsWith("/uploads/default.jpg")) {
      img.src = "/uploads/default.jpg";
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-white text-zinc-900">
        Carregando eventos...
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white text-zinc-900">
      <section className="mx-auto max-w-7xl px-4 py-8">
        {filtered.length === 0 ? (
          <div className="rounded-3xl border border-zinc-200 bg-white p-8 text-center shadow-sm">
            <p className="text-lg font-semibold text-zinc-900">
              Nenhum evento encontrado
            </p>

            <p className="mt-1 text-sm text-zinc-500">
              Tente buscar por outro nome, local ou categoria.
            </p>
          </div>
        ) : (
          <div className="grid gap-7 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((event) => (
              <motion.div
                key={getEventId(event)}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
              >
                <Link
                  href={getEventUrl(event)}
                  className="group block overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
                >
                  <div className="overflow-hidden bg-zinc-100">
                    <img
                      src={event.imageUrl || "/uploads/default.jpg"}
                      alt={event.title}
                      className="h-64 w-full object-cover transition duration-300 group-hover:scale-105"
                      onError={handleImgError}
                    />
                  </div>

                  <div className="p-5">
                    <h2 className="line-clamp-2 text-lg font-bold leading-tight text-zinc-950">
                      {event.title}
                    </h2>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}