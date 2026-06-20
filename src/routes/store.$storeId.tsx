import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { Star, MapPin, Clock, Heart } from "lucide-react";
import Navbar from "@/components/wearbuy/Navbar";
import BottomNav from "@/components/wearbuy/BottomNav";
import Footer from "@/components/wearbuy/Footer";
import { getStore, getStoreProducts, type Store, type Product } from "@/lib/wearbuy-data";
import { useWearbuy } from "@/context/wearbuy-store";

export const Route = createFileRoute("/store/$storeId")({
  loader: ({ params }): { store: Store; items: Product[] } => {
    const store = getStore(params.storeId);
    if (!store) throw notFound();
    return { store, items: getStoreProducts(params.storeId) };
  },
  component: StorePage,
  notFoundComponent: () => <div className="min-h-screen flex items-center justify-center text-foreground">Store not found</div>,
  errorComponent: () => <div className="min-h-screen flex items-center justify-center text-foreground">Something went wrong</div>,
});

function StorePage() {
  const { store, items } = Route.useLoaderData();
  const { toggleWishlist, isWished, addToCart } = useWearbuy();
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pb-24 md:pb-0">
        <div className="relative h-56 sm:h-72 overflow-hidden">
          <img src={store.banner} alt={store.name} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
        </div>
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 -mt-20 relative">
          <div className="rounded-2xl bg-card/80 backdrop-blur-xl border border-border p-6 mb-10">
            <h1 className="text-3xl text-foreground font-medium mb-1">{store.name}</h1>
            <p className="text-sm text-muted-foreground mb-4">{store.category}</p>
            <div className="flex flex-wrap items-center gap-4 text-sm">
              <span className="flex items-center gap-1 text-foreground"><Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />{store.rating}</span>
              <span className="flex items-center gap-1 text-muted-foreground"><MapPin className="w-4 h-4" />{store.distance}</span>
              <span className="flex items-center gap-1 text-green-600"><Clock className="w-4 h-4" />{store.deliveryTime}</span>
            </div>
            <div className="flex flex-wrap gap-2 mt-4">
              {store.tags.map((t: string) => (
                <span key={t} className="px-3 py-1 rounded-full bg-secondary text-foreground/85 text-xs">{t}</span>
              ))}
            </div>
          </div>
          <h2 className="text-xl text-foreground font-medium mb-4">Catalogue</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {items.map((p: Product) => (
              <div key={p.id} className="group rounded-2xl overflow-hidden bg-card/80 border border-border hover:border-primary/40 transition-all">
                <Link to="/product/$productId" params={{ productId: p.id }} className="block relative aspect-[3/4] overflow-hidden">
                  <img src={p.image} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                  <button onClick={(e) => { e.preventDefault(); toggleWishlist(p); }} className="absolute top-3 right-3 p-2 rounded-full bg-black/40 backdrop-blur-sm hover:bg-black/60">
                    <Heart className={`w-4 h-4 ${isWished(p.id) ? "fill-primary text-primary" : "text-foreground"}`} />
                  </button>
                </Link>
                <div className="p-3">
                  <Link to="/product/$productId" params={{ productId: p.id }}>
                    <h3 className="text-sm text-foreground truncate">{p.name}</h3>
                  </Link>
                  <p className="text-xs text-muted-foreground mb-2">{p.price}</p>
                  <button onClick={() => addToCart(p)} className="w-full py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary-glow text-xs font-medium">Add to Cart</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
      <Footer />
      <BottomNav />
    </div>
  );
}