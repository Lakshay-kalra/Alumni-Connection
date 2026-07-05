import { requireRole } from "@/lib/auth-utils";
import { apiFetch } from "@/lib/api";
import { VerifyAlumniClient } from "@/components/admin/verify-alumni-client";

export default async function AdminAlumniVerificationPage() {
  await requireRole("ADMIN");

  const res = await apiFetch<any>("/api/admin/users");
  const alumni = res.data?.alumni || [];

  const pendingAlumni = alumni.filter((a: any) => a.verificationStatus === "PENDING");
  const approvedAlumni = alumni.filter((a: any) => a.verificationStatus === "APPROVED");
  const rejectedAlumni = alumni.filter((a: any) => a.verificationStatus === "REJECTED");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold" style={{ fontFamily: 'Outfit, sans-serif' }}>Alumni Verification</h1>
        <p className="text-muted-foreground mt-1">Review LinkedIn profiles and manage alumni verification statuses</p>
      </div>
      <VerifyAlumniClient
        pending={pendingAlumni}
        approved={approvedAlumni}
        rejected={rejectedAlumni}
      />
    </div>
  );
}
