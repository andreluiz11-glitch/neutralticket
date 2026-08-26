import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST() {
  return NextResponse.json(
    {
      status: "disabled",
      message:
        "Webhook PicPay ainda não está ativo. O projeto está usando Pix manual.",
    },
    { status: 200 }
  );
}

export async function GET() {
  return NextResponse.json(
    {
      status: "disabled",
      message:
        "Webhook PicPay ainda não está ativo. O projeto está usando Pix manual.",
    },
    { status: 200 }
  );
}