import Link from "next/link";
import { ArrowRight, CircleCheckBig, CircleX, Clock3 } from "lucide-react";

type CheckoutStatusPageProps = {
  status: "success" | "pending" | "failure";
};

const content = {
  success: {
    eyebrow: "Pagamento confirmado",
    title: "Tudo certo com a sua compra.",
    description:
      "Seu pedido foi aprovado. Os detalhes e os ingressos ficarão disponíveis na sua conta.",
    action: "Ver minhas compras",
    href: "/account",
    icon: CircleCheckBig,
    iconClass: "bg-[#e8f8ef] text-[#16824b]",
  },
  pending: {
    eyebrow: "Pagamento em análise",
    title: "Estamos aguardando a confirmação.",
    description:
      "Você não precisa refazer o pagamento. Assim que houver uma atualização, ela aparecerá em sua conta.",
    action: "Acompanhar pedido",
    href: "/account",
    icon: Clock3,
    iconClass: "bg-[#fff3dd] text-[#b86400]",
  },
  failure: {
    eyebrow: "Pagamento não concluído",
    title: "Não foi possível aprovar a compra.",
    description:
      "Nenhum ingresso foi emitido. Volte ao evento para tentar novamente ou escolher outra opção disponível.",
    action: "Voltar aos eventos",
    href: "/#eventos",
    icon: CircleX,
    iconClass: "bg-[#fff0ed] text-[#d93617]",
  },
} as const;

export default function CheckoutStatusPage({ status }: CheckoutStatusPageProps) {
  const current = content[status];
  const Icon = current.icon;

  return (
    <main className="grid min-h-[calc(100dvh-74px)] place-items-center bg-[#f7f5f8] px-4 py-12 sm:px-6">
      <section className="w-full max-w-2xl overflow-hidden rounded-[2rem] border border-[#e8e3eb] bg-white shadow-[0_24px_70px_rgba(23,17,31,0.1)]">
        <div className="p-6 sm:p-10">
          <div className={`grid size-16 place-items-center rounded-2xl ${current.iconClass}`}>
            <Icon className="size-8" strokeWidth={2.1} />
          </div>

          <p className="mt-8 text-[0.75rem] font-black uppercase tracking-[0.15em] text-[#f24423]">
            {current.eyebrow}
          </p>
          <h1 className="mt-3 max-w-xl text-[clamp(2.3rem,6vw,4.25rem)] font-black leading-[0.95] tracking-[-0.055em] text-[#17111f]">
            {current.title}
          </h1>
          <p className="mt-5 max-w-xl text-[1rem] leading-7 text-[#6f6875]">
            {current.description}
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href={current.href}
              className="inline-flex min-h-[52px] items-center justify-center gap-2 rounded-full bg-[#f24423] px-6 text-[0.9375rem] font-black text-white transition hover:-translate-y-0.5 hover:bg-[#d93617]"
            >
              {current.action}
              <ArrowRight className="size-4" />
            </Link>
            <Link
              href="/"
              className="inline-flex min-h-[52px] items-center justify-center rounded-full border border-[#d8d1dc] bg-white px-6 text-[0.9375rem] font-bold text-[#302936] transition hover:border-[#f24423] hover:text-[#f24423]"
            >
              Ir para o início
            </Link>
          </div>
        </div>

        <div className="brand-grid border-t border-[#ffd0c4] bg-[#f24423] px-6 py-5 text-[0.8125rem] font-semibold text-white/80 sm:px-10">
          Compra protegida · Acompanhamento pela sua conta
        </div>
      </section>
    </main>
  );
}
