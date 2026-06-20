import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Shield, Mail, Lock } from "lucide-react";
import { GoogleAuthProvider, signInWithPopup, signInWithEmailAndPassword } from "firebase/auth";
import { useServerFn } from "@tanstack/react-start";
import { auth } from "@/lib/firebase";
import { syncUser } from "@/lib/user.functions";
import { useAuth } from "@/context/auth-store";

export const Route = createFileRoute("/admin-login")({
  component: AdminLogin,
});

const SUPER_ADMIN_EMAIL = import.meta.env.VITE_SUPER_ADMIN_EMAIL ?? "naveen.maan2006@gmail.com";

function AdminLogin() {
  const { firebaseUser, role, loading } = useAuth();
  const navigate = useNavigate();
  const sync = useServerFn(syncUser);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  // Already logged in as admin → go to admin portal.
  useEffect(() => {
    if (!loading && firebaseUser && role === "ADMIN") {
      navigate({ to: "/admin" });
    }
  }, [loading, firebaseUser, role, navigate]);

  async function afterAuth(userEmail: string | null) {
    if (userEmail?.toLowerCase() !== SUPER_ADMIN_EMAIL) {
      setError("This account is not authorized for admin access.");
      await auth.signOut();
      return;
    }
    const u = auth.currentUser;
    if (u) {
      await sync({ data: { firebaseUid: u.uid, email: u.email ?? "", name: u.displayName, image: u.photoURL } });
    }
    navigate({ to: "/admin" });
  }

  async function googleLogin() {
    setBusy(true);
    setError("");
    try {
      const res = await signInWithPopup(auth, new GoogleAuthProvider());
      await afterAuth(res.user.email);
    } catch (e: any) {
      setError(e.message || "Login failed");
    } finally {
      setBusy(false);
    }
  }

  async function emailLogin(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await signInWithEmailAndPassword(auth, email, password);
      await afterAuth(res.user.email);
    } catch (e: any) {
      setError(e.code === "auth/invalid-credential" ? "Invalid email or password" : e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-foreground px-4">
      <div className="max-w-md w-full rounded-3xl bg-background border border-border p-8 shadow-2xl animate-scaleIn">
        <div className="flex flex-col items-center text-center mb-7">
          <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center mb-4">
            <Shield className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-heading text-foreground mb-1">Admin Access</h1>
          <p className="text-sm text-muted-foreground">Restricted — authorized personnel only</p>
        </div>

        <button
          onClick={googleLogin}
          disabled={busy}
          className="w-full flex items-center justify-center gap-3 py-3.5 rounded-xl border border-border bg-background hover:bg-accent transition-all text-sm font-medium text-foreground mb-5 disabled:opacity-50"
        >
          Continue with Google
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="flex-1 h-px bg-border" />
          <span className="text-xs text-muted-foreground">or</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        <form onSubmit={emailLogin} className="space-y-3.5">
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="email"
              placeholder="Admin email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full pl-11 pr-4 py-3.5 bg-input-background rounded-xl border border-border text-foreground text-sm focus:outline-none focus:border-primary/40"
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
              className="w-full pl-11 pr-4 py-3.5 bg-input-background rounded-xl border border-border text-foreground text-sm focus:outline-none focus:border-primary/40"
            />
          </div>
          {error && <p className="text-xs text-destructive bg-destructive/10 rounded-lg px-3 py-2">{error}</p>}
          <button
            type="submit"
            disabled={busy}
            className="w-full py-3.5 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary-glow transition-all disabled:opacity-50"
          >
            {busy ? "Verifying…" : "Sign in to Admin"}
          </button>
        </form>

        <Link to="/" className="block text-center text-xs text-muted-foreground hover:text-foreground mt-6">
          ← Back to store
        </Link>
      </div>
    </div>
  );
}
