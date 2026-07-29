/**
 * Backend Context
 * 
 * Detects whether Convex is configured (VITE_CONVEX_URL set) and
 * provides a unified React hook interface that works with either:
 *   - Convex (real-time DB, used in production)
 *   - Local storage (demo mode, no Convex account needed)
 * 
 * This lets the full app work demo-able without requiring Convex setup.
 */

import { useState, useEffect, useCallback } from "react";
import { useQuery as useConvexQuery, useMutation as useConvexMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { localSchemes, localBusinesses, localMatches, localTracked } from "./localBackend";

const IS_CONVEX = !!import.meta.env.VITE_CONVEX_URL && 
  import.meta.env.VITE_CONVEX_URL !== "" &&
  !import.meta.env.VITE_CONVEX_URL.includes("placeholder");

export { IS_CONVEX };

// ── Local backend hook ────────────────────────────────────────────────────────

function useLocalQuery(queryFn, args) {
  const [data, setData] = useState(undefined);

  useEffect(() => {
    if (!args || args === "skip") {
      setData(null);
      return;
    }
    // Simulate async by deferring one frame
    const id = requestAnimationFrame(() => {
      try {
        setData(queryFn(args));
      } catch (e) {
        console.error("Local query error:", e);
        setData(null);
      }
    });
    return () => cancelAnimationFrame(id);
  });

  return data;
}

// ── Unified hooks ─────────────────────────────────────────────────────────────

export function useSchemesList() {
  if (IS_CONVEX) {
    const data = useConvexQuery(api.schemes.list);
    return data;
  }
  return useLocalQuery((args) => localSchemes.list(), {});
}

export function useBusinessGet(businessId) {
  if (IS_CONVEX) {
    const data = useConvexQuery(api.businesses.get, businessId ? { businessId } : "skip");
    return data;
  }
  return useLocalQuery(
    ({ businessId }) => localBusinesses.get(businessId),
    businessId ? { businessId } : "skip"
  );
}

export function useMatchesByBusiness(businessId) {
  if (IS_CONVEX) {
    const data = useConvexQuery(api.matches.listByBusiness, businessId ? { businessId } : "skip");
    // Refetch isn't needed manually in Convex because it's real-time, but we provide a dummy one for the API
    return [data, () => {}];
  }

  const [data, setData] = useState(undefined);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!businessId) { setData([]); return; }
    const result = localMatches.listByBusiness(businessId);
    setData(result);
  }, [businessId, tick]);

  const refetch = useCallback(() => setTick((t) => t + 1), []);
  return [data, refetch];
}

export function useTrackedByBusiness(businessId) {
  if (IS_CONVEX) {
    const data = useConvexQuery(api.tracked_schemes.listByBusiness, businessId ? { businessId } : "skip");
    return [data, () => {}];
  }

  const [data, setData] = useState(undefined);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!businessId) { setData([]); return; }
    const result = localTracked.listByBusiness(businessId);
    setData(result);
  }, [businessId, tick]);

  const refetch = useCallback(() => setTick((t) => t + 1), []);
  return [data, refetch];
}

// ── Mutation wrappers ─────────────────────────────────────────────────────────

export function useCreateBusiness() {
  if (IS_CONVEX) {
    return useConvexMutation(api.businesses.create);
  }
  return useCallback((data) => {
    return Promise.resolve(localBusinesses.create(data));
  }, []);
}

export function useSeedSchemes() {
  if (IS_CONVEX) {
    return useConvexMutation(api.schemes.seed);
  }
  return useCallback(() => {
    return Promise.resolve(localSchemes.seed());
  }, []);
}

export function useSaveMatches() {
  if (IS_CONVEX) {
    return useConvexMutation(api.matches.saveMatches);
  }
  return useCallback(({ businessId, matches }) => {
    return Promise.resolve(localMatches.saveMatches(businessId, matches));
  }, []);
}

export function useTrackScheme() {
  if (IS_CONVEX) {
    return useConvexMutation(api.tracked_schemes.track);
  }
  return useCallback(({ businessId, schemeId }) => {
    return Promise.resolve(localTracked.track(businessId, schemeId));
  }, []);
}

export function useUpdateStatus() {
  if (IS_CONVEX) {
    return useConvexMutation(api.tracked_schemes.updateStatus);
  }
  return useCallback(({ trackedId, status, notes }) => {
    return Promise.resolve(localTracked.updateStatus(trackedId, status, notes));
  }, []);
}

export function useUntrack() {
  if (IS_CONVEX) {
    return useConvexMutation(api.tracked_schemes.untrack);
  }
  return useCallback(({ trackedId }) => {
    return Promise.resolve(localTracked.untrack(trackedId));
  }, []);
}
