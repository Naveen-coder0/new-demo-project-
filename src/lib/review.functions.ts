import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { prisma } from "./prisma";

export type ReviewItem = {
  id: string;
  rating: number;
  comment: string | null;
  userName: string | null;
  userImage: string | null;
  images: string[];
  replies: { id: string; userName: string; comment: string; createdAt: string }[];
  createdAt: string;
  isOwn: boolean;
};

/** Get reviews for a product with pagination. */
export const getProductReviews = createServerFn({ method: "GET" })
  .inputValidator(
    (d: { productId: string; page?: number; uid?: string }) =>
      z.object({ productId: z.string(), page: z.number().optional(), uid: z.string().optional() }).parse(d),
  )
  .handler(async ({ data }) => {
    const page = data.page ?? 1;
    const take = 10;
    const skip = (page - 1) * take;

    let currentUserId: string | null = null;
    if (data.uid) {
      const u = await prisma.user.findUnique({ where: { firebaseUid: data.uid }, select: { id: true } });
      currentUserId = u?.id ?? null;
    }

    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where: { productId: data.productId, hidden: false },
        include: {
          user: { select: { name: true, image: true, id: true } },
          images: { select: { id: true, url: true } },
          replies: { select: { id: true, userName: true, comment: true, createdAt: true }, orderBy: { createdAt: "asc" } },
        },
        orderBy: { createdAt: "desc" },
        take,
        skip,
      }),
      prisma.review.count({ where: { productId: data.productId, hidden: false } }),
    ]);

    const items: ReviewItem[] = reviews.map((r) => ({
      id: r.id,
      rating: r.rating,
      comment: r.comment,
      userName: r.user.name,
      userImage: r.user.image,
      images: r.images.map((i) => i.url),
      replies: r.replies.map((rp) => ({
        id: rp.id,
        userName: rp.userName,
        comment: rp.comment,
        createdAt: rp.createdAt.toISOString(),
      })),
      createdAt: r.createdAt.toISOString(),
      isOwn: r.user.id === currentUserId,
    }));

    return { items, total, pages: Math.ceil(total / take), page };
  });

/** Add a review. */
export const addReview = createServerFn({ method: "POST" })
  .inputValidator(
    (d: { uid: string; productId: string; rating: number; comment?: string; images?: string[] }) =>
      z
        .object({
          uid: z.string(),
          productId: z.string(),
          rating: z.number().int().min(1).max(5),
          comment: z.string().optional(),
          images: z.array(z.string()).optional(),
        })
        .parse(d),
  )
  .handler(async ({ data }) => {
    const user = await prisma.user.findUnique({ where: { firebaseUid: data.uid } });
    if (!user) throw new Error("Please sign in");

    const review = await prisma.review.create({
      data: {
        userId: user.id,
        productId: data.productId,
        rating: data.rating,
        comment: data.comment,
        images: data.images?.length
          ? { create: data.images.map((url) => ({ url })) }
          : undefined,
      },
    });

    return { id: review.id };
  });

/** Update own review. */
export const updateReview = createServerFn({ method: "POST" })
  .inputValidator(
    (d: { uid: string; reviewId: string; rating: number; comment?: string }) =>
      z
        .object({
          uid: z.string(),
          reviewId: z.string(),
          rating: z.number().int().min(1).max(5),
          comment: z.string().optional(),
        })
        .parse(d),
  )
  .handler(async ({ data }) => {
    const user = await prisma.user.findUnique({ where: { firebaseUid: data.uid } });
    if (!user) throw new Error("Please sign in");

    const review = await prisma.review.findUnique({ where: { id: data.reviewId } });
    if (!review || review.userId !== user.id) throw new Error("Not your review");

    await prisma.review.update({
      where: { id: data.reviewId },
      data: { rating: data.rating, comment: data.comment },
    });
    return { ok: true };
  });

/** Delete own review. */
export const deleteReview = createServerFn({ method: "POST" })
  .inputValidator((d: { uid: string; reviewId: string }) =>
    z.object({ uid: z.string(), reviewId: z.string() }).parse(d),
  )
  .handler(async ({ data }) => {
    const user = await prisma.user.findUnique({ where: { firebaseUid: data.uid } });
    if (!user) throw new Error("Please sign in");

    const review = await prisma.review.findUnique({ where: { id: data.reviewId } });
    if (!review || review.userId !== user.id) throw new Error("Not your review");

    await prisma.review.delete({ where: { id: data.reviewId } });
    return { ok: true };
  });

/** Seller reply to a review. */
export const replyToReview = createServerFn({ method: "POST" })
  .inputValidator(
    (d: { uid: string; reviewId: string; comment: string }) =>
      z.object({ uid: z.string(), reviewId: z.string(), comment: z.string().min(1) }).parse(d),
  )
  .handler(async ({ data }) => {
    const user = await prisma.user.findUnique({ where: { firebaseUid: data.uid } });
    if (!user) throw new Error("Please sign in");

    await prisma.reviewReply.create({
      data: {
        reviewId: data.reviewId,
        userId: user.id,
        userName: user.name ?? "Seller",
        comment: data.comment,
      },
    });
    return { ok: true };
  });

/** Admin: hide/moderate a review. */
export const moderateReview = createServerFn({ method: "POST" })
  .inputValidator((d: { reviewId: string; hidden: boolean }) =>
    z.object({ reviewId: z.string(), hidden: z.boolean() }).parse(d),
  )
  .handler(async ({ data }) => {
    await prisma.review.update({ where: { id: data.reviewId }, data: { hidden: data.hidden } });
    return { ok: true };
  });
