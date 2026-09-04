import Link from "next/link";
import { ArrowRight, Clock3, Mail, ReceiptText } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ManualPixWaitingPage({
  searchParams,
}: {
  searchParams: Promise<{ orderId?: string }>;
}) {
  const params = await searchParams;
  const orderId = params.orderId || "";

  return (
    <main className="grid min-h-[calc(100dvh-74px)] place-items-center bg-[#f7f5f8] px-4 py-12 sm:px-6">
      <section className="w-full max-w-3xl overflow-hidden rounded-[2rem] border border-[#e8e3eb] bg-white shadow-[0_24px_70px_rgba(23,17,31,0.1)]">
        <div className="p-6 sm:p-10">
          <div className="grid size-16 place-items-center rounded-2xl bg-[#fff3dd] text-[#b86400]">
            <Clock3 className="size-8" strokeWidth={2.1} />
          </div>

          <p className="mt-8 text-[0.75rem] font-black uppercase tracking-[0.15em] text-[#f24423]">
            Pix informado
          </p>
          <h1 className="mt-3 max-w-2xl text-[clamp(2.35rem,6vw,4.5rem)] font-black leading-[0.93] tracking-[-0.06em] text-[#17111f]">
            Agora é só aguardar a conferência.
          </h1>
          <p className="mt-5 max-w-2xl text-[1rem] leading-7 text-[#6f6875]">
            Recebemos sua confirmação. O organizador verificará o pagamento e,
            após a aprovação, seu ingresso aparecerá na conta e será enviado ao
            e-mail cadastrado.
          </p>

          {orderId && (
            <div className="mt-8 flex items-start gap-3 rounded-2xl border border-[#e8e3eb] bg-[#f7f5f8] p-4 sm:p-5">
              <ReceiptText className="mt-0.5 size-5 shrink-0 text-[#f24423]" />
              <div className="min-w-0">
                <p className="text-[0.75rem] font-black uppercase tracking-[0.1em] text-[#837b88]">
                  Número do pedido
                </p>
                <p className="mt-1 break-all text-[0.9375rem] font-black text-[#17111f]">
                  {orderId}
                </p>
              </div>
            </div>
          )}

          <div className="mt-4 flex items-start gap-3 rounded-2xl border border-[#f3d49d] bg-[#fff9ed] p-4 sm:p-5">
            <Mail className="mt-0.5 size-5 shrink-0 text-[#b86400]" />
            <div>
              <p className="text-[0.9375rem] font-black text-[#302936]">
                O ingresso ainda não está liberado
              </p>
              <p className="mt-1 text-[0.875rem] leading-6 text-[#6f6875]">
                Não faça um novo pagamento. Acompanhe a atualização em “Minhas
                compras” e fique atento ao seu e-mail.
              </p>
            </div>
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/account"
              className="inline-flex min-h-[52px] items-center justify-center gap-2 rounded-full bg-[#f24423] px-6 text-[0.9375rem] font-black text-white transition hover:-translate-y-0.5 hover:bg-[#d93617]"
            >
              Ver minhas compras
              <ArrowRight className="size-4" />
            </Link>
            <Link
              href="/"
              className="inline-flex min-h-[52px] items-center justify-center rounded-full border border-[#d8d1dc] px-6 text-[0.9375rem] font-bold text-[#302936] transition hover:border-[#f24423] hover:text-[#f24423]"
            >
              Voltar ao início
            </Link>
          </div>
        </div>

        <div className="brand-grid border-t border-[#ffd0c4] bg-[#f24423] px-6 py-5 text-[0.8125rem] font-semibold text-white/80 sm:px-10">
          Confirmação manual · Você acompanha tudo pela sua conta
        </div>
      </section>
    </main>
  );
}
