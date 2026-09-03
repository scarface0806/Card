"use client";

import { useEffect, useState } from "react";

import { resolveCardBackImage } from "@/lib/cardImages";

/**
 * Does this card actually have a back face?
 *
 * WHY THIS IS A PROBE AND NOT AN <img onError>
 *
 * The first version decided this from an `onError` on the back <img> itself.
 * That image lives on a face that is rotated 180deg with
 * `backface-visibility: hidden` and was marked `loading="lazy"`, so the
 * browser was free never to fetch it - and a load that never happens never
 * errors. The result was a "View back" control offered for a URL that did not
 * exist, sitting above a card that showed nothing. Exactly the reported bug.
 *
 * Deciding it here, by loading the URL eagerly and off-DOM, means the control
 * is only ever rendered once the bytes have actually arrived. The browser
 * caches the response, so the <img> that renders afterwards costs nothing.
 *
 * `resolveCardBackImage` remains the single place that decides WHAT the back
 * URL is; this hook only decides WHETHER it resolves.
 */
export function useCardBackImage(
  frontSrc?: string | null,
  explicitBack?: string | null
): { backSrc: string | null; available: boolean } {
  const backSrc = resolveCardBackImage(frontSrc, explicitBack);

  // Keyed by URL so a stale result can never be read against a new card: a
  // probe that resolves after the product changed is ignored because its `src`
  // no longer matches.
  const [probe, setProbe] = useState<{ src: string | null; ok: boolean }>({
    src: null,
    ok: false,
  });

  useEffect(() => {
    if (!backSrc || typeof window === "undefined") return;

    let cancelled = false;
    const image = new window.Image();

    image.onload = () => {
      if (!cancelled) setProbe({ src: backSrc, ok: true });
    };
    image.onerror = () => {
      if (!cancelled) setProbe({ src: backSrc, ok: false });
    };
    image.src = backSrc;

    return () => {
      cancelled = true;
      image.onload = null;
      image.onerror = null;
    };
  }, [backSrc]);

  return {
    backSrc,
    available: Boolean(backSrc) && probe.src === backSrc && probe.ok,
  };
}

export default useCardBackImage;
