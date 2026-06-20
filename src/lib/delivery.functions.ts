import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { prisma } from "./prisma";

const RegisterSchema = z.object({
  uid: z.string(),
  fullName: z.string().min(1),
  phone: z.string().min(1),
  email: z.string().email(),
  address: z.string().min(1),
  aadhaar: z.string().min(1),
  license: z.string().min(1),
  vehicleType: z.string().min(1),
  vehicleNumber: z.string().min(1),
  selfieUrl: z.string().optional(),
  vehiclePhoto: z.string().optional(),
});

/** Register as a delivery partner (verification fee ₹150). Stays PENDING until admin approval. */
export const registerDeliveryPartner = createServerFn({ method: "POST" })
  .inputValidator((d) => RegisterSchema.parse(d))
  .handler(async ({ data }) => {
    const user = await prisma.user.findUnique({ where: { firebaseUid: data.uid } });
    if (!user) throw new Error("Please sign in first");

    const partner = await prisma.deliveryPartner.upsert({
      where: { userId: user.id },
      update: {
        fullName: data.fullName,
        phone: data.phone,
        email: data.email,
        address: data.address,
        aadhaar: data.aadhaar,
        license: data.license,
        vehicleType: data.vehicleType,
        vehicleNumber: data.vehicleNumber,
        selfieUrl: data.selfieUrl,
        vehiclePhoto: data.vehiclePhoto,
        feePaid: true,
      },
      create: {
        userId: user.id,
        fullName: data.fullName,
        phone: data.phone,
        email: data.email,
        address: data.address,
        aadhaar: data.aadhaar,
        license: data.license,
        vehicleType: data.vehicleType,
        vehicleNumber: data.vehicleNumber,
        selfieUrl: data.selfieUrl,
        vehiclePhoto: data.vehiclePhoto,
        feePaid: true,
        status: "PENDING",
      },
    });
    if (user.role === "USER") {
      await prisma.user.update({ where: { id: user.id }, data: { role: "DELIVERY", onboarded: true } });
    }
    return { id: partner.id, status: partner.status };
  });

/** Get the delivery-partner profile + approval status for a user. */
export const getMyDeliveryProfile = createServerFn({ method: "GET" })
  .inputValidator((d: { uid: string }) => z.object({ uid: z.string() }).parse(d))
  .handler(async ({ data }) => {
    const user = await prisma.user.findUnique({ where: { firebaseUid: data.uid } });
    if (!user) return null;
    const p = await prisma.deliveryPartner.findUnique({ where: { userId: user.id } });
    if (!p) return null;
    return {
      id: p.id,
      fullName: p.fullName,
      phone: p.phone,
      vehicleType: p.vehicleType,
      vehicleNumber: p.vehicleNumber,
      status: p.status,
      feePaid: p.feePaid,
    };
  });

/* ---------------- Admin: manage delivery partners ---------------- */

export const getAllDeliveryPartners = createServerFn({ method: "GET" }).handler(async () => {
  const partners = await prisma.deliveryPartner.findMany({ orderBy: { createdAt: "desc" } });
  return partners.map((p) => ({
    id: p.id,
    fullName: p.fullName,
    phone: p.phone,
    email: p.email,
    vehicleType: p.vehicleType,
    vehicleNumber: p.vehicleNumber,
    status: p.status,
    createdAt: p.createdAt.toISOString(),
  }));
});

export const updateDeliveryStatus = createServerFn({ method: "POST" })
  .inputValidator((d: { id: string; status: "PENDING" | "APPROVED" | "REJECTED" | "SUSPENDED" }) =>
    z.object({ id: z.string(), status: z.enum(["PENDING", "APPROVED", "REJECTED", "SUSPENDED"]) }).parse(d),
  )
  .handler(async ({ data }) => {
    await prisma.deliveryPartner.update({ where: { id: data.id }, data: { status: data.status } });
    return { ok: true };
  });
