import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { prisma } from "./prisma";

export type NotificationItem = {
  id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  link: string | null;
  createdAt: string;
};

async function userIdFromUid(uid: string): Promise<string> {
  const user = await prisma.user.findUnique({ where: { firebaseUid: uid } });
  if (!user) throw new Error("User not found");
  return user.id;
}

/** Get notifications for the current user. */
export const getNotifications = createServerFn({ method: "GET" })
  .inputValidator((d: { uid: string; limit?: number }) =>
    z.object({ uid: z.string(), limit: z.number().optional() }).parse(d),
  )
  .handler(async ({ data }): Promise<NotificationItem[]> => {
    const userId = await userIdFromUid(data.uid);
    const items = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: data.limit ?? 20,
    });
    return items.map((n) => ({
      id: n.id,
      title: n.title,
      message: n.message,
      type: n.type,
      read: n.read,
      link: n.link,
      createdAt: n.createdAt.toISOString(),
    }));
  });

/** Get unread notification count. */
export const getUnreadCount = createServerFn({ method: "GET" })
  .inputValidator((d: { uid: string }) => z.object({ uid: z.string() }).parse(d))
  .handler(async ({ data }) => {
    const userId = await userIdFromUid(data.uid);
    const count = await prisma.notification.count({ where: { userId, read: false } });
    return { count };
  });

/** Mark a notification as read. */
export const markNotificationRead = createServerFn({ method: "POST" })
  .inputValidator((d: { id: string }) => z.object({ id: z.string() }).parse(d))
  .handler(async ({ data }) => {
    await prisma.notification.update({ where: { id: data.id }, data: { read: true } });
    return { ok: true };
  });

/** Mark all notifications as read. */
export const markAllRead = createServerFn({ method: "POST" })
  .inputValidator((d: { uid: string }) => z.object({ uid: z.string() }).parse(d))
  .handler(async ({ data }) => {
    const userId = await userIdFromUid(data.uid);
    await prisma.notification.updateMany({ where: { userId, read: false }, data: { read: true } });
    return { ok: true };
  });

/** Create a notification (internal utility, called from other server functions). */
export async function createNotification(params: {
  userId: string;
  title: string;
  message: string;
  type: string;
  link?: string;
}) {
  await prisma.notification.create({
    data: {
      userId: params.userId,
      title: params.title,
      message: params.message,
      type: params.type,
      link: params.link,
    },
  });
}

/** Notify all admins. */
export async function notifyAdmins(title: string, message: string, type: string, link?: string) {
  const admins = await prisma.user.findMany({ where: { role: "ADMIN" }, select: { id: true } });
  await prisma.notification.createMany({
    data: admins.map((a) => ({
      userId: a.id,
      title,
      message,
      type,
      link,
    })),
  });
}

/** Notify shop owner when order is placed. */
export async function notifyShopOwner(shopId: string, title: string, message: string, type: string) {
  const shop = await prisma.shop.findUnique({ where: { id: shopId }, select: { ownerId: true } });
  if (shop) {
    await createNotification({ userId: shop.ownerId, title, message, type, link: "/seller" });
  }
}
