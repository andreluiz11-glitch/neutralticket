import { randomUUID } from "crypto";
import type { Order } from "@/lib/orders";

const API_BASE = "https://api.mercadopago.com";
const DEFAULT_SITE_URL = "https://www.ingresseclub.com";

function siteUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL || DEFAULT_SITE_URL).replace(/\/$/, "");
}

export function isMercadoPagoConfigured() {
  return Boolean(
    process.env.MERCADO_PAGO_CHECKOUT_ENABLED === "true" &&
      process.env.MERCADO_PAGO_ACCESS_TOKEN &&
      process.env.MERCADO_PAGO_WEBHOOK_SECRET
  );
}

function assertCheckoutUrl(value: string) {
  const url = new URL(value);
  const host = url.hostname.toLowerCase();
  const allowed =
    host === "mercadopago.com" ||
    host.endsWith(".mercadopago.com") ||
    host === "mercadopago.com.br" ||
    host.endsWith(".mercadopago.com.br");

  if (url.protocol !== "https:" || !allowed) {
    throw new Error("O Mercado Pago retornou uma URL de checkout inválida.");
  }

  return url.toString();
}

export async function createMercadoPagoCheckout(order: Order) {
  const baseUrl = siteUrl();
  const response = await fetch(`${API_BASE}/checkout/preferences`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.MERCADO_PAGO_ACCESS_TOKEN}`,
      "Content-Type": "application/json",
      "X-Idempotency-Key": randomUUID(),
    },
    body: JSON.stringify({
      items: order.items.map((item) => ({
        id: `${item.id}:${item.ticketName}`.slice(0, 256),
        title: `${item.title} — ${item.ticketName}`.slice(0, 256),
        description: item.location?.slice(0, 256),
        quantity: item.qty,
        currency_id: "BRL",
        unit_price: Number(item.unitPrice.toFixed(2)),
      })),
      payer: { email: order.customer.email },
      external_reference: order.id,
      statement_descriptor: "INGRESSE",
      back_urls: {
        success: `${baseUrl}/account?payment=success&order=${encodeURIComponent(order.id)}`,
        pending: `${baseUrl}/account?payment=pending&order=${encodeURIComponent(order.id)}`,
        failure: `${baseUrl}/account?payment=failure&order=${encodeURIComponent(order.id)}`,
      },
      auto_return: "approved",
      notification_url: `${baseUrl}/api/webhooks/mercado-pago`,
      payment_methods: {
        excluded_payment_types: [{ id: "ticket" }, { id: "atm" }],
        installments: 6,
      },
      metadata: { order_id: order.id },
    }),
    cache: "no-store",
  });

  const data = (await response.json().catch(() => null)) as
    | { id?: string; init_point?: string; sandbox_init_point?: string; message?: string }
    | null;

  if (!response.ok || !data?.id) {
    throw new Error(data?.message || "Não foi possível iniciar o Mercado Pago.");
  }

  const checkoutUrl = data.init_point || data.sandbox_init_point;
  if (!checkoutUrl) {
    throw new Error("O Mercado Pago não retornou o endereço do checkout.");
  }

  return { id: data.id, checkoutUrl: assertCheckoutUrl(checkoutUrl) };
}

export async function getMercadoPagoPayment(paymentId: string) {
  const response = await fetch(`${API_BASE}/v1/payments/${encodeURIComponent(paymentId)}`, {
    headers: { Authorization: `Bearer ${process.env.MERCADO_PAGO_ACCESS_TOKEN}` },
    cache: "no-store",
  });
  const data = (await response.json().catch(() => null)) as
    | {
        id?: number;
        status?: string;
        external_reference?: string;
        transaction_amount?: number;
        currency_id?: string;
      }
    | null;

  if (!response.ok || !data?.id) {
    throw new Error("Não foi possível confirmar o pagamento no Mercado Pago.");
  }

  return data;
}
