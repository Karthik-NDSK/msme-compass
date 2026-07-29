import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Create a new business profile
export const create = mutation({
  args: {
    userId: v.string(),
    name: v.string(),
    sector: v.string(),
    state: v.string(),
    registrationType: v.string(),
    turnoverBand: v.string(),
    employeeCount: v.number(),
    extractedFrom: v.string(),
    registrationNumber: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const id = await ctx.db.insert("businesses", {
      ...args,
      createdAt: Date.now(),
    });
    return id;
  },
});

// Update an existing business profile
export const update = mutation({
  args: {
    id: v.id("businesses"),
    name: v.string(),
    sector: v.string(),
    state: v.string(),
    registrationType: v.string(),
    turnoverBand: v.string(),
    employeeCount: v.number(),
    extractedFrom: v.string(),
    registrationNumber: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...rest } = args;
    await ctx.db.patch(id, rest);
    return id;
  },
});

// Get business profiles for a user
export const listByUser = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("businesses")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
  },
});

// Get a single business
export const get = query({
  args: { businessId: v.id("businesses") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.businessId);
  },
});
