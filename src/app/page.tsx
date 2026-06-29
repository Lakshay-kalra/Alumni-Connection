import Link from "next/link";
import { GraduationCap, Users, MessageSquare, Calendar, ArrowRight, Star, Shield, Zap, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-xl">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 lg:px-8">
          <div className="flex items-center gap-2.5">
            <img src="/logo.jpeg" alt="Alumni Network Logo" className="h-9 w-auto rounded-md border" />
            <span className="font-bold text-xl tracking-tight" style={{ fontFamily: 'Outfit, sans-serif' }}>
              Alumni Network
            </span>
          </div>
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
            <a href="#features" className="hover:text-foreground transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-foreground transition-colors">How it works</a>
            <a href="#stats" className="hover:text-foreground transition-colors">Community</a>
          </nav>
          <div className="flex gap-2">
            <Button variant="ghost" asChild>
              <Link href="/login">Sign In</Link>
            </Button>
            <Button asChild className="shadow-lg shadow-primary/25">
              <Link href="/register">Get Started <ArrowRight className="ml-1.5 h-4 w-4" /></Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 left-1/4 w-96 h-96 rounded-full bg-primary/10 blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 rounded-full bg-purple-500/10 blur-3xl" />
        </div>
        <div className="container mx-auto px-4 lg:px-8 py-24 text-center">
          <Badge variant="secondary" className="mb-6 px-4 py-1.5 text-sm font-medium">
            🎓 Trusted by 500+ students and alumni
          </Badge>
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-tight mb-6" style={{ fontFamily: 'Outfit, sans-serif' }}>
            Connect. Grow.{" "}
            <span className="gradient-text">Mentor Together.</span>
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground leading-relaxed mb-10">
            The premier alumni mentorship platform bridging the gap between students and successful graduates.
            Find mentors, attend events, and build your professional network — all in one place.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Button size="lg" asChild className="h-12 px-8 text-base shadow-xl shadow-primary/30">
              <Link href="/register">Join as Student or Alumni <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="h-12 px-8 text-base">
              <Link href="/login">Sign In to Dashboard</Link>
            </Button>
          </div>

          {/* Login hints */}
          <div className="mt-8 flex flex-wrap justify-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5 bg-muted px-3 py-1.5 rounded-full">
              <Shield className="h-3 w-3" /> Admin: admin@alumninetwork.com / Admin@123
            </span>
            <span className="flex items-center gap-1.5 bg-muted px-3 py-1.5 rounded-full">
              <Star className="h-3 w-3" /> Alumni: alumni1@company.com / Alumni@123
            </span>
            <span className="flex items-center gap-1.5 bg-muted px-3 py-1.5 rounded-full">
              <Zap className="h-3 w-3" /> Student: student1@college.edu / Student@123
            </span>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section id="stats" className="border-y bg-muted/30">
        <div className="container mx-auto px-4 lg:px-8 py-12">
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
            {[
              { value: "500+", label: "Alumni Mentors", icon: Users },
              { value: "1,200+", label: "Students Mentored", icon: GraduationCap },
              { value: "95%", label: "Placement Rate", icon: TrendingUp },
              { value: "50+", label: "Events Hosted", icon: Calendar },
            ].map((stat) => (
              <div key={stat.label} className="flex flex-col items-center text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 mb-3">
                  <stat.icon className="h-6 w-6 text-primary" />
                </div>
                <div className="text-3xl font-black text-foreground mb-1" style={{ fontFamily: 'Outfit, sans-serif' }}>{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="text-center mb-16">
            <Badge variant="secondary" className="mb-4">Features</Badge>
            <h2 className="text-4xl font-black mb-4" style={{ fontFamily: 'Outfit, sans-serif' }}>
              Everything you need to{" "}
              <span className="gradient-text">succeed</span>
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              A comprehensive platform built for modern mentorship and networking.
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                icon: Users,
                title: "Alumni Directory",
                desc: "Search and filter verified alumni by skill, industry, department, or batch year.",
                gradient: "from-blue-500/20 to-indigo-500/20",
                iconColor: "text-blue-600 dark:text-blue-400",
              },
              {
                icon: MessageSquare,
                title: "Smart Mentorship",
                desc: "AI-powered mentor matching with real-time private chat between mentors and mentees.",
                gradient: "from-violet-500/20 to-purple-500/20",
                iconColor: "text-violet-600 dark:text-violet-400",
              },
              {
                icon: Calendar,
                title: "Events & Meetups",
                desc: "Register for alumni events, career fairs, and tech talks organized by admins.",
                gradient: "from-emerald-500/20 to-green-500/20",
                iconColor: "text-emerald-600 dark:text-emerald-400",
              },
              {
                icon: GraduationCap,
                title: "Community Hub",
                desc: "Admin broadcasts, alumni discussions, announcements, and college updates.",
                gradient: "from-amber-500/20 to-orange-500/20",
                iconColor: "text-amber-600 dark:text-amber-400",
              },
            ].map((f) => (
              <div
                key={f.title}
                className={`rounded-2xl border bg-gradient-to-br ${f.gradient} p-6 card-hover cursor-default`}
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-background shadow-sm mb-4">
                  <f.icon className={`h-6 w-6 ${f.iconColor}`} />
                </div>
                <h3 className="font-bold text-lg mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="py-24 bg-muted/30 border-t">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="text-center mb-16">
            <Badge variant="secondary" className="mb-4">How it works</Badge>
            <h2 className="text-4xl font-black mb-4" style={{ fontFamily: 'Outfit, sans-serif' }}>
              Start in <span className="gradient-text">3 simple steps</span>
            </h2>
          </div>
          <div className="grid gap-8 sm:grid-cols-3 max-w-4xl mx-auto">
            {[
              { step: "01", title: "Create Account", desc: "Register as a student or alumni. Alumni accounts get verified by admins." },
              { step: "02", title: "Discover Mentors", desc: "Browse the alumni directory and get AI-powered mentor recommendations based on your goals." },
              { step: "03", title: "Start Mentoring", desc: "Send a mentorship request, get accepted, and start chatting directly with your mentor." },
            ].map((s) => (
              <div key={s.step} className="relative text-center">
                <div className="text-7xl font-black text-primary/10 mb-4" style={{ fontFamily: 'Outfit, sans-serif' }}>{s.step}</div>
                <h3 className="text-xl font-bold mb-2">{s.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="relative rounded-3xl overflow-hidden bg-primary p-12 text-center text-primary-foreground">
            <div className="absolute inset-0 -z-0 opacity-20">
              <div className="absolute top-0 left-0 w-64 h-64 rounded-full bg-white blur-3xl" />
              <div className="absolute bottom-0 right-0 w-64 h-64 rounded-full bg-purple-300 blur-3xl" />
            </div>
            <div className="relative z-10">
              <h2 className="text-4xl font-black mb-4" style={{ fontFamily: 'Outfit, sans-serif' }}>
                Ready to build your career?
              </h2>
              <p className="text-primary-foreground/80 mb-8 max-w-xl mx-auto">
                Join thousands of students and alumni on the platform built to accelerate your professional journey.
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <Button size="lg" variant="secondary" asChild className="h-12 px-8">
                  <Link href="/register">Get Started Free <ArrowRight className="ml-2 h-4 w-4" /></Link>
                </Button>
                <Button size="lg" variant="outline" asChild className="h-12 px-8 border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10">
                  <Link href="/login">Sign In</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-10">
        <div className="container mx-auto px-4 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 font-bold text-primary">
            <img src="/logo.jpeg" alt="Alumni Network Logo" className="h-6 w-auto rounded border" /> Alumni Network
          </div>
          <p className="text-sm text-muted-foreground">© 2026 Alumni Network. Built for students and alumni.</p>
          <div className="flex gap-6 text-sm text-muted-foreground">
            <Link href="/login" className="hover:text-foreground transition-colors">Login</Link>
            <Link href="/register" className="hover:text-foreground transition-colors">Register</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
