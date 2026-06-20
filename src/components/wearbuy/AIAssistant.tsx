import { Sparkles, X, Send, ImagePlus, Loader2, Plus, Heart, Clock } from "lucide-react";
import { useRef, useState, useCallback } from "react";
import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useWearbuy } from "@/context/wearbuy-store";
import { askStylist, type StylistResponse } from "@/lib/stylist.functions";
import { products as ALL_PRODUCTS, type Product } from "@/lib/wearbuy-data";

const STYLE_MODES = [
  "College Fit",
  "Date Night",
  "Streetwear",
  "Concert",
  "Ethnic Function",
  "Airport Look",
  "Korean Fashion",
  "Old Money",
  "Budget Under ₹2000",
] as const;

type ChatMessage = {
  role: "user" | "ai";
  text: string;
  image?: string;
  vibe?: string;
  detected?: string;
  products?: Product[];
};

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result as string);
    r.onerror = rej;
    r.readAsDataURL(file);
  });
}

export default function AIAssistant() {
  const { stylistOpen, setStylistOpen, addToCart, setCartOpen } = useWearbuy();
  const ask = useServerFn(askStylist);
  const fileRef = useRef<HTMLInputElement>(null);
  const [input, setInput] = useState("");
  const [pendingImage, setPendingImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "ai",
      text:
        "Hey ✨ I'm your AI stylist. Drop a pic of sneakers, a kurta, or a Pinterest fit — I'll build the full look from stores near you.",
    },
  ]);

  const handleFiles = useCallback(async (files: FileList | null) => {
    if (!files || !files[0]) return;
    const url = await fileToDataUrl(files[0]);
    setPendingImage(url);
  }, []);

  const send = async (overrideMode?: string) => {
    const text = input.trim();
    if (!text && !pendingImage && !overrideMode) return;
    const userMsg: ChatMessage = {
      role: "user",
      text: overrideMode ? `Style me: ${overrideMode}` : text || "Complete this look",
      image: pendingImage ?? undefined,
    };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    const img = pendingImage;
    setPendingImage(null);
    setLoading(true);
    try {
      const res: StylistResponse = await ask({
        data: {
          message: text,
          imageDataUrl: img ?? undefined,
          mode: overrideMode,
        },
      });
      const matched = res.productIds
        .map((id) => ALL_PRODUCTS.find((p) => p.id === id))
        .filter((x): x is Product => !!x);
      setMessages((m) => [
        ...m,
        {
          role: "ai",
          text: res.reply,
          vibe: res.vibe,
          detected: res.detected,
          products: matched,
        },
      ]);
    } catch (e) {
      setMessages((m) => [
        ...m,
        { role: "ai", text: "AI hit a snag. Try again in a sec." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const addFullLook = (items: Product[]) => {
    items.forEach((p) => addToCart(p, p.sizes[1] ?? p.sizes[0]));
    setStylistOpen(false);
    setCartOpen(true);
  };

  return (
    <>
      <button
        onClick={() => setStylistOpen(!stylistOpen)}
        className="fixed right-5 sm:right-6 bottom-24 md:bottom-8 z-40 group"
        aria-label="AI Stylist"
      >
        <span className="absolute inset-0 rounded-2xl bg-primary/20 blur-md opacity-0 group-hover:opacity-100 transition-opacity" />
        <span className="relative flex items-center gap-3 px-4 py-3 rounded-2xl bg-primary backdrop-blur-xl border border-border hover:border-primary/40 text-primary-foreground shadow-lg">
          <span className="relative flex items-center justify-center w-8 h-8 rounded-xl bg-primary-foreground/15 border border-primary-foreground/30">
            <Sparkles className="w-4 h-4 text-primary-foreground" />
          </span>
          <span className="hidden sm:flex flex-col items-start leading-tight">
            <span className="text-sm font-medium">AI Stylist</span>
            <span className="text-[10px] text-primary-foreground/60">Drop a pic, get a fit</span>
          </span>
        </span>
      </button>

      {stylistOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 animate-in fade-in"
            onClick={() => setStylistOpen(false)}
          />
          <div
            className={`fixed right-0 top-0 bottom-0 w-full sm:w-[440px] bg-background border-l border-border z-50 flex flex-col transition-colors ${dragOver ? "ring-2 ring-primary/60" : ""}`}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              handleFiles(e.dataTransfer.files);
            }}
          >
            <div className="flex items-center justify-between p-5 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/15 border border-primary/30">
                  <Sparkles className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg text-foreground font-medium">AI Stylist</h3>
                  <p className="text-[11px] text-muted-foreground">Visual fashion AI · powered by WearBuy</p>
                </div>
              </div>
              <button
                onClick={() => setStylistOpen(false)}
                className="p-2 rounded-lg hover:bg-secondary/60"
              >
                <X className="w-5 h-5 text-foreground/85" />
              </button>
            </div>

            {/* Style mode chips */}
            <div className="px-5 py-3 border-b border-border overflow-x-auto">
              <div className="flex gap-2 w-max">
                {STYLE_MODES.map((mode) => (
                  <button
                    key={mode}
                    disabled={loading}
                    onClick={() => send(mode)}
                    className="px-3 py-1.5 rounded-full bg-secondary/60 border border-border hover:border-primary/50 hover:bg-primary/10 text-xs text-foreground/85 whitespace-nowrap transition-all"
                  >
                    {mode}
                  </button>
                ))}
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              {messages.map((m, i) => (
                <div key={i} className={m.role === "user" ? "flex justify-end" : "flex items-start gap-3"}>
                  {m.role === "ai" && (
                    <div className="p-2 rounded-lg bg-primary/15 border border-primary/30 flex-shrink-0">
                      <Sparkles className="w-4 h-4 text-primary" />
                    </div>
                  )}
                  <div className={`flex-1 ${m.role === "user" ? "max-w-[85%]" : ""}`}>
                    {m.image && (
                      <img
                        src={m.image}
                        alt="upload"
                        className="mb-2 rounded-xl max-h-48 object-cover border border-border"
                      />
                    )}
                    <div
                      className={
                        m.role === "user"
                          ? "bg-primary text-primary-foreground rounded-2xl rounded-tr-sm px-4 py-2.5 text-sm font-medium inline-block"
                          : "bg-card/80 rounded-xl px-4 py-3 border border-border text-sm text-foreground/95 leading-relaxed"
                      }
                    >
                      {m.text}
                    </div>
                    {m.detected && (
                      <p className="mt-2 text-[11px] text-muted-foreground">
                        Detected: <span className="text-primary">{m.detected}</span>
                        {m.vibe ? ` · vibe: ${m.vibe}` : ""}
                      </p>
                    )}

                    {m.products && m.products.length > 0 && (
                      <div className="mt-3 space-y-2">
                        <div className="grid grid-cols-2 gap-2">
                          {m.products.map((p) => (
                            <OutfitCard key={p.id} product={p} />
                          ))}
                        </div>
                        <button
                          onClick={() => addFullLook(m.products!)}
                          className="w-full py-2.5 rounded-xl bg-primary hover:bg-primary-glow text-primary-foreground text-xs font-semibold transition-all flex items-center justify-center gap-1.5"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          Add Full Look to Cart
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/15 border border-primary/30">
                    <Loader2 className="w-4 h-4 text-primary animate-spin" />
                  </div>
                  <p className="text-sm text-muted-foreground">Styling your fit...</p>
                </div>
              )}
            </div>

            {/* Composer */}
            <div className="p-4 border-t border-border space-y-2">
              {pendingImage && (
                <div className="relative inline-block">
                  <img src={pendingImage} alt="preview" className="h-16 w-16 rounded-lg object-cover border border-primary/40" />
                  <button
                    onClick={() => setPendingImage(null)}
                    className="absolute -top-1.5 -right-1.5 bg-foreground border border-border rounded-full p-0.5"
                  >
                    <X className="w-3 h-3 text-background" />
                  </button>
                </div>
              )}
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                hidden
                onChange={(e) => handleFiles(e.target.files)}
              />
              <div className="relative flex items-center gap-2">
                <button
                  onClick={() => fileRef.current?.click()}
                  className="p-2.5 rounded-xl bg-secondary/60 border border-border hover:border-primary/50 text-foreground/85 transition-all"
                  title="Upload outfit / sneakers / inspo"
                >
                  <ImagePlus className="w-4 h-4" />
                </button>
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !loading && send()}
                  placeholder="Describe your vibe or drop a pic..."
                  className="flex-1 pl-4 pr-12 py-3 bg-input-background rounded-xl border border-border text-foreground placeholder:text-muted-foreground/60 text-sm focus:outline-none focus:ring-1 focus:ring-primary/40"
                />
                <button
                  onClick={() => send()}
                  disabled={loading || (!input.trim() && !pendingImage)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg bg-primary hover:bg-primary-glow text-primary-foreground disabled:opacity-40 transition-all"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[10px] text-muted-foreground text-center">
                Tip: drag & drop a Pinterest screenshot anywhere here
              </p>
            </div>
          </div>
        </>
      )}
    </>
  );
}

function OutfitCard({ product }: { product: Product }) {
  const { addToCart, toggleWishlist, isWished } = useWearbuy();
  return (
    <div className="group rounded-xl overflow-hidden bg-card/40 border border-border hover:border-primary/50 transition-all">
      <Link to="/product/$productId" params={{ productId: product.id }} className="block relative aspect-square overflow-hidden">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        {product.tryAndBuy && (
          <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded-md bg-primary/90 text-primary-foreground text-[9px] font-semibold">
            Try & Buy
          </span>
        )}
        <button
          onClick={(e) => {
            e.preventDefault();
            toggleWishlist(product);
          }}
          className="absolute top-1.5 right-1.5 p-1 rounded-full bg-black/60 backdrop-blur"
        >
          <Heart className={`w-3 h-3 ${isWished(product.id) ? "fill-primary text-primary" : "text-foreground"}`} />
        </button>
      </Link>
      <div className="p-2 space-y-1">
        <p className="text-[11px] text-foreground truncate font-medium">{product.name}</p>
        <p className="text-[10px] text-muted-foreground truncate">{product.store}</p>
        <div className="flex items-center justify-between">
          <span className="text-xs text-primary font-semibold">{product.price}</span>
          <span className="flex items-center gap-0.5 text-[9px] text-green-400">
            <Clock className="w-2.5 h-2.5" />
            {product.deliveryEta}
          </span>
        </div>
        <button
          onClick={() => addToCart(product, product.sizes[1] ?? product.sizes[0])}
          className="w-full mt-1 py-1.5 rounded-md bg-primary/15 hover:bg-primary/25 text-primary text-[10px] font-semibold border border-primary/30 transition-all"
        >
          Add to Cart
        </button>
      </div>
    </div>
  );
}