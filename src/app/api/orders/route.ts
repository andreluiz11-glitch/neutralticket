import { NextResponse } from "next/server";
import { hasValidAdminSession } from "@/lib/adminAuth";
import { getOrders } from "@/lib/orders";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await hasValidAdminSession())) {
    return NextResponse.json({ error: "Acesso não autorizado." }, { status: 401 });
  }

  try {
    const orders = await getOrders();

    return NextResponse.json({
      orders,
    });
  } catch {
    return NextResponse.json(
      {
        error: "Não foi possível carregar os pedidos.",
      },
      { status: 500 }
    );
  }
}
