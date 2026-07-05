"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { verifyAlumni } from "@/actions/verification";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle, Clock, XCircle, Linkedin, AlertCircle, ExternalLink } from "lucide-react";
import type { AlumniProfile, User } from "@/types/db";

type AlumniWithUser = AlumniProfile & { user: User };

export function VerifyAlumniClient({ pending, approved, rejected }: { pending: AlumniWithUser[]; approved: AlumniWithUser[]; rejected: AlumniWithUser[] }) {
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<string | null>(null);

  async function handleVerify(id: string, action: "approve" | "reject") {
    setLoadingId(id);
    try {
      const res = await verifyAlumni(id, action);
      if (res.success) {
        router.refresh();
      } else {
        alert(res.error || "Action failed");
      }
    } catch (err) {
      console.error(err);
      alert("An unexpected error occurred");
    } finally {
      setLoadingId(null);
    }
  }

  function renderAlumniList(list: AlumniWithUser[], status: "PENDING" | "APPROVED" | "REJECTED") {
    if (list.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground border-2 border-dashed rounded-2xl">
          {status === "PENDING" && <Clock className="h-10 w-10 text-amber-500/60 mb-3" />}
          {status === "APPROVED" && <CheckCircle className="h-10 w-10 text-emerald-500/60 mb-3" />}
          {status === "REJECTED" && <XCircle className="h-10 w-10 text-rose-500/60 mb-3" />}
          <p className="font-semibold text-sm">No alumni found</p>
          <p className="text-xs">No records under this status</p>
        </div>
      );
    }

    return (
      <div className="grid gap-4 md:grid-cols-2">
        {list.map((a) => (
          <Card key={a.id} className="card-hover">
            <CardContent className="p-5 flex flex-col justify-between h-full space-y-4">
              <div className="space-y-2 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-bold text-base truncate">{a.name}</h3>
                    <p className="text-xs text-muted-foreground">
                      {a.position && a.company ? `${a.position} at ${a.company}` : "Alumni"}
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0">{a.department} · Batch {a.batch}</span>
                </div>
                <p className="text-xs text-muted-foreground truncate">{a.user.email}</p>
                {a.linkedin ? (
                  <a
                    href={a.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline font-medium"
                  >
                    <Linkedin className="h-3.5 w-3.5 fill-primary stroke-none" /> Review LinkedIn Profile <ExternalLink className="h-3 w-3" />
                  </a>
                ) : (
                  <p className="text-xs text-rose-500 flex items-center gap-1.5">
                    <AlertCircle className="h-3.5 w-3.5" /> No LinkedIn URL provided
                  </p>
                )}
              </div>

              <div className="flex gap-2 pt-2 border-t">
                {status === "PENDING" ? (
                  <>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleVerify(a.id, "reject")}
                      disabled={loadingId !== null}
                      className="flex-1"
                    >
                      {loadingId === a.id ? "..." : "Reject"}
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleVerify(a.id, "approve")}
                      disabled={loadingId !== null || !a.linkedin}
                      className="flex-1"
                    >
                      {loadingId === a.id ? "..." : "Approve"}
                    </Button>
                  </>
                ) : (
                  <Button
                    size="sm"
                    variant={status === "APPROVED" ? "destructive" : "default"}
                    onClick={() => handleVerify(a.id, status === "APPROVED" ? "reject" : "approve")}
                    disabled={loadingId !== null}
                    className="w-full"
                  >
                    {loadingId === a.id ? "..." : status === "APPROVED" ? "Reject Access" : "Approve Access"}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <Tabs defaultValue="pending" className="space-y-6">
      <TabsList className="grid w-full grid-cols-3 max-w-md">
        <TabsTrigger value="pending" className="flex items-center gap-2">
          Pending
          {pending.length > 0 && (
            <span className="h-5 w-5 bg-amber-500 text-white rounded-full flex items-center justify-center text-[10px] font-bold">
              {pending.length}
            </span>
          )}
        </TabsTrigger>
        <TabsTrigger value="approved">Approved</TabsTrigger>
        <TabsTrigger value="rejected">Rejected</TabsTrigger>
      </TabsList>

      <TabsContent value="pending" className="space-y-4">
        {renderAlumniList(pending, "PENDING")}
      </TabsContent>

      <TabsContent value="approved" className="space-y-4">
        {renderAlumniList(approved, "APPROVED")}
      </TabsContent>

      <TabsContent value="rejected" className="space-y-4">
        {renderAlumniList(rejected, "REJECTED")}
      </TabsContent>
    </Tabs>
  );
}
