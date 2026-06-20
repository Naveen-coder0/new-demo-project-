import { X, User, ShoppingBag, Heart, Mail, Lock, UserPlus, LayoutDashboard, Store, Truck, LogOut, Package } from "lucide-react";
import { useState } from "react";
import { GoogleAuthProvider, signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword, type User as FirebaseUser } from "firebase/auth";
import { useServerFn } from "@tanstack/react-start";
import { Link } from "@tanstack/react-router";
import { auth } from "@/lib/firebase";
import { syncUser } from "@/lib/user.functions";
import { useWearbuy } from "@/context/wearbuy-store";
import { useAuth } from "@/context/auth-store";

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" aria-hidden="true">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  );
}

export default function ProfileModal() {
  const { profileOpen, setProfileOpen, setWishOpen, setCartOpen, wishlist, cart } = useWearbuy();
  const { firebaseUser, dbUser, role, logout } = useAuth();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const saveUser = useServerFn(syncUser);

  if (!profileOpen) return null;

  async function persistUser(fbUser: FirebaseUser, displayName?: string) {
    try {
      await saveUser({
        data: {
          firebaseUid: fbUser.uid,
          email: fbUser.email ?? "",
          name: fbUser.displayName ?? displayName ?? null,
          image: fbUser.photoURL ?? null,
        },
      });
    } catch (e) {
      console.error("User sync failed:", e);
    }
  }

  async function handleGoogle() {
    setLoading(true);
    setError("");
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      await persistUser(result.user);
    } catch (e: any) {
      setError(e.message || "Google sign-in failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      if (mode === "login") {
        const result = await signInWithEmailAndPassword(auth, email, password);
        await persistUser(result.user);
      } else {
        const result = await createUserWithEmailAndPassword(auth, email, password);
        await persistUser(result.user, name);
      }
    } catch (e: any) {
      const msg = e.code === "auth/invalid-credential"
        ? "Invalid email or password"
        : e.code === "auth/email-already-in-use"
        ? "Email already in use"
        : e.code === "auth/weak-password"
        ? "Password should be at least 6 characters"
        : e.message || "Something went wrong";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  const close = () => setProfileOpen(false);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/30 backdrop-blur-sm p-4" onClick={close}>
      <div className="relative max-w-md w-full rounded-3xl bg-background border border-border p-7 shadow-xl animate-scaleIn" onClick={(e) => e.stopPropagation()}>
        <button onClick={close} className="absolute top-4 right-4 p-2 rounded-full hover:bg-accent transition-colors">
          <X className="w-4.5 h-4.5 text-muted-foreground" />
        </button>

        {firebaseUser ? (
          /* ===== LOGGED IN VIEW ===== */
          <>
            <div className="flex items-center gap-4 mb-6">
              {firebaseUser.photoURL ? (
                <img src={firebaseUser.photoURL} alt="" className="w-14 h-14 rounded-full object-cover" />
              ) : (
                <div className="w-14 h-14 rounded-full bg-accent border border-border flex items-center justify-center">
                  <User className="w-6 h-6 text-primary" />
                </div>
              )}
              <div>
                <h2 className="text-xl text-foreground">{dbUser?.name ?? firebaseUser.displayName ?? "WearBuy User"}</h2>
                <p className="text-sm text-muted-foreground">{firebaseUser.email}</p>
                <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-accent text-foreground">{role ?? "USER"}</span>
              </div>
            </div>

            {/* Portals — only show user's own portal */}
            <p className="text-xs uppercase tracking-wide text-muted-foreground font-medium mb-2">Your Portal</p>
            <div className="space-y-2 mb-5">
              {(role === "USER" || role === "ADMIN") && (
                <Link to="/account" onClick={close} className="flex items-center gap-3 px-4 py-3 rounded-xl bg-secondary/60 hover:bg-accent border border-border text-sm font-medium text-foreground transition-all">
                  <Package className="w-4 h-4 text-primary" /> My Account & Orders
                </Link>
              )}
              {role === "SHOP_OWNER" && (
                <Link to="/seller" onClick={close} className="flex items-center gap-3 px-4 py-3 rounded-xl bg-secondary/60 hover:bg-accent border border-border text-sm font-medium text-foreground transition-all">
                  <Store className="w-4 h-4 text-primary" /> Seller Dashboard
                </Link>
              )}
              {role === "DELIVERY" && (
                <Link to="/delivery" onClick={close} className="flex items-center gap-3 px-4 py-3 rounded-xl bg-secondary/60 hover:bg-accent border border-border text-sm font-medium text-foreground transition-all">
                  <Truck className="w-4 h-4 text-primary" /> Delivery Dashboard
                </Link>
              )}
              {role === "ADMIN" && (
                <Link to="/admin" onClick={close} className="flex items-center gap-3 px-4 py-3 rounded-xl bg-primary/10 hover:bg-primary/15 border border-primary/20 text-sm font-medium text-foreground transition-all">
                  <LayoutDashboard className="w-4 h-4 text-primary" /> Admin Portal
                </Link>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2.5 mb-5">
              <button onClick={() => { close(); setCartOpen(true); }} className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-secondary/60 hover:bg-accent border border-border text-sm text-foreground/80 font-medium transition-all">
                <ShoppingBag className="w-4 h-4 text-primary" /> Cart ({cart.length})
              </button>
              <button onClick={() => { close(); setWishOpen(true); }} className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-secondary/60 hover:bg-accent border border-border text-sm text-foreground/80 font-medium transition-all">
                <Heart className="w-4 h-4 text-primary" /> Wishlist ({wishlist.length})
              </button>
            </div>

            <button onClick={() => { logout(); close(); }} className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-border text-sm text-destructive font-medium hover:bg-destructive/10 transition-all">
              <LogOut className="w-4 h-4" /> Logout
            </button>
          </>
        ) : (
          /* ===== LOGGED OUT / AUTH VIEW ===== */
          <>
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 rounded-full bg-accent border border-border flex items-center justify-center">
                <User className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h2 className="text-xl text-foreground">Welcome to WearBuy</h2>
                <p className="text-sm text-muted-foreground">Sign in to track orders & save fits</p>
              </div>
            </div>

            <button
              onClick={handleGoogle}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 py-3.5 rounded-xl border border-border bg-background hover:bg-accent transition-all text-sm font-medium text-foreground shadow-sm disabled:opacity-50"
            >
              <GoogleIcon />
              Continue with Google
            </button>

            <div className="flex items-center gap-3 my-5">
              <div className="flex-1 h-px bg-border" />
              <span className="text-xs text-muted-foreground">or</span>
              <div className="flex-1 h-px bg-border" />
            </div>

            <div className="flex gap-1 mb-5 p-1 rounded-xl bg-secondary border border-border">
              {(["login", "signup"] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => { setMode(m); setError(""); }}
                  className={`flex-1 py-2.5 rounded-lg text-sm capitalize transition-all font-medium ${
                    mode === m ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {m === "login" ? "Sign In" : "Sign Up"}
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5">
              {mode === "signup" && (
                <div className="relative">
                  <UserPlus className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Full name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-11 pr-4 py-3.5 bg-input-background rounded-xl border border-border text-foreground placeholder:text-muted-foreground/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/15 focus:border-primary/30 transition-all"
                  />
                </div>
              )}
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="email"
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full pl-11 pr-4 py-3.5 bg-input-background rounded-xl border border-border text-foreground placeholder:text-muted-foreground/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/15 focus:border-primary/30 transition-all"
                />
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full pl-11 pr-4 py-3.5 bg-input-background rounded-xl border border-border text-foreground placeholder:text-muted-foreground/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/15 focus:border-primary/30 transition-all"
                />
              </div>

              {error && <p className="text-xs text-destructive bg-destructive/10 rounded-lg px-3 py-2">{error}</p>}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-xl bg-primary text-primary-foreground hover:bg-primary-glow font-semibold transition-all disabled:opacity-50 text-sm"
              >
                {loading ? "Please wait..." : mode === "login" ? "Continue" : "Create Account"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
