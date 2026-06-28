import { requireRole } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { VerifyAlumniClient } from "@/components/admin/verify-alumni-client";

export default async function AdminAlumniVerificationPage() {
  await requireRole("ADMIN");

  const [pendingAlumni, approvedAlumni, rejectedAlumni] = await Promise.all([
    db.alumniProfile.findMany({
      where: { verificationStatus: "PENDING" },
      include: { user: true },
      orderBy: { updatedAt: "desc" },
    }),
    db.alumniProfile.findMany({
      where: { verificationStatus: "APPROVED" },
      include: { user: true },
      orderBy: { updatedAt: "desc" },
    }),
    db.alumniProfile.findMany({
      where: { verificationStatus: "REJECTED" },
      include: { user: true },
      orderBy: { updatedAt: "desc" },
    }),
  ]);

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
