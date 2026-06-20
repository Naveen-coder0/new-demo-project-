import { useState, useEffect, useRef, useCallback } from "react";
import { Bell, Check, CheckCheck, Package, Store, Truck, ShieldAlert, X } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { useAuth } from "@/context/auth-store";
import { getNotifications, getUnreadCount, markNotificationRead, markAllRead, type NotificationItem } from "@/lib/notification.functions";

const TYPE_ICONS: Record<string, typeof Package> = {
  order_placed: Package,
  order_shipped: Truck,
  order_delivered: Package,
  new_order: Package,
  shop_approved: Store,
  admin_alert: ShieldAlert,
};

export default function NotificationBell() {
  const { firebaseUser } = useAuth();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unread, setUnread] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  const fetchNotifs = useServerFn(getNotifications);
  const fetchCount = useServerFn(getUnreadCount);
  const markRead = useServerFn(markNotificationRead);
  const markAll = useServerFn(markAllRead);

  const load = useCallback(() => {
    if (!firebaseUser) return;
    fetchCount({ data: { uid: firebaseUser.uid } }).then((r) => setUnread(r.count)).catch(() => {});
  }, [firebaseUser, fetchCount]);

  // Poll every 15 seconds for live updates
  useEffect(() => {
    load();
    const interval = setInterval(load, 15000);
    return () => clearInterval(interval);
  }, [load]);

  // Close on outside click
  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("click", close);
    return () => window.removeEventListener("click", close);
  }, []);

  async function openPanel() {
    setOpen(true);
    if (!firebaseUser) return;
    const data = await fetchNotifs({ data: { uid: firebaseUser.uid, limit: 20 } });
    setItems(data);
  }

  async function handleMarkRead(id: string) {
    await markRead({ data: { id } });
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    setUnread((c) => Math.max(0, c - 1));
  }

  async function handleMarkAll() {
    if (!firebaseUser) return;
    await markAll({ data: { uid: firebaseUser.uid } });
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnread(0);
  }

  function timeAgo(date: string) {
    const diff = Date.now() - new Date(date).getTime();
    const min = Math.floor(diff / 60000);
    if (min < 1) return "Just now";
    if (min < 60) return `${min}m ago`;
    const hr = Math.floor(min / 60);
    if (hr < 24) return `${hr}h ago`;
    return `${Math.floor(hr / 24)}d ago`;
  }

  if (!firebaseUser) return null;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={openPanel}
        className="relative p-2.5 rounded-full hover:bg-accent transition-all"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5 text-foreground/70" />
        {unread > 0 && (
          <span className="absolute top-1 right-1 w-4.5 h-4.5 bg-destructive text-white text-[9px] rounded-full flex items-center justify-center font-bold animate-pulseGlow">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-background border border-border shadow-xl z-50 animate-fadeInDown overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <h3 className="text-sm font-semibold text-foreground">Notifications</h3>
            <div className="flex items-center gap-2">
              {unread > 0 && (
                <button onClick={handleMarkAll} className="text-[11px] text-primary font-medium hover:underline flex items-center gap-1">
                  <CheckCheck className="w-3 h-3" /> Mark all read
                </button>
              )}
              <button onClick={() => setOpen(false)} className="p-1 rounded hover:bg-accent">
                <X className="w-3.5 h-3.5 text-muted-foreground" />
              </button>
            </div>
          </div>

          {/* List */}
          <div className="max-h-96 overflow-y-auto">
            {items.length === 0 ? (
              <div className="py-12 text-center">
                <Bell className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No notifications yet</p>
              </div>
            ) : (
              items.map((n) => {
                const Icon = TYPE_ICONS[n.type] ?? Bell;
                return (
                  <div
                    key={n.id}
                    onClick={() => !n.read && handleMarkRead(n.id)}
                    className={`flex items-start gap-3 px-4 py-3 border-b border-border/50 cursor-pointer transition-colors ${
                      n.read ? "bg-background" : "bg-accent/40 hover:bg-accent/60"
                    }`}
                  >
                    <div className={`mt-0.5 p-2 rounded-lg flex-shrink-0 ${n.read ? "bg-secondary" : "bg-primary/10"}`}>
                      <Icon className={`w-4 h-4 ${n.read ? "text-muted-foreground" : "text-primary"}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm leading-tight ${n.read ? "text-muted-foreground" : "text-foreground font-medium"}`}>
                        {n.title}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.message}</p>
                      <p className="text-[10px] text-muted-foreground/60 mt-1">{timeAgo(n.createdAt)}</p>
                    </div>
                    {!n.read && (
                      <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-2" />
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
