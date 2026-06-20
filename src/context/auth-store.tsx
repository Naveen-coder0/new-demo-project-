import * as React from "react";
import { onAuthStateChanged, signOut, type User as FirebaseUser } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { getUserByUid, type SyncedUser, type Role } from "@/lib/user.functions";

type AuthCtx = {
  firebaseUser: FirebaseUser | null;
  dbUser: SyncedUser | null;
  role: Role | null;
  onboarded: boolean;
  loading: boolean;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
};

const Ctx = React.createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [firebaseUser, setFirebaseUser] = React.useState<FirebaseUser | null>(null);
  const [dbUser, setDbUser] = React.useState<SyncedUser | null>(null);
  const [loading, setLoading] = React.useState(true);

  const loadDbUser = React.useCallback(async (uid: string) => {
    try {
      const u = await getUserByUid({ data: { firebaseUid: uid } });
      setDbUser(u);
    } catch {
      setDbUser(null);
    }
  }, []);

  React.useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setFirebaseUser(u);
      if (u) {
        await loadDbUser(u.uid);
      } else {
        setDbUser(null);
      }
      setLoading(false);
    });
    return () => unsub();
  }, [loadDbUser]);

  const value: AuthCtx = {
    firebaseUser,
    dbUser,
    role: dbUser?.role ?? null,
    onboarded: dbUser?.onboarded ?? false,
    loading,
    logout: async () => {
      await signOut(auth);
      setDbUser(null);
    },
    refresh: async () => {
      if (firebaseUser) await loadDbUser(firebaseUser.uid);
    },
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const ctx = React.useContext(Ctx);
  if (!ctx) throw new Error("useAuth outside provider");
  return ctx;
}
