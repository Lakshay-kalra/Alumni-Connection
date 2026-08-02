import { auth } from "@/auth";
import { API_BASE as API_URL } from "@/lib/env";

export async function apiFetch<T = any>(
  path: string,
  options: RequestInit = {}
): Promise<{ success: boolean; data?: T; error?: string; message?: string }> {
  try {
    const session = await auth();
    const token = session?.accessToken;

    const headers = new Headers(options.headers);
    if (!headers.has("Content-Type") && !(options.body instanceof FormData)) {
      headers.set("Content-Type", "application/json");
    }
    
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }

    const res = await fetch(`${API_URL}${path}`, {
      ...options,
      headers,
    });

    const data = await res.json();
    if (!res.ok) {
      return { success: false, error: data.error || "Request failed" };
    }

    return {
      success: true,
      data: data,
      message: data.message,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || "Network error. Please try again later.",
    };
  }
}
