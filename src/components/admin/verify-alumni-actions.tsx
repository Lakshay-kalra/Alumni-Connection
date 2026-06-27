"use client";

import { useState } from "react";
import { verifyAlumni } from "@/actions/mentorship";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export function VerifyAlumniActions({ alumniId }: { alumniId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  async function handle(action: "approve" | "reject") {
    setLoading(action);
    await verifyAlumni(alumniId, action);
    router.refresh();
    setLoading(null);
  }

  return (
    <div className="flex gap-2">
      <Button size="sm" onClick={() => handle("approve")} disabled={loading !== null}>
        {loading === "approve" ? "..." : "Approve"}
      </Button>
      <Button size="sm" variant="destructive" onClick={() => handle("reject")} disabled={loading !== null}>
        {loading === "reject" ? "..." : "Reject"}
      </Button>
    </div>
  );
}
