import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { prisma } from "./prisma";

export type ProductDetail = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  comparePrice: number | null;
  discount: number;
  sku: string | null;
  images: string[];
  image: string | null;
  category: string;
  stock: number;
  sizes: string[];
  colors: string[];
  tags: string[];
  variants: any;
  tryAndBuy: boolean;
  shop: { id: string; name: string; image: string | null; rating: number; category: string };
  avgRating: number;
  reviewCount: number;
};

/** Get full product details with shop info and rating stats. */
export const getProductDetail = createServerFn({ method: "GET" })
  .inputValidator((d: { productId: string }) => z.object({ productId: z.string() }).parse(d))
  .handler(async ({ data }): Promise<ProductDetail | null> => {
    const p = await prisma.product.findUnique({
      where: { id: data.productId },
      include: { shop: { select: { id: true, name: true, image: true, rating: true, category: true } } },
    });
    if (!p) return null;

    const stats = await prisma.review.aggregate({
      where: { productId: data.productId, hidden: false },
      _avg: { rating: true },
      _count: { rating: true },
    });

    return {
      id: p.id,
      name: p.name,
      description: p.description,
      price: p.price,
      comparePrice: p.comparePrice,
      discount: p.discount ?? 0,
      sku: p.sku,
      images: p.images.length > 0 ? p.images : p.image ? [p.image] : [],
      image: p.image,
      category: p.category,
      stock: p.stock,
      sizes: p.sizes,
      colors: p.colors,
      tags: p.tags,
      variants: p.variants,
      tryAndBuy: p.tryAndBuy,
      shop: p.shop,
      avgRating: stats._avg.rating ?? 0,
      reviewCount: stats._count.rating,
    };
  });

/** Get related products (same shop or same category). */
export const getRelatedProducts = createServerFn({ method: "GET" })
  .inputValidator((d: { productId: string; shopId: string; category: string }) =>
    z.object({ productId: z.string(), shopId: z.string(), category: z.string() }).parse(d),
  )
  .handler(async ({ data }) => {
    const products = await prisma.product.findMany({
      where: {
        id: { not: data.productId },
        status: "ACTIVE",
        OR: [{ shopId: data.shopId }, { category: data.category }],
      },
      take: 8,
      orderBy: { createdAt: "desc" },
      select: { id: true, name: true, image: true, price: true, comparePrice: true, discount: true },
    });
    return products;
  });

/** Get rating distribution for a product (1-5 star counts). */
export const getRatingDistribution = createServerFn({ method: "GET" })
  .inputValidator((d: { productId: string }) => z.object({ productId: z.string() }).parse(d))
  .handler(async ({ data }) => {
    const reviews = await prisma.review.findMany({
      where: { productId: data.productId, hidden: false },
      select: { rating: true },
    });
    const dist = [0, 0, 0, 0, 0]; // index 0 = 1 star, index 4 = 5 star
    for (const r of reviews) {
      if (r.rating >= 1 && r.rating <= 5) dist[r.rating - 1]++;
    }
    return { distribution: dist, total: reviews.length };
  });

/** Get latest published products for the homepage "Fresh Drops" section. */
export const getLatestProducts = createServerFn({ method: "GET" })
  .inputValidator((d: { limit?: number }) => z.object({ limit: z.number().optional() }).parse(d ?? {}))
  .handler(async ({ data }) => {
    const products = await prisma.product.findMany({
      where: { status: "ACTIVE" },
      orderBy: { createdAt: "desc" },
      take: data?.limit ?? 8,
      include: { shop: { select: { id: true, name: true } } },
    });
    return products.map((p) => ({
      id: p.id,
      name: p.name,
      image: p.image ?? p.images[0] ?? null,
      price: p.price,
      comparePrice: p.comparePrice,
      discount: p.discount ?? 0,
      shopName: p.shop.name,
      shopId: p.shop.id,
      category: p.category,
    }));
  });
