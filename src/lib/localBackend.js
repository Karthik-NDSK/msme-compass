/**
 * MSME Compass — Local Storage Backend
 * 
 * This module provides a complete local-storage based backend
 * that mirrors the Convex API exactly, enabling the full demo
 * flow without requiring a Convex account.
 * 
 * Used when VITE_CONVEX_URL is not set.
 */

import { getSeedSchemes } from "./seedData";

// ── Storage keys ─────────────────────────────────────────────────────────────
const KEYS = {
  schemes: "mc_schemes",
  businesses: "mc_businesses",
  matches: "mc_matches",
  tracked: "mc_tracked",
};

// ── ID generator ─────────────────────────────────────────────────────────────
let idCounter = Date.now();
function generateId(prefix = "id") {
  return `${prefix}_${(++idCounter).toString(36)}`;
}

// ── Storage helpers ───────────────────────────────────────────────────────────
function getStore(key) {
  try {
    return JSON.parse(localStorage.getItem(key) || "[]");
  } catch {
    return [];
  }
}

function setStore(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
}

// ── Schemes ───────────────────────────────────────────────────────────────────
export const localSchemes = {
  seed() {
    const existing = getStore(KEYS.schemes);
    if (existing.length > 0) return { seeded: 0 };
    const schemes = getSeedSchemes().map((s) => ({
      ...s,
      _id: generateId("scheme"),
      isSeeded: true,
    }));
    setStore(KEYS.schemes, schemes);
    return { seeded: schemes.length };
  },

  list() {
    const schemes = getStore(KEYS.schemes);
    if (schemes.length === 0) {
      this.seed();
      return getStore(KEYS.schemes);
    }
    return schemes;
  },

  get(schemeId) {
    return getStore(KEYS.schemes).find((s) => s._id === schemeId) || null;
  },
};

// ── Businesses ────────────────────────────────────────────────────────────────
export const localBusinesses = {
  create(data) {
    const businesses = getStore(KEYS.businesses);
    const biz = { ...data, _id: generateId("biz"), createdAt: Date.now() };
    businesses.push(biz);
    setStore(KEYS.businesses, businesses);
    return biz._id;
  },

  listByUser(userId) {
    return getStore(KEYS.businesses).filter((b) => b.userId === userId);
  },

  get(businessId) {
    return getStore(KEYS.businesses).find((b) => b._id === businessId) || null;
  },
};

// ── Matches ───────────────────────────────────────────────────────────────────
export const localMatches = {
  saveMatches(businessId, matches) {
    const allMatches = getStore(KEYS.matches).filter(
      (m) => m.businessId !== businessId
    );
    const now = Date.now();
    const newMatches = matches.map((m) => ({
      ...m,
      _id: generateId("match"),
      businessId,
      createdAt: now,
    }));
    setStore(KEYS.matches, [...allMatches, ...newMatches]);
    return matches.length;
  },

  listByBusiness(businessId) {
    const matches = getStore(KEYS.matches).filter(
      (m) => m.businessId === businessId
    );
    const schemes = localSchemes.list();
    return matches
      .map((m) => ({
        ...m,
        scheme: schemes.find((s) => s._id === m.schemeId) || null,
      }))
      .sort((a, b) => b.matchScore - a.matchScore);
  },
};

// ── Tracked Schemes ───────────────────────────────────────────────────────────
export const localTracked = {
  track(businessId, schemeId) {
    const all = getStore(KEYS.tracked);
    const existing = all.find(
      (t) => t.businessId === businessId && t.schemeId === schemeId
    );
    if (existing) return existing._id;

    const entry = {
      _id: generateId("track"),
      businessId,
      schemeId,
      status: "not_started",
      notes: "",
      trackedAt: Date.now(),
    };
    setStore(KEYS.tracked, [...all, entry]);
    return entry._id;
  },

  updateStatus(trackedId, status, notes) {
    const all = getStore(KEYS.tracked);
    const updated = all.map((t) => {
      if (t._id !== trackedId) return t;
      return {
        ...t,
        ...(status !== undefined && { status }),
        ...(notes !== undefined && { notes }),
      };
    });
    setStore(KEYS.tracked, updated);
  },

  untrack(trackedId) {
    const all = getStore(KEYS.tracked).filter((t) => t._id !== trackedId);
    setStore(KEYS.tracked, all);
  },

  listByBusiness(businessId) {
    const tracked = getStore(KEYS.tracked).filter(
      (t) => t.businessId === businessId
    );
    const schemes = localSchemes.list();
    return tracked
      .map((t) => ({
        ...t,
        scheme: schemes.find((s) => s._id === t.schemeId) || null,
      }))
      .sort((a, b) => b.trackedAt - a.trackedAt);
  },

  isTracked(businessId, schemeId) {
    const found = getStore(KEYS.tracked).find(
      (t) => t.businessId === businessId && t.schemeId === schemeId
    );
    return found
      ? { tracked: true, id: found._id, status: found.status }
      : { tracked: false };
  },
};
