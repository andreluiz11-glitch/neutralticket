import { NextResponse } from "next/server";
import { getOrders } from "@/lib/orders";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const orders = await getOrders();

    return NextResponse.json({
      orders,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        error: error?.message || "Não foi possível carregar os pedidos.",
      },
      { status: 500 }
    );
  }
}