"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import {
  CART_UPDATED_EVENT,
  CartItem,
  getCart,
  getCartCount,
  openCart,
} from "@/lib/cart";

type MeResponse = {
  user: {
    id: string;
    email: string;
    name?: string | null;
  } | null;
};

export default function SiteHeader() {
  const pathname = usePathname();
  const menuRef = useRef<HTMLDivElement | null>(null);

  const [search, setSearch] = useState("");
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [me, setMe] = useState<MeResponse["user"]>(null);
  const [checkingUser, setCheckingUser] = useState(true);
  const [cartCount, setCartCount] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setCartCount(getCartCount());

    function syncCart(event: Event) {
      const customEvent = event as CustomEvent<CartItem[]>;
      const items = Array.isArray(customEvent.detail)
        ? customEvent.detail
        : getCart();

      setCartCount(getCartCount(items));
    }

    window.addEventListener(CART_UPDATED_EVENT, syncCart);

    return () => {
      window.removeEventListener(CART_UPDATED_EVENT, syncCart);
    };
  }, []);

  useEffect(() => {
    async function loadUser() {
      try {
        const res = await fetch("/api/auth/me", {
          cache: "no-store",
          credentials: "include",
        });

        const data: MeResponse = await res.json();
        setMe(data.user || null);
      } catch {
        setMe(null);
      } finally {
        setCheckingUser(false);
      }
    }

    loadUser();
  }, [pathname]);

  useEffect(() => {
    function closeOnOutsideClick(event: MouseEvent) {
      if (!menuRef.current) return;

      if (!menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }

    if (menuOpen) {
      document.addEventListener("mousedown", closeOnOutsideClick);
    }

    return () => {
      document.removeEventListener("mousedown", closeOnOutsideClick);
    };
  }, [menuOpen]);

  function handleSearch(value: string) {
    setSearch(value);

    window.dispatchEvent(
      new CustomEvent("neutralTicketSearch", {
        detail: value,
      })
    );
  }

  async function handleLogout() {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch {}

    setMe(null);
    setMenuOpen(false);
    window.location.href = "/";
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-zinc-200 bg-white">
      <div className="relative flex h-[82px] w-full items-center gap-3 px-4 sm:gap-6 sm:px-8 lg:px-10">
        <Link
          href="/"
          aria-label="Voltar para a página inicial"
          className="flex shrink-0 items-center transition-opacity hover:opacity-80"
        >
          <img
            src="/logotipo-clube.png"
            alt="Clube do Ingresso"
            className="h-[50px] w-auto object-contain sm:h-[58px]"
          />
        </Link>

        <div className="hidden flex-1 items-center md:flex">
          <div className="flex h-[46px] w-full max-w-[430px] items-center rounded-lg border border-zinc-900 bg-white px-4">
            <Search className="mr-2 size-5 text-zinc-500" />

            <input
              type="text"
              value={search}
              onChange={(event) => handleSearch(event.target.value)}
              placeholder="Buscar por eventos, locais..."
              className="h-full w-full bg-transparent text-sm text-zinc-700 outline-none placeholder:text-zinc-500"
            />
          </div>
        </div>

        <div className="ml-auto flex shrink-0 items-center gap-2 sm:gap-4">
          <button
            type="button"
            onClick={() => setMobileSearchOpen(true)}
            aria-label="Abrir busca"
            className="flex h-12 w-12 items-center justify-center rounded-xl border border-zinc-300 bg-white text-zinc-900 transition hover:bg-zinc-100 md:hidden"
          >
            <Search className="size-6" />
          </button>

          {!checkingUser && !me && (
            <>
              <Link
                href="/signup"
                className="hidden h-[48px] min-w-[112px] items-center justify-center rounded-lg border border-zinc-900 bg-white px-5 text-base font-bold text-zinc-950 transition hover:bg-zinc-100 sm:flex"
              >
                Criar conta
              </Link>

              <Link
                href="/login"
                className="hidden h-[48px] min-w-[96px] items-center justify-center rounded-lg border border-zinc-900 bg-white px-6 text-base font-bold text-zinc-950 transition hover:bg-zinc-100 sm:flex"
              >
                Entrar
              </Link>
            </>
          )}

          {!checkingUser && me && (
            <button
              type="button"
              onClick={openCart}
              aria-label="Abrir carrinho"
              className="relative flex h-12 w-12 items-center justify-center rounded-xl bg-white text-zinc-800 transition hover:text-zinc-950"
            >
              <svg
                width="30"
                height="30"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="8" cy="21" r="1" />
                <circle cx="19" cy="21" r="1" />
                <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h8.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
              </svg>

              {cartCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-orange-500 px-1 text-xs font-bold text-black">
                  {cartCount}
                </span>
              )}
            </button>
          )}

          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setMenuOpen((current) => !current)}
              aria-label="Abrir menu"
              className="flex h-12 w-12 flex-col items-center justify-center gap-1.5 rounded-xl border border-zinc-300 bg-white transition hover:bg-zinc-100 sm:h-14 sm:w-14"
            >
              <span className="h-0.5 w-6 rounded bg-zinc-900" />
              <span className="h-0.5 w-6 rounded bg-zinc-900" />
              <span className="h-0.5 w-6 rounded bg-zinc-900" />
            </button>

            {menuOpen && (
              <div className="absolute right-0 mt-3 w-64 rounded-2xl border border-zinc-200 bg-white p-2 shadow-xl">
                {me ? (
                  <>
                    <div className="px-3 py-3">
                      <p className="text-xs text-zinc-500">Logado como</p>
                      <p className="truncate text-sm font-semibold text-zinc-950">
                        {me.name || me.email}
                      </p>
                    </div>

                    <div className="my-1 h-px bg-zinc-200" />

                    <Link
                      href="/account"
                      onClick={() => setMenuOpen(false)}
                      className="block rounded-xl px-3 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-100"
                    >
                      Minhas compras
                    </Link>

                    <Link
                      href="/account?tab=profile"
                      onClick={() => setMenuOpen(false)}
                      className="block rounded-xl px-3 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-100"
                    >
                      Meu cadastro
                    </Link>

                    <Link
                      href="/"
                      onClick={() => setMenuOpen(false)}
                      className="block rounded-xl px-3 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-100"
                    >
                      Página principal
                    </Link>

                    <div className="my-1 h-px bg-zinc-200" />

                    <button
                      type="button"
                      onClick={handleLogout}
                      className="w-full rounded-xl px-3 py-2 text-left text-sm font-medium text-red-600 hover:bg-red-50"
                    >
                      Sair
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      href="/login"
                      onClick={() => setMenuOpen(false)}
                      className="block rounded-xl px-3 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-100"
                    >
                      Entrar
                    </Link>

                    <Link
                      href="/signup"
                      onClick={() => setMenuOpen(false)}
                      className="block rounded-xl px-3 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-100"
                    >
                      Criar conta
                    </Link>

                    <Link
                      href="/"
                      onClick={() => setMenuOpen(false)}
                      className="block rounded-xl px-3 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-100"
                    >
                      Página principal
                    </Link>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {mobileSearchOpen && (
          <div className="absolute inset-x-0 top-0 z-[90] flex h-[82px] items-center gap-3 border-b border-zinc-200 bg-white px-4 md:hidden">
            <div className="flex h-12 flex-1 items-center rounded-xl border border-zinc-900 bg-white px-4">
              <Search className="mr-2 size-5 shrink-0 text-zinc-500" />

              <input
                autoFocus
                type="text"
                value={search}
                onChange={(event) => handleSearch(event.target.value)}
                placeholder="Buscar eventos..."
                className="h-full w-full bg-transparent text-base text-zinc-800 outline-none placeholder:text-zinc-500"
              />
            </div>

            <button
              type="button"
              onClick={() => {
                setMobileSearchOpen(false);
                handleSearch("");
              }}
              aria-label="Fechar busca"
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-zinc-300 bg-white text-zinc-900"
            >
              <X className="size-6" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
}