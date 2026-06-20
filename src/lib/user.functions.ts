import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { prisma } from "./prisma";

const SyncUserSchema = z.object({
  firebaseUid: z.string().min(1),
  email: z.string().email(),
  name: z.string().optional().nullable(),
  image: z.string().optional().nullable(),
});

export type Role = "USER" | "ADMIN" | "SHOP_OWNER" | "DELIVERY";

export type SyncedUser = {
  id: string;
  firebaseUid: string;
  email: string;
  name: string | null;
  image: string | null;
  role: Role;
  onboarded: boolean;
  blocked: boolean;
  createdAt: string;
};

// Super-admin email — auto-promoted to ADMIN on sign-in.
const SUPER_ADMIN_EMAIL = process.env.SUPER_ADMIN_EMAIL ?? "naveen.maan2006@gmail.com";

function toDto(u: any): SyncedUser {
  return {
    id: u.id,
    firebaseUid: u.firebaseUid,
    email: u.email,
    name: u.name,
    image: u.image,
    role: u.role as Role,
    onboarded: u.onboarded,
    blocked: u.blocked,
    createdAt: u.createdAt.toISOString(),
  };
}

/** Upsert a Firebase-authenticated user into Neon. Super-admin auto-promoted. */
export const syncUser = createServerFn({ method: "POST" })
  .inputValidator((d) => SyncUserSchema.parse(d))
  .handler(async ({ data }): Promise<SyncedUser> => {
    const isAdmin = data.email.toLowerCase() === SUPER_ADMIN_EMAIL;

    const user = await prisma.user.upsert({
      where: { firebaseUid: data.firebaseUid },
      update: {
        email: data.email,
        name: data.name ?? undefined,
        image: data.image ?? undefined,
        ...(isAdmin ? { role: "ADMIN", onboarded: true } : {}),
      },
      create: {
        firebaseUid: data.firebaseUid,
        email: data.email,
        name: data.name ?? undefined,
        image: data.image ?? undefined,
        role: isAdmin ? "ADMIN" : "USER",
        onboarded: isAdmin,
      },
    });

    return toDto(user);
  });

/** Fetch a user by Firebase UID. */
export const getUserByUid = createServerFn({ method: "GET" })
  .inputValidator((d: { firebaseUid: string }) => z.object({ firebaseUid: z.string() }).parse(d))
  .handler(async ({ data }): Promise<SyncedUser | null> => {
    const user = await prisma.user.findUnique({ where: { firebaseUid: data.firebaseUid } });
    return user ? toDto(user) : null;
  });

/** Choose a role during first-login onboarding (permanent). */
export const chooseRole = createServerFn({ method: "POST" })
  .inputValidator((d: { firebaseUid: string; role: "USER" | "SHOP_OWNER" | "DELIVERY"; phone?: string }) =>
    z
      .object({
        firebaseUid: z.string(),
        role: z.enum(["USER", "SHOP_OWNER", "DELIVERY"]),
        phone: z.string().optional(),
      })
      .parse(d),
  )
  .handler(async ({ data }): Promise<SyncedUser> => {
    const existing = await prisma.user.findUnique({ where: { firebaseUid: data.firebaseUid } });
    if (!existing) throw new Error("User not found");
    // Never downgrade an admin.
    if (existing.role === "ADMIN") return toDto(existing);

    const user = await prisma.user.update({
      where: { firebaseUid: data.firebaseUid },
      data: { role: data.role, onboarded: true, phone: data.phone ?? undefined },
    });
    return toDto(user);
  });

/** Admin-only: set any user's role. */
export const setUserRole = createServerFn({ method: "POST" })
  .inputValidator((d: { userId: string; role: Role }) =>
    z.object({ userId: z.string(), role: z.enum(["USER", "ADMIN", "SHOP_OWNER", "DELIVERY"]) }).parse(d),
  )
  .handler(async ({ data }) => {
    await prisma.user.update({ where: { id: data.userId }, data: { role: data.role } });
    return { ok: true };
  });

/** Admin-only: block / unblock a user. */
export const setUserBlocked = createServerFn({ method: "POST" })
  .inputValidator((d: { userId: string; blocked: boolean }) =>
    z.object({ userId: z.string(), blocked: z.boolean() }).parse(d),
  )
  .handler(async ({ data }) => {
    await prisma.user.update({ where: { id: data.userId }, data: { blocked: data.blocked } });
    return { ok: true };
  });
