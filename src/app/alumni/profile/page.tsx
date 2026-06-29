import { requireRole } from "@/lib/auth-utils";
import { apiFetch } from "@/lib/api";
import { AlumniProfileForm } from "@/components/profile/alumni-profile-form";

export default async function AlumniProfilePage() {
  await requireRole("ALUMNI");
  const res = await apiFetch<any>("/api/auth/me");
  const profile = res.data?.alumniProfile;
  if (!profile) return <p>Profile not found</p>;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold">My Profile</h1>
        <p className="text-muted-foreground">Manage your professional alumni profile</p>
      </div>
      <AlumniProfileForm profile={profile} />
    </div>
  );
}
