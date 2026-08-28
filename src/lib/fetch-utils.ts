/**
 * Helpers for handling aborted `fetch` requests.
 *
 * When a component unmounts (or an effect re-runs) mid-request, its
 * AbortController fires and the pending fetch rejects with a DOMException
 * named "AbortError". That is expected teardown, not a failure, so it must
 * never reach the console — otherwise every navigation logs
 * "signal is aborted without reason".
 */

/**
 * True when the error (or anything in its `cause` chain) is an abort.
 *
 * The chain walk matters because service layers often rethrow as
 * `new Error("...", { cause: original })`, which hides the original `name`.
 */
export function isAbortError(error: unknown, depth = 0): boolean {
  if (!error || depth > 5) return false;

  if (typeof error === "object" && "name" in error) {
    const { name } = error as { name?: unknown };
    if (name === "AbortError" || name === "CanceledError") return true;
  }

  if (error instanceof Error && error.cause) {
    return isAbortError(error.cause, depth + 1);
  }

  return false;
}

/**
 * `console.error` that stays quiet for aborts. Use it in every fetch catch
 * block so genuine failures (network, 5xx, parse) still surface.
 */
export function logFetchError(context: string, error: unknown): void {
  if (isAbortError(error)) return;
  console.error(context, error);
}
