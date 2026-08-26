import { NextResponse } from "next/server";
import { getOrders } from "@/lib/orders";

export const dynamic = "force-dynamic";

export async function GET() {
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