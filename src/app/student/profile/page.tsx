import { requireRole } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { StudentProfileForm } from "@/components/profile/student-profile-form";

export default async function StudentProfilePage() {
  const user = await requireRole("STUDENT");
  const profile = await db.studentProfile.findUnique({ where: { userId: user.id } });

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
