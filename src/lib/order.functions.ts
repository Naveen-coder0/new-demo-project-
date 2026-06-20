import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { prisma } from "./prisma";
import { createNotification, notifyShopOwner, notifyAdmins } from "./notification.functions";

const PlaceOrderSchema = z.object({
  userUid: z.string(),
  shopId: z.string(),
  paymentMethod: z.string(),
  delivery: z.object({
    name: z.string(),
    phone: z.string(),
    address: z.string(),
    city: z.string(),
    pincode: z.string(),
  }),
  items: z.array(
    z.object({
      productId: z.string(),
      name: z.string(),
      image: z.string().optional(),
      price: z.number().int(),
      quantity: z.number().int().positive(),
      size: z.string().optional(),
    }),
  ),
  total: z.number().int(),
});

/** Place an order from the checkout flow. */
export const placeOrder = createServerFn({ method: "POST" })
  .inputValidator((d) => PlaceOrderSchema.parse(d))
  .handler(async ({ data }) => {
    const user = await prisma.user.findUnique({ where: { firebaseUid: data.userUid } });
    if (!user) throw new Error("Please sign in to place an order");
    if (user.blocked) throw new Error("Your account is suspended.");

    // SECURITY: enforce single-shop — every item must belong to data.shopId.
    const productIds = data.items.map((i) => i.productId);
    const dbProducts = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, shopId: true },
    });
    // Only validate items that actually exist in the DB (demo items are skipped).
    const foreignShop = dbProducts.find((p) => p.shopId !== data.shopId);
    if (foreignShop) {
      throw new Error("Checkout rejected: cart contains items from multiple shops.");
    }

    const order = await prisma.order.create({
      data: {
        userId: user.id,
        shopId: data.shopId,
        subtotal: data.total,
        deliveryFee: 0,
        discount: 0,
        total: data.total,
        paymentMethod: data.paymentMethod,
        paymentStatus: data.paymentMethod === "cod" ? "PENDING" : "PAID",
        status: "PLACED",
        deliveryName: data.delivery.name,
        deliveryPhone: data.delivery.phone,
        deliveryAddress: data.delivery.address,
        deliveryCity: data.delivery.city,
        deliveryPincode: data.delivery.pincode,
        items: {
          create: data.items.map((i) => ({
            productId: i.productId,
            name: i.name,
            image: i.image,
            price: i.price,
            quantity: i.quantity,
            size: i.size,
          })),
        },
      },
    });

    // decrement stock
    for (const item of data.items) {
      await prisma.product
        .update({ where: { id: item.productId }, data: { stock: { decrement: item.quantity } } })
        .catch(() => {});
    }

    // Notifications
    await createNotification({
      userId: user.id,
      title: "Order Placed!",
      message: `Your order #${order.id.slice(-6)} has been placed successfully.`,
      type: "order_placed",
      link: "/account",
    });
    await notifyShopOwner(data.shopId, "New Order", `New order #${order.id.slice(-6)} received.`, "new_order");

    return { orderId: order.id };
  });

/** Get all orders for a user (user portal). */
export const getMyOrders = createServerFn({ method: "GET" })
  .inputValidator((d: { userUid: string }) => z.object({ userUid: z.string() }).parse(d))
  .handler(async ({ data }) => {
    const user = await prisma.user.findUnique({ where: { firebaseUid: data.userUid } });
    if (!user) return [];
    const orders = await prisma.order.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      include: { items: true, shop: { select: { name: true } } },
    });
    return orders.map((o) => ({
      id: o.id,
      total: o.total,
      status: o.status,
      paymentStatus: o.paymentStatus,
      shopName: o.shop.name,
      items: o.items.map((i) => ({ name: i.name, image: i.image, qty: i.quantity, size: i.size, price: i.price })),
      createdAt: o.createdAt.toISOString(),
    }));
  });

/* ---------------- Delivery portal ---------------- */

/** Orders that are ready to be delivered (out for delivery / packed). */
export const getDeliveryOrders = createServerFn({ method: "GET" }).handler(async () => {
  const orders = await prisma.order.findMany({
    where: { status: { in: ["PACKED", "OUT_FOR_DELIVERY"] } },
    orderBy: { createdAt: "asc" },
    include: { shop: { select: { name: true } } },
  });
  return orders.map((o) => ({
    id: o.id,
    status: o.status,
    total: o.total,
    shopName: o.shop.name,
    customer: o.deliveryName,
    phone: o.deliveryPhone,
    address: `${o.deliveryAddress}, ${o.deliveryCity} - ${o.deliveryPincode}`,
    paymentMethod: o.paymentMethod,
    createdAt: o.createdAt.toISOString(),
  }));
});

/** Mark a delivery order as delivered. */
export const markDelivered = createServerFn({ method: "POST" })
  .inputValidator((d: { orderId: string }) => z.object({ orderId: z.string() }).parse(d))
  .handler(async ({ data }) => {
    await prisma.order.update({ where: { id: data.orderId }, data: { status: "DELIVERED", paymentStatus: "PAID" } });
    return { ok: true };
  });
