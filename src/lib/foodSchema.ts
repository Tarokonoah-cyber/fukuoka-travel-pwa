import { z } from "zod";
import {
  foodAreas,
  foodCategories,
  foodMomStatuses,
  foodPriorities,
  foodQueueLevels,
  foodReservationStatuses,
} from "@/types/food";

const optionalUrl = z.union([z.literal(""), z.string().url().max(600)]);
const tripDate = z.string().regex(/^2026-08-0[2-6]$/);

export const foodCandidateSchema = z.object({
  id: z.string().trim().min(1).max(160),
  name: z.string().trim().min(1).max(160),
  japaneseName: z.string().trim().max(160),
  description: z.string().trim().min(1).max(500),
  priority: z.enum(foodPriorities),
  category: z.array(z.enum(foodCategories)).min(1).max(foodCategories.length),
  area: z.enum(foodAreas),
  recommendedItems: z.array(z.string().trim().min(1).max(160)).max(20),
  googleMapsUrl: z.string().url().max(600),
  tabelogUrl: optionalUrl,
  officialUrl: optionalUrl,
  reservationUrl: optionalUrl,
  reservation: z.enum(foodReservationStatuses),
  queueLevel: z.enum(foodQueueLevels),
  motherFriendly: z.enum(foodMomStatuses),
  motherFriendlyNote: z.string().trim().max(500),
  openingHours: z.string().trim().min(1).max(160),
  lastOrder: z.string().trim().min(1).max(160),
  closedDays: z.string().trim().min(1).max(160),
  suitableTime: z.array(z.string().trim().min(1).max(160)).max(20),
  walkingMinutes: z.number().int().min(0).max(300).nullable(),
  transportNote: z.string().trim().max(500),
  budget: z.string().trim().max(160),
  relatedDay: z.array(tripDate).max(5),
  visited: z.boolean(),
  visitedAt: tripDate.nullable(),
  rating: z.number().int().min(1).max(5).nullable(),
  review: z.string().trim().max(1000),
  demo: z.boolean(),
  notes: z.string().trim().max(1000),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
}).superRefine((value, context) => {
  if (!value.visited && (value.visitedAt || value.rating || value.review)) {
    context.addIssue({ code: "custom", message: "未造訪店家不可保留用餐紀錄。" });
  }
});

export const foodCandidatePatchSchema = z.object({
  item: foodCandidateSchema,
  baseUpdatedAt: z.string().datetime().nullable().default(null),
});
