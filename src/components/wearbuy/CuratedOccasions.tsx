import { Link } from "@tanstack/react-router";
import { ImageWithFallback } from "@/components/figma/ImageWithFallback";
import { occasions } from "@/lib/wearbuy-data";

export default function CuratedOccasions() {
  return (
    <section className="py-16 sm:py-20">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl sm:text-4xl text-foreground mb-2">Shop by Occasion</h2>
            <p className="text-sm text-muted-foreground">Find the perfect outfit for every moment</p>
          </div>
          <button className="text-sm text-primary hover:text-primary-glow transition-colors">See all</button>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          {occasions.map((o) => (
            <Link
              key={o.slug}
              to="/search"
              search={{ q: "", occasion: o.slug }}
              className="group relative rounded-2xl overflow-hidden aspect-[3/4] cursor-pointer block"
            >
              <ImageWithFallback src={o.image} alt={o.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
              <div className="absolute inset-0 ring-1 ring-inset ring-white/5 group-hover:ring-primary/30 rounded-2xl transition-all" />
              <div className="absolute bottom-0 left-0 right-0 p-4">
                <h3 className="text-base sm:text-lg text-white mb-1 drop-shadow-lg font-medium">{o.title}</h3>
                <p className="text-xs text-white/70">{o.count}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}