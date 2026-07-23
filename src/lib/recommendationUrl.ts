export function normalizeRecommendationUrl(value: string) {
  try {
    const url = new URL(value.trim());
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    if (url.username || url.password || url.port) return null;
    const hostname = url.hostname.toLowerCase().replace(/\.$/, "");
    if (
      !hostname
      || hostname === "localhost"
      || hostname.endsWith(".localhost")
      || hostname.endsWith(".local")
      || hostname.endsWith(".internal")
      || hostname.endsWith(".lan")
      || hostname === "metadata.google.internal"
      || /^\d+(?:\.\d+){3}$/.test(hostname)
      || hostname.includes(":")
    ) return null;
    url.hash = "";
    return url.toString();
  } catch {
    return null;
  }
}
