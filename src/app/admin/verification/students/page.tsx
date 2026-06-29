import { requireRole } from "@/lib/auth-utils";
import { apiFetch } from "@/lib/api";
import { VerifyStudentClient } from "@/components/admin/verify-student-client";

export default async function AdminStudentVerificationPage() {
  await requireRole("ADMIN");

  const res = await apiFetch<any>("/api/admin/users");
  const students = res.data?.students || [];

  const pendingStudents = students.filter((s: any) => s.verificationStatus === "PENDING");
  const approvedStudents = students.filter((s: any) => s.verificationStatus === "APPROVED");
  const rejectedStudents = students.filter((s: any) => s.verificationStatus === "REJECTED");

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
