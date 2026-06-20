import { X, ShoppingBag, Trash2, Plus, Minus, Sparkles, Clock } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useWearbuy } from "@/context/wearbuy-store";
import { products as allProducts } from "@/lib/wearbuy-data";

export default function CartSheet() {
  const { cartOpen, setCartOpen, cart, removeFromCart, incQty, decQty, cartShopName } = useWearbuy();
  if (!cartOpen) return null;
  const subtotal = cart.reduce((s, c) => s + c.product.priceNum * c.qty, 0);
  const tryBuyFee = cart.length > 0 ? 60 : 0;
  const total = subtotal + tryBuyFee;
  const cartIds = new Set(cart.map((c) => c.product.id));
  const cartStores = new Set(cart.map((c) => c.product.storeId));
  const aiPicks = allProducts
    .filter((p) => !cartIds.has(p.id) && (cartStores.size === 0 || cartStores.has(p.storeId)))
    .slice(0, 3);
  const eta = cart.length ? Math.max(...cart.map((c) => parseInt(c.product.deliveryEta) || 45)) : 45;
  return (
    <>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 animate-fade-in" onClick={() => setCartOpen(false)} />
      <div className="fixed right-0 top-0 bottom-0 w-full sm:w-[420px] bg-background border-l border-border z-50 flex flex-col animate-slide-in-right shadow-xl">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/15 border border-primary/30">
              <ShoppingBag className="w-5 h-5 text-primary" />
            </div>
            <h3 className="text-lg text-foreground font-medium">Your Bag</h3>
          </div>
          <button onClick={() => setCartOpen(false)} className="p-2 rounded-lg hover:bg-secondary/60">
            <X className="w-5 h-5 text-foreground/85" />
          </button>
        </div>
        {cartShopName && (
          <div className="px-6 py-3 bg-accent/50 border-b border-border">
            <p className="text-xs text-muted-foreground">
              You are ordering from: <span className="text-foreground font-semibold">{cartShopName}</span>
            </p>
          </div>
        )}
        <div className="flex-1 overflow-y-auto p-6 space-y-3">
          {cart.length === 0 && <p className="text-sm text-muted-foreground text-center py-12">Your bag is empty.</p>}
          {cart.map((c) => (
            <div key={c.product.id + c.size} className="flex gap-3 p-3 rounded-xl bg-card/80 border border-border">
              <img src={c.product.image} alt={c.product.name} className="w-16 h-20 object-cover rounded-lg" />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground truncate">{c.product.name}</p>
                <p className="text-xs text-muted-foreground">{c.product.store} • Size {c.size}</p>
                <div className="flex items-center justify-between mt-2">
                  <p className="text-sm text-primary font-medium">{c.product.price}</p>
                  <div className="flex items-center gap-1 rounded-lg border border-border bg-secondary/40">
                    <button onClick={() => decQty(c.product.id, c.size)} className="p-1.5 text-foreground/80 hover:text-primary"><Minus className="w-3 h-3" /></button>
                    <span className="text-xs text-foreground w-5 text-center">{c.qty}</span>
                    <button onClick={() => incQty(c.product.id, c.size)} className="p-1.5 text-foreground/80 hover:text-primary"><Plus className="w-3 h-3" /></button>
                  </div>
                </div>
              </div>
              <button onClick={() => removeFromCart(c.product.id)} className="p-2 text-muted-foreground hover:text-destructive">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
          {cart.length > 0 && aiPicks.length > 0 && (
            <div className="pt-4 mt-2 border-t border-border/60">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-4 h-4 text-primary" />
                <p className="text-xs text-foreground font-medium">AI Stylist suggests</p>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {aiPicks.map((p) => (
                  <Link key={p.id} to="/product/$productId" params={{ productId: p.id }} onClick={() => setCartOpen(false)} className="rounded-lg overflow-hidden bg-card/50 border border-border hover:border-primary/40">
                    <img src={p.image} alt={p.name} className="w-full aspect-square object-cover" />
                    <p className="text-[10px] text-primary p-1 truncate">{p.price}</p>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
        {cart.length > 0 && (
          <div className="p-4 border-t border-border space-y-3">
            <div className="flex items-center gap-2 text-xs text-green-600">
              <Clock className="w-3.5 h-3.5" />
              <span>Estimated delivery in ~{eta} min</span>
            </div>
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Product total</span>
                <span className="text-foreground/90">₹{subtotal.toLocaleString("en-IN")}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Try & Buy / Convenience fee</span>
                <span className="text-foreground/90">₹{tryBuyFee}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-border/60">
                <span className="text-foreground font-medium">Total</span>
                <span className="text-foreground font-semibold">₹{total.toLocaleString("en-IN")}</span>
              </div>
              <p className="text-[11px] text-primary/80 pt-1">Includes instant delivery + try & buy support</p>
            </div>
            <Link
              to="/checkout"
              onClick={() => setCartOpen(false)}
              className="w-full py-3 rounded-xl bg-primary text-primary-foreground hover:bg-primary-glow font-semibold transition-all block text-center"
            >
              Checkout
            </Link>
          </div>
        )}
      </div>
    </>
  );
}