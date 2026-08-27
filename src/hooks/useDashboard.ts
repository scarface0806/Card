"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { DashboardMetrics, getDashboardMetrics } from "@/services/dashboard";

const INR_FORMATTER = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

/**
 * Module-level cache so navigating away from the dashboard and back paints
 * instantly from memory instead of showing a spinner. Same idea as React
 * Query's staleTime + stale-while-revalidate, without adding a dependency.
 */
const STALE_TIME_MS = 30_000;

type CacheState = {
  data: DashboardMetrics | null;
  fetchedAt: number;
  inFlight: Promise<DashboardMetrics> | null;
};

const cache: CacheState = { data: null, fetchedAt: 0, inFlight: null };

function isFresh(): boolean {
  return cache.data !== null && Date.now() - cache.fetchedAt < STALE_TIME_MS;
}

/**
 * Shared fetch. Concurrent callers reuse the same in-flight promise, so a
 * remount mid-request cannot trigger a duplicate round trip.
 */
function loadMetrics(force: boolean): Promise<DashboardMetrics> {
  if (!force && cache.inFlight) return cache.inFlight;
  if (!force && isFresh() && cache.data) return Promise.resolve(cache.data);

  const request = getDashboardMetrics()
    .then((data) => {
      cache.data = data;
      cache.fetchedAt = Date.now();
      return data;
    })
    .finally(() => {
      cache.inFlight = null;
    });

  cache.inFlight = request;
  return request;
}

/**
 * Hook for fetching dashboard metrics.
 *
 * Renders cached data immediately when available and revalidates in the
 * background, so `loading` is only true on a genuinely cold first load.
 */
export function useDashboard(autoRefresh: boolean = false, refreshInterval: number = 60000) {
  // Seed straight from the cache so a revisit has data on the very first render.
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(cache.data);
  const [loading, setLoading] = useState(cache.data === null);
  const [error, setError] = useState<string | null>(null);
  const mounted = useRef(true);

  const fetchMetrics = useCallback(async (force: boolean = true) => {
    // Only show the skeleton when there is nothing at all to display.
    if (!cache.data) setLoading(true);

    try {
      const data = await loadMetrics(force);
      if (!mounted.current) return;
      setMetrics(data);
      setError(null);
    } catch (err) {
      if (!mounted.current) return;
      setError(err instanceof Error ? err.message : "Failed to fetch metrics");
    } finally {
      if (mounted.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    mounted.current = true;

    // Fresh cache: paint it and skip the network entirely.
    if (isFresh()) {
      setMetrics(cache.data);
      setLoading(false);
    } else {
      fetchMetrics(false);
    }

    let interval: ReturnType<typeof setInterval> | undefined;
    if (autoRefresh && refreshInterval > 0) {
      interval = setInterval(() => fetchMetrics(true), refreshInterval);
    }

    return () => {
      mounted.current = false;
      if (interval) clearInterval(interval);
    };
  }, [fetchMetrics, autoRefresh, refreshInterval]);

  return {
    metrics,
    loading,
    error,
    refetch: fetchMetrics,
  };
}

/**
 * Format currency for display
 */
export function formatCurrency(amount: number): string {
  return INR_FORMATTER.format(amount);
}

/**
 * Format large numbers with K/M suffix
 */
export function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + "M";
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + "K";
  }
  return num.toString();
}

/**
 * Calculate percentage change
 */
export function calculateChange(current: number, previous: number): {
  value: number;
  isPositive: boolean;
} {
  if (previous === 0) {
    return { value: current > 0 ? 100 : 0, isPositive: current > 0 };
  }
  const change = ((current - previous) / previous) * 100;
  return {
    value: Math.abs(Math.round(change)),
    isPositive: change >= 0,
  };
}
