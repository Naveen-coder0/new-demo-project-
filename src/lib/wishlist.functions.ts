import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { prisma } from "./prisma";

export type WishlistEntry = {
  id: string;
  productId: string;
  name: string;
  image: string | null;
  price: number;
  shopName: string;
};

async function userIdFromUid(uid: string): Promise<string> {
  const user = await prisma.user.findUnique({ where: { firebaseUid: uid } });
  if (!user) throw new Error("Please sign in");
  return user.id;
}

/** Get all wishlist items for the user. */
export const getWishlist = createServerFn({ method: "GET" })
  .inputValidator((d: { uid: string }) => z.object({ uid: z.string() }).parse(d))
  .handler(async ({ data }) => {
    const userId = await userIdFromUid(data.uid);
    const items = await prisma.wishlistItem.findMany({
      where: { userId },
      include: { product: { include: { shop: { select: { name: true } } } } },
      orderBy: { createdAt: "desc" },
    });
    return items.map((i) => ({
      id: i.id,
      productId: i.productId,
      name: i.product.name,
      image: i.product.image,
      price: i.product.price,
      shopName: i.product.shop.name,
    }));
  });

/** Toggle a product in the wishlist. */
export const toggleWishlistItem = createServerFn({ method: "POST" })
  .inputValidator((d: { uid: string; productId: string }) =>
    z.object({ uid: z.string(), productId: z.string() }).parse(d),
  )
  .handler(async ({ data }): Promise<{ added: boolean; count: number }> => {
    const userId = await userIdFromUid(data.uid);
    const existing = await prisma.wishlistItem.findUnique({
      where: { userId_productId: { userId, productId: data.productId } },
    });
    if (existing) {
      await prisma.wishlistItem.delete({ where: { id: existing.id } });
    } else {
      await prisma.wishlistItem.create({ data: { userId, productId: data.productId } });
    }
    const count = await prisma.wishlistItem.count({ where: { userId } });
    return { added: !existing, count };
  });

/** Move a wishlist item to cart. */
export const moveWishlistToCart = createServerFn({ method: "POST" })
  .inputValidator((d: { uid: string; productId: string; size?: string }) =>
    z.object({ uid: z.string(), productId: z.string(), size: z.string().optional() }).parse(d),
  )
  .handler(async ({ data }) => {
    const userId = await userIdFromUid(data.uid);
    const product = await prisma.product.findUnique({ where: { id: data.productId } });
    if (!product) throw new Error("Product not found");

    // Add to cart (single-shop enforcement)
    const existingCart = await prisma.cartItem.findMany({ where: { userId } });
    const cartShopId = existingCart[0]?.shopId ?? null;
    if (cartShopId && cartShopId !== product.shopId) {
      throw new Error("Cart has items from another shop. Clear cart first.");
    }

    const size = data.size ?? "";
    await prisma.cartItem.upsert({
      where: { userId_productId_size_color: { userId, productId: data.productId, size, color: "" } },
      update: { quantity: { increment: 1 } },
      create: { userId, productId: data.productId, shopId: product.shopId, size, quantity: 1 },
    });

    // Remove from wishlist
    await prisma.wishlistItem.deleteMany({ where: { userId, productId: data.productId } });
    return { ok: true };
  });

/** Get wishlist count. */
export const getWishlistCount = createServerFn({ method: "GET" })
  .inputValidator((d: { uid: string }) => z.object({ uid: z.string() }).parse(d))
  .handler(async ({ data }) => {
    const userId = await userIdFromUid(data.uid);
    const count = await prisma.wishlistItem.count({ where: { userId } });
    return { count };
  });
