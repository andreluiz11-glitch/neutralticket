"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  CheckCircle2,
  Copy,
  Minus,
  Plus,
  ShoppingBag,
  Ticket,
  Trash2,
} from "lucide-react";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  CART_OPEN_EVENT,
  CART_UPDATED_EVENT,
  CartItem,
  clearCart,
  getCart,
  getCartTotal,
  removeCartItem,
  updateCartQty,
} from "@/lib/cart";

type MeResponse = {
  user: {
    id: string;
    email: string;
    name?: string | null;
  } | null;
};

type ManualPixResponse = {
  orderId: string;
  amount: number;
  pix: {
    key: string;
    txid: string;
    copyPaste: string;
    qrCodeDataUrl: string;
  };
};

const formatBRL = (value: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);

const formatDate = (iso?: string) =>
  iso
    ? new Date(iso).toLocaleString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "Data não informada";

export default function AppCartDrawer() {
  const pathname = usePathname();
  const pixTextAreaRef = useRef<HTMLTextAreaElement | null>(null);

  const [open, setOpen] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [me, setMe] = useState<MeResponse["user"]>(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [manualPix, setManualPix] = useState<ManualPixResponse | null>(null);
  const [copied, setCopied] = useState(false);
  const [reportingPayment, setReportingPayment] = useState(false);

  const total = useMemo(() => getCartTotal(cart), [cart]);

  async function refreshUser() {
    try {
      const res = await fetch("/api/auth/me", {
        cache: "no-store",
        credentials: "include",
      });

      const data: MeResponse = await res.json();
      const currentUser = data.user || null;

      setMe(currentUser);

      return currentUser;
    } catch {
      setMe(null);
      return null;
    }
  }

  useEffect(() => {
    setCart(getCart());
    refreshUser();

    async function openCart() {
      setCart(getCart());
      setManualPix(null);
      setOpen(true);
      await refreshUser();
    }

    function syncCart(event: Event) {
      const customEvent = event as CustomEvent<CartItem[]>;
      setCart(
        Array.isArray(customEvent.detail) ? customEvent.detail : getCart()
      );
    }

    window.addEventListener(CART_OPEN_EVENT, openCart);
    window.addEventListener(CART_UPDATED_EVENT, syncCart);

    return () => {
      window.removeEventListener(CART_OPEN_EVENT, openCart);
      window.removeEventListener(CART_UPDATED_EVENT, syncCart);
    };
  }, []);

  function handleDecrease(item: CartItem) {
    const updated = updateCartQty(
      item.id,
      item.ticketName,
      Math.max(1, item.qty - 1)
    );

    setCart(updated);
  }

  function handleIncrease(item: CartItem) {
    const updated = updateCartQty(item.id, item.ticketName, item.qty + 1);
    setCart(updated);
  }

  function handleRemove(item: CartItem) {
    const updated = removeCartItem(item.id, item.ticketName);
    setCart(updated);
  }

  async function handleCopyPix() {
    if (!manualPix) return;

    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(manualPix.pix.copyPaste);
      } else if (pixTextAreaRef.current) {
        pixTextAreaRef.current.focus();
        pixTextAreaRef.current.select();
        pixTextAreaRef.current.setSelectionRange(
          0,
          manualPix.pix.copyPaste.length
        );

        const copiedByCommand = document.execCommand("copy");

        if (!copiedByCommand) {
          throw new Error("Falha ao copiar automaticamente.");
        }
      } else {
        throw new Error("Campo Pix não encontrado.");
      }

      setCopied(true);

      setTimeout(() => {
        setCopied(false);
      }, 1800);
    } catch {
      if (pixTextAreaRef.current) {
        pixTextAreaRef.current.focus();
        pixTextAreaRef.current.select();
        pixTextAreaRef.current.setSelectionRange(
          0,
          manualPix.pix.copyPaste.length
        );
      }

      alert(
        "Não foi possível copiar automaticamente. O código Pix foi selecionado, toque em copiar manualmente."
      );
    }
  }

  async function handleCheckout() {
    if (!cart.length) return;

    try {
      setCheckoutLoading(true);

      const currentUser = await refreshUser();

      if (!currentUser) {
        window.location.href = "/login";
        return;
      }

      const res = await fetch("/api/checkout/manual-pix", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          items: cart,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Falha ao gerar Pix.");
      }

      setManualPix(data);
    } catch (error: any) {
      alert(error?.message || "Não foi possível gerar o Pix.");
    } finally {
      setCheckoutLoading(false);
    }
  }

  async function handlePaymentReported() {
    if (!manualPix) return;

    try {
      setReportingPayment(true);

      const res = await fetch(
        `/api/orders/${manualPix.orderId}/reported-payment`,
        {
          method: "POST",
          credentials: "include",
        }
      );

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || "Não foi possível informar o pagamento.");
      }

      clearCart();
      setCart([]);

      window.location.href = `/checkout/manual-pix/aguardando?orderId=${encodeURIComponent(
        manualPix.orderId
      )}`;
    } catch (error: any) {
      alert(
        error?.message || "Não foi possível informar o pagamento. Tente novamente."
      );
      setReportingPayment(false);
    }
  }

  if (pathname.startsWith("/admin") || pathname.startsWith("/api")) {
    return null;
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent className="flex h-[100dvh] max-h-[100dvh] w-full flex-col overflow-hidden border-l border-[#e8e3eb] bg-white p-0 text-[#17111f] shadow-[0_0_80px_rgba(23,17,31,0.2)] sm:max-w-[480px]">
        <SheetHeader className="shrink-0 border-b border-[#e8e3eb] bg-white px-5 py-5 sm:px-6">
          <SheetTitle className="flex items-center gap-3 text-[1.35rem] font-black tracking-[-0.03em] text-[#17111f]">
            <span className="grid size-10 place-items-center rounded-full bg-[#fff2ee] text-[#f24423]">
              <ShoppingBag className="size-[18px]" />
            </span>
            {manualPix ? "Pagamento via Pix" : "Sua sacola"}
          </SheetTitle>
        </SheetHeader>

        {manualPix ? (
          <div className="flex min-h-0 flex-1 flex-col bg-white">
            <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-4 py-5 sm:px-5">
              <div className="rounded-2xl border border-[#ffd8cc] bg-[#fff3ef] p-4">
                <p className="text-sm font-black text-zinc-950">
                  Pedido gerado com sucesso
                </p>

                <p className="mt-1 text-xs text-zinc-700">
                  Número do pedido:
                </p>

                <p className="mt-1 break-all text-sm font-bold text-zinc-950">
                  {manualPix.orderId}
                </p>
              </div>

              <div className="rounded-2xl border border-zinc-200 bg-white p-4 text-center shadow-sm sm:p-5">
                <p className="text-sm font-semibold text-zinc-500">
                  Valor do Pix
                </p>

                <p className="mt-1 text-3xl font-black text-zinc-950">
                  {formatBRL(manualPix.amount)}
                </p>

                <img
                  src={manualPix.pix.qrCodeDataUrl}
                  alt="QR Code Pix"
                  className="mx-auto mt-5 h-52 w-52 rounded-2xl border border-zinc-200 bg-white p-3 sm:h-64 sm:w-64"
                />

                <p className="mt-4 text-xs leading-relaxed text-zinc-600">
                  Escaneie o QR Code ou copie o código Pix abaixo. Depois de
                  pagar, clique no botão informando que o pagamento foi
                  efetuado.
                </p>
              </div>

              <div className="rounded-2xl border border-zinc-200 bg-white p-4">
                <p className="text-xs font-semibold uppercase text-zinc-500">
                  Pix copia e cola
                </p>

                <textarea
                  ref={pixTextAreaRef}
                  value={manualPix.pix.copyPaste}
                  readOnly
                  aria-label="Código Pix copia e cola"
                  className="mt-2 h-28 w-full resize-none rounded-xl border border-zinc-200 bg-zinc-50 p-3 text-xs text-zinc-800 outline-none"
                />

                <Button
                  type="button"
                  onClick={handleCopyPix}
                  className="mt-3 h-12 w-full rounded-full bg-[#f24423] text-base font-black text-white hover:bg-[#d93617]"
                >
                  <Copy className="mr-2 size-4" />
                  {copied ? "Pix copiado" : "Copiar código Pix"}
                </Button>
              </div>

              <div className="rounded-2xl border border-zinc-200 bg-white p-4">
                <p className="text-sm font-black text-zinc-950">Já pagou?</p>

                <p className="mt-2 text-xs leading-relaxed text-zinc-600">
                  Clique abaixo somente depois de realizar o Pix. O ingresso
                  será liberado apenas após a conferência manual do pagamento.
                </p>

                <Button
                  type="button"
                  onClick={handlePaymentReported}
                  disabled={reportingPayment}
                  className="mt-4 h-14 w-full rounded-full bg-[#f24423] text-base font-black uppercase text-white hover:bg-[#d93617] disabled:bg-zinc-200 disabled:text-zinc-500"
                >
                  <CheckCircle2 className="mr-2 size-5" />
                  {reportingPayment
                    ? "Enviando confirmação..."
                    : "Já efetuei o pagamento"}
                </Button>
              </div>
            </div>

            <div className="shrink-0 border-t border-zinc-200 bg-white px-4 py-4 shadow-[0_-8px_24px_rgba(0,0,0,0.08)] sm:px-5">
              <Button
                type="button"
                onClick={() => setManualPix(null)}
                className="h-14 w-full rounded-full border border-[#f24423] bg-white text-base font-black uppercase text-[#f24423] hover:bg-[#fff2ee]"
              >
                Voltar ao carrinho
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex min-h-0 flex-1 flex-col bg-white">
            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-5 sm:px-5">
              {cart.length === 0 && (
                <div className="rounded-[1.5rem] border border-dashed border-[#cfc7d4] bg-[#f9f7fa] p-6 text-center">
                  <p className="text-sm font-bold text-[#17111f]">
                    Sua sacola está vazia.
                  </p>

                  <p className="mt-1 text-xs text-zinc-500">
                    Escolha um evento e adicione seus ingressos.
                  </p>
                </div>
              )}

              {cart.map((item) => (
                <div
                  key={`${item.id}|${item.ticketName}`}
                  className="rounded-[1.5rem] border border-[#e8e3eb] bg-white p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="break-words text-sm font-bold text-zinc-950">
                        {item.title}
                      </p>

                      <p className="mt-1 text-xs font-medium text-zinc-500">
                        {item.ticketName}
                      </p>

                      <p className="mt-1 text-xs text-zinc-500">
                        {formatDate(item.date)}
                        {item.location ? ` — ${item.location}` : ""}
                      </p>

                      <p className="mt-2 text-sm font-semibold text-zinc-900">
                        {formatBRL(item.unitPrice)} × {item.qty} ={" "}
                        {formatBRL(item.unitPrice * item.qty)}
                      </p>
                    </div>

                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemove(item)}
                      aria-label={`Remover ${item.ticketName} da sacola`}
                      className="shrink-0 text-zinc-700 hover:bg-zinc-100 hover:text-red-600"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>

                  <div className="mt-4 flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => handleDecrease(item)}
                      aria-label={`Diminuir quantidade de ${item.ticketName}`}
                      className="rounded-full bg-white text-zinc-950"
                    >
                      <Minus className="size-4" />
                    </Button>

                    <span className="w-8 text-center text-sm font-bold text-zinc-950">
                      {item.qty}
                    </span>

                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => handleIncrease(item)}
                      aria-label={`Aumentar quantidade de ${item.ticketName}`}
                      className="rounded-full bg-white text-zinc-950"
                    >
                      <Plus className="size-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <div className="shrink-0 border-t border-[#e8e3eb] bg-white px-4 py-4 shadow-[0_-8px_24px_rgba(23,17,31,0.06)] sm:px-5">
              <div className="mb-4 flex items-center justify-between text-base text-zinc-950">
                <span className="font-semibold">Total</span>
                <span className="font-black">{formatBRL(total)}</span>
              </div>

              <Button
                className="h-14 w-full rounded-full bg-[#f24423] text-base font-black uppercase text-white hover:bg-[#d93617] disabled:bg-zinc-200 disabled:text-zinc-500"
                disabled={!cart.length || checkoutLoading}
                onClick={handleCheckout}
              >
                <Ticket className="mr-2 size-5" />
                {checkoutLoading ? "Gerando Pix..." : "Finalizar compra"}
              </Button>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
