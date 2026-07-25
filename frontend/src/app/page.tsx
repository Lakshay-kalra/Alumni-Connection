import HomeClient from "@/components/home/home-client";

export default async function HomePage() {
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
  let stats = {
    totalAlumni: 0,
    totalStudents: 0,
    totalEvents: 0,
    activeMentorships: 0,
  };

  try {
    const res = await fetch(`${API_URL}/api/public/stats`, { cache: "no-store" });
    if (res.ok) {
      const data = await res.json();
      stats = {
        totalAlumni: data.totalAlumni || 0,
        totalStudents: data.totalStudents || 0,
        totalEvents: data.totalEvents || 0,
        activeMentorships: data.activeMentorships || 0,
      };
    }
  } catch (error) {
    console.error("Failed to fetch public stats:", error);
  }

  return <HomeClient stats={stats} />;
}
