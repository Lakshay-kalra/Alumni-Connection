import { requireRole } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { AlumniVerificationForm } from "@/components/verification/alumni-verification-form";

export default async function AlumniVerificationPage() {
  const user = await requireRole("ALUMNI");
  const profile = await db.alumniProfile.findUnique({ where: { userId: user.id } });
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
