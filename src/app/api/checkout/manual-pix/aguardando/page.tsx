import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function LegacyManualPixWaitingPage({
  searchParams,
}: {
  searchParams: Promise<{ orderId?: string }>;
}) {
  const params = await searchParams;
  const target = params.orderId
    ? `/checkout/manual-pix/aguardando?orderId=${encodeURIComponent(params.orderId)}`
    : "/checkout/manual-pix/aguardando";

  redirect(target);
}
