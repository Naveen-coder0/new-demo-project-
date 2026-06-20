import { createFileRoute, Link } from "@tanstack/react-router";
import { z } from "zod";
import Navbar from "@/components/wearbuy/Navbar";
import BottomNav from "@/components/wearbuy/BottomNav";
import Footer from "@/components/wearbuy/Footer";
import { filterProducts, getOccasion } from "@/lib/wearbuy-data";
import { Clock, X } from "lucide-react";

export const Route = createFileRoute("/search")({
  validateSearch: z.object({
    q: z.string().optional().default(""),
    category: z.string().optional(),
    occasion: z.string().optional(),
    trending: z.coerce.boolean().optional(),
  }),
  component: SearchPage,
});

function SearchPage() {
  const { q, category, occasion, trending } = Route.useSearch();
  const results = filterProducts({ q, category, occasion, trending });
  const occ = occasion ? getOccasion(occasion) : null;
  const title = q
    ? `Results for "${q}"`
    : trending
    ? "Trending now"
    : occ
    ? `${occ.title} edit`
    : category && category !== "For You"
    ? `${category} fashion`
    : "Browse all";
  const chips = [
    category && category !== "For You" ? { k: "category", v: category } : null,
    occ ? { k: "occasion", v: occ.title } : null,
    trending ? { k: "trending", v: "Trending" } : null,
  ].filter(Boolean) as { k: string; v: string }[];
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-10 pb-24 md:pb-10">
        <h1 className="text-2xl sm:text-3xl text-foreground mb-2 font-medium">{title}</h1>
        <p className="text-sm text-muted-foreground mb-4">{results.length} items found</p>
        {chips.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            {chips.map((c) => (
              <Link
                key={c.k}
                to="/search"
                search={{ q: q || "" }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/15 border border-primary/30 text-xs text-primary hover:bg-primary/25 transition-all"
              >
                {c.v}
                <X className="w-3 h-3" />
              </Link>
            ))}
          </div>
        )}
        {results.length === 0 ? (
          <p className="text-muted-foreground">No matches. Try "white tee", "cargo", or "kurta".</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {results.map((p) => (
              <Link key={p.id} to="/product/$productId" params={{ productId: p.id }} className="group rounded-2xl overflow-hidden bg-card/80 border border-border hover:border-primary/40 transition-all">
                <div className="relative aspect-[3/4] overflow-hidden">
                  <img src={p.image} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                </div>
                <div className="p-3">
                  <h3 className="text-sm text-foreground truncate">{p.name}</h3>
                  <p className="text-xs text-muted-foreground mb-2">{p.store}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-base text-foreground font-medium">{p.price}</span>
                    <div className="flex items-center gap-1 text-xs text-green-600"><Clock className="w-3 h-3" />{p.deliveryEta}</div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
      <Footer />
      <BottomNav />
    </div>
  );
}