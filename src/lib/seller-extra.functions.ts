import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { prisma } from "./prisma";

/* ==================== COUPONS ==================== */

export const getShopCoupons = createServerFn({ method: "GET" })
  .inputValidator((d: { shopId: string }) => z.object({ shopId: z.string() }).parse(d))
  .handler(async ({ data }) => {
    const coupons = await prisma.coupon.findMany({ where: { shopId: data.shopId }, orderBy: { createdAt: "desc" } });
    return coupons.map((c) => ({
      id: c.id,
      code: c.code,
      type: c.type,
      value: c.value,
      minOrder: c.minOrder,
      maxDiscount: c.maxDiscount,
      usageLimit: c.usageLimit,
      usedCount: c.usedCount,
      active: c.active,
      expiresAt: c.expiresAt?.toISOString() ?? null,
    }));
  });

export const createCoupon = createServerFn({ method: "POST" })
  .inputValidator(
    (d: { shopId: string; code: string; type: string; value: number; minOrder?: number; maxDiscount?: number; usageLimit?: number; expiresAt?: string }) =>
      z
        .object({
          shopId: z.string(),
          code: z.string().min(1),
          type: z.enum(["PERCENT", "FLAT"]),
          value: z.number().int().positive(),
          minOrder: z.number().int().optional(),
          maxDiscount: z.number().int().optional(),
          usageLimit: z.number().int().optional(),
          expiresAt: z.string().optional(),
        })
        .parse(d),
  )
  .handler(async ({ data }) => {
    const coupon = await prisma.coupon.create({
      data: {
        shopId: data.shopId,
        code: data.code.toUpperCase(),
        type: data.type,
        value: data.value,
        minOrder: data.minOrder ?? 0,
        maxDiscount: data.maxDiscount,
        usageLimit: data.usageLimit ?? 100,
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
      },
    });
    return { id: coupon.id };
  });

export const deleteCoupon = createServerFn({ method: "POST" })
  .inputValidator((d: { id: string }) => z.object({ id: z.string() }).parse(d))
  .handler(async ({ data }) => {
    await prisma.coupon.delete({ where: { id: data.id } });
    return { ok: true };
  });

/* ==================== SHOP SETTINGS ==================== */

export const getShopSettings = createServerFn({ method: "GET" })
  .inputValidator((d: { shopId: string }) => z.object({ shopId: z.string() }).parse(d))
  .handler(async ({ data }) => {
    const s = await prisma.shop.findUnique({ where: { id: data.shopId } });
    if (!s) return null;
    return {
      name: s.name,
      tagline: s.tagline ?? "",
      category: s.category,
      description: s.description ?? "",
      image: s.image ?? "",
      banner: s.banner ?? "",
      contactEmail: s.contactEmail ?? "",
      whatsapp: s.whatsapp ?? "",
      instagram: s.instagram ?? "",
      freeShipAbove: s.freeShipAbove,
    };
  });

export const updateShopSettings = createServerFn({ method: "POST" })
  .inputValidator(
    (d: { shopId: string; name: string; tagline?: string; description?: string; image?: string; banner?: string; contactEmail?: string; whatsapp?: string; instagram?: string; freeShipAbove?: number }) =>
      z
        .object({
          shopId: z.string(),
          name: z.string().min(1),
          tagline: z.string().optional(),
          description: z.string().optional(),
          image: z.string().optional(),
          banner: z.string().optional(),
          contactEmail: z.string().optional(),
          whatsapp: z.string().optional(),
          instagram: z.string().optional(),
          freeShipAbove: z.number().int().optional(),
        })
        .parse(d),
  )
  .handler(async ({ data }) => {
    await prisma.shop.update({
      where: { id: data.shopId },
      data: {
        name: data.name,
        tagline: data.tagline,
        description: data.description,
        image: data.image,
        banner: data.banner,
        contactEmail: data.contactEmail,
        whatsapp: data.whatsapp,
        instagram: data.instagram,
        freeShipAbove: data.freeShipAbove ?? 0,
      },
    });
    return { ok: true };
  });

/* ==================== SELLER REVIEWS ==================== */

export const getShopReviews = createServerFn({ method: "GET" })
  .inputValidator((d: { shopId: string }) => z.object({ shopId: z.string() }).parse(d))
  .handler(async ({ data }) => {
    const reviews = await prisma.review.findMany({
      where: { product: { shopId: data.shopId } },
      include: { user: { select: { name: true } }, product: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    return reviews.map((r) => ({
      id: r.id,
      rating: r.rating,
      comment: r.comment,
      userName: r.user.name,
      productName: r.product.name,
      createdAt: r.createdAt.toISOString(),
    }));
  });
