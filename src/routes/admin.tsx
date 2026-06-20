import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { LayoutDashboard, Users, Store, ShoppingCart, Check, Ban, Clock, Truck } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import PortalShell, { StatCard, AuthGate } from "@/components/portal/PortalShell";
import {
  getAdminStats,
  getAllUsers,
  getAllShops,
  getAllOrders,
  updateShopStatus,
  type AdminStats,
} from "@/lib/admin.functions";
import { setUserBlocked } from "@/lib/user.functions";
import { getAllDeliveryPartners, updateDeliveryStatus } from "@/lib/delivery.functions";

export const Route = createFileRoute("/admin")({
  component: () => (
    <AuthGate allow={["ADMIN"]}>
      <AdminPortal />
    </AuthGate>
  ),
});

const ACCENT = "oklch(0.55 0.18 25)";

function AdminPortal() {
  const [tab, setTab] = useState("dashboard");
  return (
    <PortalShell
      title="Admin Portal"
      subtitle="Full platform control"
      accent={ACCENT}
      active={tab}
      onNavigate={setTab}
      nav={[
        { key: "dashboard", label: "Dashboard", icon: <LayoutDashboard className="w-4 h-4" /> },
        { key: "shops", label: "Shops", icon: <Store className="w-4 h-4" /> },
        { key: "delivery", label: "Delivery Partners", icon: <Truck className="w-4 h-4" /> },
        { key: "users", label: "Users", icon: <Users className="w-4 h-4" /> },
        { key: "orders", label: "Orders", icon: <ShoppingCart className="w-4 h-4" /> },
      ]}
    >
      {tab === "dashboard" && <Dashboard />}
      {tab === "shops" && <Shops />}
      {tab === "delivery" && <DeliveryPartners />}
      {tab === "users" && <UsersTab />}
      {tab === "orders" && <Orders />}
    </PortalShell>
  );
}

function Dashboard() {
  const fn = useServerFn(getAdminStats);
  const [stats, setStats] = useState<AdminStats | null>(null);
  useEffect(() => {
    fn().then(setStats).catch(() => {});
  }, [fn]);

  const chartData = [
    { name: "Users", value: stats?.totalUsers ?? 0 },
    { name: "Shops", value: stats?.totalShops ?? 0 },
    { name: "Products", value: stats?.totalProducts ?? 0 },
    { name: "Orders", value: stats?.totalOrders ?? 0 },
  ];

  return (
    <div>
      <h2 className="text-2xl font-heading text-foreground mb-5">Overview</h2>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <StatCard label="Total Users" value={stats?.totalUsers ?? "—"} icon={<Users className="w-4 h-4 text-primary" />} />
        <StatCard label="Total Shops" value={stats?.totalShops ?? "—"} icon={<Store className="w-4 h-4 text-primary" />} />
        <StatCard label="Products" value={stats?.totalProducts ?? "—"} icon={<LayoutDashboard className="w-4 h-4 text-primary" />} />
        <StatCard label="Orders" value={stats?.totalOrders ?? "—"} icon={<ShoppingCart className="w-4 h-4 text-primary" />} />
        <StatCard label="Revenue" value={stats ? `₹${stats.revenue.toLocaleString("en-IN")}` : "—"} icon={<ShoppingCart className="w-4 h-4 text-primary" />} />
        <StatCard label="Pending Shops" value={stats?.pendingShops ?? "—"} icon={<Clock className="w-4 h-4 text-primary" />} />
      </div>

      {stats && (
        <div className="rounded-2xl bg-background border border-border p-5">
          <h3 className="text-sm font-medium text-foreground mb-4">Platform Overview</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.22 0.025 50 / 0.1)" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="oklch(0.48 0.025 50)" />
                <YAxis tick={{ fontSize: 12 }} stroke="oklch(0.48 0.025 50)" />
                <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid oklch(0.22 0.025 50 / 0.1)" }} />
                <Bar dataKey="value" fill="oklch(0.3 0.04 50)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}

function Shops() {
  const list = useServerFn(getAllShops);
  const update = useServerFn(updateShopStatus);
  const [shops, setShops] = useState<any[]>([]);
  const load = () => list().then(setShops).catch(() => {});
  useEffect(() => { load(); }, []);
  async function setStatus(shopId: string, status: "ACTIVE" | "SUSPENDED") {
    await update({ data: { shopId, status } });
    load();
  }
  return (
    <div>
      <h2 className="text-2xl font-heading text-foreground mb-5">Shops</h2>
      <div className="rounded-2xl bg-background border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-secondary/50 text-muted-foreground">
            <tr>
              <th className="text-left px-4 py-3 font-medium">Shop</th>
              <th className="text-left px-4 py-3 font-medium hidden sm:table-cell">Owner</th>
              <th className="text-left px-4 py-3 font-medium">Status</th>
              <th className="text-left px-4 py-3 font-medium hidden md:table-cell">Products</th>
              <th className="text-right px-4 py-3 font-medium">Action</th>
            </tr>
          </thead>
          <tbody>
            {shops.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">No shops yet.</td></tr>
            )}
            {shops.map((s) => (
              <tr key={s.id} className="border-t border-border">
                <td className="px-4 py-3 text-foreground font-medium">{s.name}<div className="text-xs text-muted-foreground">{s.category}</div></td>
                <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">{s.ownerEmail}</td>
                <td className="px-4 py-3"><StatusBadge status={s.status} /></td>
                <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{s.productCount}</td>
                <td className="px-4 py-3 text-right">
                  {s.status !== "ACTIVE" ? (
                    <button onClick={() => setStatus(s.id, "ACTIVE")} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-green-100 text-green-700 text-xs font-medium hover:bg-green-200"><Check className="w-3 h-3" />Approve</button>
                  ) : (
                    <button onClick={() => setStatus(s.id, "SUSPENDED")} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-destructive/10 text-destructive text-xs font-medium hover:bg-destructive/20"><Ban className="w-3 h-3" />Suspend</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function UsersTab() {
  const list = useServerFn(getAllUsers);
  const block = useServerFn(setUserBlocked);
  const [users, setUsers] = useState<any[]>([]);
  const load = () => list().then(setUsers).catch(() => {});
  useEffect(() => { load(); }, []);
  async function toggleBlock(userId: string, blocked: boolean) {
    await block({ data: { userId, blocked: !blocked } });
    load();
  }
  return (
    <div>
      <h2 className="text-2xl font-heading text-foreground mb-5">Users</h2>
      <div className="rounded-2xl bg-background border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-secondary/50 text-muted-foreground">
            <tr>
              <th className="text-left px-4 py-3 font-medium">Name</th>
              <th className="text-left px-4 py-3 font-medium">Email</th>
              <th className="text-left px-4 py-3 font-medium">Role</th>
              <th className="text-right px-4 py-3 font-medium">Action</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-t border-border">
                <td className="px-4 py-3 text-foreground font-medium">{u.name ?? "—"}{u.blocked && <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded-full bg-destructive/10 text-destructive">BLOCKED</span>}</td>
                <td className="px-4 py-3 text-muted-foreground">{u.email}</td>
                <td className="px-4 py-3"><span className="px-2 py-0.5 rounded-full text-xs bg-accent text-foreground">{u.role}</span></td>
                <td className="px-4 py-3 text-right">
                  {u.role !== "ADMIN" && (
                    <button onClick={() => toggleBlock(u.id, u.blocked)} className={`px-3 py-1.5 rounded-lg text-xs font-medium ${u.blocked ? "bg-green-100 text-green-700 hover:bg-green-200" : "bg-destructive/10 text-destructive hover:bg-destructive/20"}`}>
                      {u.blocked ? "Unblock" : "Block"}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function DeliveryPartners() {
  const list = useServerFn(getAllDeliveryPartners);
  const update = useServerFn(updateDeliveryStatus);
  const [partners, setPartners] = useState<any[]>([]);
  const load = () => list().then(setPartners).catch(() => {});
  useEffect(() => { load(); }, []);
  async function setStatus(id: string, status: "APPROVED" | "REJECTED" | "SUSPENDED") {
    await update({ data: { id, status } });
    load();
  }
  return (
    <div>
      <h2 className="text-2xl font-heading text-foreground mb-5">Delivery Partners</h2>
      <div className="rounded-2xl bg-background border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-secondary/50 text-muted-foreground">
            <tr>
              <th className="text-left px-4 py-3 font-medium">Name</th>
              <th className="text-left px-4 py-3 font-medium hidden sm:table-cell">Vehicle</th>
              <th className="text-left px-4 py-3 font-medium">Status</th>
              <th className="text-right px-4 py-3 font-medium">Action</th>
            </tr>
          </thead>
          <tbody>
            {partners.length === 0 && (
              <tr><td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">No delivery partners yet.</td></tr>
            )}
            {partners.map((p) => (
              <tr key={p.id} className="border-t border-border">
                <td className="px-4 py-3 text-foreground font-medium">{p.fullName}<div className="text-xs text-muted-foreground">{p.phone}</div></td>
                <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">{p.vehicleType} • {p.vehicleNumber}</td>
                <td className="px-4 py-3"><StatusBadge status={p.status} /></td>
                <td className="px-4 py-3 text-right">
                  {p.status !== "APPROVED" ? (
                    <button onClick={() => setStatus(p.id, "APPROVED")} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-green-100 text-green-700 text-xs font-medium hover:bg-green-200"><Check className="w-3 h-3" />Approve</button>
                  ) : (
                    <button onClick={() => setStatus(p.id, "SUSPENDED")} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-destructive/10 text-destructive text-xs font-medium hover:bg-destructive/20"><Ban className="w-3 h-3" />Suspend</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Orders() {
  const list = useServerFn(getAllOrders);
  const [orders, setOrders] = useState<any[]>([]);
  useEffect(() => { list().then(setOrders).catch(() => {}); }, []);
  return (
    <div>
      <h2 className="text-2xl font-heading text-foreground mb-5">Orders</h2>
      <div className="rounded-2xl bg-background border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-secondary/50 text-muted-foreground">
            <tr>
              <th className="text-left px-4 py-3 font-medium">Order</th>
              <th className="text-left px-4 py-3 font-medium hidden sm:table-cell">Customer</th>
              <th className="text-left px-4 py-3 font-medium hidden md:table-cell">Shop</th>
              <th className="text-left px-4 py-3 font-medium">Total</th>
              <th className="text-left px-4 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">No orders yet.</td></tr>
            )}
            {orders.map((o) => (
              <tr key={o.id} className="border-t border-border">
                <td className="px-4 py-3 text-foreground font-mono text-xs">#{o.id.slice(-6)}</td>
                <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">{o.customerName}</td>
                <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{o.shopName}</td>
                <td className="px-4 py-3 text-foreground">₹{o.total.toLocaleString("en-IN")}</td>
                <td className="px-4 py-3"><StatusBadge status={o.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    ACTIVE: "bg-green-100 text-green-700",
    PENDING: "bg-amber-100 text-amber-700",
    SUSPENDED: "bg-destructive/10 text-destructive",
    PLACED: "bg-blue-100 text-blue-700",
    CONFIRMED: "bg-blue-100 text-blue-700",
    PACKED: "bg-purple-100 text-purple-700",
    OUT_FOR_DELIVERY: "bg-amber-100 text-amber-700",
    DELIVERED: "bg-green-100 text-green-700",
    CANCELLED: "bg-destructive/10 text-destructive",
  };
  return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${map[status] ?? "bg-accent text-foreground"}`}>{status.replace(/_/g, " ")}</span>;
}
