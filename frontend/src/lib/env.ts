// A trailing slash in these env URLs produces "//path" when concatenated with
// an API path, which 404s with an HTML page on Express/Railway. Strip once here.
export const API_BASE = (
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"
).replace(/\/+$/, "");

export const SOCKET_BASE = (
  process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:5000"
).replace(/\/+$/, "");
