import { Sparkles, Store, Truck, RotateCcw, ShoppingBag } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { ImageWithFallback } from "@/components/figma/ImageWithFallback";
import { useWearbuy } from "@/context/wearbuy-store";

const features = [
  { icon: Truck, label: "Fast Delivery" },
  { icon: ShoppingBag, label: "Try & Buy Available" },
  { icon: Sparkles, label: "AI Styling" },
  { icon: Store, label: "Nearby Fashion Stores" },
  { icon: RotateCcw, label: "Easy Returns" },
];

export default function Hero() {
  const { setStylistOpen } = useWearbuy();
  return (
    <section className="relative pt-12 pb-16 sm:pt-16 sm:pb-20 lg:pt-20 lg:pb-24 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-accent/40 via-transparent to-transparent" />

      <div className="relative max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          <div className="lg:col-span-5 space-y-8 animate-fadeIn">
            <div className="space-y-6">
              <h1 className="text-5xl sm:text-6xl lg:text-7xl text-foreground tracking-[-0.035em] leading-[1.05]">
                Get your fit
                <br />
                <span
                  className="italic text-transparent bg-clip-text"
                  style={{
                    backgroundImage:
                      "linear-gradient(110deg, oklch(0.3 0.04 50) 0%, oklch(0.5 0.04 45) 55%, oklch(0.38 0.04 50) 100%)",
                  }}
                >
                  in 60 minutes
                </span>
              </h1>

              <p className="text-lg sm:text-xl text-muted-foreground max-w-xl leading-relaxed">
                Discover curated fashion from top stores near you — delivered fast with AI-powered styling.
              </p>
            </div>

            <div className="flex flex-wrap gap-2.5 animate-stagger">
              {features.map((feature) => {
                const Icon = feature.icon;
                return (
                  <div
                    key={feature.label}
                    className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-card border border-border/60 hover-lift"
                  >
                    <Icon className="w-3.5 h-3.5 text-primary" />
                    <span className="text-xs text-foreground/80 font-medium">{feature.label}</span>
                  </div>
                );
              })}
            </div>

            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Link
                to="/search"
                search={{ q: "" }}
                className="px-8 py-4 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary-glow hover:shadow-lg transition-all duration-300 text-center"
              >
                Explore Stores
              </Link>
              <button
                onClick={() => setStylistOpen(true)}
                className="px-8 py-4 rounded-xl bg-secondary hover:bg-accent border border-border hover:border-primary/40 transition-all duration-300 text-foreground flex items-center justify-center gap-2 font-medium"
              >
                <Sparkles className="w-4 h-4 text-primary" />
                AI Style Me
              </button>
            </div>
          </div>

          <div className="lg:col-span-7 animate-fadeIn" style={{ animationDelay: "0.2s", opacity: 0 }}>
            <div className="grid grid-cols-5 gap-4 h-[500px] lg:h-[600px]">
              <div className="col-span-3 row-span-2 relative rounded-3xl overflow-hidden group hover-lift">
                <ImageWithFallback
                  src="https://images.unsplash.com/photo-1713448721612-9301044240e8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080"
                  alt="Featured Fashion"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/5 to-transparent" />
              </div>
              <div className="col-span-2 relative rounded-3xl overflow-hidden group hover-lift">
                <ImageWithFallback
                  src="https://images.unsplash.com/photo-1756483510859-c0ab4c45782c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080"
                  alt="Ethnic Fashion"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/5 to-transparent" />
              </div>
              <div className="col-span-2 relative rounded-3xl overflow-hidden group hover-lift">
                <ImageWithFallback
                  src="https://images.unsplash.com/photo-1764698192271-d6888c24e071?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080"
                  alt="Oversized Fashion"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/5 to-transparent" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
