import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  created_newspapers: defineTable({
    query: v.string(),
    newspapers: v.any(),
    articleCount: v.number(),
    headlines: v.array(v.string()),
    createdAt: v.number(),
  }).index("by_created_at", ["createdAt"]),
});
