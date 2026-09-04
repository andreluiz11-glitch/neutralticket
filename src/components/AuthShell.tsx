import { ShieldCheck, TicketCheck } from "lucide-react";

type AuthShellProps = {
  eyebrow: string;
  title: string;
  description: string;
  children: React.ReactNode;
};

export default function AuthShell({
  eyebrow,
  title,
  description,
  children,
}: AuthShellProps) {
  return (
    <main className="min-h-[calc(100dvh-74px)] bg-[#f7f5f8] px-4 py-6 sm:px-6 sm:py-10 lg:px-8">
      <section className="mx-auto grid min-h-[650px] w-full max-w-[1180px] overflow-hidden rounded-[2rem] border border-[#e8e3eb] bg-white shadow-[0_26px_80px_rgba(23,17,31,0.08)] lg:grid-cols-[0.9fr_1.1fr]">
        <aside className="brand-grid relative hidden overflow-hidden bg-[#f24423] p-10 text-white lg:flex lg:flex-col lg:justify-between xl:p-14">
          <div className="absolute -right-24 -top-24 size-72 rounded-full bg-white/10" />
          <div className="absolute -bottom-32 -left-24 size-80 rounded-full border-[60px] border-white/[0.06]" />
          <div className="relative">
            <span className="grid size-12 place-items-center rounded-full bg-white/10">
              <TicketCheck className="size-5 text-[#ff9b80]" />
            </span>
            <p className="mt-10 max-w-[8ch] text-[clamp(3.4rem,5vw,5.6rem)] font-black uppercase leading-[0.87] tracking-[-0.07em]">
              Seu evento vai com você.
            </p>
          </div>
          <div className="relative flex items-center gap-3 border-t border-white/15 pt-6 text-[0.8125rem] font-semibold text-white/70">
            <ShieldCheck className="size-5 text-[#ff8a6a]" />
            Compra e ingressos protegidos em uma só conta.
          </div>
        </aside>

        <div className="flex items-center px-6 py-10 sm:px-10 lg:px-14 xl:px-20">
          <div className="mx-auto w-full max-w-[470px]">
            <p className="text-[0.75rem] font-black uppercase tracking-[0.16em] text-[#f24423]">
              {eyebrow}
            </p>
            <h1 className="mt-4 text-[clamp(2.5rem,5vw,4.3rem)] font-black leading-[0.92] tracking-[-0.06em] text-[#17111f]">
              {title}
            </h1>
            <p className="mt-5 text-[0.9375rem] leading-relaxed text-[#6f6875] sm:text-[1rem]">
              {description}
            </p>
            <div className="mt-8">{children}</div>
          </div>
        </div>
      </section>
    </main>
  );
}
