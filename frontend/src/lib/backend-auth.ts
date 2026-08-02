import { API_BASE as API_URL } from "@/lib/env";

export type UserRole = "STUDENT" | "ALUMNI" | "ADMIN";

export type BackendUser = {
  id: string;
  email: string;
  role: UserRole;
  name: string;
  image: string | null;
};

export type BackendLoginResult =
  | { ok: true; user: BackendUser; token: string }
  | { ok: false; error: string };

export async function loginWithBackend(
  email: string,
  password: string
): Promise<BackendLoginResult> {
  try {
    const res = await fetch(`${API_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: email.trim().toLowerCase(),
        password,
      }),
      cache: "no-store",
    });

    const data = await res.json().catch(() => null);

    if (!res.ok || !data?.success || !data?.user) {
      return {
        ok: false,
        error: data?.error || "Invalid email or password",
      };
    }

    return {
      ok: true,
      user: data.user as BackendUser,
      token: data.token as string,
    };
  } catch {
    return {
      ok: false,
      error: "Unable to reach the server. Make sure the backend is running on port 5000.",
    };
  }
}
