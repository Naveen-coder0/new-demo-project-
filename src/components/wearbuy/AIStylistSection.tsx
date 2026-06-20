import { Sparkles } from "lucide-react";
import { ImageWithFallback } from "@/components/figma/ImageWithFallback";
import { useWearbuy } from "@/context/wearbuy-store";

const outfits = [
  { title: "Urban Explorer", items: "5 items • ₹4,299", image: "https://images.unsplash.com/photo-1774133874606-6057a0b4d22c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080" },
  { title: "Casual Chic", items: "4 items • ₹3,599", image: "https://images.unsplash.com/photo-1511474274885-186ea2ca6b24?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080" },
  { title: "Night Out", items: "6 items • ₹5,899", image: "https://images.unsplash.com/photo-1715968347067-96290933b3ba?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080" },
];

export default function AIStylistSection() {
  const { setStylistOpen } = useWearbuy();
  return (
    <section className="py-16 sm:py-20 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent" />
      <div className="relative max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/15 border border-primary/30 mb-4">
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            <span className="text-xs text-primary font-medium">AI-Powered Styling</span>
          </div>
          <h2 className="text-3xl sm:text-4xl text-foreground mb-3">Curated Outfits for You</h2>
          <p className="text-sm sm:text-base text-muted-foreground max-w-2xl">Complete looks styled for your vibe, weather & occasion</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {outfits.map((o) => (
            <div key={o.title} className="group relative rounded-2xl overflow-hidden aspect-[3/4] cursor-pointer">
              <ImageWithFallback src={o.image} alt={o.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
              <div className="absolute inset-0 ring-1 ring-inset ring-white/5 group-hover:ring-primary/30 rounded-2xl transition-all" />
              <div className="absolute top-3 right-3">
                <div className="p-1.5 rounded-lg bg-primary backdrop-blur-sm">
                  <Sparkles className="w-3.5 h-3.5 text-primary-foreground" />
                </div>
              </div>
              <div className="absolute bottom-0 left-0 right-0 p-4">
                <h3 className="text-lg text-white mb-1 drop-shadow-lg font-medium">{o.title}</h3>
                <p className="text-xs text-white/75">{o.items}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="text-center">
          <button onClick={() => setStylistOpen(true)} className="px-6 py-3 rounded-xl bg-primary hover:bg-primary-glow text-primary-foreground transition-all text-sm inline-flex items-center gap-2 font-semibold">
            <Sparkles className="w-4 h-4" />
            Get Styled by AI
          </button>
        </div>
      </div>
    </section>
  );
}