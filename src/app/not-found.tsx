import Link from "next/link";
import { ArrowRight, SearchX } from "lucide-react";

export default function NotFoundPage() {
  return (
    <main className="grid min-h-[calc(100dvh-74px)] place-items-center bg-[#f7f5f8] px-4 py-12 sm:px-6">
      <section className="w-full max-w-3xl overflow-hidden rounded-[2rem] border border-[#e8e3eb] bg-white shadow-[0_24px_70px_rgba(23,17,31,0.1)]">
        <div className="p-6 sm:p-10">
          <div className="grid size-16 place-items-center rounded-2xl bg-[#fff0ed] text-[#f24423]">
            <SearchX className="size-8" />
          </div>
          <p className="mt-8 text-[0.75rem] font-black uppercase tracking-[0.15em] text-[#f24423]">
            Página não encontrada
          </p>
          <h1 className="mt-3 max-w-2xl text-[clamp(2.8rem,8vw,6rem)] font-black leading-[0.88] tracking-[-0.07em] text-[#17111f]">
            Esse acesso não está disponível.
          </h1>
          <p className="mt-6 max-w-xl text-[1rem] leading-7 text-[#6f6875]">
            O link pode ter expirado ou o conteúdo pode ter sido removido.
            Confira o endereço ou volte para explorar os eventos.
          </p>
          <Link
            href="/#eventos"
            className="mt-8 inline-flex min-h-[52px] items-center justify-center gap-2 rounded-full bg-[#f24423] px-6 text-[0.9375rem] font-black text-white transition hover:-translate-y-0.5 hover:bg-[#d93617]"
          >
            Explorar eventos
            <ArrowRight className="size-4" />
          </Link>
        </div>
        <div className="brand-grid h-14 bg-[#f24423]" />
      </section>
    </main>
  );
}
