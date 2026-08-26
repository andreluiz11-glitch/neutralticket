import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST() {
  return NextResponse.json(
    {
      error:
        "Checkout Mercado Pago ainda não está ativo. Use o Pix manual para finalizar a compra.",
    },
    { status: 501 }
  );
}

export async function GET() {
  return NextResponse.json(
    {
      status: "disabled",
      message:
        "Checkout Mercado Pago ainda não está ativo. Use o Pix manual para finalizar a compra.",
    },
    { status: 200 }
  );
}