"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ChevronDown,
  ChevronRight,
  MapPin,
  Menu,
  Search,
  ShoppingBag,
  Ticket,
  UserRound,
  X,
} from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
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

function AnimatedBrandLogo() {
  const reduceMotion = useReducedMotion();

  return (
    <Link
      href="/"
      aria-label="INGRESSE — página inicial"
      className="relative flex shrink-0 items-center rounded-lg transition-opacity hover:opacity-80"
    >
      {reduceMotion ? (
        <img
          src="/ingresse-logo.png"
          alt="INGRESSE"
          className="h-auto w-[168px] object-contain sm:w-[196px]"
        />
      ) : (
        <span
          aria-hidden="true"
          className="relative block h-[34px] w-[168px] sm:h-[40px] sm:w-[196px]"
        >
          <motion.img
            src="/ingresse-logo.png"
            alt=""
            draggable={false}
            className="pointer-events-none absolute inset-0 h-full w-full select-none object-contain grayscale"
            initial={{ opacity: 0, clipPath: "inset(0 100% 0 27%)" }}
            animate={{
              opacity: [0, 0.58, 0.58, 0],
              clipPath: [
                "inset(0 100% 0 27%)",
                "inset(0 0 0 27%)",
                "inset(0 0 0 27%)",
                "inset(0 0 0 100%)",
              ],
            }}
            transition={{
              delay: 0.16,
              duration: 1.18,
              times: [0, 0.22, 0.54, 1],
              ease: [0.22, 1, 0.36, 1],
            }}
          />

          <motion.img
            src="/ingresse-logo.png"
            alt=""
            draggable={false}
            className="pointer-events-none absolute inset-0 h-full w-full select-none object-contain"
            style={{
              clipPath: "inset(0 76% 0 0)",
              filter:
                "invert(33%) sepia(95%) saturate(3560%) hue-rotate(353deg) brightness(101%) contrast(91%)",
            }}
            initial={{ opacity: 0, scale: 0.7, x: -10, rotate: -7 }}
            animate={{
              opacity: [0, 1, 1, 0],
              scale: [0.7, 1, 0.92, 0.78],
              x: [-10, 0, 82, 132],
              rotate: [-7, 0, 5, -3],
            }}
            transition={{
              delay: 0.18,
              duration: 1.2,
              times: [0, 0.2, 0.6, 1],
              ease: [0.22, 1, 0.36, 1],
            }}
          />

          <motion.img
            src="/ingresse-logo.png"
            alt=""
            draggable={false}
            className="pointer-events-none absolute inset-0 h-full w-full select-none object-contain"
            style={{ clipPath: "inset(0 76% 0 0)" }}
            initial={{ opacity: 0, scale: 0.72, rotate: -5 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{
              delay: 1.3,
              duration: 0.5,
              ease: [0.22, 1, 0.36, 1],
            }}
          />

          <motion.img
            src="/ingresse-logo.png"
            alt=""
            draggable={false}
            className="pointer-events-none absolute inset-0 h-full w-full select-none object-contain"
            initial={{ opacity: 0, clipPath: "inset(0 0 0 100%)", x: 9 }}
            animate={{ opacity: 1, clipPath: "inset(0 0 0 27%)", x: 0 }}
            transition={{
              delay: 1.46,
              duration: 0.7,
              ease: [0.22, 1, 0.36, 1],
            }}
          />
        </span>
      )}
      <span className="sr-only">INGRESSE</span>
    </Link>
  );
}

export default function SiteHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const menuRef = useRef<HTMLDivElement | null>(null);
  const locationRef = useRef<HTMLDivElement | null>(null);
  const locationButtonRef = useRef<HTMLButtonElement | null>(null);
  const menuButtonRef = useRef<HTMLButtonElement | null>(null);
  const firstMenuLinkRef = useRef<HTMLAnchorElement | null>(null);
  const desktopSearchRef = useRef<HTMLDivElement | null>(null);
  const desktopSearchButtonRef = useRef<HTMLButtonElement | null>(null);
  const mobileSearchButtonRef = useRef<HTMLButtonElement | null>(null);
  const desktopInputRef = useRef<HTMLInputElement | null>(null);
  const mobileInputRef = useRef<HTMLInputElement | null>(null);
  const [search, setSearch] = useState("");
  const [desktopSearchOpen, setDesktopSearchOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [me, setMe] = useState<MeResponse["user"]>(null);
  const [checkingUser, setCheckingUser] = useState(true);
  const [cartCount, setCartCount] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [locationOpen, setLocationOpen] = useState(false);

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
    return () => window.removeEventListener(CART_UPDATED_EVENT, syncCart);
  }, []);

  useEffect(() => {
    async function loadUser() {
      try {
        const response = await fetch("/api/auth/me", {
          cache: "no-store",
          credentials: "include",
        });
        const data: MeResponse = await response.json();
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
    setMenuOpen(false);
    setLocationOpen(false);
    setDesktopSearchOpen(false);
    setMobileSearchOpen(false);
  }, [pathname]);

  useEffect(() => {
    function closeOnOutsideClick(event: MouseEvent) {
      const target = event.target as Node;

      if (menuRef.current && !menuRef.current.contains(target)) {
        setMenuOpen(false);
      }

      if (locationRef.current && !locationRef.current.contains(target)) {
        setLocationOpen(false);
      }

      if (
        desktopSearchRef.current &&
        !desktopSearchRef.current.contains(target)
      ) {
        setDesktopSearchOpen(false);
      }
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        const activeElement = document.activeElement;
        const returnFocus = Boolean(
          menuRef.current?.contains(activeElement)
        );
        const returnLocationFocus = Boolean(
          locationRef.current?.contains(activeElement)
        );
        const returnDesktopSearchFocus = Boolean(
          desktopSearchRef.current?.contains(activeElement)
        );
        const returnMobileSearchFocus = mobileInputRef.current === activeElement;
        setMenuOpen(false);
        setLocationOpen(false);
        setDesktopSearchOpen(false);
        setMobileSearchOpen(false);
        if (returnFocus) {
          window.requestAnimationFrame(() => menuButtonRef.current?.focus());
        } else if (returnLocationFocus) {
          window.requestAnimationFrame(() => locationButtonRef.current?.focus());
        } else if (returnDesktopSearchFocus) {
          window.requestAnimationFrame(() =>
            desktopSearchButtonRef.current?.focus()
          );
        } else if (returnMobileSearchFocus) {
          window.requestAnimationFrame(() => mobileSearchButtonRef.current?.focus());
        }
      }
    }

    document.addEventListener("mousedown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, []);

  useEffect(() => {
    if (desktopSearchOpen) {
      window.requestAnimationFrame(() => desktopInputRef.current?.focus());
    }
  }, [desktopSearchOpen]);

  useEffect(() => {
    if (mobileSearchOpen) {
      window.requestAnimationFrame(() => mobileInputRef.current?.focus());
    }
  }, [mobileSearchOpen]);

  useEffect(() => {
    if (menuOpen) {
      window.requestAnimationFrame(() => firstMenuLinkRef.current?.focus());
    }
  }, [menuOpen]);

  function updateSearch(value: string) {
    setSearch(value);
    if (pathname === "/") {
      window.dispatchEvent(
        new CustomEvent("neutralTicketSearch", { detail: value })
      );
    }
  }

  function submitSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const query = search.trim();
    setDesktopSearchOpen(false);
    setMobileSearchOpen(false);

    if (pathname === "/") {
      document.getElementById("eventos")?.scrollIntoView({
        behavior: reduceMotion ? "auto" : "smooth",
      });
      return;
    }

    router.push(query ? `/?q=${encodeURIComponent(query)}#eventos` : "/#eventos");
  }

  async function handleLogout() {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch {
      // A navegação abaixo também encerra o estado visual da sessão.
    }

    setMe(null);
    setMenuOpen(false);
    window.location.href = "/";
  }

  const mobileSearchForm = (
    <form
      role="search"
      onSubmit={submitSearch}
      className="flex h-12 flex-1 items-center rounded-full border border-[#ded8e2] bg-white px-4 focus-within:border-[#f24423]"
    >
      <label htmlFor="mobile-event-search" className="sr-only">
        Buscar eventos
      </label>
      <input
        ref={mobileInputRef}
        id="mobile-event-search"
        type="search"
        value={search}
        onChange={(event) => updateSearch(event.target.value)}
        placeholder="Busque por eventos"
        className="h-full min-w-0 flex-1 bg-transparent text-[0.875rem] text-[#17111f] outline-none placeholder:text-[#837b88]"
      />
      <button
        type="submit"
        aria-label="Pesquisar"
        className="grid size-9 shrink-0 place-items-center rounded-full text-[#f24423] transition hover:bg-[#fff2ee]"
      >
        <Search className="size-[19px]" strokeWidth={2.2} />
      </button>
    </form>
  );

  return (
    <header className="sticky top-0 z-50 w-full border-b border-[#e8e3eb] bg-white/95 backdrop-blur-xl">
      <div className="relative mx-auto flex h-[74px] w-full max-w-[1440px] items-center gap-4 px-4 sm:px-6 lg:px-8">
        <AnimatedBrandLogo />

        <div className="min-w-0 flex-1" />

        <div className="ml-auto flex shrink-0 items-center gap-1.5 sm:gap-2">
          <div
            ref={desktopSearchRef}
            className="relative hidden h-11 justify-end overflow-hidden transition-[width] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] md:flex"
            style={{
              width: desktopSearchOpen
                ? "min(390px, calc(100vw - 450px))"
                : "44px",
            }}
          >
            <form
              role="search"
              onSubmit={(event) => {
                if (!desktopSearchOpen) {
                  event.preventDefault();
                  setMenuOpen(false);
                  setDesktopSearchOpen(true);
                  return;
                }
                submitSearch(event);
              }}
              className={`absolute inset-0 flex h-11 w-full items-center rounded-full bg-white transition-[border-color,box-shadow,padding] duration-300 focus-within:border-[#f24423] ${
                desktopSearchOpen
                  ? "border border-[#17111f] pl-4 shadow-[0_8px_26px_rgba(23,17,31,0.08)]"
                  : "border border-transparent p-0 shadow-none"
              }`}
            >
              <label htmlFor="desktop-event-search" className="sr-only">
                Buscar eventos
              </label>
              <input
                ref={desktopInputRef}
                id="desktop-event-search"
                type="search"
                value={search}
                tabIndex={desktopSearchOpen ? 0 : -1}
                aria-hidden={!desktopSearchOpen}
                onChange={(event) => updateSearch(event.target.value)}
                placeholder="Busque por eventos"
                className="h-full min-w-0 flex-1 bg-transparent text-[0.875rem] text-[#17111f] outline-none placeholder:text-[#837b88]"
              />
              <button
                ref={desktopSearchButtonRef}
                type="submit"
                aria-label={desktopSearchOpen ? "Pesquisar" : "Abrir busca"}
                className={`grid size-11 shrink-0 place-items-center rounded-full transition ${
                  desktopSearchOpen
                    ? "text-[#f24423] hover:bg-[#fff2ee]"
                    : "text-[#17111f] hover:bg-[#f7f5f8]"
                }`}
              >
                <Search
                  className={desktopSearchOpen ? "size-[19px]" : "size-5"}
                  strokeWidth={desktopSearchOpen ? 2.2 : 2}
                />
              </button>
            </form>
          </div>

          <div ref={locationRef} className="relative hidden lg:block">
            <button
              ref={locationButtonRef}
              type="button"
              aria-expanded={locationOpen}
              aria-controls="location-menu"
              onClick={() => {
                setMenuOpen(false);
                setLocationOpen((current) => !current);
              }}
              className="flex h-11 items-center gap-2 rounded-full px-3 text-[0.75rem] font-black uppercase tracking-[0.07em] text-[#302936] transition hover:bg-[#fff2ee] hover:text-[#f24423]"
            >
              <MapPin className="size-[19px] text-[#f24423]" />
              Brasil
              <ChevronDown className={`size-4 transition-transform ${locationOpen ? "rotate-180" : ""}`} />
            </button>
            <AnimatePresence>
              {locationOpen && (
                <motion.div
                  id="location-menu"
                  initial={reduceMotion ? false : { opacity: 0, y: -7, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -5, scale: 0.98 }}
                  transition={{ duration: reduceMotion ? 0 : 0.2 }}
                  className="absolute left-0 mt-3 w-60 rounded-3xl border border-[#ffd8ce] bg-white p-2 shadow-[0_22px_60px_rgba(242,68,35,0.16)]"
                >
                  <button
                    type="button"
                    onClick={() => {
                      setLocationOpen(false);
                      document.getElementById("eventos")?.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" });
                    }}
                    className="flex w-full items-center gap-3 rounded-2xl bg-[#fff2ee] px-4 py-3 text-left text-[0.875rem] font-bold text-[#302936]"
                  >
                    <span aria-hidden="true" className="text-lg">🇧🇷</span>
                    Brasil
                    <span className="ml-auto size-2 rounded-full bg-[#f24423]" />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <button
            ref={mobileSearchButtonRef}
            type="button"
            onClick={() => {
              setMenuOpen(false);
              setMobileSearchOpen(true);
            }}
            aria-label="Abrir busca"
            className="grid size-11 place-items-center rounded-full text-[#17111f] transition hover:bg-[#f7f5f8] md:hidden"
          >
            <Search className="size-5" />
          </button>

          {!checkingUser && me && (
            <Link
              href="/account"
              className="hidden h-11 items-center gap-2 rounded-full px-3 text-[0.8125rem] font-black uppercase tracking-[0.045em] text-[#302936] transition hover:bg-[#fff2ee] hover:text-[#f24423] lg:flex"
            >
              <Ticket className="size-[19px] text-[#f24423]" />
              Meus ingressos
            </Link>
          )}

          {!checkingUser && me && (
            <button
              type="button"
              onClick={openCart}
              aria-label={`Abrir sacola${cartCount ? `, ${cartCount} item(ns)` : ""}`}
              className="relative grid size-11 place-items-center rounded-full text-[#17111f] transition hover:bg-[#f7f5f8]"
            >
              <ShoppingBag className="size-[21px]" strokeWidth={2.1} />
              {cartCount > 0 && (
                <span className="absolute right-0 top-0 grid h-5 min-w-5 place-items-center rounded-full bg-[#f24423] px-1 text-[0.6875rem] font-black text-white">
                  {cartCount}
                </span>
              )}
            </button>
          )}

          <div className="hidden h-8 items-center gap-2 border-l border-[#e8e3eb] pl-4 text-[0.8125rem] font-black text-[#17111f] xl:flex">
            <span aria-hidden="true" className="text-lg">🇧🇷</span>
            PT
          </div>

          {!checkingUser && !me && (
            <Link
              href="/login"
              className="hidden h-11 items-center justify-center rounded-full bg-[#f24423] px-5 text-[0.875rem] font-bold text-white shadow-[0_8px_22px_rgba(242,68,35,0.22)] transition hover:-translate-y-0.5 hover:bg-[#d93617] sm:flex"
            >
              Acessar
            </Link>
          )}

          <div ref={menuRef} className="relative">
            <button
              ref={menuButtonRef}
              type="button"
              onClick={() => {
                setDesktopSearchOpen(false);
                setMobileSearchOpen(false);
                setLocationOpen(false);
                setMenuOpen((current) => !current);
              }}
              aria-label={menuOpen ? "Fechar menu" : "Abrir menu"}
              aria-expanded={menuOpen}
              aria-controls="account-menu"
              className="grid size-11 place-items-center rounded-full border border-[#ffd0c4] bg-white text-[#f24423] transition hover:border-[#f24423] hover:bg-[#fff2ee]"
            >
              {menuOpen ? (
                <X className="size-5" />
              ) : me ? (
                <span className="flex items-center gap-0.5">
                  <UserRound className="size-5" />
                  <ChevronDown className="size-3.5" />
                </span>
              ) : (
                <Menu className="size-5" />
              )}
            </button>

            <AnimatePresence>
              {menuOpen && (
                <motion.div
                  initial={reduceMotion ? false : { opacity: 0, y: -8, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={
                    reduceMotion
                      ? { opacity: 0 }
                      : { opacity: 0, y: -6, scale: 0.98 }
                  }
                  transition={
                    reduceMotion
                      ? { duration: 0 }
                      : { duration: 0.22, ease: [0.22, 1, 0.36, 1] }
                  }
                  id="account-menu"
                  className="absolute right-0 mt-3 w-[min(19rem,calc(100vw-2rem))] overflow-hidden rounded-3xl border border-[#e8e3eb] bg-white p-2 shadow-[0_24px_70px_rgba(23,17,31,0.16)]"
                >
                  {me ? (
                    <div className="rounded-2xl bg-[#f7f5f8] px-4 py-3">
                      <p className="text-[0.75rem] font-semibold uppercase tracking-[0.08em] text-[#837b88]">
                        Sua conta
                      </p>
                      <p className="mt-1 truncate text-[0.9375rem] font-bold text-[#17111f]">
                        {me.name || me.email}
                      </p>
                    </div>
                  ) : (
                    <div className="px-3 py-3">
                      <p className="text-[0.8125rem] leading-relaxed text-[#6f6875]">
                        Entre para acompanhar compras e acessar seus ingressos.
                      </p>
                    </div>
                  )}

                  <nav aria-label="Menu da conta" className="mt-1">
                    <Link
                      ref={firstMenuLinkRef}
                      href="/#eventos"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-3 rounded-2xl px-3 py-3 text-[0.9375rem] font-semibold text-[#302936] transition hover:bg-[#f7f5f8]"
                    >
                      <Ticket className="size-[18px] text-[#f24423]" />
                      Explorar eventos
                      <ChevronRight className="ml-auto size-4 text-[#a49ca8]" />
                    </Link>

                    {me ? (
                      <>
                        <Link
                          href="/account"
                          onClick={() => setMenuOpen(false)}
                          className="flex items-center gap-3 rounded-2xl px-3 py-3 text-[0.9375rem] font-semibold text-[#302936] transition hover:bg-[#f7f5f8]"
                        >
                          <UserRound className="size-[18px] text-[#f24423]" />
                          Meus ingressos
                          <ChevronRight className="ml-auto size-4 text-[#a49ca8]" />
                        </Link>
                        <button
                          type="button"
                          onClick={handleLogout}
                          className="mt-1 w-full rounded-2xl px-3 py-3 text-left text-[0.875rem] font-bold text-[#d93617] transition hover:bg-[#fff2ee]"
                        >
                          Sair da conta
                        </button>
                      </>
                    ) : (
                      <div className="mt-2 border-t border-[#eee9f0] pt-2">
                        <Link
                          href="/login"
                          onClick={() => setMenuOpen(false)}
                          className="flex h-11 items-center justify-center rounded-full bg-[#f24423] px-5 text-[0.8125rem] font-bold text-white shadow-[0_8px_22px_rgba(242,68,35,0.2)] transition hover:bg-[#d93617]"
                        >
                          Entrar ou criar conta
                        </Link>
                      </div>
                    )}
                  </nav>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <AnimatePresence>
          {mobileSearchOpen && (
            <motion.div
              initial={
                reduceMotion
                  ? false
                  : { opacity: 0, clipPath: "inset(0 0 0 78%)" }
              }
              animate={{ opacity: 1, clipPath: "inset(0 0 0 0)" }}
              exit={
                reduceMotion
                  ? { opacity: 0 }
                  : { opacity: 0, clipPath: "inset(0 0 0 78%)" }
              }
              transition={
                reduceMotion
                  ? { duration: 0 }
                  : { duration: 0.42, ease: [0.22, 1, 0.36, 1] }
              }
              className="absolute inset-0 z-[90] flex items-center gap-2 bg-white px-4 md:hidden"
            >
              {mobileSearchForm}
              <button
                type="button"
                onClick={() => {
                  setMobileSearchOpen(false);
                  window.requestAnimationFrame(() =>
                    mobileSearchButtonRef.current?.focus()
                  );
                }}
                aria-label="Fechar busca"
                className="grid size-11 shrink-0 place-items-center rounded-full text-[#17111f] transition hover:bg-[#f7f5f8]"
              >
                <X className="size-5" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
}
