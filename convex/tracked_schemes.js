import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Track a scheme for a business
export const track = mutation({
  args: {
    businessId: v.id("businesses"),
    schemeId: v.id("schemes"),
  },
  handler: async (ctx, args) => {
    // Check if already tracked
    const existing = await ctx.db
      .query("tracked_schemes")
      .withIndex("by_business_scheme", (q) =>
        q.eq("businessId", args.businessId).eq("schemeId", args.schemeId)
      )
      .first();

    if (existing) return existing._id;

    const id = await ctx.db.insert("tracked_schemes", {
      businessId: args.businessId,
      schemeId: args.schemeId,
      status: "not_started",
      notes: "",
      trackedAt: Date.now(),
    });
    return id;
  },
});

// Update status or notes
export const updateStatus = mutation({
  args: {
    trackedId: v.id("tracked_schemes"),
    status: v.string(),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const update = { status: args.status };
    if (args.notes !== undefined) update.notes = args.notes;
    await ctx.db.patch(args.trackedId, update);
  },
});

// Untrack a scheme
export const untrack = mutation({
  args: { trackedId: v.id("tracked_schemes") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.trackedId);
  },
});

// List tracked schemes for a business
export const listByBusiness = query({
  args: { businessId: v.id("businesses") },
  handler: async (ctx, args) => {
    const tracked = await ctx.db
      .query("tracked_schemes")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .collect();

    // Enrich with scheme data
    const enriched = await Promise.all(
      tracked.map(async (t) => {
        const scheme = await ctx.db.get(t.schemeId);
        return { ...t, scheme };
      })
    );

    return enriched.sort((a, b) => b.trackedAt - a.trackedAt);
  },
});

// Check if a scheme is tracked
export const isTracked = query({
  args: {
    businessId: v.id("businesses"),
    schemeId: v.id("schemes"),
  },
  handler: async (ctx, args) => {
    const found = await ctx.db
      .query("tracked_schemes")
      .withIndex("by_business_scheme", (q) =>
        q.eq("businessId", args.businessId).eq("schemeId", args.schemeId)
      )
      .first();
    return found ? { tracked: true, id: found._id, status: found.status } : { tracked: false };
  },
});
