import { NextResponse } from "next/server";
import { Resend } from "resend";
import { updateOrderEmailDelivery } from "@/lib/orders";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
  const webhookSecret = process.env.RESEND_WEBHOOK_SECRET?.trim();

  if (!webhookSecret) {
    return NextResponse.json(
      { error: "Webhook de e-mail não configurado." },
      { status: 503 }
    );
  }

  const payload = await request.text();
  const resend = new Resend(process.env.RESEND_API_KEY);

  try {
    const event = resend.webhooks.verify({
      payload,
      headers: {
        id: request.headers.get("svix-id") || "",
        timestamp: request.headers.get("svix-timestamp") || "",
        signature: request.headers.get("svix-signature") || "",
      },
      webhookSecret,
    });

    if (!("email_id" in event.data)) {
      return NextResponse.json({ ok: true });
    }

    const statusByEvent: Record<string, string> = {
      "email.sent": "sent",
      "email.delivered": "delivered",
      "email.delivery_delayed": "delayed",
      "email.opened": "opened",
      "email.clicked": "clicked",
      "email.bounced": "bounced",
      "email.failed": "failed",
      "email.suppressed": "suppressed",
      "email.complained": "complained",
    };

    const status = statusByEvent[event.type];

    if (!status) {
      return NextResponse.json({ ok: true });
    }

    let error: string | null = null;

    if (event.type === "email.bounced") {
      error = event.data.bounce.message;
    } else if (event.type === "email.failed") {
      error = event.data.failed.reason;
    } else if (event.type === "email.suppressed") {
      error = event.data.suppressed.message;
    } else if (event.type === "email.complained") {
      error = "O destinatário marcou a mensagem como spam.";
    }

    await updateOrderEmailDelivery({
      messageId: event.data.email_id,
      status,
      deliveredAt:
        event.type === "email.delivered" ? new Date(event.created_at) : null,
      error,
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "Assinatura do webhook inválida." },
      { status: 400 }
    );
  }
}
