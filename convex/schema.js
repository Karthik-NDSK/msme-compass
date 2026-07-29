import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  businesses: defineTable({
    userId: v.string(),
    name: v.string(),
    sector: v.string(),
    state: v.string(),
    registrationType: v.string(), // "Udyam" | "GST" | "None"
    turnoverBand: v.string(),     // "<40L" | "40L-5Cr" | "5Cr-50Cr" | ">50Cr"
    employeeCount: v.number(),
    extractedFrom: v.string(),    // "ocr" | "manual"
    registrationNumber: v.optional(v.string()),
    createdAt: v.number(),
  }).index("by_user", ["userId"]),

  schemes: defineTable({
    name: v.string(),
    authority: v.string(),
    description: v.string(),
    eligibility: v.object({
      sectors: v.array(v.string()),     // ["*"] = all
      states: v.array(v.string()),      // ["*"] = all
      maxTurnover: v.optional(v.string()),
      registrationRequired: v.array(v.string()),
    }),
    benefit: v.string(),
    deadline: v.optional(v.number()),   // timestamp, null = rolling
    applyUrl: v.string(),
    category: v.string(),               // "Subsidy" | "Certification" | "Funding" | "Tax Benefit"
    isSeeded: v.optional(v.boolean()),
  }),

  matches: defineTable({
    businessId: v.id("businesses"),
    schemeId: v.id("schemes"),
    matchScore: v.number(),             // 0-100
    reason: v.string(),                 // Gemini-generated explanation
    createdAt: v.number(),
  })
    .index("by_business", ["businessId"])
    .index("by_business_scheme", ["businessId", "schemeId"]),

  tracked_schemes: defineTable({
    businessId: v.id("businesses"),
    schemeId: v.id("schemes"),
    status: v.string(), // "not_started" | "in_progress" | "applied" | "rejected" | "approved"
    notes: v.string(),
    trackedAt: v.number(),
  })
    .index("by_business", ["businessId"])
    .index("by_business_scheme", ["businessId", "schemeId"]),
});
