import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Save match results for a business
export const saveMatches = mutation({
  args: {
    businessId: v.id("businesses"),
    matches: v.array(
      v.object({
        schemeId: v.id("schemes"),
        matchScore: v.number(),
        reason: v.string(),
      })
    ),
  },
  handler: async (ctx, args) => {
    // Delete old matches for this business first
    const old = await ctx.db
      .query("matches")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .collect();
    for (const m of old) {
      await ctx.db.delete(m._id);
    }

    // Insert new matches
    for (const m of args.matches) {
      await ctx.db.insert("matches", {
        businessId: args.businessId,
        schemeId: m.schemeId,
        matchScore: m.matchScore,
        reason: m.reason,
        createdAt: Date.now(),
      });
    }
    return args.matches.length;
  },
});

// Get matches for a business, sorted by score desc
export const listByBusiness = query({
  args: { businessId: v.id("businesses") },
  handler: async (ctx, args) => {
    const matches = await ctx.db
      .query("matches")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .collect();

    // Enrich with scheme data
    const enriched = await Promise.all(
      matches.map(async (m) => {
        const scheme = await ctx.db.get(m.schemeId);
        return { ...m, scheme };
      })
    );

    return enriched.sort((a, b) => b.matchScore - a.matchScore);
  },
});
