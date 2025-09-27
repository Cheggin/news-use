import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const createNewspaper = mutation({
  args: {
    query: v.string(),
    newspapers: v.any(),
    articleCount: v.number(),
    headlines: v.array(v.string()),
    userName: v.optional(v.string()),
    isPublic: v.boolean(),
  },
  handler: async (ctx, args) => {
    const newspaper = await ctx.db.insert("created_newspapers", {
      query: args.query,
      newspapers: args.newspapers,
      articleCount: args.articleCount,
      headlines: args.headlines,
      createdAt: Date.now(),
      userName: args.userName,
      isPublic: args.isPublic,
    });
    return newspaper;
  },
});

export const listNewspapers = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 20;
    const newspapers = await ctx.db
      .query("created_newspapers")
      .withIndex("by_created_at")
      .order("desc")
      .filter((q) => q.eq(q.field("isPublic"), true))
      .take(limit);
    return newspapers;
  },
});

export const getNewspaper = query({
  args: {
    id: v.id("created_newspapers"),
  },
  handler: async (ctx, args) => {
    const newspaper = await ctx.db.get(args.id);
    return newspaper;
  },
});

export const getStats = query({
  handler: async (ctx) => {
    const newspapers = await ctx.db.query("created_newspapers").collect();
    const totalNewspapers = newspapers.length;
    const totalArticles = newspapers.reduce((sum, n) => sum + n.articleCount, 0);
    const uniqueTopics = new Set(newspapers.map(n => n.query.toLowerCase().split(" ")[0])).size;

    return {
      totalNewspapers,
      totalArticles,
      uniqueTopics,
    };
  },
});