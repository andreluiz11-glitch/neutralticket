import { NextResponse } from "next/server";
import { hasValidAdminSession } from "@/lib/adminAuth";
import { getEvents, upsertEventBySlug } from "@/lib/events";

// GET /api/events → retorna todos os eventos
export async function GET() {
  try {
    const list = await getEvents();
    return NextResponse.json(list);
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Falha ao carregar eventos" },
      { status: 500 }
    );
  }
}

// POST /api/events → cria/atualiza por slug (se não enviar slug, geramos a partir do título)
export async function POST(req: Request) {
  try {
    if (!(await hasValidAdminSession())) {
      return NextResponse.json(
        { error: "Acesso não autorizado." },
        { status: 401 }
      );
    }

    const payload = await req.json();
    if (!payload || !payload.title) {
      return NextResponse.json(
        { error: "Título é obrigatório para criar/atualizar um evento." },
        { status: 400 }
      );
    }

    const saved = await upsertEventBySlug(payload);
    return NextResponse.json(saved, { status: 201 });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Falha ao salvar evento" },
      { status: 500 }
    );
  }
}
