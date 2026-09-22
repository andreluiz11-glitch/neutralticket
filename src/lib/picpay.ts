const API_BASE = "https://ecommerce-api.svc.picpay.com";

export function isPicPayConfigured() {
  return Boolean(
    process.env.PICPAY_CHECKOUT_ENABLED === "true" &&
      process.env.PICPAY_CLIENT_ID &&
      process.env.PICPAY_CLIENT_SECRET &&
      process.env.PICPAY_WEBHOOK_TOKEN &&
      process.env.PICPAY_MERCHANT_DOCUMENT
  );
}

export function getPicPayMerchantDocument() {
  return (process.env.PICPAY_MERCHANT_DOCUMENT || "").replace(/\D/g, "");
}

export async function createPicPayCheckout(input: {
  amountCents: number;
  orderId: string;
  name: string;
  email: string;
  cpf: string;
  phone: string;
}) {
  if (!isPicPayConfigured()) throw new Error("PicPay não configurado.");

  const authResponse = await fetch(`${API_BASE}/oauth2/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      grant_type: "client_credentials",
      client_id: process.env.PICPAY_CLIENT_ID,
      client_secret: process.env.PICPAY_CLIENT_SECRET,
    }),
    cache: "no-store",
  });
  const auth = await authResponse.json().catch(() => null);
  if (!authResponse.ok || typeof auth?.access_token !== "string") {
    throw new Error("Falha na autenticação com o PicPay.");
  }

  const expiresAt = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);
  const response = await fetch(`${API_BASE}/v1/paymentlink/create`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Bearer ${auth.access_token}`,
    },
    body: JSON.stringify({
      charge: {
        name: `Pedido INGRESSE ${input.orderId.slice(-8).toUpperCase()}`,
        description: "Ingressos de evento vendidos pela INGRESSE",
        order_number: input.orderId,
        redirect_url: `https://www.ingresseclub.com/account?order=${encodeURIComponent(input.orderId)}`,
        payment: {
          methods: ["BRCODE", "CREDIT_CARD"],
          brcode_arrangements: ["PICPAY", "PIX"],
        },
        amounts: {
          product: input.amountCents,
          delivery: 0,
        },
      },
      options: {
        allow_create_pix_key: true,
        card_max_installment_number: 6,
        expired_at: expiresAt,
      },
    }),
    cache: "no-store",
  });
  const data = await response.json().catch(() => null);
  if (!response.ok || typeof data?.link !== "string") {
    throw new Error("Não foi possível abrir o checkout do PicPay. Tente novamente.");
  }

  const url = new URL(data.link);
  if (
    url.protocol !== "https:" ||
    !(
      url.hostname.endsWith(".picpay.com") || url.hostname === "picpay.com" ||
      url.hostname.endsWith(".picpay.com.br") || url.hostname === "picpay.com.br" ||
      url.hostname.endsWith(".ppay.me")
    )
  ) {
    throw new Error("O PicPay retornou uma URL de pagamento inválida.");
  }

  const pathParts = url.pathname.split("/").filter(Boolean);
  const idFromLink = pathParts[pathParts.length - 1] || "";
  const checkoutId =
    (typeof data?.paymentLinkId === "string" && data.paymentLinkId) ||
    (typeof data?.details?.paymentLinkId === "string" && data.details.paymentLinkId) ||
    idFromLink;
  if (!checkoutId) {
    throw new Error("O PicPay não retornou o identificador da cobrança.");
  }

  return { id: checkoutId, checkoutUrl: url.toString() };
}
