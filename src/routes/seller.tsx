import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useCallback } from "react";
import { LayoutDashboard, Package, ShoppingCart, Plus, Trash2, Store, X, TrendingUp, AlertTriangle, IndianRupee, Tag, Star, Settings as SettingsIcon } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { useServerFn } from "@tanstack/react-start";
import PortalShell, { AuthGate } from "@/components/portal/PortalShell";
import ImageUploader from "@/components/portal/ImageUploader";
import { useAuth } from "@/context/auth-store";
import {
  createShop,
  getMyShops,
  getShopDashboard,
  getShopProducts,
  upsertProduct,
  deleteProduct,
  getShopOrders,
  updateOrderStatus,
  type ShopDashboard,
} from "@/lib/shop.functions";
import {
  getShopCoupons,
  createCoupon,
  deleteCoupon,
  getShopSettings,
  updateShopSettings,
  getShopReviews,
} from "@/lib/seller-extra.functions";

export const Route = createFileRoute("/seller")({
  component: () => (
    <AuthGate allow={["SHOP_OWNER", "ADMIN"]}>
      <SellerPortal />
    </AuthGate>
  ),
});

const ACCENT = "oklch(0.55 0.13 160)";

function SellerPortal() {
  const { firebaseUser } = useAuth();
  const myShops = useServerFn(getMyShops);
  const [shops, setShops] = useState<any[]>([]);
  const [shopId, setShopId] = useState<string | null>(null);
  const [tab, setTab] = useState("dashboard");
  const [loadingShops, setLoadingShops] = useState(true);

  const loadShops = useCallback(() => {
    if (!firebaseUser) return;
    setLoadingShops(true);
    myShops({ data: { ownerUid: firebaseUser.uid } })
      .then((s) => {
        setShops(s);
        if (s.length && !shopId) setShopId(s[0].id);
      })
      .finally(() => setLoadingShops(false));
  }, [firebaseUser, myShops, shopId]);

  useEffect(() => { loadShops(); }, [firebaseUser]);

  if (loadingShops) {
    return <div className="min-h-screen flex items-center justify-center bg-secondary/30 text-muted-foreground">Loading…</div>;
  }

  if (shops.length === 0) {
    return <CreateShopScreen onCreated={loadShops} />;
  }

  return (
    <PortalShell
      title="Seller Portal"
      subtitle={shops.find((s) => s.id === shopId)?.name ?? "Manage your shop"}
      accent={ACCENT}
      active={tab}
      onNavigate={setTab}
      nav={[
        { key: "dashboard", label: "Dashboard", icon: <LayoutDashboard className="w-4 h-4" /> },
        { key: "orders", label: "Orders", icon: <ShoppingCart className="w-4 h-4" /> },
        { key: "products", label: "Products", icon: <Package className="w-4 h-4" /> },
        { key: "marketing", label: "Marketing", icon: <Tag className="w-4 h-4" /> },
        { key: "reviews", label: "Reviews", icon: <Star className="w-4 h-4" /> },
        { key: "settings", label: "Settings", icon: <SettingsIcon className="w-4 h-4" /> },
      ]}
    >
      {shops.length > 1 && (
        <select
          value={shopId ?? ""}
          onChange={(e) => setShopId(e.target.value)}
          className="mb-5 px-4 py-2 rounded-xl bg-background border border-border text-sm text-foreground"
        >
          {shops.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      )}
      {shopId && tab === "dashboard" && <Dashboard shopId={shopId} />}
      {shopId && tab === "orders" && <Orders shopId={shopId} />}
      {shopId && tab === "products" && <Products shopId={shopId} />}
      {shopId && tab === "marketing" && <Marketing shopId={shopId} />}
      {shopId && tab === "reviews" && <Reviews shopId={shopId} />}
      {shopId && tab === "settings" && <SettingsTab shopId={shopId} />}
    </PortalShell>
  );
}

function CreateShopScreen({ onCreated }: { onCreated: () => void }) {
  const { firebaseUser } = useAuth();
  const create = useServerFn(createShop);
  const [form, setForm] = useState({ name: "", category: "", description: "", image: "" });
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!firebaseUser) return;
    setLoading(true);
    try {
      await create({ data: { ownerUid: firebaseUser.uid, ...form } });
      onCreated();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-secondary/30 p-4">
      <div className="max-w-md w-full p-7 rounded-3xl bg-background border border-border shadow-sm animate-scaleIn">
        <div className="w-14 h-14 rounded-full bg-accent flex items-center justify-center mb-4">
          <Store className="w-6 h-6 text-primary" />
        </div>
        <h1 className="text-2xl font-heading text-foreground mb-1">Open your shop</h1>
        <p className="text-sm text-muted-foreground mb-6">Start selling on WearBuy in minutes.</p>
        <form onSubmit={submit} className="space-y-3.5">
          <input required placeholder="Shop name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-4 py-3 rounded-xl bg-input-background border border-border text-foreground text-sm focus:outline-none focus:border-primary/40" />
          <input required placeholder="Category (e.g. Streetwear)" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full px-4 py-3 rounded-xl bg-input-background border border-border text-foreground text-sm focus:outline-none focus:border-primary/40" />
          <input placeholder="Logo image URL (optional)" value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })} className="w-full px-4 py-3 rounded-xl bg-input-background border border-border text-foreground text-sm focus:outline-none focus:border-primary/40" />
          <textarea placeholder="Short description (optional)" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} className="w-full px-4 py-3 rounded-xl bg-input-background border border-border text-foreground text-sm focus:outline-none focus:border-primary/40 resize-none" />
          <button disabled={loading} className="w-full py-3.5 rounded-xl bg-primary text-primary-foreground font-semibold disabled:opacity-50">
            {loading ? "Creating…" : "Create Shop"}
          </button>
        </form>
      </div>
    </div>
  );
}

function GradientStat({ label, value, sub, icon, gradient }: { label: string; value: string | number; sub?: string; icon: React.ReactNode; gradient: string }) {
  return (
    <div className="relative overflow-hidden rounded-2xl p-5 text-white" style={{ background: gradient }}>
      <div className="absolute -right-4 -bottom-4 opacity-20">
        <div className="w-24 h-24">{icon}</div>
      </div>
      <div className="relative">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-medium uppercase tracking-wide text-white/80">{label}</span>
          <span className="p-2 rounded-lg bg-white/20">{icon}</span>
        </div>
        <p className="text-3xl font-heading">{value}</p>
        {sub && <p className="text-xs text-white/70 mt-1">{sub}</p>}
      </div>
    </div>
  );
}

function Dashboard({ shopId }: { shopId: string }) {
  const fn = useServerFn(getShopDashboard);
  const [d, setD] = useState<ShopDashboard | null>(null);
  useEffect(() => { fn({ data: { shopId } }).then(setD).catch(() => {}); }, [shopId, fn]);

  const revenueData = [
    { name: "Mon", value: 0 }, { name: "Tue", value: 0 }, { name: "Wed", value: 0 },
    { name: "Thu", value: 0 }, { name: "Fri", value: 0 }, { name: "Sat", value: 0 },
    { name: "Sun", value: d?.revenue ?? 0 },
  ];
  const inStock = (d?.products ?? 0) - (d?.lowStock ?? 0);
  const inventoryData = [
    { name: "In Stock", value: Math.max(0, inStock) },
    { name: "Low Stock", value: d?.lowStock ?? 0 },
  ];
  const COLORS = ["oklch(0.55 0.18 280)", "oklch(0.65 0.2 25)"];

  return (
    <div>
      <h2 className="text-2xl font-heading text-foreground mb-1">Dashboard</h2>
      <p className="text-xs text-muted-foreground uppercase tracking-widest mb-5">Seller Management</p>

      {/* Gradient stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <GradientStat label="Total Revenue" value={d ? `₹${d.revenue.toLocaleString("en-IN")}` : "₹0"} sub="All paid orders" icon={<TrendingUp className="w-full h-full" />} gradient="linear-gradient(135deg, oklch(0.55 0.18 280), oklch(0.6 0.2 295))" />
        <GradientStat label="Orders" value={d?.orders ?? 0} sub={`${d?.pendingOrders ?? 0} pending`} icon={<ShoppingCart className="w-full h-full" />} gradient="linear-gradient(135deg, oklch(0.6 0.13 160), oklch(0.65 0.15 175))" />
        <GradientStat label="Products" value={d?.products ?? 0} sub="Listed items" icon={<Package className="w-full h-full" />} gradient="linear-gradient(135deg, oklch(0.6 0.16 250), oklch(0.6 0.18 265))" />
        <GradientStat label="Low Stock" value={d?.lowStock ?? 0} sub="Need attention" icon={<AlertTriangle className="w-full h-full" />} gradient="linear-gradient(135deg, oklch(0.62 0.2 25), oklch(0.65 0.21 15))" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 rounded-2xl bg-background border border-border p-5">
          <h3 className="text-sm font-medium text-foreground mb-4">Revenue Overview</h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.22 0.025 50 / 0.08)" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="oklch(0.48 0.025 50)" />
                <YAxis tick={{ fontSize: 11 }} stroke="oklch(0.48 0.025 50)" />
                <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid oklch(0.22 0.025 50 / 0.1)" }} />
                <Bar dataKey="value" fill="oklch(0.55 0.18 280)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="rounded-2xl bg-background border border-border p-5">
          <h3 className="text-sm font-medium text-foreground mb-4">Inventory Breakdown</h3>
          <div className="h-56 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={inventoryData} dataKey="value" innerRadius={55} outerRadius={80} paddingAngle={4}>
                  {inventoryData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-4 text-xs">
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full" style={{ background: COLORS[0] }} />In Stock</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full" style={{ background: COLORS[1] }} />Low Stock</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function Products({ shopId }: { shopId: string }) {
  const list = useServerFn(getShopProducts);
  const save = useServerFn(upsertProduct);
  const del = useServerFn(deleteProduct);
  const [products, setProducts] = useState<any[]>([]);
  const [editing, setEditing] = useState<any>(null);
  const [search, setSearch] = useState("");

  const load = useCallback(() => { list({ data: { shopId } }).then(setProducts).catch(() => {}); }, [shopId, list]);
  useEffect(() => { load(); }, [shopId]);

  async function remove(id: string) {
    await del({ data: { id } });
    if (editing?.id === id) setEditing(null);
    load();
  }

  const filtered = products.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()));
  const active = products.filter((p) => p.status === "ACTIVE").length;
  const outOfStock = products.filter((p) => p.stock === 0).length;
  const avgPrice = products.length ? Math.round(products.reduce((s, p) => s + p.price, 0) / products.length) : 0;

  return (
    <div>
      {/* Gradient stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <GradientStat label="Total Products" value={products.length} icon={<Package className="w-full h-full" />} gradient="linear-gradient(135deg, oklch(0.55 0.18 280), oklch(0.6 0.2 295))" />
        <GradientStat label="Active Items" value={active} icon={<TrendingUp className="w-full h-full" />} gradient="linear-gradient(135deg, oklch(0.6 0.13 160), oklch(0.65 0.15 175))" />
        <GradientStat label="Out of Stock" value={outOfStock} icon={<AlertTriangle className="w-full h-full" />} gradient="linear-gradient(135deg, oklch(0.62 0.2 25), oklch(0.65 0.21 15))" />
        <GradientStat label="Avg. Price" value={`₹${avgPrice}`} icon={<IndianRupee className="w-full h-full" />} gradient="linear-gradient(135deg, oklch(0.65 0.17 60), oklch(0.68 0.18 50))" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Catalog list */}
        <div className="lg:col-span-3">
          <div className="rounded-2xl bg-background border border-border p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-foreground">Catalog Management</h3>
              <button onClick={() => setEditing(null)} className="text-xs text-primary font-medium hover:underline flex items-center gap-1">
                <Plus className="w-3 h-3" /> New
              </button>
            </div>
            <div className="relative mb-4">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search products..."
                className="w-full px-4 py-2.5 rounded-xl bg-secondary/50 border border-border text-foreground text-sm focus:outline-none focus:border-primary/40"
              />
            </div>
            {filtered.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground text-sm">
                {products.length === 0 ? "No products yet. Create your first one →" : "No matches."}
              </div>
            ) : (
              <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
                {filtered.map((p) => (
                  <div key={p.id} className={`flex items-center gap-3 p-2.5 rounded-xl border transition-all cursor-pointer ${editing?.id === p.id ? "border-primary bg-primary/5" : "border-border hover:bg-accent/40"}`} onClick={() => setEditing(p)}>
                    {p.image ? <img src={p.image} alt={p.name} className="w-12 h-12 rounded-lg object-cover" /> : <div className="w-12 h-12 rounded-lg bg-accent flex items-center justify-center"><Package className="w-5 h-5 text-muted-foreground" /></div>}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{p.name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-secondary text-muted-foreground uppercase">{p.category}</span>
                        <span className="text-xs text-foreground">₹{p.price}</span>
                        {p.stock === 0 && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-destructive/10 text-destructive font-medium">Out of Stock</span>}
                      </div>
                    </div>
                    <button onClick={(e) => { e.stopPropagation(); remove(p.id); }} className="p-1.5 rounded-lg text-destructive hover:bg-destructive/10"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Create / Edit form panel */}
        <div className="lg:col-span-2">
          <ProductFormPanel
            key={editing?.id ?? "new"}
            shopId={shopId}
            editing={editing}
            save={save}
            onSaved={() => { setEditing(null); load(); }}
          />
        </div>
      </div>
    </div>
  );
}

function ProductFormPanel({ shopId, editing, onSaved, save }: any) {
  const [form, setForm] = useState({
    name: editing?.name ?? "",
    description: editing?.description ?? "",
    price: editing?.price ?? 0,
    comparePrice: editing?.comparePrice ?? "",
    discount: editing?.discount ?? 0,
    stock: editing?.stock ?? 0,
    sku: editing?.sku ?? "",
    category: editing?.category ?? "",
    image: editing?.image ?? "",
    images: editing?.images ?? [],
    sizes: (editing?.sizes ?? []).join(", "),
    colors: (editing?.colors ?? []).join(", "),
    tags: (editing?.tags ?? []).join(", "),
    tryAndBuy: editing?.tryAndBuy ?? false,
  });
  const [loading, setLoading] = useState(false);

  function autoSku() {
    const prefix = form.category.slice(0, 3).toUpperCase() || "PRD";
    const rand = Math.random().toString(36).slice(2, 7).toUpperCase();
    setForm({ ...form, sku: `${prefix}-${rand}` });
  }

  function calcDiscount() {
    if (form.comparePrice && form.price) {
      const d = Math.round(((Number(form.comparePrice) - Number(form.price)) / Number(form.comparePrice)) * 100);
      setForm({ ...form, discount: Math.max(0, d) });
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await save({
        data: {
          id: editing?.id,
          shopId,
          name: form.name,
          description: form.description || undefined,
          price: Number(form.price),
          comparePrice: form.comparePrice ? Number(form.comparePrice) : undefined,
          discount: Number(form.discount) || 0,
          stock: Number(form.stock),
          sku: form.sku || undefined,
          category: form.category,
          image: form.images[0] || form.image || undefined,
          images: form.images.length > 0 ? form.images : form.image ? [form.image] : [],
          sizes: form.sizes ? form.sizes.split(",").map((s: string) => s.trim()).filter(Boolean) : [],
          colors: form.colors ? form.colors.split(",").map((s: string) => s.trim()).filter(Boolean) : [],
          tags: form.tags ? form.tags.split(",").map((s: string) => s.trim()).filter(Boolean) : [],
          tryAndBuy: form.tryAndBuy,
        },
      });
      onSaved();
    } finally {
      setLoading(false);
    }
  }

  const inputCls = "w-full px-4 py-2.5 rounded-xl bg-input-background border border-border text-foreground text-sm focus:outline-none focus:border-primary/40";

  return (
    <div className="rounded-2xl bg-background border border-border p-5 sticky top-24">
      <h3 className="text-lg font-medium text-foreground mb-1">{editing ? "Edit Product" : "Create Product"}</h3>
      <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-4">Identity & Details</p>
      <form onSubmit={submit} className="space-y-3.5">
        <ImageUploader images={form.images} onChange={(urls) => setForm({ ...form, images: urls })} max={4} />

        <div>
          <label className="text-[10px] text-muted-foreground uppercase mb-1 block">Product Name</label>
          <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputCls} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[10px] text-muted-foreground uppercase mb-1 block">Category</label>
            <input required value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className={inputCls} />
          </div>
          <div>
            <label className="text-[10px] text-muted-foreground uppercase mb-1 flex items-center gap-2">SKU<button type="button" onClick={autoSku} className="text-[9px] text-primary underline">Auto</button></label>
            <input value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} className={inputCls} />
          </div>
        </div>

        <div>
          <label className="text-[10px] text-muted-foreground uppercase mb-1 block">Short Pitch</label>
          <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} className={`${inputCls} resize-none`} />
        </div>

        <p className="text-[10px] text-muted-foreground uppercase tracking-widest pt-2">Pricing & Stock</p>
        <div className="grid grid-cols-3 gap-2">
          <div>
            <label className="text-[10px] text-muted-foreground uppercase mb-1 block">Price ₹</label>
            <input required type="number" value={form.price || ""} onChange={(e) => setForm({ ...form, price: e.target.value })} onBlur={calcDiscount} className="w-full px-3 py-2.5 rounded-xl bg-input-background border border-border text-foreground text-sm focus:outline-none focus:border-primary/40" />
          </div>
          <div>
            <label className="text-[10px] text-muted-foreground uppercase mb-1 block">MRP</label>
            <input type="number" value={form.comparePrice} onChange={(e) => setForm({ ...form, comparePrice: e.target.value })} onBlur={calcDiscount} className="w-full px-3 py-2.5 rounded-xl bg-input-background border border-border text-foreground text-sm focus:outline-none focus:border-primary/40" />
          </div>
          <div>
            <label className="text-[10px] text-muted-foreground uppercase mb-1 block">Stock</label>
            <input required type="number" value={form.stock || ""} onChange={(e) => setForm({ ...form, stock: e.target.value })} className="w-full px-3 py-2.5 rounded-xl bg-input-background border border-border text-foreground text-sm focus:outline-none focus:border-primary/40" />
          </div>
        </div>

        <p className="text-[10px] text-muted-foreground uppercase tracking-widest pt-2">Variants</p>
        <input placeholder="Sizes (S, M, L, XL)" value={form.sizes} onChange={(e) => setForm({ ...form, sizes: e.target.value })} className={inputCls} />
        <input placeholder="Colors (Black, White)" value={form.colors} onChange={(e) => setForm({ ...form, colors: e.target.value })} className={inputCls} />
        <input placeholder="Tags" value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} className={inputCls} />

        <label className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-input-background border border-border cursor-pointer">
          <input type="checkbox" checked={form.tryAndBuy} onChange={(e) => setForm({ ...form, tryAndBuy: e.target.checked })} className="w-4 h-4 accent-primary" />
          <span className="text-sm text-foreground">Try & Buy available</span>
        </label>

        <button disabled={loading} className="w-full py-3.5 rounded-xl bg-primary text-primary-foreground font-semibold disabled:opacity-50 mt-2">
          {loading ? "Saving…" : editing ? "Update Product" : "Create Product"}
        </button>
      </form>
    </div>
  );
}

function Orders({ shopId }: { shopId: string }) {
  const list = useServerFn(getShopOrders);
  const update = useServerFn(updateOrderStatus);
  const [orders, setOrders] = useState<any[]>([]);
  const load = useCallback(() => { list({ data: { shopId } }).then(setOrders).catch(() => {}); }, [shopId, list]);
  useEffect(() => { load(); }, [shopId]);

  const NEXT: Record<string, string> = {
    PLACED: "CONFIRMED",
    CONFIRMED: "PACKED",
    PACKED: "OUT_FOR_DELIVERY",
    OUT_FOR_DELIVERY: "DELIVERED",
  };

  async function advance(orderId: string, current: string) {
    const next = NEXT[current];
    if (!next) return;
    await update({ data: { orderId, status: next } });
    load();
  }

  return (
    <div>
      <h2 className="text-2xl font-heading text-foreground mb-5">Orders</h2>
      {orders.length === 0 ? (
        <div className="p-10 rounded-2xl bg-background border border-border text-center text-muted-foreground">No orders yet.</div>
      ) : (
        <div className="space-y-3">
          {orders.map((o) => (
            <div key={o.id} className="p-5 rounded-2xl bg-background border border-border">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="text-sm font-medium text-foreground">#{o.id.slice(-6)} • {o.customer}</p>
                  <p className="text-xs text-muted-foreground">{o.address}</p>
                </div>
                <StatusBadge status={o.status} />
              </div>
              <div className="text-xs text-muted-foreground mb-3">
                {o.items.map((i: any, idx: number) => <span key={idx}>{i.name} ×{i.qty}{i.size ? ` (${i.size})` : ""}{idx < o.items.length - 1 ? ", " : ""}</span>)}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-foreground">₹{o.total.toLocaleString("en-IN")} • {o.paymentMethod.toUpperCase()}</span>
                {NEXT[o.status] && (
                  <button onClick={() => advance(o.id, o.status)} className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-medium">
                    Mark {NEXT[o.status].replace(/_/g, " ")}
                  </button>
                )}
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

/* ==================== MARKETING (Coupons) ==================== */

function Marketing({ shopId }: { shopId: string }) {
  const list = useServerFn(getShopCoupons);
  const create = useServerFn(createCoupon);
  const del = useServerFn(deleteCoupon);
  const [coupons, setCoupons] = useState<any[]>([]);
  const [form, setForm] = useState({ code: "", type: "PERCENT", value: 0, minOrder: 0, maxDiscount: "", usageLimit: 100, expiresAt: "" });
  const [loading, setLoading] = useState(false);

  const load = useCallback(() => { list({ data: { shopId } }).then(setCoupons).catch(() => {}); }, [shopId, list]);
  useEffect(() => { load(); }, [shopId]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await create({
        data: {
          shopId,
          code: form.code,
          type: form.type as "PERCENT" | "FLAT",
          value: Number(form.value),
          minOrder: Number(form.minOrder) || 0,
          maxDiscount: form.maxDiscount ? Number(form.maxDiscount) : undefined,
          usageLimit: Number(form.usageLimit) || 100,
          expiresAt: form.expiresAt || undefined,
        },
      });
      setForm({ code: "", type: "PERCENT", value: 0, minOrder: 0, maxDiscount: "", usageLimit: 100, expiresAt: "" });
      load();
    } finally { setLoading(false); }
  }

  const inputCls = "w-full px-4 py-2.5 rounded-xl bg-input-background border border-border text-foreground text-sm focus:outline-none focus:border-primary/40";

  return (
    <div>
      <h2 className="text-2xl font-heading text-foreground mb-1">Marketing</h2>
      <p className="text-xs text-muted-foreground uppercase tracking-widest mb-5">Coupons & Promotions</p>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active coupons */}
        <div className="rounded-2xl bg-background border border-border p-5">
          <h3 className="text-sm font-medium text-foreground mb-4 flex items-center gap-2"><Tag className="w-4 h-4 text-primary" /> Active Coupons</h3>
          {coupons.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground text-sm">
              <Tag className="w-8 h-8 mx-auto mb-2 text-muted-foreground/30" />
              No coupons created yet.
            </div>
          ) : (
            <div className="space-y-2">
              {coupons.map((c) => (
                <div key={c.id} className="flex items-center justify-between p-3 rounded-xl border border-border">
                  <div>
                    <p className="text-sm font-semibold text-foreground tracking-wider">{c.code}</p>
                    <p className="text-xs text-muted-foreground">{c.type === "PERCENT" ? `${c.value}% off` : `₹${c.value} off`} • {c.usedCount}/{c.usageLimit} used</p>
                  </div>
                  <button onClick={() => del({ data: { id: c.id } }).then(load)} className="p-1.5 rounded-lg text-destructive hover:bg-destructive/10"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* New coupon form */}
        <div className="rounded-2xl bg-background border border-border p-5">
          <h3 className="text-sm font-medium text-foreground mb-4">New Coupon</h3>
          <form onSubmit={submit} className="space-y-3.5">
            <div>
              <label className="text-[10px] text-muted-foreground uppercase mb-1 block">Coupon Code</label>
              <input required value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} placeholder="SUMMER25" className={inputCls} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] text-muted-foreground uppercase mb-1 block">Type</label>
                <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className={inputCls}>
                  <option value="PERCENT">Percentage (%)</option>
                  <option value="FLAT">Flat (₹)</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] text-muted-foreground uppercase mb-1 block">Value</label>
                <input required type="number" value={form.value || ""} onChange={(e) => setForm({ ...form, value: Number(e.target.value) })} className={inputCls} />
              </div>
            </div>
            <div>
              <label className="text-[10px] text-muted-foreground uppercase mb-1 block">Min. Order Amount (₹)</label>
              <input type="number" value={form.minOrder || ""} onChange={(e) => setForm({ ...form, minOrder: Number(e.target.value) })} className={inputCls} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] text-muted-foreground uppercase mb-1 block">Max Discount (₹)</label>
                <input type="number" value={form.maxDiscount} onChange={(e) => setForm({ ...form, maxDiscount: e.target.value })} placeholder="500" className={inputCls} />
              </div>
              <div>
                <label className="text-[10px] text-muted-foreground uppercase mb-1 block">Usage Limit</label>
                <input type="number" value={form.usageLimit || ""} onChange={(e) => setForm({ ...form, usageLimit: Number(e.target.value) })} className={inputCls} />
              </div>
            </div>
            <div>
              <label className="text-[10px] text-muted-foreground uppercase mb-1 block">Expiry Date</label>
              <input type="date" value={form.expiresAt} onChange={(e) => setForm({ ...form, expiresAt: e.target.value })} className={inputCls} />
            </div>
            <button disabled={loading} className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold disabled:opacity-50">
              {loading ? "Creating…" : "Create Coupon"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

/* ==================== REVIEWS ==================== */

function Reviews({ shopId }: { shopId: string }) {
  const list = useServerFn(getShopReviews);
  const [reviews, setReviews] = useState<any[]>([]);
  useEffect(() => { list({ data: { shopId } }).then(setReviews).catch(() => {}); }, [shopId]);

  return (
    <div>
      <h2 className="text-2xl font-heading text-foreground mb-1">Reviews</h2>
      <p className="text-xs text-muted-foreground uppercase tracking-widest mb-5">Customer Feedback</p>
      {reviews.length === 0 ? (
        <div className="p-12 rounded-2xl bg-background border border-border text-center text-muted-foreground">
          <Star className="w-8 h-8 mx-auto mb-2 text-muted-foreground/30" />
          No reviews yet on your products.
        </div>
      ) : (
        <div className="space-y-3">
          {reviews.map((r) => (
            <div key={r.id} className="p-5 rounded-2xl bg-background border border-border">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="text-sm font-medium text-foreground">{r.userName ?? "Customer"}</p>
                  <p className="text-xs text-muted-foreground">on {r.productName}</p>
                </div>
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map((s) => <Star key={s} className={`w-3.5 h-3.5 ${s <= r.rating ? "fill-amber-400 text-amber-400" : "text-border"}`} />)}
                </div>
              </div>
              {r.comment && <p className="text-sm text-foreground/80">{r.comment}</p>}
              <p className="text-[10px] text-muted-foreground mt-2">{new Date(r.createdAt).toLocaleDateString()}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ==================== SETTINGS ==================== */

function SettingsTab({ shopId }: { shopId: string }) {
  const get = useServerFn(getShopSettings);
  const save = useServerFn(updateShopSettings);
  const [form, setForm] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => { get({ data: { shopId } }).then(setForm).catch(() => {}); }, [shopId]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form) return;
    setLoading(true);
    setSaved(false);
    try {
      await save({
        data: {
          shopId,
          name: form.name,
          tagline: form.tagline,
          description: form.description,
          image: form.image,
          banner: form.banner,
          contactEmail: form.contactEmail,
          whatsapp: form.whatsapp,
          instagram: form.instagram,
          freeShipAbove: Number(form.freeShipAbove) || 0,
        },
      });
      setSaved(true);
    } finally { setLoading(false); }
  }

  if (!form) return <div className="p-12 text-center text-muted-foreground">Loading…</div>;
  const inputCls = "w-full px-4 py-2.5 rounded-xl bg-input-background border border-border text-foreground text-sm focus:outline-none focus:border-primary/40";

  return (
    <div className="max-w-2xl">
      <h2 className="text-2xl font-heading text-foreground mb-1">Settings</h2>
      <p className="text-xs text-muted-foreground uppercase tracking-widest mb-5">Shop Configuration</p>
      <form onSubmit={submit} className="space-y-6">
        <div className="rounded-2xl bg-background border border-border p-5 space-y-3.5">
          <h3 className="text-sm font-medium text-foreground">🛍 Shop Identity</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] text-muted-foreground uppercase mb-1 block">Shop Name</label>
              <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputCls} />
            </div>
            <div>
              <label className="text-[10px] text-muted-foreground uppercase mb-1 block">Tagline</label>
              <input value={form.tagline} onChange={(e) => setForm({ ...form, tagline: e.target.value })} className={inputCls} />
            </div>
          </div>
          <div>
            <label className="text-[10px] text-muted-foreground uppercase mb-1 block">Description</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} className={`${inputCls} resize-none`} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] text-muted-foreground uppercase mb-1 block">Logo URL</label>
              <input value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })} className={inputCls} />
            </div>
            <div>
              <label className="text-[10px] text-muted-foreground uppercase mb-1 block">Free Ship Above (₹)</label>
              <input type="number" value={form.freeShipAbove || ""} onChange={(e) => setForm({ ...form, freeShipAbove: e.target.value })} className={inputCls} />
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-background border border-border p-5 space-y-3.5">
          <h3 className="text-sm font-medium text-foreground">📞 Contact & Social</h3>
          <div>
            <label className="text-[10px] text-muted-foreground uppercase mb-1 block">Contact Email</label>
            <input type="email" value={form.contactEmail} onChange={(e) => setForm({ ...form, contactEmail: e.target.value })} className={inputCls} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] text-muted-foreground uppercase mb-1 block">WhatsApp</label>
              <input value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} className={inputCls} />
            </div>
            <div>
              <label className="text-[10px] text-muted-foreground uppercase mb-1 block">Instagram</label>
              <input value={form.instagram} onChange={(e) => setForm({ ...form, instagram: e.target.value })} className={inputCls} />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button disabled={loading} className="px-6 py-3 rounded-xl bg-primary text-primary-foreground font-semibold disabled:opacity-50">
            {loading ? "Saving…" : "Save Settings"}
          </button>
          {saved && <span className="text-sm text-green-600">✓ Saved</span>}
        </div>
      </form>
    </div>
  );
}
