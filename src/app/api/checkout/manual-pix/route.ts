import { NextResponse } from "next/server";
import { getAuthenticatedUserId } from "@/lib/cookies";
import { createManualPixOrder } from "@/lib/orders";
import { buildPixPayload, generatePixQrCodeDataUrl } from "@/lib/pix";

export const dynamic = "force-dynamic";

function isValidCnpj(value: string) {
  const cnpj = value.replace(/\D/g, "");
  if (!/^\d{14}$/.test(cnpj) || /^(\d)\1+$/.test(cnpj)) return false;

  const calculateDigit = (base: string, weights: number[]) => {
    const total = base
      .split("")
      .reduce((sum, digit, index) => sum + Number(digit) * weights[index], 0);
    const remainder = total % 11;
    return remainder < 2 ? 0 : 11 - remainder;
  };

  const firstDigit = calculateDigit(cnpj.slice(0, 12), [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  const secondDigit = calculateDigit(cnpj.slice(0, 13), [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);

  return firstDigit === Number(cnpj[12]) && secondDigit === Number(cnpj[13]);
}

export async function POST(request: Request) {
  try {
    const userId = await getAuthenticatedUserId();

    if (!userId) {
      return NextResponse.json(
        { error: "Entre na sua conta para finalizar a compra." },
        { status: 401 }
      );
    }

    const body = await request.json();

    const pixKey = String(process.env.PIX_KEY || "").replace(/\D/g, "");
    const receiverName = String(process.env.PIX_RECEIVER_NAME || "").trim();
    const receiverCity = String(process.env.PIX_RECEIVER_CITY || "").trim();

    if (!receiverName || !receiverCity) {
      return NextResponse.json(
        { error: "Dados do recebedor Pix não configurados." },
        { status: 503 }
      );
    }

    if (!isValidCnpj(pixKey)) {
      return NextResponse.json(
        {
          error: "A chave Pix CNPJ da empresa não está configurada corretamente.",
        },
        { status: 503 }
      );
    }

    const order = await createManualPixOrder({
      userId,
      items: body?.items,
    });

    const pixCopyPaste = buildPixPayload({
      key: pixKey,
      receiverName,
      receiverCity,
      amount: order.amount,
      txid: order.pixTxid,
      description: `Pedido ${order.id}`,
    });

    const qrCodeDataUrl = await generatePixQrCodeDataUrl(pixCopyPaste);

    return NextResponse.json({
      orderId: order.id,
      status: order.status,
      amount: order.amount,
      pix: {
        key: pixKey,
        keyType: "CNPJ",
        receiverName,
        txid: order.pixTxid,
        copyPaste: pixCopyPaste,
        qrCodeDataUrl,
      },
    });
  } catch (error: unknown) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Não foi possível gerar o Pix.",
      },
      { status: 400 }
    );
  }
}
