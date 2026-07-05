"use client";

import { useState } from "react";
import { respondToMentorshipRequest } from "@/actions/mentorship";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export function MentorshipRequestActions({
  requestId,
  isFull,
}: {
  requestId: string;
  isFull: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  async function handle(action: "accept" | "reject") {
    setLoading(action);
    await respondToMentorshipRequest(requestId, action);
    router.refresh();
    setLoading(null);
  }

  return (
    <div className="flex gap-2">
      <Button
        size="sm"
        onClick={() => handle("accept")}
        disabled={isFull || loading !== null}
      >
        {isFull ? "Full Capacity" : loading === "accept" ? "..." : "Accept"}
      </Button>
      <Button
        size="sm"
        variant="outline"
        onClick={() => handle("reject")}
        disabled={loading !== null}
      >
        {loading === "reject" ? "..." : "Reject"}
      </Button>
    </div>
  );
}
