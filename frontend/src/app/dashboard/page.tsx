import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getDashboardPath } from "@/lib/auth-utils";

export default async function DashboardRedirectPage() {
  const session = await auth();
  if (!session?.user?.role) {
    redirect("/login");
  }
  redirect(getDashboardPath(session.user.role));
}
