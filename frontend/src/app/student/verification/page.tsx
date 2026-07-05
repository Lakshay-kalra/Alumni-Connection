import { requireRole } from "@/lib/auth-utils";
import { apiFetch } from "@/lib/api";
import { StudentVerificationForm } from "@/components/verification/student-verification-form";

export default async function StudentVerificationPage() {
  await requireRole("STUDENT");
  const res = await apiFetch<any>("/api/students/profile");
  const profile = res.data;
  
  if (!profile) return <p className="p-6">Profile not found</p>;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold" style={{ fontFamily: 'Outfit, sans-serif' }}>Account Verification</h1>
        <p className="text-muted-foreground mt-1">Verify your student identity to access all platform features</p>
      </div>
      <StudentVerificationForm profile={profile} />
    </div>
  );
}
