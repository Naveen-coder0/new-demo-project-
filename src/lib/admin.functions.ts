import { createServerFn } from "@tanstack/react-start";
import { prisma } from "./prisma";

export type AdminStats = {
  totalUsers: number;
  totalShops: number;
  totalProducts: number;
  totalOrders: number;
  revenue: number;
  pendingShops: number;
};

/** Dashboard-wide statistics for the admin portal. */
export const getAdminStats = createServerFn({ method: "GET" }).handler(async (): Promise<AdminStats> => {
  const [totalUsers, totalShops, totalProducts, totalOrders, pendingShops, paidOrders] = await Promise.all([
    prisma.user.count(),
    prisma.shop.count(),
    prisma.product.count(),
    prisma.order.count(),
    prisma.shop.count({ where: { status: "PENDING" } }),
    prisma.order.findMany({ where: { paymentStatus: "PAID" }, select: { total: true } }),
  ]);
  const revenue = paidOrders.reduce((s, o) => s + o.total, 0);
  return { totalUsers, totalShops, totalProducts, totalOrders, revenue, pendingShops };
});

export const getAllUsers = createServerFn({ method: "GET" }).handler(async () => {
  const users = await prisma.user.findMany({ orderBy: { createdAt: "desc" } });
  return users.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    image: u.image,
    blocked: u.blocked,
    onboarded: u.onboarded,
    createdAt: u.createdAt.toISOString(),
  }));
});

export const getAllShops = createServerFn({ method: "GET" }).handler(async () => {
  const shops = await prisma.shop.findMany({
    orderBy: { createdAt: "desc" },
    include: { owner: { select: { name: true, email: true } }, _count: { select: { products: true, orders: true } } },
  });
  return shops.map((s) => ({
    id: s.id,
    name: s.name,
    category: s.category,
    status: s.status,
    image: s.image,
    ownerName: s.owner.name,
    ownerEmail: s.owner.email,
    productCount: s._count.products,
    orderCount: s._count.orders,
    createdAt: s.createdAt.toISOString(),
  }));
});

export const getAllOrders = createServerFn({ method: "GET" }).handler(async () => {
  const orders = await prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { user: { select: { name: true, email: true } }, shop: { select: { name: true } } },
  });
  return orders.map((o) => ({
    id: o.id,
    total: o.total,
    status: o.status,
    paymentStatus: o.paymentStatus,
    customerName: o.user.name ?? o.deliveryName,
    customerEmail: o.user.email,
    shopName: o.shop.name,
    createdAt: o.createdAt.toISOString(),
  }));
});

import { z } from "zod";

/** Approve / suspend a shop. */
export const updateShopStatus = createServerFn({ method: "POST" })
  .inputValidator((d: { shopId: string; status: "PENDING" | "ACTIVE" | "SUSPENDED" }) =>
    z.object({ shopId: z.string(), status: z.enum(["PENDING", "ACTIVE", "SUSPENDED"]) }).parse(d),
  )
  .handler(async ({ data }) => {
    await prisma.shop.update({ where: { id: data.shopId }, data: { status: data.status } });
    return { ok: true };
  });
