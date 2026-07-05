import { requireRole } from "@/lib/auth-utils";
import { apiFetch } from "@/lib/api";
import { AlumniVerificationForm } from "@/components/verification/alumni-verification-form";

export default async function AlumniVerificationPage() {
  await requireRole("ALUMNI");
  const res = await apiFetch<any>("/api/auth/me");
  const profile = res.data?.alumniProfile;
  if (!profile) return <p className="p-6">Profile not found</p>;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold" style={{ fontFamily: 'Outfit, sans-serif' }}>Account Verification</h1>
        <p className="text-muted-foreground mt-1">Verify your alumni credentials to unlock mentorship tools</p>
      </div>
      <AlumniVerificationForm profile={profile} />
    </div>
  );
}
