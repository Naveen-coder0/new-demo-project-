import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { User, Package, Heart, MapPin } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import PortalShell, { StatCard, AuthGate } from "@/components/portal/PortalShell";
import { useAuth } from "@/context/auth-store";
import { useWearbuy } from "@/context/wearbuy-store";
import { getMyOrders } from "@/lib/order.functions";

export const Route = createFileRoute("/account")({
  component: () => (
    <AuthGate allow={["USER", "ADMIN", "SHOP_OWNER", "DELIVERY"]}>
      <AccountPortal />
    </AuthGate>
  ),
});

const ACCENT = "oklch(0.3 0.04 50)";

function AccountPortal() {
  const [tab, setTab] = useState("profile");
  return (
    <PortalShell
      title="My Account"
      subtitle="Your orders & details"
      accent={ACCENT}
      active={tab}
      onNavigate={setTab}
      nav={[
        { key: "profile", label: "Profile", icon: <User className="w-4 h-4" /> },
        { key: "orders", label: "My Orders", icon: <Package className="w-4 h-4" /> },
        { key: "wishlist", label: "Wishlist", icon: <Heart className="w-4 h-4" /> },
      ]}
    >
      {tab === "profile" && <Profile />}
      {tab === "orders" && <Orders />}
      {tab === "wishlist" && <Wishlist />}
    </PortalShell>
  );
}

function Profile() {
  const { dbUser, firebaseUser } = useAuth();
  const { cart, wishlist } = useWearbuy();
  return (
    <div>
      <h2 className="text-2xl font-heading text-foreground mb-5">Profile</h2>
      <div className="flex items-center gap-4 p-6 rounded-2xl bg-background border border-border mb-6">
        {firebaseUser?.photoURL ? (
          <img src={firebaseUser.photoURL} alt="" className="w-16 h-16 rounded-full object-cover" />
        ) : (
          <div className="w-16 h-16 rounded-full bg-accent flex items-center justify-center">
            <User className="w-7 h-7 text-primary" />
          </div>
        )}
        <div>
          <h3 className="text-lg text-foreground font-medium">{dbUser?.name ?? firebaseUser?.displayName ?? "WearBuy User"}</h3>
          <p className="text-sm text-muted-foreground">{dbUser?.email ?? firebaseUser?.email}</p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <StatCard label="In Cart" value={cart.length} icon={<Package className="w-4 h-4 text-primary" />} />
        <StatCard label="Wishlist" value={wishlist.length} icon={<Heart className="w-4 h-4 text-primary" />} />
      </div>
    </div>
  );
}

function Orders() {
  const { firebaseUser } = useAuth();
  const fn = useServerFn(getMyOrders);
  const [orders, setOrders] = useState<any[]>([]);
  useEffect(() => {
    if (firebaseUser) fn({ data: { userUid: firebaseUser.uid } }).then(setOrders).catch(() => {});
  }, [firebaseUser, fn]);
  return (
    <div>
      <h2 className="text-2xl font-heading text-foreground mb-5">My Orders</h2>
      {orders.length === 0 ? (
        <div className="p-10 rounded-2xl bg-background border border-border text-center text-muted-foreground">
          No orders yet. Start shopping!
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((o) => (
            <div key={o.id} className="p-5 rounded-2xl bg-background border border-border">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-sm font-medium text-foreground">Order #{o.id.slice(-6)}</p>
                  <p className="text-xs text-muted-foreground">{o.shopName} • {new Date(o.createdAt).toLocaleDateString()}</p>
                </div>
                <StatusBadge status={o.status} />
              </div>
              <div className="flex gap-2 mb-3">
                {o.items.slice(0, 4).map((i: any, idx: number) => (
                  i.image ? <img key={idx} src={i.image} alt={i.name} className="w-12 h-14 rounded-lg object-cover" /> : null
                ))}
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{o.items.length} item(s)</span>
                <span className="font-semibold text-foreground">₹{o.total.toLocaleString("en-IN")}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Wishlist() {
  const { wishlist } = useWearbuy();
  return (
    <div>
      <h2 className="text-2xl font-heading text-foreground mb-5">Wishlist</h2>
      {wishlist.length === 0 ? (
        <div className="p-10 rounded-2xl bg-background border border-border text-center text-muted-foreground">
          No saved items yet.
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {wishlist.map((p) => (
            <div key={p.id} className="rounded-2xl bg-background border border-border overflow-hidden hover-lift">
              <img src={p.image} alt={p.name} className="w-full aspect-[3/4] object-cover" />
              <div className="p-3">
                <p className="text-sm text-foreground truncate">{p.name}</p>
                <p className="text-sm text-primary font-medium">{p.price}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    PLACED: "bg-blue-100 text-blue-700",
    CONFIRMED: "bg-blue-100 text-blue-700",
    PACKED: "bg-purple-100 text-purple-700",
    OUT_FOR_DELIVERY: "bg-amber-100 text-amber-700",
    DELIVERED: "bg-green-100 text-green-700",
    CANCELLED: "bg-destructive/10 text-destructive",
  };
  return <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${map[status] ?? "bg-accent text-foreground"}`}>{status.replace(/_/g, " ")}</span>;
}
