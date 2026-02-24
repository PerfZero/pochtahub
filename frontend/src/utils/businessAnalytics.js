import { businessAPI } from "../api";

const METRIKA_ID = 104664178;
const ANON_KEY = "business_anonymous_id";
const SESSION_KEY = "business_session_id";

function createId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function getAnonymousId() {
  if (typeof window === "undefined") {
    return "";
  }
  let value = localStorage.getItem(ANON_KEY);
  if (!value) {
    value = createId();
    localStorage.setItem(ANON_KEY, value);
  }
  return value;
}

function getSessionId() {
  if (typeof window === "undefined") {
    return "";
  }
  let value = sessionStorage.getItem(SESSION_KEY);
  if (!value) {
    value = createId();
    sessionStorage.setItem(SESSION_KEY, value);
  }
  return value;
}

function getDeviceType() {
  if (typeof window === "undefined") {
    return "unknown";
  }
  const width = window.innerWidth || 0;
  if (width <= 767) {
    return "mobile";
  }
  if (width <= 1024) {
    return "tablet";
  }
  return "desktop";
}

function getUtmParams() {
  if (typeof window === "undefined") {
    return {};
  }
  const params = new URLSearchParams(window.location.search);
  return {
    utm_source: params.get("utm_source") || "",
    utm_medium: params.get("utm_medium") || "",
    utm_campaign: params.get("utm_campaign") || "",
    utm_term: params.get("utm_term") || "",
    utm_content: params.get("utm_content") || "",
  };
}

export async function trackBusinessEvent(eventType, payload = {}, options = {}) {
  const {
    oncePerSession = false,
    dedupeKey = "",
  } = options;

  if (typeof window !== "undefined" && oncePerSession) {
    const key = `business_evt_once_${eventType}_${dedupeKey || window.location.pathname}`;
    if (sessionStorage.getItem(key) === "1") {
      return;
    }
    sessionStorage.setItem(key, "1");
  }

  const anonymousId = getAnonymousId();
  const sessionId = getSessionId();
  const eventId = createId();
  const path = typeof window !== "undefined" ? window.location.pathname : "";
  const referrer = typeof document !== "undefined" ? document.referrer || "" : "";
  const userAgent = typeof navigator !== "undefined" ? navigator.userAgent || "" : "";
  const viewportWidth = typeof window !== "undefined" ? window.innerWidth || null : null;
  const viewportHeight = typeof window !== "undefined" ? window.innerHeight || null : null;

  const requestBody = {
    event_id: eventId,
    anonymous_id: anonymousId,
    session_id: sessionId,
    event_type: eventType,
    path,
    referrer,
    user_agent: userAgent,
    device: getDeviceType(),
    viewport_width: viewportWidth,
    viewport_height: viewportHeight,
    duration_ms: payload.durationMs ?? null,
    error_code: payload.errorCode ?? "",
    error_message: payload.errorMessage ?? "",
    ...getUtmParams(),
    timestamp: new Date().toISOString(),
    count_photos: payload.countPhotos ?? null,
    result: payload.result ?? {},
    metadata: payload.metadata ?? {},
  };

  if (typeof window !== "undefined" && typeof window.ym === "function") {
    try {
      window.ym(METRIKA_ID, "reachGoal", eventType, {
        source: "business",
        anonymous_id: anonymousId,
        session_id: sessionId,
        count_photos: requestBody.count_photos,
      });
    } catch (error) {
      console.error("YM business analytics error:", error);
    }
  }

  try {
    await businessAPI.trackEvent(requestBody);
  } catch (error) {
    console.error("Business analytics API error:", error);
  }
}
