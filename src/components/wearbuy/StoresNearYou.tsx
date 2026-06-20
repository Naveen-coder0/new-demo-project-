import { Star, Clock, MapPin, TrendingUp } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { ImageWithFallback } from "@/components/figma/ImageWithFallback";
import { stores } from "@/lib/wearbuy-data";

export default function StoresNearYou() {
  return (
    <section className="py-16 sm:py-20">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl sm:text-4xl text-foreground mb-2">Stores Near You</h2>
            <p className="text-sm text-muted-foreground">Discover fashion from local stores</p>
          </div>
          <Link to="/search" search={{ q: "" }} className="text-sm text-primary hover:text-primary-glow transition-colors">View all</Link>
        </div>
        <div className="overflow-x-auto pb-4 -mx-4 px-4 scrollbar-hide">
          <div className="flex gap-4 min-w-min">
            {stores.map((store) => (
              <Link key={store.id} to="/store/$storeId" params={{ storeId: store.id }} className="flex-shrink-0 w-[280px] sm:w-[300px] group">
                <div className="relative rounded-2xl overflow-hidden bg-card/80 border border-border hover:border-primary/40 hover-lift transition-all duration-300 h-full">
                  <div className="relative h-44 overflow-hidden">
                    <ImageWithFallback src={store.image} alt={store.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    <div className="absolute top-3 right-3">
                      <span className="px-2.5 py-1 rounded-full text-xs bg-green-500/85 text-white backdrop-blur-sm">Open now</span>
                    </div>
                    {store.badge && (
                      <div className="absolute top-3 left-3">
                        <span className="px-2.5 py-1 rounded-full text-xs bg-primary text-primary-foreground backdrop-blur-sm flex items-center gap-1 font-medium">
                          <TrendingUp className="w-3 h-3" />
                          {store.badge}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="text-base text-foreground mb-1 font-medium">{store.name}</h3>
                    <p className="text-xs text-muted-foreground mb-3">{store.category}</p>
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {store.tags.map((tag) => (
                        <span key={tag} className="px-2 py-0.5 rounded-md bg-secondary/60 text-foreground/85 text-[11px]">{tag}</span>
                      ))}
                    </div>
                    <div className="flex items-center gap-3 mb-3 text-xs">
                      <div className="flex items-center gap-1"><Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" /><span className="text-foreground">{store.rating}</span></div>
                      <div className="flex items-center gap-1 text-muted-foreground"><MapPin className="w-3.5 h-3.5" /><span>{store.distance}</span></div>
                      <div className="flex items-center gap-1 text-green-600"><Clock className="w-3.5 h-3.5" /><span>{store.deliveryTime}</span></div>
                    </div>
                    <div className="w-full py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary-glow transition-all text-sm text-center font-medium">View Store</div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}