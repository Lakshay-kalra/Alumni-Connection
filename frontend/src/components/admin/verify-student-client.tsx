"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { verifyStudent } from "@/actions/verification";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { CheckCircle, Clock, XCircle, FileText, AlertCircle } from "lucide-react";
import type { StudentProfile, User } from "@/types/db";

type StudentWithUser = StudentProfile & { user: User };

export function VerifyStudentClient({ pending, approved, rejected }: { pending: StudentWithUser[]; approved: StudentWithUser[]; rejected: StudentWithUser[] }) {
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<StudentWithUser | null>(null);
  const [reviewOpen, setReviewOpen] = useState(false);

  async function handleVerify(id: string, action: "approve" | "reject") {
    setLoadingId(id);
    try {
      const res = await verifyStudent(id, action);
      if (res.success) {
        setReviewOpen(false);
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

  function renderStudentList(list: StudentWithUser[], status: "PENDING" | "APPROVED" | "REJECTED") {
    if (list.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground border-2 border-dashed rounded-2xl">
          {status === "PENDING" && <Clock className="h-10 w-10 text-amber-500/60 mb-3" />}
          {status === "APPROVED" && <CheckCircle className="h-10 w-10 text-emerald-500/60 mb-3" />}
          {status === "REJECTED" && <XCircle className="h-10 w-10 text-rose-500/60 mb-3" />}
          <p className="font-semibold text-sm">No students found</p>
          <p className="text-xs">No records under this status</p>
        </div>
      );
    }

    return (
      <div className="grid gap-4 md:grid-cols-2">
        {list.map((s) => (
          <Card key={s.id} className="card-hover">
            <CardContent className="p-5 flex flex-col justify-between h-full space-y-4">
              <div className="space-y-2 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-bold text-base truncate">{s.name}</h3>
                  <span className="text-xs text-muted-foreground shrink-0">{s.department} · {s.batch}</span>
                </div>
                <p className="text-xs text-muted-foreground truncate">{s.user.email}</p>
                {s.studentIdCard ? (
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                    <FileText className="h-3.5 w-3.5" /> ID card submitted
                  </p>
                ) : (
                  <p className="text-xs text-rose-500 flex items-center gap-1.5">
                    <AlertCircle className="h-3.5 w-3.5" /> No ID card uploaded
                  </p>
                )}
              </div>

              <div className="flex gap-2 pt-2 border-t">
                {s.studentIdCard ? (
                  <Dialog open={reviewOpen && selectedStudent?.id === s.id} onOpenChange={(open) => {
                    if (open) {
                      setSelectedStudent(s);
                      setReviewOpen(true);
                    } else {
                      setReviewOpen(false);
                    }
                  }}>
                    <DialogTrigger asChild>
                      <Button size="sm" className="w-full flex-1">Review ID Document</Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>Review Student ID Card</DialogTitle>
                        <DialogDescription>
                          Review details for {selectedStudent?.name} ({selectedStudent?.department} · Batch {selectedStudent?.batch})
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="relative aspect-video max-w-full rounded-xl overflow-hidden border bg-background flex items-center justify-center">
                          {selectedStudent?.studentIdCard?.match(/\.(pdf)/i) ? (
                            <a
                              href={selectedStudent.studentIdCard}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex flex-col items-center gap-2 p-6 border rounded-xl hover:bg-muted"
                            >
                              <FileText className="h-10 w-10 text-muted-foreground" />
                              <span className="text-sm font-semibold">Open Student ID PDF</span>
                            </a>
                          ) : (
                            <img
                              src={selectedStudent?.studentIdCard || ""}
                              alt="Student ID card preview"
                              className="object-contain max-h-[350px] w-full"
                            />
                          )}
                        </div>
                        {status === "PENDING" && (
                          <div className="flex gap-3 justify-end pt-4">
                            <Button
                              variant="destructive"
                              onClick={() => selectedStudent?.id && handleVerify(selectedStudent.id, "reject")}
                              disabled={loadingId !== null}
                            >
                              {loadingId === selectedStudent?.id ? "..." : "Reject"}
                            </Button>
                            <Button
                              onClick={() => selectedStudent?.id && handleVerify(selectedStudent.id, "approve")}
                              disabled={loadingId !== null}
                            >
                              {loadingId === selectedStudent?.id ? "..." : "Approve Student"}
                            </Button>
                          </div>
                        )}
                      </div>
                    </DialogContent>
                  </Dialog>
                ) : (
                  <Button size="sm" variant="outline" className="w-full flex-1" disabled>No Document</Button>
                )}

                {status !== "PENDING" && (
                  <Button
                    size="sm"
                    variant={status === "APPROVED" ? "destructive" : "default"}
                    onClick={() => handleVerify(s.id, status === "APPROVED" ? "reject" : "approve")}
                    disabled={loadingId !== null}
                    className="flex-1"
                  >
                    {loadingId === s.id ? "..." : status === "APPROVED" ? "Reject Access" : "Approve Access"}
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
        {renderStudentList(pending, "PENDING")}
      </TabsContent>

      <TabsContent value="approved" className="space-y-4">
        {renderStudentList(approved, "APPROVED")}
      </TabsContent>

      <TabsContent value="rejected" className="space-y-4">
        {renderStudentList(rejected, "REJECTED")}
      </TabsContent>
    </Tabs>
  );
}

