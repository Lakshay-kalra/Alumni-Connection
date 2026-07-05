import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string) {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(date));
}

export function formatDateOnly(date: Date | string) {
  return new Intl.DateTimeFormat("en-IN", { dateStyle: "long" }).format(
    new Date(date)
  );
}

export function getMentorshipStatus(current: number, max = 2) {
  if (current >= max) return { label: "Full", slots: `${max}/${max}`, variant: "destructive" as const };
  if (current === max - 1) return { label: "Almost Full", slots: `${current}/${max}`, variant: "warning" as const };
  return { label: "Available", slots: `${current}/${max}`, variant: "success" as const };
}

export function calculateMatchPercentage(
  student: { department?: string; interests?: string[]; careerGoals?: string[] },
  alumni: { department?: string; skills?: string[]; expertise?: string[]; industry?: string; interests?: string[] }
): number {
  let score = 0;
  let total = 0;

  if (student.department && alumni.department) {
    total += 30;
    if (student.department.toLowerCase() === alumni.department.toLowerCase()) score += 30;
  }

  const studentInterests = [...(student.interests || []), ...(student.careerGoals || [])].map((s) => s.toLowerCase());
  const alumniTags = [...(alumni.skills || []), ...(alumni.expertise || []), ...(alumni.interests || []), alumni.industry || ""]
    .filter(Boolean)
    .map((s) => s.toLowerCase());

  if (studentInterests.length && alumniTags.length) {
    total += 50;
    const matches = studentInterests.filter((i) =>
      alumniTags.some((t) => t.includes(i) || i.includes(t))
    );
    score += Math.min(50, (matches.length / studentInterests.length) * 50);
  }

  total += 20;
  if (student.careerGoals?.length && alumni.expertise?.length) {
    const goalMatches = student.careerGoals.filter((g) =>
      alumni.expertise!.some((e) => e.toLowerCase().includes(g.toLowerCase().split(" ")[0]))
    );
    score += (goalMatches.length / student.careerGoals.length) * 20;
  }

  return total > 0 ? Math.round((score / total) * 100) : 50;
}

export function sanitizeInput(input: string): string {
  return input.replace(/<[^>]*>/g, "").trim();
}
