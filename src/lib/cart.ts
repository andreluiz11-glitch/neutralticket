export type CartItem = {
  id: string;
  title: string;
  date?: string;
  location?: string;
  ticketName: string;
  unitPrice: number;
  qty: number;
};

export const CART_KEY = "neutralTicket:cart";
export const CART_UPDATED_EVENT = "neutralTicketCartUpdated";
export const CART_OPEN_EVENT = "neutralTicketOpenCart";

export function getCart(): CartItem[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = localStorage.getItem(CART_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed
      .filter(
        (item) =>
          item &&
          typeof item === "object" &&
          typeof item.id === "string" &&
          typeof item.title === "string" &&
          typeof item.ticketName === "string" &&
          typeof item.unitPrice === "number" &&
          typeof item.qty === "number"
      )
      .map((item) => ({
        ...item,
        qty: Math.max(1, Math.floor(item.qty)),
      }));
  } catch {
    return [];
  }
}

export function saveCart(items: CartItem[]) {
  if (typeof window === "undefined") return;

  localStorage.setItem(CART_KEY, JSON.stringify(items));
  window.dispatchEvent(
    new CustomEvent<CartItem[]>(CART_UPDATED_EVENT, {
      detail: items,
    })
  );
}

export function openCart() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(CART_OPEN_EVENT));
}

export function getCartCount(items = getCart()) {
  return items.reduce((total, item) => total + item.qty, 0);
}

export function getCartTotal(items = getCart()) {
  return items.reduce((total, item) => total + item.unitPrice * item.qty, 0);
}

export function addCartItem(item: CartItem) {
  const current = getCart();
  const safeQty = Math.max(1, Math.floor(item.qty || 1));
  const key = `${item.id}|${item.ticketName}`;

  const index = current.findIndex(
    (cartItem) => `${cartItem.id}|${cartItem.ticketName}` === key
  );

  let updated: CartItem[];

  if (index >= 0) {
    updated = [...current];
    updated[index] = {
      ...updated[index],
      qty: updated[index].qty + safeQty,
    };
  } else {
    updated = [
      ...current,
      {
        ...item,
        qty: safeQty,
      },
    ];
  }

  saveCart(updated);
  return updated;
}

export function removeCartItem(id: string, ticketName: string) {
  const updated = getCart().filter(
    (item) => !(item.id === id && item.ticketName === ticketName)
  );

  saveCart(updated);
  return updated;
}

export function updateCartQty(id: string, ticketName: string, qty: number) {
  const safeQty = Math.max(1, Math.floor(qty || 1));

  const updated = getCart().map((item) =>
    item.id === id && item.ticketName === ticketName
      ? {
          ...item,
          qty: safeQty,
        }
      : item
  );

  saveCart(updated);
  return updated;
}

export function clearCart() {
  saveCart([]);
}