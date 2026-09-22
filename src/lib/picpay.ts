const API_BASE = "https://ecommerce-api.svcp.picpay.com";

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

  const response = await fetch(`${API_BASE}/checkout`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Bearer ${auth.access_token}`,
    },
    body: JSON.stringify({
      billingUrlAddress: "https://www.ingresseclub.com",
      amount: input.amountCents,
      description: `Ingressos Ingresse - pedido ${input.orderId}`,
      customer: {
        name: input.name,
        email: input.email,
        documentType: "CPF",
        document: input.cpf,
        phone: {
          countryCode: "55",
          areaCode: input.phone.slice(0, 2),
          number: input.phone.slice(2),
          type: "MOBILE",
        },
      },
    }),
    cache: "no-store",
  });
  const data = await response.json().catch(() => null);
  if (!response.ok || typeof data?.id !== "string" || typeof data?.checkoutUrl !== "string") {
    throw new Error("Não foi possível abrir o checkout do PicPay. Tente novamente.");
  }

  const url = new URL(data.checkoutUrl);
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

  return { id: data.id as string, checkoutUrl: url.toString() };
}
