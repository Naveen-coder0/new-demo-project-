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

/** Choose a role during first-login onboarding (permanent). Creates Shop / DeliveryPartner records. */
export const chooseRole = createServerFn({ method: "POST" })
  .inputValidator(
    (d: {
      firebaseUid: string;
      role: "USER" | "SHOP_OWNER" | "DELIVERY";
      name?: string;
      phone?: string;
      address?: string;
      city?: string;
      state?: string;
      pincode?: string;
      // Shop owner
      shopName?: string;
      shopType?: string;
      gstAvailable?: boolean;
      gstNumber?: string;
      // Delivery
      vehicleType?: string;
      vehicleNumber?: string;
      aadhaar?: string;
      license?: string;
    }) =>
      z
        .object({
          firebaseUid: z.string(),
          role: z.enum(["USER", "SHOP_OWNER", "DELIVERY"]),
          name: z.string().optional(),
          phone: z.string().optional(),
          address: z.string().optional(),
          city: z.string().optional(),
          state: z.string().optional(),
          pincode: z.string().optional(),
          shopName: z.string().optional(),
          shopType: z.string().optional(),
          gstAvailable: z.boolean().optional(),
          gstNumber: z.string().optional(),
          vehicleType: z.string().optional(),
          vehicleNumber: z.string().optional(),
          aadhaar: z.string().optional(),
          license: z.string().optional(),
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
      data: {
        role: data.role,
        onboarded: true,
        name: data.name ?? existing.name ?? undefined,
        phone: data.phone ?? undefined,
      },
    });

    // Save a default address if provided
    if (data.address && data.city && data.pincode) {
      const hasAddress = await prisma.address.count({ where: { userId: user.id } });
      if (hasAddress === 0) {
        await prisma.address.create({
          data: {
            userId: user.id,
            name: data.name ?? user.name ?? "Me",
            phone: data.phone ?? "",
            line1: data.address,
            city: data.city,
            state: data.state,
            pincode: data.pincode,
            isDefault: true,
          },
        });
      }
    }

    // Create the shop for shop owners (so the seller portal doesn't ask again)
    if (data.role === "SHOP_OWNER" && data.shopName) {
      const existingShop = await prisma.shop.findFirst({ where: { ownerId: user.id } });
      if (!existingShop) {
        await prisma.shop.create({
          data: {
            name: data.shopName,
            ownerId: user.id,
            category: data.shopType ?? "Fashion",
            ownerName: data.name ?? user.name ?? undefined,
            shopAddress: data.address,
            shopType: data.shopType,
            mobile: data.phone,
            gstAvailable: data.gstAvailable ?? false,
            gstNumber: data.gstNumber,
            status: "ACTIVE",
          },
        });
      }
    }

    // Create the delivery partner profile for delivery role
    if (data.role === "DELIVERY" && data.vehicleType) {
      const existingPartner = await prisma.deliveryPartner.findUnique({ where: { userId: user.id } });
      if (!existingPartner) {
        await prisma.deliveryPartner.create({
          data: {
            userId: user.id,
            fullName: data.name ?? user.name ?? "Delivery Partner",
            phone: data.phone ?? "",
            email: user.email,
            address: data.address ?? "",
            aadhaar: data.aadhaar ?? "",
            license: data.license ?? "",
            vehicleType: data.vehicleType,
            vehicleNumber: data.vehicleNumber ?? "",
            status: "PENDING",
          },
        });
      }
    }

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
