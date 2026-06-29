"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createAnnouncement } from "@/actions/platform";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatDate } from "@/lib/utils";
import { Megaphone, Plus, X, Calendar, Loader2 } from "lucide-react";

type Announcement = {
  id: string;
  title: string;
  content: string;
  category: string;
  publishedAt: Date;
};

const categoryConfig: Record<string, { label: string; color: string; emoji: string }> = {
  NEWS: { label: "News", color: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800", emoji: "📰" },
  ACHIEVEMENT: { label: "Achievement", color: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800", emoji: "🏆" },
  PLACEMENT_REPORT: { label: "Placement Report", color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800", emoji: "💼" },
  DEPARTMENT_UPDATE: { label: "Department Update", color: "bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-200 dark:border-violet-800", emoji: "🏛️" },
  CAMPUS_UPDATE: { label: "Campus Update", color: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-800", emoji: "🎓" },
};

export function AnnouncementsClient({
  announcements,
  isAdmin,
}: {
  announcements: Announcement[];
  isAdmin: boolean;
}) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [category, setCategory] = useState("NEWS");
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<string>("ALL");

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    formData.set("category", category);
    await createAnnouncement(formData);
    setShowForm(false);
    setLoading(false);
    router.refresh();
  }

  const filtered = filter === "ALL" ? announcements : announcements.filter((a) => a.category === filter);

  return (
    <div className="space-y-6">
      {/* Admin create form */}
      {isAdmin && (
        <div>
          {!showForm ? (
            <Button onClick={() => setShowForm(true)} className="gap-2 shadow-lg shadow-primary/20">
              <Plus className="h-4 w-4" /> Publish Announcement
            </Button>
          ) : (
            <Card className="border-primary/30">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <h3 className="font-bold text-lg">New Announcement</h3>
                    <p className="text-sm text-muted-foreground mt-0.5">This will be sent to all users</p>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => setShowForm(false)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <form onSubmit={handleCreate} className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label>Title</Label>
                      <Input name="title" required placeholder="Announcement title..." className="h-10" />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Category</Label>
                      <Select value={category} onValueChange={setCategory}>
                        <SelectTrigger className="h-10">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(categoryConfig).map(([k, v]) => (
                            <SelectItem key={k} value={k}>
                              {v.emoji} {v.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Content</Label>
                    <Textarea name="content" required rows={5} placeholder="Write your announcement..." className="resize-none" />
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit" disabled={loading} className="gap-2 shadow-md shadow-primary/20">
                      {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Publishing...</> : <><Megaphone className="h-4 w-4" /> Publish</>}
                    </Button>
                    <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setFilter("ALL")}
          className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${filter === "ALL" ? "bg-primary text-primary-foreground shadow-sm" : "bg-muted text-muted-foreground hover:text-foreground"}`}
        >
          All ({announcements.length})
        </button>
        {Object.entries(categoryConfig).map(([k, v]) => {
          const count = announcements.filter((a) => a.category === k).length;
          if (count === 0) return null;
          return (
            <button
              key={k}
              onClick={() => setFilter(k)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${filter === k ? "bg-primary text-primary-foreground shadow-sm" : "bg-muted text-muted-foreground hover:text-foreground"}`}
            >
              {v.emoji} {v.label} ({count})
            </button>
          );
        })}
      </div>

      {/* Announcements list */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Megaphone className="h-14 w-14 text-muted-foreground mb-4" />
          <p className="text-xl font-semibold">No announcements yet</p>
          <p className="text-muted-foreground text-sm mt-2">Check back later for college updates</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((a) => {
            const cat = categoryConfig[a.category] || { label: a.category, color: "bg-muted text-muted-foreground", emoji: "📢" };
            return (
              <Card key={a.id} className="card-hover overflow-hidden">
                <div className="flex">
                  {/* Left accent bar */}
                  <div className={`w-1.5 shrink-0 ${a.category === "NEWS" ? "bg-blue-500" :
                    a.category === "ACHIEVEMENT" ? "bg-amber-500" :
                    a.category === "PLACEMENT_REPORT" ? "bg-emerald-500" :
                    a.category === "DEPARTMENT_UPDATE" ? "bg-violet-500" :
                    "bg-rose-500"}`}
                  />
                  <div className="flex-1 px-5 py-4">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <h3 className="font-bold text-base leading-tight">{a.title}</h3>
                      <span className={`shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full border ${cat.color}`}>
                        {cat.emoji} {cat.label}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed mb-3">{a.content}</p>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Calendar className="h-3.5 w-3.5" />
                      {formatDate(a.publishedAt)}
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
