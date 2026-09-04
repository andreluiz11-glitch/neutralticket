"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { usePathname } from "next/navigation";

export default function AppFooter() {
  const pathname = usePathname();

  if (pathname.startsWith("/admin") || pathname.startsWith("/api")) {
    return null;
  }

  return (
    <footer className="bg-[#f24423] text-white">
      <div className="mx-auto max-w-[1440px] px-4 py-14 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
        <div className="grid gap-12 border-b border-white/15 pb-14 lg:grid-cols-[1.4fr_0.6fr] lg:items-end">
          <div>
            <img
              src="/ingresse-logo.png"
              alt="INGRESSE"
              className="h-auto w-[190px] brightness-0 invert"
            />
            <p className="mt-8 max-w-[720px] text-[clamp(2.7rem,6.6vw,6.5rem)] font-black uppercase leading-[0.86] tracking-[-0.07em]">
              Ao vivo,
              <br />
              do seu jeito.
            </p>
          </div>

          <nav aria-label="Rodapé" className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
            <Link
              href="/#eventos"
              className="flex items-center justify-between border-b border-white/15 py-4 text-[0.9375rem] font-semibold text-white/85 transition hover:text-white"
            >
              Explorar eventos <ArrowUpRight className="size-4" />
            </Link>
            <Link
              href="/account"
              className="flex items-center justify-between border-b border-white/15 py-4 text-[0.9375rem] font-semibold text-white/85 transition hover:text-white"
            >
              Minha conta <ArrowUpRight className="size-4" />
            </Link>
            <Link
              href="/login"
              className="flex items-center justify-between border-b border-white/15 py-4 text-[0.9375rem] font-semibold text-white/85 transition hover:text-white"
            >
              Entrar <ArrowUpRight className="size-4" />
            </Link>
            <Link
              href="/login"
              className="flex items-center justify-between border-b border-white/15 py-4 text-[0.9375rem] font-semibold text-white/85 transition hover:text-white"
            >
              Criar conta no acesso <ArrowUpRight className="size-4" />
            </Link>
          </nav>
        </div>

        <div className="flex flex-col gap-3 pt-6 text-[0.75rem] text-white/50 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} INGRESSE.</p>
          <p>Experiências começam antes mesmo da entrada.</p>
        </div>
      </div>
    </footer>
  );
}
