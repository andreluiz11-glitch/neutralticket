import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function ManualPixWaitingPage({
  searchParams,
}: {
  searchParams: Promise<{ orderId?: string }>;
}) {
  const params = await searchParams;
  const orderId = params.orderId || "";

  return (
    <main className="min-h-screen bg-zinc-950 px-4 py-12 text-white">
      <section className="mx-auto max-w-2xl rounded-3xl border border-zinc-800 bg-white p-6 text-zinc-950 shadow-2xl sm:p-8">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-orange-500 text-3xl font-black text-black">
          ✓
        </div>

        <h1 className="mt-6 text-center text-3xl font-black">
          Pagamento informado
        </h1>

        <p className="mt-3 text-center text-sm leading-relaxed text-zinc-600">
          Recebemos sua confirmação. Agora o organizador irá conferir o
          pagamento manualmente. Após a aprovação, os dados do ingresso e as
          informações do evento serão enviados para o seu e-mail.
        </p>

        {orderId && (
          <div className="mt-6 rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
            <p className="text-xs font-bold uppercase text-zinc-500">
              Número do pedido
            </p>

            <p className="mt-1 break-all text-sm font-black text-zinc-950">
              {orderId}
            </p>
          </div>
        )}

        <div className="mt-6 rounded-2xl border border-orange-200 bg-orange-50 p-4">
          <p className="text-sm font-black text-zinc-950">Atenção</p>

          <p className="mt-2 text-sm leading-relaxed text-zinc-700">
            O ingresso ainda não está liberado. Ele só será enviado depois que o
            pagamento for confirmado manualmente pelo organizador.
          </p>
        </div>

        <div className="mt-6 rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
          <p className="text-sm font-black text-zinc-950">
            Próximo passo
          </p>

          <p className="mt-2 text-sm leading-relaxed text-zinc-700">
            Fique atento ao seu e-mail cadastrado. Assim que o pagamento for
            conferido, você receberá o ingresso com as informações necessárias
            para utilizar no evento.
          </p>
        </div>

        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          <Link
            href="/account"
            className="flex h-12 items-center justify-center rounded-2xl bg-orange-500 text-sm font-black uppercase text-black hover:bg-orange-400"
          >
            Minhas compras
          </Link>

          <Link
            href="/"
            className="flex h-12 items-center justify-center rounded-2xl border border-zinc-900 bg-white text-sm font-black uppercase text-zinc-950 hover:bg-zinc-100"
          >
            Voltar ao início
          </Link>
        </div>
      </section>
    </main>
  );
}