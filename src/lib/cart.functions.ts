import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { prisma } from "./prisma";

export type CartLine = {
  id: string;
  productId: string;
  shopId: string;
  name: string;
  image: string | null;
  price: number;
  size: string | null;
  quantity: number;
};

export type CartView = {
  shopId: string | null;
  shopName: string | null;
  items: CartLine[];
  total: number;
};

async function buildCartView(userId: string): Promise<CartView> {
  const items = await prisma.cartItem.findMany({
    where: { userId },
    include: { product: { include: { shop: { select: { name: true } } } } },
    orderBy: { createdAt: "asc" },
  });

  const lines: CartLine[] = items.map((c) => ({
    id: c.id,
    productId: c.productId,
    shopId: c.shopId,
    name: c.product.name,
    image: c.product.image,
    price: c.product.price,
    size: c.size,
    quantity: c.quantity,
  }));

  const shopId = lines[0]?.shopId ?? null;
  const shopName = items[0]?.product.shop.name ?? null;
  const total = lines.reduce((s, l) => s + l.price * l.quantity, 0);
  return { shopId, shopName, items: lines, total };
}

async function userIdFromUid(uid: string): Promise<string> {
  const user = await prisma.user.findUnique({ where: { firebaseUid: uid } });
  if (!user) throw new Error("Please sign in");
  return user.id;
}

/** Get the current DB cart for a user. */
export const getCart = createServerFn({ method: "GET" })
  .inputValidator((d: { uid: string }) => z.object({ uid: z.string() }).parse(d))
  .handler(async ({ data }): Promise<CartView> => {
    const userId = await userIdFromUid(data.uid);
    return buildCartView(userId);
  });

/**
 * Add an item. Enforces single-shop rule.
 * If cart has items from a different shop and `force` is false, returns a conflict.
 */
export const addToCart = createServerFn({ method: "POST" })
  .inputValidator(
    (d: { uid: string; productId: string; size?: string; quantity?: number; force?: boolean }) =>
      z
        .object({
          uid: z.string(),
          productId: z.string(),
          size: z.string().optional(),
          quantity: z.number().int().positive().optional(),
          force: z.boolean().optional(),
        })
        .parse(d),
  )
  .handler(
    async ({
      data,
    }): Promise<{ ok: true; cart: CartView } | { ok: false; conflict: true; currentShopName: string }> => {
      const userId = await userIdFromUid(data.uid);

      const product = await prisma.product.findUnique({
        where: { id: data.productId },
        include: { shop: { select: { name: true } } },
      });
      if (!product) throw new Error("Product not found");

      const existing = await prisma.cartItem.findMany({ where: { userId } });
      const currentShopId = existing[0]?.shopId ?? null;

      // Single-shop enforcement
      if (currentShopId && currentShopId !== product.shopId) {
        if (!data.force) {
          const currentShop = await prisma.shop.findUnique({ where: { id: currentShopId } });
          return { ok: false, conflict: true, currentShopName: currentShop?.name ?? "another shop" };
        }
        // Clear cart to switch shops
        await prisma.cartItem.deleteMany({ where: { userId } });
      }

      // Upsert the line (unique on userId+productId+size+color)
      const size = data.size ?? "";
      const color = "";
      const found = await prisma.cartItem.findFirst({
        where: { userId, productId: data.productId, size, color },
      });
      if (found) {
        await prisma.cartItem.update({
          where: { id: found.id },
          data: { quantity: found.quantity + (data.quantity ?? 1) },
        });
      } else {
        await prisma.cartItem.create({
          data: {
            userId,
            productId: data.productId,
            shopId: product.shopId,
            size,
            color,
            quantity: data.quantity ?? 1,
          },
        });
      }

      return { ok: true, cart: await buildCartView(userId) };
    },
  );

export const updateCartQty = createServerFn({ method: "POST" })
  .inputValidator((d: { uid: string; itemId: string; quantity: number }) =>
    z.object({ uid: z.string(), itemId: z.string(), quantity: z.number().int() }).parse(d),
  )
  .handler(async ({ data }): Promise<CartView> => {
    const userId = await userIdFromUid(data.uid);
    if (data.quantity <= 0) {
      await prisma.cartItem.deleteMany({ where: { id: data.itemId, userId } });
    } else {
      await prisma.cartItem.updateMany({ where: { id: data.itemId, userId }, data: { quantity: data.quantity } });
    }
    return buildCartView(userId);
  });

export const removeCartItem = createServerFn({ method: "POST" })
  .inputValidator((d: { uid: string; itemId: string }) =>
    z.object({ uid: z.string(), itemId: z.string() }).parse(d),
  )
  .handler(async ({ data }): Promise<CartView> => {
    const userId = await userIdFromUid(data.uid);
    await prisma.cartItem.deleteMany({ where: { id: data.itemId, userId } });
    return buildCartView(userId);
  });

export const clearCart = createServerFn({ method: "POST" })
  .inputValidator((d: { uid: string }) => z.object({ uid: z.string() }).parse(d))
  .handler(async ({ data }): Promise<CartView> => {
    const userId = await userIdFromUid(data.uid);
    await prisma.cartItem.deleteMany({ where: { userId } });
    return buildCartView(userId);
  });

/**
 * Server-side single-shop validation used at checkout.
 * Throws if the cart contains items from more than one shop.
 */
export const validateCartSingleShop = createServerFn({ method: "POST" })
  .inputValidator((d: { uid: string }) => z.object({ uid: z.string() }).parse(d))
  .handler(async ({ data }): Promise<{ ok: true; shopId: string | null }> => {
    const userId = await userIdFromUid(data.uid);
    const items = await prisma.cartItem.findMany({ where: { userId }, select: { shopId: true } });
    const shopIds = new Set(items.map((i) => i.shopId));
    if (shopIds.size > 1) {
      throw new Error("Cart contains items from multiple shops. Checkout rejected.");
    }
    return { ok: true, shopId: items[0]?.shopId ?? null };
  });
