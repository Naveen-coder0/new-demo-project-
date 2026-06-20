import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { prisma } from "./prisma";
import crypto from "crypto";

const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID ?? "";
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET ?? "";

async function createRazorpayOrder(amount: number, receipt: string, notes?: Record<string, string>) {
  const auth = Buffer.from(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`).toString("base64");
  const res = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Basic ${auth}` },
    body: JSON.stringify({ amount: amount * 100, currency: "INR", receipt, notes }),
  });
  if (!res.ok) throw new Error("Failed to create Razorpay order");
  return (await res.json()) as { id: string; amount: number; currency: string; status: string };
}

/** Create a Razorpay order for checkout. */
export const createCheckoutOrder = createServerFn({ method: "POST" })
  .inputValidator(
    (d: { uid: string; orderId: string }) =>
      z.object({ uid: z.string(), orderId: z.string() }).parse(d),
  )
  .handler(async ({ data }) => {
    const order = await prisma.order.findUnique({ where: { id: data.orderId } });
    if (!order) throw new Error("Order not found");

    const rzpOrder = await createRazorpayOrder(order.total, data.orderId, { orderId: data.orderId });

    await prisma.order.update({
      where: { id: data.orderId },
      data: { razorpayOrderId: rzpOrder.id },
    });

    await prisma.payment.create({
      data: {
        orderId: data.orderId,
        type: "ORDER",
        amount: order.total,
        status: "PENDING",
        razorpayOrderId: rzpOrder.id,
      },
    });

    return {
      razorpayOrderId: rzpOrder.id,
      amount: order.total * 100,
      currency: "INR",
      keyId: RAZORPAY_KEY_ID,
    };
  });

/** Verify Razorpay payment signature and mark as paid. */
export const verifyPayment = createServerFn({ method: "POST" })
  .inputValidator(
    (d: { razorpayOrderId: string; razorpayPaymentId: string; razorpaySignature: string }) =>
      z
        .object({
          razorpayOrderId: z.string(),
          razorpayPaymentId: z.string(),
          razorpaySignature: z.string(),
        })
        .parse(d),
  )
  .handler(async ({ data }) => {
    const expectedSignature = crypto
      .createHmac("sha256", RAZORPAY_KEY_SECRET)
      .update(`${data.razorpayOrderId}|${data.razorpayPaymentId}`)
      .digest("hex");

    if (expectedSignature !== data.razorpaySignature) {
      await prisma.payment.updateMany({
        where: { razorpayOrderId: data.razorpayOrderId },
        data: { status: "FAILED" },
      });
      throw new Error("Payment verification failed — signature mismatch.");
    }

    // Mark payment as paid
    await prisma.payment.updateMany({
      where: { razorpayOrderId: data.razorpayOrderId },
      data: { status: "PAID", razorpayPayId: data.razorpayPaymentId, razorpaySignature: data.razorpaySignature },
    });

    // Mark linked order as paid
    await prisma.order.updateMany({
      where: { razorpayOrderId: data.razorpayOrderId },
      data: { paymentStatus: "PAID", razorpayPayId: data.razorpayPaymentId },
    });

    return { ok: true };
  });

/** Create a registration fee order (shop or delivery partner). */
export const createRegistrationFee = createServerFn({ method: "POST" })
  .inputValidator(
    (d: { uid: string; type: "SHOP_REGISTRATION" | "DELIVERY_VERIFICATION" }) =>
      z
        .object({
          uid: z.string(),
          type: z.enum(["SHOP_REGISTRATION", "DELIVERY_VERIFICATION"]),
        })
        .parse(d),
  )
  .handler(async ({ data }) => {
    const amount = data.type === "SHOP_REGISTRATION" ? 300 : 150;
    const receipt = `${data.type}_${data.uid.slice(-8)}_${Date.now()}`;

    const rzpOrder = await createRazorpayOrder(amount, receipt, {
      type: data.type,
      uid: data.uid,
    });

    await prisma.payment.create({
      data: {
        type: data.type,
        amount,
        status: "PENDING",
        razorpayOrderId: rzpOrder.id,
        metadata: { uid: data.uid },
      },
    });

    return {
      razorpayOrderId: rzpOrder.id,
      amount: amount * 100,
      currency: "INR",
      keyId: RAZORPAY_KEY_ID,
    };
  });

/** Verify registration fee payment and update the entity. */
export const verifyRegistrationFee = createServerFn({ method: "POST" })
  .inputValidator(
    (d: { uid: string; type: "SHOP_REGISTRATION" | "DELIVERY_VERIFICATION"; razorpayOrderId: string; razorpayPaymentId: string; razorpaySignature: string }) =>
      z
        .object({
          uid: z.string(),
          type: z.enum(["SHOP_REGISTRATION", "DELIVERY_VERIFICATION"]),
          razorpayOrderId: z.string(),
          razorpayPaymentId: z.string(),
          razorpaySignature: z.string(),
        })
        .parse(d),
  )
  .handler(async ({ data }) => {
    const expectedSignature = crypto
      .createHmac("sha256", RAZORPAY_KEY_SECRET)
      .update(`${data.razorpayOrderId}|${data.razorpayPaymentId}`)
      .digest("hex");

    if (expectedSignature !== data.razorpaySignature) {
      throw new Error("Payment verification failed.");
    }

    await prisma.payment.updateMany({
      where: { razorpayOrderId: data.razorpayOrderId },
      data: { status: "PAID", razorpayPayId: data.razorpayPaymentId, razorpaySignature: data.razorpaySignature },
    });

    const user = await prisma.user.findUnique({ where: { firebaseUid: data.uid } });
    if (!user) throw new Error("User not found");

    if (data.type === "SHOP_REGISTRATION") {
      await prisma.shop.updateMany({
        where: { ownerId: user.id, regFeePaid: false },
        data: { regFeePaid: true },
      });
    } else {
      await prisma.deliveryPartner.updateMany({
        where: { userId: user.id, feePaid: false },
        data: { feePaid: true },
      });
    }

    return { ok: true };
  });

/** Get the Razorpay public key (safe to expose). */
export const getRazorpayKey = createServerFn({ method: "GET" }).handler(async () => {
  return { keyId: RAZORPAY_KEY_ID };
});
