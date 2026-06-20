import { Home, Search, ShoppingBag, Heart, User } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useWearbuy } from "@/context/wearbuy-store";

export default function BottomNav() {
  const { setCartOpen, setWishOpen, setProfileOpen, cartCount, wishlist } = useWearbuy();
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 md:hidden">
      <div className="backdrop-blur-2xl bg-background/95 border-t border-border/80">
        <div className="flex items-center justify-around px-2 py-2.5">
          <Link to="/" className="flex flex-col items-center gap-1 px-3 py-1.5 text-primary">
            <Home className="w-5 h-5" />
            <span className="text-[10px]">Home</span>
          </Link>
          <Link to="/search" search={{ q: "" }} className="flex flex-col items-center gap-1 px-3 py-1.5 text-muted-foreground hover:text-foreground">
            <Search className="w-5 h-5" />
            <span className="text-[10px]">Search</span>
          </Link>
          <button onClick={() => setCartOpen(true)} className="flex flex-col items-center gap-1 px-3 py-1.5 text-muted-foreground hover:text-foreground relative">
            <ShoppingBag className="w-5 h-5" />
            <span className="text-[10px]">Cart</span>
            {cartCount > 0 && <span className="absolute top-0 right-0 w-4 h-4 bg-primary text-primary-foreground text-[10px] rounded-full flex items-center justify-center font-medium">{cartCount}</span>}
          </button>
          <button onClick={() => setWishOpen(true)} className="flex flex-col items-center gap-1 px-3 py-1.5 text-muted-foreground hover:text-foreground relative">
            <Heart className="w-5 h-5" />
            <span className="text-[10px]">Wishlist</span>
            {wishlist.length > 0 && <span className="absolute top-0 right-0 w-4 h-4 bg-primary text-primary-foreground text-[10px] rounded-full flex items-center justify-center font-medium">{wishlist.length}</span>}
          </button>
          <button onClick={() => setProfileOpen(true)} className="flex flex-col items-center gap-1 px-3 py-1.5 text-muted-foreground hover:text-foreground">
            <User className="w-5 h-5" />
            <span className="text-[10px]">Profile</span>
          </button>
        </div>
      </div>
    </nav>
  );
}