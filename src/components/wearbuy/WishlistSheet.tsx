import { X, Heart } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useWearbuy } from "@/context/wearbuy-store";

export default function WishlistSheet() {
  const { wishOpen, setWishOpen, wishlist, toggleWishlist } = useWearbuy();
  if (!wishOpen) return null;
  return (
    <>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" onClick={() => setWishOpen(false)} />
      <div className="fixed right-0 top-0 bottom-0 w-full sm:w-[420px] bg-background border-l border-border z-50 flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/15 border border-primary/30">
              <Heart className="w-5 h-5 text-primary" />
            </div>
            <h3 className="text-lg text-foreground font-medium">Wishlist</h3>
          </div>
          <button onClick={() => setWishOpen(false)} className="p-2 rounded-lg hover:bg-secondary/60">
            <X className="w-5 h-5 text-foreground/85" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-2 gap-3">
          {wishlist.length === 0 && <p className="col-span-2 text-sm text-muted-foreground text-center py-12">No saved items yet.</p>}
          {wishlist.map((p) => (
            <Link key={p.id} to="/product/$productId" params={{ productId: p.id }} onClick={() => setWishOpen(false)} className="rounded-xl overflow-hidden bg-card/80 border border-border hover:border-primary/40 transition-all">
              <div className="relative aspect-[3/4]">
                <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
                <button onClick={(e) => { e.preventDefault(); toggleWishlist(p); }} className="absolute top-2 right-2 p-1.5 rounded-full bg-black/50 backdrop-blur-sm">
                  <Heart className="w-3.5 h-3.5 fill-primary text-primary" />
                </button>
              </div>
              <div className="p-2">
                <p className="text-xs text-foreground truncate">{p.name}</p>
                <p className="text-xs text-primary font-medium">{p.price}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}