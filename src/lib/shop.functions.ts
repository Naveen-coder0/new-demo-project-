import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { prisma } from "./prisma";

/** Create a shop (also promotes the owner to SHOP_OWNER role). */
export const createShop = createServerFn({ method: "POST" })
  .inputValidator((d: { ownerUid: string; name: string; category: string; description?: string; image?: string; banner?: string }) =>
    z
      .object({
        ownerUid: z.string(),
        name: z.string().min(1),
        category: z.string().min(1),
        description: z.string().optional(),
        image: z.string().optional(),
        banner: z.string().optional(),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const owner = await prisma.user.findUnique({ where: { firebaseUid: data.ownerUid } });
    if (!owner) throw new Error("User not found");

    const shop = await prisma.shop.create({
      data: {
        name: data.name,
        category: data.category,
        description: data.description,
        image: data.image,
        banner: data.banner,
        ownerId: owner.id,
        status: "ACTIVE",
      },
    });
    if (owner.role === "USER") {
      await prisma.user.update({ where: { id: owner.id }, data: { role: "SHOP_OWNER" } });
    }
    return { id: shop.id };
  });

/** Get all shops owned by a user. */
export const getMyShops = createServerFn({ method: "GET" })
  .inputValidator((d: { ownerUid: string }) => z.object({ ownerUid: z.string() }).parse(d))
  .handler(async ({ data }) => {
    const owner = await prisma.user.findUnique({ where: { firebaseUid: data.ownerUid } });
    if (!owner) return [];
    const shops = await prisma.shop.findMany({
      where: { ownerId: owner.id },
      include: { _count: { select: { products: true, orders: true } } },
      orderBy: { createdAt: "desc" },
    });
    return shops.map((s) => ({
      id: s.id,
      name: s.name,
      category: s.category,
      status: s.status,
      image: s.image,
      productCount: s._count.products,
      orderCount: s._count.orders,
    }));
  });

export type ShopDashboard = {
  products: number;
  orders: number;
  revenue: number;
  lowStock: number;
  pendingOrders: number;
};

export const getShopDashboard = createServerFn({ method: "GET" })
  .inputValidator((d: { shopId: string }) => z.object({ shopId: z.string() }).parse(d))
  .handler(async ({ data }): Promise<ShopDashboard> => {
    const [products, orders, paidOrders, lowStock, pendingOrders] = await Promise.all([
      prisma.product.count({ where: { shopId: data.shopId } }),
      prisma.order.count({ where: { shopId: data.shopId } }),
      prisma.order.findMany({ where: { shopId: data.shopId, paymentStatus: "PAID" }, select: { total: true } }),
      prisma.product.count({ where: { shopId: data.shopId, stock: { lte: 5 } } }),
      prisma.order.count({ where: { shopId: data.shopId, status: { in: ["PLACED", "CONFIRMED", "PACKED"] } } }),
    ]);
    return {
      products,
      orders,
      revenue: paidOrders.reduce((s, o) => s + o.total, 0),
      lowStock,
      pendingOrders,
    };
  });

/* ---------------- Products ---------------- */

export const getShopProducts = createServerFn({ method: "GET" })
  .inputValidator((d: { shopId: string }) => z.object({ shopId: z.string() }).parse(d))
  .handler(async ({ data }) => {
    const products = await prisma.product.findMany({ where: { shopId: data.shopId }, orderBy: { createdAt: "desc" } });
    return products.map((p) => ({
      id: p.id,
      name: p.name,
      price: p.price,
      comparePrice: p.comparePrice,
      discount: p.discount,
      stock: p.stock,
      sku: p.sku,
      category: p.category,
      image: p.image,
      images: p.images,
      sizes: p.sizes,
      colors: p.colors,
      tags: p.tags,
      status: p.status,
      description: p.description,
      tryAndBuy: p.tryAndBuy,
    }));
  });

export const upsertProduct = createServerFn({ method: "POST" })
  .inputValidator(
    (d: {
      id?: string;
      shopId: string;
      name: string;
      price: number;
      comparePrice?: number;
      discount?: number;
      stock: number;
      sku?: string;
      category: string;
      image?: string;
      images?: string[];
      description?: string;
      sizes?: string[];
      colors?: string[];
      tags?: string[];
      variants?: any;
      tryAndBuy?: boolean;
    }) =>
      z
        .object({
          id: z.string().optional(),
          shopId: z.string(),
          name: z.string().min(1),
          price: z.number().int().nonnegative(),
          comparePrice: z.number().int().nonnegative().optional(),
          discount: z.number().int().nonnegative().optional(),
          stock: z.number().int().nonnegative(),
          sku: z.string().optional(),
          category: z.string().min(1),
          image: z.string().optional(),
          images: z.array(z.string()).optional(),
          description: z.string().optional(),
          sizes: z.array(z.string()).optional(),
          colors: z.array(z.string()).optional(),
          tags: z.array(z.string()).optional(),
          variants: z.any().optional(),
          tryAndBuy: z.boolean().optional(),
        })
        .parse(d),
  )
  .handler(async ({ data }) => {
    const status = data.stock > 0 ? "ACTIVE" : "OUT_OF_STOCK";
    const payload = {
      name: data.name,
      price: data.price,
      comparePrice: data.comparePrice ?? null,
      discount: data.discount ?? 0,
      stock: data.stock,
      sku: data.sku ?? null,
      category: data.category,
      image: data.image ?? data.images?.[0] ?? null,
      images: data.images ?? (data.image ? [data.image] : []),
      description: data.description,
      sizes: data.sizes ?? [],
      colors: data.colors ?? [],
      tags: data.tags ?? [],
      variants: data.variants ?? null,
      tryAndBuy: data.tryAndBuy ?? false,
      status: status as any,
    };
    if (data.id) {
      await prisma.product.update({ where: { id: data.id }, data: payload });
      return { id: data.id };
    }
    const created = await prisma.product.create({
      data: { shopId: data.shopId, ...payload },
    });
    return { id: created.id };
  });

export const deleteProduct = createServerFn({ method: "POST" })
  .inputValidator((d: { id: string }) => z.object({ id: z.string() }).parse(d))
  .handler(async ({ data }) => {
    await prisma.product.delete({ where: { id: data.id } });
    return { ok: true };
  });

/* ---------------- Orders ---------------- */

export const getShopOrders = createServerFn({ method: "GET" })
  .inputValidator((d: { shopId: string }) => z.object({ shopId: z.string() }).parse(d))
  .handler(async ({ data }) => {
    const orders = await prisma.order.findMany({
      where: { shopId: data.shopId },
      orderBy: { createdAt: "desc" },
      include: { items: true },
    });
    return orders.map((o) => ({
      id: o.id,
      total: o.total,
      status: o.status,
      paymentStatus: o.paymentStatus,
      paymentMethod: o.paymentMethod,
      customer: o.deliveryName,
      phone: o.deliveryPhone,
      address: `${o.deliveryAddress}, ${o.deliveryCity} - ${o.deliveryPincode}`,
      items: o.items.map((i) => ({ name: i.name, qty: i.quantity, size: i.size, price: i.price })),
      createdAt: o.createdAt.toISOString(),
    }));
  });

export const updateOrderStatus = createServerFn({ method: "POST" })
  .inputValidator((d: { orderId: string; status: string }) =>
    z
      .object({
        orderId: z.string(),
        status: z.enum(["PLACED", "CONFIRMED", "PACKED", "OUT_FOR_DELIVERY", "DELIVERED", "CANCELLED", "REFUNDED"]),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const updateData: any = { status: data.status };
    if (data.status === "DELIVERED") updateData.paymentStatus = "PAID";
    if (data.status === "REFUNDED") updateData.paymentStatus = "REFUNDED";
    await prisma.order.update({ where: { id: data.orderId }, data: updateData });
    return { ok: true };
  });
