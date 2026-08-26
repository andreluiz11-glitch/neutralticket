"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type Me = { id: string; email: string; name?: string | null } | null;

type OrderItem = {
  id: string;
  eventSlug: string;
  ticketName: string;
  unitPrice: number;
  qty: number;
  createdAt: string;
};

type Order = {
  id: string;
  status: string;
  total: number; // centavos
  createdAt: string;
  items: OrderItem[];
};

export default function AccountPage() {
  const [me, setMe] = useState<Me>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const r1 = await fetch("/api/auth/me", { cache: "no-store" });
        const d1 = await r1.json();
        setMe(d1.user);

        if (d1.user) {
          const r2 = await fetch("/api/orders/my", { cache: "no-store" });
          const d2 = await r2.json();
          setOrders(Array.isArray(d2) ? d2 : []);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <div className="p-6">Carregando…</div>;

  if (!me)
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <Card className="w-full max-w-md">
          <CardHeader><CardTitle>Minha conta</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <p>Você precisa estar logado para ver seus dados e histórico.</p>
            <div className="flex gap-2">
              <Button onClick={() => (location.href = "/login")}>Entrar</Button>
              <Button variant="outline" onClick={() => (location.href = "/signup")}>Criar conta</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardHeader><CardTitle>Perfil</CardTitle></CardHeader>
          <CardContent className="space-y-1">
            <p><strong>Nome:</strong> {me.name || "—"}</p>
            <p><strong>Email:</strong> {me.email}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Meus pedidos</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {orders.length === 0 ? (
              <p className="text-sm text-zinc-600">Você ainda não possui pedidos.</p>
            ) : (
              orders.map((o) => (
                <div key={o.id} className="border rounded-lg p-3">
                  <div className="flex items-center justify-between text-sm">
                    <div>
                      <p><strong>Pedido:</strong> {o.id}</p>
                      <p><strong>Status:</strong> {o.status}</p>
                    </div>
                    <div className="text-right">
                      <p><strong>Total:</strong> {(o.total / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</p>
                      <p className="text-xs text-zinc-500">{new Date(o.createdAt).toLocaleString("pt-BR")}</p>
                    </div>
                  </div>
                  <div className="mt-3 text-sm">
                    {o.items?.length ? (
                      <ul className="list-disc list-inside space-y-1">
                        {o.items.map((it) => (
                          <li key={it.id}>
                            {it.ticketName} — {(it.unitPrice / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })} × {it.qty} <span className="text-xs text-zinc-500">({it.eventSlug})</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-zinc-500">Sem itens registrados.</p>
                    )}
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
