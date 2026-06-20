import { Flame, Sparkles } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { ImageWithFallback } from "@/components/figma/ImageWithFallback";

const newDrops = [
  { title: "Oversized Tees", subtitle: "New collection", badge: "Only 4 left", price: "From ₹599", q: "oversized tee", image: "https://images.unsplash.com/photo-1535395567430-827184ae2eda?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080" },
  { title: "Cargo Pants", subtitle: "Bestseller", badge: "Recently viewed", price: "From ₹1,299", q: "cargo", image: "https://images.unsplash.com/photo-1576573303723-36d0a91aab3f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080" },
  { title: "Kurta Sets", subtitle: "Ethnic collection", badge: "Hot seller", price: "From ₹899", q: "kurta", image: "https://images.unsplash.com/photo-1756483509177-bbabd67a3234?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080" },
  { title: "Korean Street", subtitle: "Limited drop", badge: "New drop", price: "From ₹1,499", q: "coord", image: "https://images.unsplash.com/photo-1760998209708-5fc89d7983c0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080" },
];

export default function NewDrops() {
  return (
    <section className="py-16 sm:py-20 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
      <div className="relative max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-3xl sm:text-4xl text-foreground">New Drops</h2>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary/15 border border-primary/30">
                <Flame className="w-3.5 h-3.5 text-primary" />
                <span className="text-xs text-primary font-medium">Hot</span>
              </span>
            </div>
            <p className="text-sm text-muted-foreground">Fresh arrivals and limited collections</p>
          </div>
          <Link to="/search" search={{ q: "" }} className="text-sm text-primary hover:text-primary-glow transition-colors">View collection</Link>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {newDrops.map((d) => (
            <Link
              key={d.title}
              to="/search"
              search={{ q: d.q }}
              className="group relative rounded-2xl overflow-hidden bg-card/80 border border-border hover:border-primary/40 hover-lift transition-all duration-300 cursor-pointer block"
            >
              <div className="relative aspect-[3/4] overflow-hidden">
                <ImageWithFallback src={d.image} alt={d.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
                <div className="absolute top-3 left-3">
                  <span className="px-2.5 py-1 rounded-full text-xs bg-primary text-primary-foreground backdrop-blur-sm flex items-center gap-1 font-medium">
                    <Sparkles className="w-3 h-3" />
                    {d.badge}
                  </span>
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <p className="text-xs text-white/65 mb-1">{d.subtitle}</p>
                  <h3 className="text-base sm:text-lg text-white mb-2 font-medium">{d.title}</h3>
                  <p className="text-sm text-primary font-medium">{d.price}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}