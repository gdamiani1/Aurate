// Lazy require + lazy singleton — only init if env vars are set AND the
// native module is available. Required for Expo Go compatibility (PostHog
// has native dependencies not bundled into Expo Go). In a real dev-client
// or production build the require resolves and analytics works.
let client: any = null;
let initialized = false;

function getClient(): any {
  if (initialized) return client;
  initialized = true;

  const apiKey = process.env.EXPO_PUBLIC_POSTHOG_KEY;
  const host = process.env.EXPO_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com";
  if (!apiKey) return null;

  try {
    const { PostHog } = require("posthog-react-native");
    client = new PostHog(apiKey, {
      host,
      flushAt: 20,
      flushInterval: 10_000, // 10s
      captureAppLifecycleEvents: false, // we capture our own app_open with semantics
    });
  } catch (e) {
    console.warn("[analytics] init failed (likely Expo Go — PostHog native module missing):", e);
    client = null;
  }

  return client;
}

/**
 * Capture an event. Fire-and-forget — never throws.
 * Pre-auth events go to the anonymous distinct_id PostHog generates;
 * once identify() is called after sign-in, those get linked.
 */
export function capture(
  event: string,
  properties?: Record<string, unknown>
): void {
  try {
    const ph = getClient();
    if (!ph) return;
    // PostHog typings demand JSON-only values; our callers pass JSON-safe
    // primitives. Cast at the boundary.
    ph.capture(event, properties as Record<string, never> | undefined);
  } catch (e) {
    console.warn("[analytics] capture failed:", e);
  }
}

/**
 * Identify the user post-auth so subsequent events attach to their ID.
 */
export function identify(
  userId: string,
  properties?: Record<string, unknown>
): void {
  try {
    const ph = getClient();
    if (!ph) return;
    ph.identify(userId, properties as Record<string, never> | undefined);
  } catch (e) {
    console.warn("[analytics] identify failed:", e);
  }
}

/**
 * Reset the distinct_id on sign-out so the next user starts fresh.
 */
export function reset(): void {
  try {
    const ph = getClient();
    if (!ph) return;
    ph.reset();
  } catch (e) {
    console.warn("[analytics] reset failed:", e);
  }
}
