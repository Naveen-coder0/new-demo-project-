import * as React from "react";
import type { Product } from "@/lib/wearbuy-data";

type CartItem = { product: Product; size: string; qty: number };

type PendingAdd = { product: Product; size: string } | null;

type Ctx = {
  city: string;
  setCity: (c: string) => void;
  cart: CartItem[];
  addToCart: (p: Product, size?: string) => void;
  removeFromCart: (id: string) => void;
  incQty: (id: string, size: string) => void;
  decQty: (id: string, size: string) => void;
  clearCart: () => void;
  cartCount: number;
  cartShopName: string | null;
  // single-shop conflict popup
  shopConflict: { currentShop: string; newShop: string } | null;
  confirmShopSwitch: () => void;
  cancelShopSwitch: () => void;
  wishlist: Product[];
  toggleWishlist: (p: Product) => void;
  isWished: (id: string) => boolean;
  cartOpen: boolean;
  setCartOpen: (b: boolean) => void;
  wishOpen: boolean;
  setWishOpen: (b: boolean) => void;
  stylistOpen: boolean;
  setStylistOpen: (b: boolean) => void;
  profileOpen: boolean;
  setProfileOpen: (b: boolean) => void;
};

const WearbuyCtx = React.createContext<Ctx | null>(null);

function load<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const v = localStorage.getItem(key);
    return v ? (JSON.parse(v) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function WearbuyProvider({ children }: { children: React.ReactNode }) {
  const [city, setCityState] = React.useState("Chandigarh");
  const [cart, setCart] = React.useState<CartItem[]>([]);
  const [wishlist, setWishlist] = React.useState<Product[]>([]);
  const [cartOpen, setCartOpen] = React.useState(false);
  const [wishOpen, setWishOpen] = React.useState(false);
  const [stylistOpen, setStylistOpen] = React.useState(false);
  const [profileOpen, setProfileOpen] = React.useState(false);
  const [shopConflict, setShopConflict] = React.useState<{ currentShop: string; newShop: string } | null>(null);
  const pendingAdd = React.useRef<PendingAdd>(null);

  React.useEffect(() => {
    setCityState(load("wb_city", "Chandigarh"));
    setCart(load<CartItem[]>("wb_cart", []));
    setWishlist(load<Product[]>("wb_wish", []));
  }, []);

  React.useEffect(() => {
    localStorage.setItem("wb_city", JSON.stringify(city));
  }, [city]);
  React.useEffect(() => {
    localStorage.setItem("wb_cart", JSON.stringify(cart));
  }, [cart]);
  React.useEffect(() => {
    localStorage.setItem("wb_wish", JSON.stringify(wishlist));
  }, [wishlist]);

  const value: Ctx = {
    city,
    setCity: setCityState,
    cart,
    addToCart: (p, size = "M") => {
      // Single-shop enforcement
      const currentShopId = cart[0]?.product.storeId ?? null;
      if (currentShopId && currentShopId !== p.storeId) {
        pendingAdd.current = { product: p, size };
        setShopConflict({ currentShop: cart[0].product.store, newShop: p.store });
        return;
      }
      setCart((prev) => {
        const existing = prev.find((c) => c.product.id === p.id && c.size === size);
        if (existing) return prev.map((c) => (c === existing ? { ...c, qty: c.qty + 1 } : c));
        return [...prev, { product: p, size, qty: 1 }];
      });
    },
    removeFromCart: (id) => setCart((prev) => prev.filter((c) => c.product.id !== id)),
    incQty: (id, size) =>
      setCart((prev) =>
        prev.map((c) =>
          c.product.id === id && c.size === size ? { ...c, qty: c.qty + 1 } : c,
        ),
      ),
    decQty: (id, size) =>
      setCart((prev) =>
        prev
          .map((c) =>
            c.product.id === id && c.size === size ? { ...c, qty: c.qty - 1 } : c,
          )
          .filter((c) => c.qty > 0),
      ),
    clearCart: () => setCart([]),
    cartCount: cart.reduce((n, c) => n + c.qty, 0),
    cartShopName: cart[0]?.product.store ?? null,
    shopConflict,
    confirmShopSwitch: () => {
      const pending = pendingAdd.current;
      if (pending) {
        setCart([{ product: pending.product, size: pending.size, qty: 1 }]);
      }
      pendingAdd.current = null;
      setShopConflict(null);
    },
    cancelShopSwitch: () => {
      pendingAdd.current = null;
      setShopConflict(null);
    },
    wishlist,
    toggleWishlist: (p) =>
      setWishlist((prev) =>
        prev.find((x) => x.id === p.id)
          ? prev.filter((x) => x.id !== p.id)
          : [...prev, p],
      ),
    isWished: (id) => wishlist.some((x) => x.id === id),
    cartOpen,
    setCartOpen,
    wishOpen,
    setWishOpen,
    stylistOpen,
    setStylistOpen,
    profileOpen,
    setProfileOpen,
  };

  return <WearbuyCtx.Provider value={value}>{children}</WearbuyCtx.Provider>;
}

export function useWearbuy() {
  const ctx = React.useContext(WearbuyCtx);
  if (!ctx) throw new Error("useWearbuy outside provider");
  return ctx;
}