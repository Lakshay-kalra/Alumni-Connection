import { requireRole } from "@/lib/auth-utils";
import { apiFetch } from "@/lib/api";
import { StudentProfileForm } from "@/components/profile/student-profile-form";

export default async function StudentProfilePage() {
  await requireRole("STUDENT");
  const res = await apiFetch<any>("/api/students/profile");
  const profile = res.data;

  if (!profile) return <p>Profile not found</p>;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold">My Profile</h1>
        <p className="text-muted-foreground">Manage your student profile information</p>
      </div>
      <StudentProfileForm profile={profile} />
    </div>
  );
}
