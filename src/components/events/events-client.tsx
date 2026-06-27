"use client";

import { useState } from "react";
import { registerForEvent, cancelEventRegistration } from "@/actions/platform";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, MapPin, Users, CheckCircle, Plus, X, ImageOff } from "lucide-react";
import { formatDateOnly } from "@/lib/utils";

type Event = {
  id: string;
  title: string;
  description: string;
  date: Date;
  time: string;
  venue: string;
  bannerImage?: string | null;
  registrationCount: number;
  isRegistered: boolean;
};

export function EventsClient({
  events,
  userRole,
}: {
  events: Event[];
  userRole: string;
}) {
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [registeredIds, setRegisteredIds] = useState<Set<string>>(
    new Set(events.filter((e) => e.isRegistered).map((e) => e.id))
  );

  const isAlumni = userRole === "ALUMNI";
  const now = new Date();

  async function handleToggle(eventId: string) {
    setLoadingId(eventId);
    const isReg = registeredIds.has(eventId);
    const result = isReg
      ? await cancelEventRegistration(eventId)
      : await registerForEvent(eventId);

    if (result.success) {
      setRegisteredIds((prev) => {
        const next = new Set(prev);
        if (isReg) next.delete(eventId);
        else next.add(eventId);
        return next;
      });
    }
    setLoadingId(null);
  }

  const upcoming = events.filter((e) => new Date(e.date) >= now);
  const past = events.filter((e) => new Date(e.date) < now);

  return (
    <div className="space-y-8">
      {upcoming.length === 0 && past.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Calendar className="h-14 w-14 text-muted-foreground mb-4" />
          <p className="text-xl font-semibold">No events yet</p>
          <p className="text-muted-foreground mt-2">Check back soon for upcoming alumni events</p>
        </div>
      )}

      {upcoming.length > 0 && (
        <div>
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Upcoming Events
            <Badge variant="secondary">{upcoming.length}</Badge>
          </h2>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {upcoming.map((event) => {
              const isReg = registeredIds.has(event.id);
              const isLoading = loadingId === event.id;
              return (
                <Card key={event.id} className="overflow-hidden card-hover flex flex-col">
                  {/* Banner */}
                  <div className="h-40 bg-gradient-to-br from-primary/20 to-violet-500/20 relative overflow-hidden">
                    {event.bannerImage ? (
                      <img
                        src={event.bannerImage}
                        alt={event.title}
                        className="w-full h-full object-cover"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <ImageOff className="h-8 w-8 text-primary/30" />
                      </div>
                    )}
                    {isReg && (
                      <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-emerald-500 text-white text-xs font-semibold px-2.5 py-1 rounded-full shadow">
                        <CheckCircle className="h-3 w-3" /> Registered
                      </div>
                    )}
                  </div>

                  <CardContent className="flex-1 flex flex-col p-5">
                    <h3 className="font-bold text-base mb-2 line-clamp-2">{event.title}</h3>
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2 flex-1">{event.description}</p>

                    <div className="space-y-1.5 text-xs text-muted-foreground mb-4">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-3.5 w-3.5 text-primary" />
                        {formatDateOnly(event.date)}
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-3.5 w-3.5 text-primary" />
                        {event.time}
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-3.5 w-3.5 text-primary" />
                        {event.venue}
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="h-3.5 w-3.5 text-primary" />
                        {event.registrationCount} registered
                      </div>
                    </div>

                    {isAlumni && (
                      <Button
                        size="sm"
                        variant={isReg ? "outline" : "default"}
                        className={`w-full gap-2 ${isReg ? "border-destructive/50 text-destructive hover:bg-destructive/10" : "shadow-md shadow-primary/20"}`}
                        onClick={() => handleToggle(event.id)}
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                        ) : isReg ? (
                          <><X className="h-3.5 w-3.5" /> Cancel Registration</>
                        ) : (
                          <><Plus className="h-3.5 w-3.5" /> Register</>
                        )}
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {past.length > 0 && (
        <div>
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-muted-foreground">
            Past Events
            <Badge variant="secondary">{past.length}</Badge>
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {past.map((event) => (
              <Card key={event.id} className="overflow-hidden opacity-70">
                <div className="h-28 bg-gradient-to-br from-muted to-muted-foreground/10 relative">
                  {event.bannerImage && (
                    <img src={event.bannerImage} alt={event.title} className="w-full h-full object-cover grayscale" />
                  )}
                  <div className="absolute inset-0 bg-background/40 flex items-center justify-center">
                    <Badge variant="secondary">Past</Badge>
                  </div>
                </div>
                <CardContent className="p-4">
                  <h3 className="font-semibold text-sm mb-1 line-clamp-1">{event.title}</h3>
                  <p className="text-xs text-muted-foreground">{formatDateOnly(event.date)} · {event.venue}</p>
                  <p className="text-xs text-muted-foreground mt-1">{event.registrationCount} attended</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
