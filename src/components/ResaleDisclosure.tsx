import Link from "next/link";
import { BadgeInfo } from "lucide-react";

export default function ResaleDisclosure({ compact = false }: { compact?: boolean }) {
  return (
    <aside className={`rounded-2xl border border-[#f3c76b] bg-[#fff9e8] text-[#5f430b] ${compact ? "p-4" : "p-5 sm:p-6"}`}>
      <div className="flex items-start gap-3">
        <BadgeInfo className="mt-0.5 size-5 shrink-0 text-[#c77900]" />
        <div>
          <p className="text-sm font-black uppercase tracking-[0.035em]">Plataforma independente de revenda</p>
          <p className="mt-1 text-xs font-semibold leading-5 sm:text-sm">
            A INGRESSE não é o canal oficial do evento. Os ingressos são intermediados no mercado secundário e os preços podem ser superiores aos praticados pelo canal oficial.
          </p>
          <Link href="/cancelamento" className="mt-2 inline-flex text-xs font-black underline underline-offset-2">
            Cancelamento, transferência e reembolso
          </Link>
        </div>
      </div>
    </aside>
  );
}
