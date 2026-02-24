import { businessAPI } from "../api";

const METRIKA_ID = 104664178;

export async function trackBusinessEvent(eventType, payload = {}) {
  const requestBody = {
    event_type: eventType,
    timestamp: new Date().toISOString(),
    count_photos: payload.countPhotos ?? null,
    result: payload.result ?? {},
    metadata: payload.metadata ?? {},
  };

  if (typeof window !== "undefined" && typeof window.ym === "function") {
    try {
      window.ym(METRIKA_ID, "reachGoal", eventType, {
        source: "business",
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
