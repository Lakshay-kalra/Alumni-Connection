"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getMentorshipStatus } from "@/lib/utils";
import { MentorshipRequestDialog } from "@/components/directory/mentorship-request-dialog";
import {
  Search,
  Building2,
  MapPin,
  GraduationCap,
  Users,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Filter,
} from "lucide-react";

async function fetchAlumni(params: Record<string, string>) {
  const searchParams = new URLSearchParams(params);
  const res = await fetch(`/api/alumni?${searchParams}`);
  if (!res.ok) throw new Error("Failed to fetch");
  return res.json();
}

export function AlumniDirectoryClient() {
  const [query, setQuery] = useState("");
  const [department, setDepartment] = useState("");
  const [batch, setBatch] = useState("");
  const [page, setPage] = useState(1);
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [selectedAlumni, setSelectedAlumni] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 350);
    return () => clearTimeout(timer);
  }, [query]);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["alumni", debouncedQuery, department, batch, page],
    queryFn: () =>
      fetchAlumni({ query: debouncedQuery, department, batch, page: String(page) }),
  });

  const hasFilters = debouncedQuery || department || batch;

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-10 h-11"
            placeholder="Search by name, company, position, location..."
            value={query}
            onChange={(e) => { setQuery(e.target.value); setPage(1); }}
          />
        </div>
        <div className="flex gap-2">
          <Input
            placeholder="Department"
            value={department}
            onChange={(e) => { setDepartment(e.target.value); setPage(1); }}
            className="h-11 sm:w-44"
          />
          <Input
            placeholder="Batch year"
            value={batch}
            onChange={(e) => { setBatch(e.target.value); setPage(1); }}
            className="h-11 w-28"
          />
          {hasFilters && (
            <Button
              variant="outline"
              size="icon"
              className="h-11 w-11 shrink-0"
              onClick={() => { setQuery(""); setDepartment(""); setBatch(""); setPage(1); }}
              title="Clear filters"
            >
              ✕
            </Button>
          )}
        </div>
      </div>

      {/* Results header */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          {isFetching ? (
            <span className="flex items-center gap-1.5"><Loader2 className="h-3.5 w-3.5 animate-spin" /> Searching...</span>
          ) : data?.total !== undefined ? (
            `${data.total} alumni found${hasFilters ? " (filtered)" : ""}`
          ) : null}
        </span>
        {data?.pages > 1 && (
          <span>Page {page} of {data.pages}</span>
        )}
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="pt-6 pb-5 px-5">
                <div className="h-4 bg-muted rounded-full w-3/4 mb-2" />
                <div className="h-3 bg-muted rounded-full w-1/2 mb-4" />
                <div className="h-3 bg-muted rounded-full w-full mb-2" />
                <div className="flex gap-1 mb-4">
                  <div className="h-5 bg-muted rounded-full w-16" />
                  <div className="h-5 bg-muted rounded-full w-20" />
                </div>
                <div className="h-8 bg-muted rounded-lg w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : data?.alumni?.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Search className="h-14 w-14 text-muted-foreground mb-4" />
          <p className="text-xl font-semibold">No alumni found</p>
          <p className="text-muted-foreground mt-2">Try adjusting your search filters</p>
          {hasFilters && (
            <Button variant="outline" onClick={() => { setQuery(""); setDepartment(""); setBatch(""); }} className="mt-4">
              Clear filters
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data?.alumni?.map((alumni: {
            id: string;
            name: string;
            company?: string;
            position?: string;
            department: string;
            batch: string;
            skills: string[];
            expertise: string[];
            location?: string;
            menteeCount: number;
            matchPercentage?: number;
          }) => {
            const status = getMentorshipStatus(alumni.menteeCount);
            return (
              <Card key={alumni.id} className="card-hover flex flex-col">
                <CardContent className="flex-1 flex flex-col pt-6 pb-5 px-5">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div>
                      <h3 className="font-bold text-base leading-tight">{alumni.name}</h3>
                      {alumni.position && (
                        <p className="text-sm text-muted-foreground mt-0.5">
                          {alumni.position}
                        </p>
                      )}
                    </div>
                    {alumni.matchPercentage !== undefined && (
                      <Badge variant="success" className="shrink-0 text-xs">
                        {alumni.matchPercentage}%
                      </Badge>
                    )}
                  </div>

                  {/* Meta info */}
                  <div className="space-y-1.5 mb-3">
                    {alumni.company && (
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Building2 className="h-3.5 w-3.5 text-primary/60" />
                        <span>{alumni.company}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <GraduationCap className="h-3.5 w-3.5 text-primary/60" />
                      <span>{alumni.department} · Batch {alumni.batch}</span>
                    </div>
                    {alumni.location && (
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <MapPin className="h-3.5 w-3.5 text-primary/60" />
                        <span>{alumni.location}</span>
                      </div>
                    )}
                  </div>

                  {/* Skills */}
                  {alumni.skills.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-4">
                      {alumni.skills.slice(0, 4).map((s) => (
                        <span key={s} className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
                          {s}
                        </span>
                      ))}
                      {alumni.skills.length > 4 && (
                        <span className="text-xs text-muted-foreground px-1 py-0.5">+{alumni.skills.length - 4}</span>
                      )}
                    </div>
                  )}

                  {/* Footer */}
                  <div className="mt-auto flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <Users className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className={`text-xs font-semibold ${
                        status.label === "Full" ? "text-destructive" :
                        status.label === "Almost Full" ? "text-amber-600 dark:text-amber-400" :
                        "text-emerald-600 dark:text-emerald-400"
                      }`}>
                        {status.label} · {status.slots}
                      </span>
                    </div>
                    <Button
                      size="sm"
                      className="gap-1.5 shadow-sm shadow-primary/20"
                      onClick={() => setSelectedAlumni(alumni.id)}
                      disabled={status.label === "Full"}
                      variant={status.label === "Full" ? "outline" : "default"}
                    >
                      {status.label === "Full" ? "Full" : "Request"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {data?.pages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <Button variant="outline" size="icon" disabled={page <= 1} onClick={() => setPage(page - 1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium text-muted-foreground">
            {page} / {data.pages}
          </span>
          <Button variant="outline" size="icon" disabled={page >= data.pages} onClick={() => setPage(page + 1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      {selectedAlumni && (
        <MentorshipRequestDialog
          alumniId={selectedAlumni}
          open={!!selectedAlumni}
          onClose={() => setSelectedAlumni(null)}
        />
      )}
    </div>
  );
}
