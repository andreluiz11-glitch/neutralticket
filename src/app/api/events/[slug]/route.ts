import { NextResponse } from "next/server";
import {
  deleteEventBySlug,
  getEventBySlug,
  upsertEventBySlug,
} from "@/lib/events";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  context: {
    params: Promise<{ slug: string }>;
  }
) {
  try {
    const { slug } = await context.params;

    if (!slug) {
      return NextResponse.json(
        { error: "Evento não informado." },
        { status: 400 }
      );
    }

    const event = await getEventBySlug(slug);

    if (!event) {
      return NextResponse.json(
        { error: "Evento não encontrado." },
        { status: 404 }
      );
    }

    return NextResponse.json({ event });
  } catch (error: any) {
    return NextResponse.json(
      {
        error: error?.message || "Não foi possível carregar o evento.",
      },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  context: {
    params: Promise<{ slug: string }>;
  }
) {
  try {
    const { slug } = await context.params;

    if (!slug) {
      return NextResponse.json(
        { error: "Evento não informado." },
        { status: 400 }
      );
    }

    const body = await request.json();

    const event = await upsertEventBySlug({
      ...body,
      slug,
    });

    return NextResponse.json({ event });
  } catch (error: any) {
    return NextResponse.json(
      {
        error: error?.message || "Não foi possível salvar o evento.",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  context: {
    params: Promise<{ slug: string }>;
  }
) {
  try {
    const { slug } = await context.params;

    if (!slug) {
      return NextResponse.json(
        { error: "Evento não informado." },
        { status: 400 }
      );
    }

    const deleted = await deleteEventBySlug(slug);

    return NextResponse.json({ deleted });
  } catch (error: any) {
    return NextResponse.json(
      {
        error: error?.message || "Não foi possível excluir o evento.",
      },
      { status: 500 }
    );
  }
}