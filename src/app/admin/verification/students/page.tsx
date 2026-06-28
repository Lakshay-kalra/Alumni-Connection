import { requireRole } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { VerifyStudentClient } from "@/components/admin/verify-student-client";

export default async function AdminStudentVerificationPage() {
  await requireRole("ADMIN");

  const [pendingStudents, approvedStudents, rejectedStudents] = await Promise.all([
    db.studentProfile.findMany({
      where: { verificationStatus: "PENDING" },
      include: { user: true },
      orderBy: { updatedAt: "desc" },
    }),
    db.studentProfile.findMany({
      where: { verificationStatus: "APPROVED" },
      include: { user: true },
      orderBy: { updatedAt: "desc" },
    }),
    db.studentProfile.findMany({
      where: { verificationStatus: "REJECTED" },
      include: { user: true },
      orderBy: { updatedAt: "desc" },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold" style={{ fontFamily: 'Outfit, sans-serif' }}>Student Verification</h1>
        <p className="text-muted-foreground mt-1">Review student IDs and manage their verification statuses</p>
      </div>
      <VerifyStudentClient
        pending={pendingStudents}
        approved={approvedStudents}
        rejected={rejectedStudents}
      />
    </div>
  );
}
