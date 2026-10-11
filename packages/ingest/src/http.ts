/**
 * Polite HTTP for public government APIs: a simple rate limit plus retries
 * with exponential backoff on network errors, 429s, and 5xx responses.
 */

export interface PoliteFetchOptions {
  requestsPerSecond?: number;
  maxRetries?: number;
  /** Injected for tests. Defaults to global fetch. */
  fetchImpl?: typeof fetch;
  /** Injected for tests so retries don't actually wait. */
  sleep?: (ms: number) => Promise<void>;
}

const defaultSleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

export function createPoliteFetch(options: PoliteFetchOptions = {}) {
  const rps = options.requestsPerSecond ?? Number(process.env.INGEST_RATE_LIMIT_RPS ?? 2);
  const minGapMs = rps > 0 ? 1000 / rps : 0;
  const maxRetries = options.maxRetries ?? 4;
  const fetchImpl = options.fetchImpl ?? fetch;
  const sleep = options.sleep ?? defaultSleep;
  let lastRequestAt = 0;

  return async function politeFetch(url: string): Promise<unknown> {
    for (let attempt = 0; ; attempt++) {
      const wait = lastRequestAt + minGapMs - Date.now();
      if (wait > 0) await sleep(wait);
      lastRequestAt = Date.now();

      try {
        const res = await fetchImpl(url, {
          headers: {
            Accept: "application/json",
            "User-Agent": "OpenStaffing (open-source civic data project)",
          },
        });
        if (res.ok) return await res.json();
        const retryable = res.status === 429 || res.status >= 500;
        if (!retryable || attempt >= maxRetries) {
          throw new Error(`GET ${url} failed with HTTP ${res.status}`);
        }
      } catch (err) {
        if (attempt >= maxRetries) throw err;
        if (err instanceof Error && err.message.startsWith(`GET ${url} failed`)) throw err;
      }
      await sleep(2 ** attempt * 500);
    }
  };
}
