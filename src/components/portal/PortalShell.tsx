import { Link } from "@tanstack/react-router";
import { LogOut, ArrowLeft } from "lucide-react";
import { useAuth } from "@/context/auth-store";

type NavItem = { label: string; icon: React.ReactNode; key: string };

export default function PortalShell({
  title,
  subtitle,
  accent,
  nav,
  active,
  onNavigate,
  children,
}: {
  title: string;
  subtitle: string;
  accent: string;
  nav: NavItem[];
  active: string;
  onNavigate: (key: string) => void;
  children: React.ReactNode;
}) {
  const { dbUser, firebaseUser, logout } = useAuth();
  const name = dbUser?.name ?? firebaseUser?.displayName ?? firebaseUser?.email ?? "Guest";

  return (
    <div className="min-h-screen bg-secondary/30 flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-64 md:min-h-screen bg-background border-r border-border flex flex-col">
        <div className="p-5 border-b border-border">
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full" style={{ background: accent }} />
            <h1 className="text-lg font-heading text-foreground">{title}</h1>
          </div>
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-x-auto md:overflow-visible flex md:flex-col">
          {nav.map((item) => (
            <button
              key={item.key}
              onClick={() => onNavigate(item.key)}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap w-full ${
                active === item.key
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
              }`}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </nav>

        <div className="p-3 border-t border-border space-y-1">
          <Link
            to="/"
            className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Store
          </Link>
          <button
            onClick={() => logout()}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm text-destructive hover:bg-destructive/10 transition-all"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 min-w-0">
        <header className="bg-background border-b border-border px-6 py-4 flex items-center justify-between sticky top-0 z-10">
          <div>
            <p className="text-xs text-muted-foreground">Signed in as</p>
            <p className="text-sm font-medium text-foreground">{name}</p>
          </div>
          <span className="px-3 py-1 rounded-full text-xs font-medium bg-accent text-foreground">{dbUser?.role ?? "USER"}</span>
        </header>
        <div className="p-6 animate-fadeIn">{children}</div>
      </main>
    </div>
  );
}

export function StatCard({ label, value, icon, accent }: { label: string; value: string | number; icon: React.ReactNode; accent?: string }) {
  return (
    <div className="p-5 rounded-2xl bg-background border border-border hover-lift">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{label}</span>
        <span className="p-2 rounded-lg" style={{ background: accent ?? "var(--accent)" }}>
          {icon}
        </span>
      </div>
      <p className="text-3xl font-heading text-foreground">{value}</p>
    </div>
  );
}

export function AuthGate({
  allow,
  children,
}: {
  allow: ("ADMIN" | "SHOP_OWNER" | "DELIVERY" | "USER")[];
  children: React.ReactNode;
}) {
  const { loading, firebaseUser, role } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground animate-pulseGlow">Loading…</p>
      </div>
    );
  }

  if (!firebaseUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="text-center max-w-sm">
          <h1 className="text-2xl font-heading text-foreground mb-2">Sign in required</h1>
          <p className="text-sm text-muted-foreground mb-6">Please sign in from the store to access this portal.</p>
          <Link to="/" className="px-6 py-3 rounded-xl bg-primary text-primary-foreground font-semibold inline-block">
            Go to Store
          </Link>
        </div>
      </div>
    );
  }

  if (role && !allow.includes(role)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="text-center max-w-sm">
          <h1 className="text-2xl font-heading text-foreground mb-2">Access denied</h1>
          <p className="text-sm text-muted-foreground mb-6">
            Your account ({role}) doesn't have permission for this portal.
          </p>
          <Link to="/" className="px-6 py-3 rounded-xl bg-primary text-primary-foreground font-semibold inline-block">
            Go to Store
          </Link>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
