import { MapPin, Search, Heart, ShoppingBag, User, ChevronDown, Check, X, Store as StoreIcon, Grid3X3, Compass } from "lucide-react";
import { Link, useNavigate, useSearch, useMatchRoute } from "@tanstack/react-router";
import { useState, useRef, useEffect } from "react";
import logoImage from "@/assets/we_rbuy.png";
import { cities, navCategories, suggestProducts, suggestStores } from "@/lib/wearbuy-data";
import { useWearbuy } from "@/context/wearbuy-store";
import { useAuth } from "@/context/auth-store";
import NotificationBell from "@/components/wearbuy/NotificationBell";

export default function Navbar() {
  const { city, setCity, cartCount, wishlist, setCartOpen, setWishOpen, setProfileOpen } = useWearbuy();
  const { firebaseUser } = useAuth();
  const [cityOpen, setCityOpen] = useState(false);
  const [unavailable, setUnavailable] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [suggestOpen, setSuggestOpen] = useState(false);
  const navigate = useNavigate();
  const ref = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const matchRoute = useMatchRoute();
  const onSearchRoute = !!matchRoute({ to: "/search" });
  const currentSearch = useSearch({ strict: false }) as { category?: string };
  const activeCategory = onSearchRoute ? currentSearch?.category ?? "For You" : "For You";

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setCityOpen(false);
      if (!searchRef.current?.contains(e.target as Node)) setSuggestOpen(false);
    };
    window.addEventListener("click", close);
    return () => window.removeEventListener("click", close);
  }, []);

  function pickCity(c: { name: string; available: boolean }) {
    if (!c.available) {
      setUnavailable(c.name);
      setCityOpen(false);
      return;
    }
    setCity(c.name);
    setCityOpen(false);
  }

  function submitSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!search.trim()) return;
    setSuggestOpen(false);
    navigate({ to: "/search", search: { q: search.trim() } });
  }

  function goCategory(cat: string) {
    navigate({ to: "/search", search: { q: "", category: cat } });
  }

  const productSuggestions = search.trim() ? suggestProducts(search, 5) : [];
  const storeSuggestions = search.trim() ? suggestStores(search, 3) : [];
  const hasSuggestions = productSuggestions.length + storeSuggestions.length > 0;

  return (
    <>
      <nav className="sticky top-0 z-50 bg-background/95 backdrop-blur-xl shadow-sm">
        {/* Main bar — compact, full-width feel */}
        <div className="border-b border-border/50">
          <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-4 h-[72px]">
              {/* Logo */}
              <Link to="/" className="flex-shrink-0">
                <img src={logoImage} alt="WearBuy" className="h-16 sm:h-20 w-auto object-contain mix-blend-multiply" />
              </Link>

              {/* City picker */}
              <div className="relative flex-shrink-0" ref={ref}>
                <button
                  onClick={() => setCityOpen((v) => !v)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-accent transition-all text-left"
                >
                  <MapPin className="w-4 h-4 text-primary flex-shrink-0" />
                  <div className="hidden sm:block leading-tight">
                    <p className="text-[11px] text-muted-foreground">Deliver to</p>
                    <p className="text-sm font-semibold text-foreground">{city}</p>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
                </button>
                {cityOpen && (
                  <div className="absolute left-0 mt-1.5 w-52 rounded-xl bg-background border border-border shadow-xl overflow-hidden animate-fadeInDown z-50">
                    <div className="p-1">
                      {cities.map((c) => (
                        <button
                          key={c.name}
                          onClick={() => pickCity(c)}
                          className="w-full flex items-center justify-between px-3 py-2 text-sm text-foreground rounded-lg hover:bg-accent transition-colors"
                        >
                          <span className="flex items-center gap-2">
                            {c.name}
                            {!c.available && (
                              <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground font-medium">soon</span>
                            )}
                          </span>
                          {c.name === city && <Check className="w-3.5 h-3.5 text-primary" />}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Search — takes up all remaining space */}
              <form onSubmit={submitSearch} className="hidden md:flex flex-1 min-w-0">
                <div className="relative w-full" ref={searchRef}>
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onFocus={() => setSuggestOpen(true)}
                    placeholder="Search for products, brands or more"
                    className="w-full pl-12 pr-5 py-3 bg-secondary/60 rounded-xl border border-border/50 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:bg-background focus:border-primary/30 focus:shadow-[0_0_0_3px_oklch(0.3_0.04_50_/_0.05)] transition-all text-base"
                  />
                  {suggestOpen && hasSuggestions && (
                    <div className="absolute left-0 right-0 mt-1.5 rounded-xl bg-background border border-border shadow-xl overflow-hidden z-50 animate-fadeInDown">
                      {productSuggestions.length > 0 && (
                        <div className="p-1.5">
                          <p className="px-3 py-1 text-[10px] tracking-widest uppercase text-muted-foreground font-medium">Products</p>
                          {productSuggestions.map((p) => (
                            <Link
                              key={p.id}
                              to="/product/$productId"
                              params={{ productId: p.id }}
                              onClick={() => { setSuggestOpen(false); setSearch(""); }}
                              className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-accent transition-colors"
                            >
                              <img src={p.image} alt={p.name} className="w-9 h-11 rounded-md object-cover" />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm text-foreground truncate font-medium">{p.name}</p>
                                <p className="text-[11px] text-muted-foreground">{p.store} • {p.price}</p>
                              </div>
                            </Link>
                          ))}
                        </div>
                      )}
                      {storeSuggestions.length > 0 && (
                        <div className="p-1.5 border-t border-border/60">
                          <p className="px-3 py-1 text-[10px] tracking-widest uppercase text-muted-foreground font-medium">Stores</p>
                          {storeSuggestions.map((s) => (
                            <Link
                              key={s.id}
                              to="/store/$storeId"
                              params={{ storeId: s.id }}
                              onClick={() => { setSuggestOpen(false); setSearch(""); }}
                              className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-accent transition-colors"
                            >
                              <div className="w-9 h-9 rounded-md bg-accent border border-border flex items-center justify-center">
                                <StoreIcon className="w-4 h-4 text-primary" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm text-foreground truncate font-medium">{s.name}</p>
                                <p className="text-[11px] text-muted-foreground">{s.category} • {s.deliveryTime}</p>
                              </div>
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </form>

              {/* Right nav links */}
              <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                <Link
                  to="/search"
                  search={{ q: "", category: "For You" }}
                  className="hidden lg:flex items-center gap-2 px-3.5 py-2.5 rounded-lg hover:bg-accent transition-all"
                >
                  <Grid3X3 className="w-5 h-5 text-foreground/70" />
                  <span className="text-sm text-foreground/80 font-medium">Categories</span>
                </Link>
                <Link
                  to="/search"
                  search={{ q: "", trending: true }}
                  className="hidden lg:flex items-center gap-2 px-3.5 py-2.5 rounded-lg hover:bg-accent transition-all"
                >
                  <Compass className="w-5 h-5 text-foreground/70" />
                  <span className="text-sm text-foreground/80 font-medium">Discover</span>
                </Link>

                <div className="w-px h-7 bg-border/60 mx-2 hidden lg:block" />

                <NotificationBell />

                <button
                  onClick={() => setWishOpen(true)}
                  className="relative flex items-center gap-2 px-3 py-2.5 rounded-lg hover:bg-accent transition-all"
                >
                  <Heart className="w-5 h-5 text-foreground/70" />
                  <span className="hidden xl:inline text-sm text-foreground/80 font-medium">Wishlist</span>
                  {wishlist.length > 0 && (
                    <span className="absolute top-1 left-6 xl:static w-4.5 h-4.5 bg-primary text-primary-foreground text-[10px] rounded-full flex items-center justify-center font-bold">
                      {wishlist.length}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => setCartOpen(true)}
                  className="relative flex items-center gap-2 px-3 py-2.5 rounded-lg hover:bg-accent transition-all"
                >
                  <ShoppingBag className="w-5 h-5 text-foreground/70" />
                  <span className="hidden xl:inline text-sm text-foreground/80 font-medium">Cart</span>
                  {cartCount > 0 && (
                    <span className="absolute top-1 left-6 xl:static w-4.5 h-4.5 bg-primary text-primary-foreground text-[10px] rounded-full flex items-center justify-center font-bold">
                      {cartCount}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => setProfileOpen(true)}
                  className="flex items-center gap-2 px-3 py-2.5 rounded-lg hover:bg-accent transition-all"
                >
                  {firebaseUser?.photoURL ? (
                    <img src={firebaseUser.photoURL} alt="" className="w-7 h-7 rounded-full object-cover" />
                  ) : (
                    <User className="w-5 h-5 text-foreground/70" />
                  )}
                  <span className="hidden xl:inline text-sm text-foreground/80 font-medium">
                    {firebaseUser ? "Account" : "Sign In"}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Category strip — full width with icons feel */}
        <div className="hidden md:block bg-background">
          <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-0 overflow-x-auto scrollbar-hide">
              {navCategories.map((category) => (
                <button
                  key={category}
                  onClick={() => goCategory(category)}
                  className={`flex-1 min-w-[100px] flex flex-col items-center gap-1 py-3 px-3 border-b-[2.5px] transition-all duration-200 ${
                    activeCategory === category
                      ? "border-primary text-primary font-semibold"
                      : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
                  }`}
                >
                  <span className="text-sm whitespace-nowrap">{category}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Mobile: search + pills */}
        <div className="md:hidden border-t border-border/30 px-4 pb-3 pt-2.5">
          <form onSubmit={submitSearch} className="relative w-full mb-2.5">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search fashion…"
              className="w-full pl-11 pr-4 py-3 bg-secondary/60 rounded-xl border border-border/50 text-foreground placeholder:text-muted-foreground/50 text-sm focus:outline-none focus:bg-background focus:border-primary/30 transition-all"
            />
          </form>
          <div className="flex gap-2 overflow-x-auto scrollbar-hide">
            {navCategories.map((category) => (
              <button
                key={category}
                onClick={() => goCategory(category)}
                className={`px-4 py-2 rounded-full text-sm whitespace-nowrap transition-all flex-shrink-0 border ${
                  activeCategory === category
                    ? "bg-primary text-primary-foreground border-primary font-medium"
                    : "text-muted-foreground hover:text-foreground border-border/60 hover:bg-accent"
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Unavailable city modal */}
      {unavailable && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/30 backdrop-blur-sm p-4"
          onClick={() => setUnavailable(null)}
        >
          <div
            className="relative max-w-sm w-full rounded-2xl bg-background border border-border p-6 text-center shadow-xl animate-scaleIn"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setUnavailable(null)}
              className="absolute top-3 right-3 p-1.5 rounded-full hover:bg-accent transition-colors"
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
            <div className="mx-auto w-14 h-14 rounded-full bg-accent flex items-center justify-center mb-4">
              <MapPin className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-xl text-foreground mb-2">Coming soon to {unavailable}</h3>
            <p className="text-sm text-muted-foreground mb-6">
              WearBuy is not available in your city yet. We&apos;re launching across India soon.
            </p>
            <button
              onClick={() => setUnavailable(null)}
              className="w-full py-3 rounded-xl bg-primary text-primary-foreground hover:bg-primary-glow transition-all font-medium"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
}
