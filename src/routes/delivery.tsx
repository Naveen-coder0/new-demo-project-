import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useCallback } from "react";
import { Truck, Package, MapPin, Phone, CheckCircle2 } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import PortalShell, { StatCard, AuthGate } from "@/components/portal/PortalShell";
import { getDeliveryOrders, markDelivered } from "@/lib/order.functions";

export const Route = createFileRoute("/delivery")({
  component: () => (
    <AuthGate allow={["DELIVERY", "ADMIN"]}>
      <DeliveryPortal />
    </AuthGate>
  ),
});

const ACCENT = "oklch(0.6 0.15 250)";

function DeliveryPortal() {
  const [tab, setTab] = useState("active");
  return (
    <PortalShell
      title="Delivery Portal"
      subtitle="Active deliveries"
      accent={ACCENT}
      active={tab}
      onNavigate={setTab}
      nav={[{ key: "active", label: "Active Deliveries", icon: <Truck className="w-4 h-4" /> }]}
    >
      <Deliveries />
    </PortalShell>
  );
}

function Deliveries() {
  const list = useServerFn(getDeliveryOrders);
  const deliver = useServerFn(markDelivered);
  const [orders, setOrders] = useState<any[]>([]);
  const load = useCallback(() => { list().then(setOrders).catch(() => {}); }, [list]);
  useEffect(() => { load(); }, []);

  async function done(orderId: string) {
    await deliver({ data: { orderId } });
    load();
  }

  const outForDelivery = orders.filter((o) => o.status === "OUT_FOR_DELIVERY").length;

  return (
    <div>
      <h2 className="text-2xl font-heading text-foreground mb-5">Active Deliveries</h2>
      <div className="grid grid-cols-2 gap-4 mb-6">
        <StatCard label="To Pick Up" value={orders.length - outForDelivery} icon={<Package className="w-4 h-4 text-primary" />} />
        <StatCard label="Out for Delivery" value={outForDelivery} icon={<Truck className="w-4 h-4 text-primary" />} />
      </div>

      {orders.length === 0 ? (
        <div className="p-10 rounded-2xl bg-background border border-border text-center text-muted-foreground">No deliveries right now.</div>
      ) : (
        <div className="space-y-3">
          {orders.map((o) => (
            <div key={o.id} className="p-5 rounded-2xl bg-background border border-border">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-sm font-medium text-foreground">#{o.id.slice(-6)} • from {o.shopName}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${o.status === "OUT_FOR_DELIVERY" ? "bg-amber-100 text-amber-700" : "bg-purple-100 text-purple-700"}`}>
                    {o.status.replace(/_/g, " ")}
                  </span>
                </div>
                <span className="text-sm font-semibold text-foreground">
                  {o.paymentMethod === "cod" ? `Collect ₹${o.total.toLocaleString("en-IN")}` : "Prepaid"}
                </span>
              </div>
              <div className="space-y-1.5 mb-4 text-sm">
                <p className="flex items-center gap-2 text-foreground"><span className="font-medium">{o.customer}</span></p>
                <p className="flex items-center gap-2 text-muted-foreground"><MapPin className="w-3.5 h-3.5" />{o.address}</p>
                <a href={`tel:${o.phone}`} className="flex items-center gap-2 text-primary"><Phone className="w-3.5 h-3.5" />{o.phone}</a>
              </div>
              <button onClick={() => done(o.id)} className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium inline-flex items-center justify-center gap-2">
                <CheckCircle2 className="w-4 h-4" />Mark Delivered
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
