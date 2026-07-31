"use client";

import { useRef } from "react";
import Link from "next/link";
import { motion, useInView } from "framer-motion";
import {
  GraduationCap, Users, MessageSquare, Calendar,
  ArrowRight, Star, Shield, Zap, TrendingUp, Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import HeroParticles from "@/components/ui/hero-particles";

interface Stats {
  totalAlumni: number;
  totalStudents: number;
  totalEvents: number;
  activeMentorships: number;
}

// ── Animation variants ────────────────────────────────────────────────────────
const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } },
};

const stagger = (delayChildren = 0.08) => ({
  hidden: {},
  show: { transition: { staggerChildren: delayChildren, delayChildren: 0.1 } },
});

const fadeIn = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.6, ease: "easeOut" } },
};

const slideRight = {
  hidden: { opacity: 0, x: -20 },
  show: { opacity: 1, x: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
};

// ── Animated section wrapper ──────────────────────────────────────────────────
function AnimatedSection({ children, className = "", delay = 0 }: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={inView ? "show" : "hidden"}
      variants={stagger(0.1)}
      className={className}
      style={{ transitionDelay: `${delay}s` }}
    >
      {children}
    </motion.div>
  );
}

// ── Feature cards ─────────────────────────────────────────────────────────────
const features = [
  {
    icon: Users,
    title: "Alumni Directory",
    desc: "Search and filter verified alumni by skill, industry, department, or batch year.",
    tag: "Directory",
  },
  {
    icon: MessageSquare,
    title: "Mentorship Chat",
    desc: "Real-time private messaging between mentors and mentees with persistent history.",
    tag: "Connect",
  },
  {
    icon: Calendar,
    title: "Events & Meetups",
    desc: "Register for alumni events, career fairs, and tech talks organized by admins.",
    tag: "Events",
  },
  {
    icon: GraduationCap,
    title: "Community Hub",
    desc: "Admin broadcasts, alumni discussions, announcements, and college updates.",
    tag: "Community",
  },
];

const steps = [
  { step: "I", title: "Create Your Account", desc: "Register as a student or alumni. Alumni accounts are individually verified by administrators." },
  { step: "II", title: "Find a Mentor", desc: "Browse the verified alumni directory filtered by industry, skill, or graduation year." },
  { step: "III", title: "Begin the Journey", desc: "Send a mentorship request, get accepted, and begin direct private conversations." },
];

// ── Main export ───────────────────────────────────────────────────────────────
export default function HomeClient({ stats }: { stats: Stats }) {
  const totalMembers = stats.totalAlumni + stats.totalStudents;
  const statsRef = useRef(null);
  const statsInView = useInView(statsRef, { once: true, margin: "-60px" });

  const statItems = [
    { value: stats.totalAlumni, label: "Verified Alumni", icon: Users },
    { value: stats.totalStudents, label: "Active Students", icon: GraduationCap },
    { value: stats.activeMentorships, label: "Mentorships Active", icon: TrendingUp },
    { value: stats.totalEvents, label: "Events Hosted", icon: Calendar },
  ];

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">

      {/* ── Header ── */}
      <motion.header
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="sticky top-0 z-50 border-b border-[#E31E24]/8 glass-dark"
      >
        <div className="container mx-auto flex h-16 items-center justify-between px-4 lg:px-8">
          <div className="flex items-center gap-3">
            <img
              src="/logo.jpeg"
              alt="Alumni Network"
              className="h-8 w-auto rounded border border-[#E31E24]/20"
            />
            <span className="font-display font-semibold text-lg tracking-wide text-[#1A1A1A]">
              Alumni Network
            </span>
          </div>
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-[#666666]">
            {["Features", "How it works", "Community"].map((item) => (
              <a
                key={item}
                href={`#${item.toLowerCase().replace(/ /g, "-")}`}
                className="hover:text-[#E31E24] transition-colors duration-200"
              >
                {item}
              </a>
            ))}
          </nav>
          <div className="flex gap-2">
            <Button variant="ghost" asChild className="text-[#666666] hover:text-[#E31E24] hover:bg-[#E31E24]/5">
              <Link href="/login">Sign In</Link>
            </Button>
            <Button asChild className="bg-[#E31E24] hover:bg-[#E31E24]/90 text-[#FFFFFF] font-semibold shadow-lg shadow-[#E31E24]/20">
              <Link href="/register">
                Get Started <ArrowRight className="ml-1.5 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </motion.header>

      {/* ── Hero ── */}
      <section className="relative overflow-hidden" style={{ minHeight: "90vh", display: "flex", alignItems: "center" }}>
        {/* Particle canvas */}
        <div className="absolute inset-0 z-0">
          <HeroParticles />
        </div>

        {/* Atmospheric gradients */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          <div className="absolute top-[-5%] left-[30%] w-[45%] h-[55%] rounded-full bg-[#E31E24]/6 blur-[140px]" />
          <div className="absolute bottom-[-5%] right-[25%] w-[40%] h-[45%] rounded-full bg-[#F5F5F5]/4 blur-[120px]" />
        </div>

        {/* Decorative rule lines */}
        <div className="absolute left-0 top-0 h-full w-px bg-gradient-to-b from-transparent via-[#E31E24]/10 to-transparent hidden lg:block" />
        <div className="absolute right-0 top-0 h-full w-px bg-gradient-to-b from-transparent via-[#E31E24]/10 to-transparent hidden lg:block" />

        <div className="container mx-auto px-4 lg:px-8 py-28 text-center relative z-10">
          <motion.div
            variants={stagger(0.12)}
            initial="hidden"
            animate="show"
          >
            {/* Pill badge */}
            <motion.div variants={fadeIn} className="mb-8">
              <span className="inline-flex items-center gap-2 rounded-full border border-[#E31E24]/20 bg-[#E31E24]/8 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-[#E31E24]">
                <Sparkles className="h-3 w-3" />
                {totalMembers > 0 ? `${totalMembers} members and growing` : "Join our community"}
              </span>
            </motion.div>

            {/* Headline */}
            <motion.h1
              variants={fadeUp}
              className="font-display text-5xl sm:text-6xl lg:text-[5.5rem] font-bold leading-[1.05] tracking-tight mb-6 text-[#1A1A1A]"
            >
              Where graduates{" "}
              <em className="not-italic gradient-gold">mentor</em>
              <br />
              the next generation.
            </motion.h1>

            <motion.p
              variants={fadeUp}
              className="mx-auto max-w-xl text-base sm:text-lg text-[#666666] leading-relaxed mb-10 font-light"
            >
              A private alumni platform built for meaningful mentorship — connect with verified graduates, attend curated events, and build a career worth having.
            </motion.p>

            {/* CTA buttons */}
            <motion.div variants={fadeUp} className="flex flex-col sm:flex-row justify-center gap-3">
              <Button
                size="lg"
                asChild
                className="h-12 px-9 text-sm font-semibold tracking-wide bg-[#E31E24] hover:bg-[#C41A1F] text-[#FFFFFF] shadow-xl shadow-[#E31E24]/25 transition-all duration-300"
              >
                <Link href="/register">
                  Request Access <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                asChild
                className="h-12 px-9 text-sm font-medium border-[#E31E24]/20 text-[#E31E24] hover:bg-[#E31E24]/6 hover:border-[#E31E24]/35 transition-all duration-300"
              >
                <Link href="/login">Sign In to Platform</Link>
              </Button>
            </motion.div>

            {/* Demo credentials */}
            <motion.div variants={fadeIn} className="mt-10 flex flex-wrap justify-center gap-2.5 text-[11px] text-[#666666]">
              <span className="flex items-center gap-1.5 bg-white/[0.03] px-3 py-1.5 rounded-full border border-white/[0.06]">
                <Shield className="h-3 w-3 text-[#E31E24]/70" />
                Admin: admin@alumninetwork.com / Admin@123
              </span>
              <span className="flex items-center gap-1.5 bg-[#E31E24]/5 px-3 py-1.5 rounded-full border border-[#E31E24]/12">
                <Star className="h-3 w-3 text-[#E31E24]/80" />
                Alumni: vikram.singh@google.com / Alumni@123
              </span>
              <span className="flex items-center gap-1.5 bg-white/[0.02] px-3 py-1.5 rounded-full border border-white/[0.05]">
                <Zap className="h-3 w-3 text-[#666666]/50" />
                Student: arjun.sharma@chitkara.edu.in / Student@123
              </span>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ── Stats ── */}
      <section id="community" className="relative border-y border-[#E31E24]/8">
        <div className="absolute inset-0 bg-gradient-to-r from-[#E31E24]/3 via-transparent to-[#E31E24]/3 pointer-events-none" />
        <div ref={statsRef} className="container mx-auto px-4 lg:px-8 py-14 relative z-10">
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
            {statItems.map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 20 }}
                animate={statsInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
                className="flex flex-col items-center text-center"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#E31E24]/15 bg-[#E31E24]/5 mb-3">
                  <s.icon className="h-5 w-5 text-[#E31E24]" />
                </div>
                <div className="font-display text-3xl font-bold text-[#1A1A1A] mb-0.5 tabular-nums">{s.value}</div>
                <div className="text-xs text-[#666666] tracking-wide uppercase font-medium">{s.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="py-28">
        <div className="container mx-auto px-4 lg:px-8">
          <AnimatedSection className="text-center mb-16">
            <motion.div variants={fadeIn}>
              <span className="inline-block text-xs font-semibold tracking-widest uppercase text-[#E31E24] mb-4">Platform</span>
            </motion.div>
            <motion.h2 variants={fadeUp} className="font-display text-4xl sm:text-5xl font-bold text-[#1A1A1A] mb-4">
              Everything in one place
            </motion.h2>
            <motion.p variants={fadeUp} className="text-[#666666] max-w-md mx-auto text-sm leading-relaxed">
              A purpose-built platform for meaningful alumni–student connections.
            </motion.p>
          </AnimatedSection>

          <AnimatedSection className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                variants={fadeUp}
                whileHover={{ y: -6, transition: { duration: 0.25, ease: "easeOut" } }}
                className="group relative rounded-2xl border border-[#E31E24]/10 bg-[#F5F5F5] p-6 overflow-hidden cursor-default"
              >
                {/* Hover glow */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br from-[#E31E24]/5 to-transparent rounded-2xl" />
                <div className="absolute top-0 right-0 text-[10px] font-semibold tracking-widest uppercase text-[#E31E24]/40 p-3">{f.tag}</div>

                <div className="relative z-10">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#E31E24]/15 bg-[#E31E24]/8 mb-5">
                    <f.icon className="h-5 w-5 text-[#E31E24]" />
                  </div>
                  <h3 className="font-display text-lg font-semibold text-[#1A1A1A] mb-2">{f.title}</h3>
                  <p className="text-sm text-[#666666] leading-relaxed">{f.desc}</p>
                </div>
              </motion.div>
            ))}
          </AnimatedSection>
        </div>
      </section>

      {/* ── Divider ── */}
      <div className="divider-gold mx-auto max-w-2xl" />

      {/* ── How it works ── */}
      <section id="how-it-works" className="py-28">
        <div className="container mx-auto px-4 lg:px-8">
          <AnimatedSection className="text-center mb-16">
            <motion.div variants={fadeIn}>
              <span className="inline-block text-xs font-semibold tracking-widest uppercase text-[#E31E24] mb-4">Process</span>
            </motion.div>
            <motion.h2 variants={fadeUp} className="font-display text-4xl sm:text-5xl font-bold text-[#1A1A1A] mb-4">
              Simple by design
            </motion.h2>
          </AnimatedSection>

          <div className="relative max-w-4xl mx-auto">
            {/* Connecting line */}
            <div className="absolute top-8 left-[16.6%] right-[16.6%] h-px bg-gradient-to-r from-transparent via-[#E31E24]/25 to-transparent hidden sm:block" />

            <AnimatedSection className="grid gap-10 sm:grid-cols-3">
              {steps.map((s, i) => (
                <motion.div key={s.step} variants={fadeUp} className="relative text-center">
                  <div className="flex items-center justify-center w-16 h-16 mx-auto mb-5 rounded-full border border-[#E31E24]/25 bg-[#F5F5F5] relative z-10">
                    <span className="font-display text-lg font-bold text-[#E31E24]">{s.step}</span>
                  </div>
                  <h3 className="font-display text-xl font-semibold text-[#1A1A1A] mb-2">{s.title}</h3>
                  <p className="text-sm text-[#666666] leading-relaxed">{s.desc}</p>
                </motion.div>
              ))}
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* ── CTA Banner ── */}
      <section className="py-24">
        <div className="container mx-auto px-4 lg:px-8">
          <AnimatedSection>
            <motion.div
              variants={fadeIn}
              className="relative rounded-3xl overflow-hidden border border-[#E31E24]/12 bg-[#F5F5F5] p-14 text-center"
            >
              {/* Corner accents */}
              <div className="absolute top-0 left-0 w-32 h-32 border-t border-l border-[#E31E24]/20 rounded-tl-3xl" />
              <div className="absolute bottom-0 right-0 w-32 h-32 border-b border-r border-[#E31E24]/20 rounded-br-3xl" />

              {/* Glow */}
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[60%] h-[1px] bg-gradient-to-r from-transparent via-[#E31E24]/40 to-transparent" />
              </div>

              <div className="relative z-10">
                <motion.div variants={fadeIn}>
                  <span className="inline-block text-xs font-semibold tracking-widest uppercase text-[#E31E24] mb-5">Get started today</span>
                </motion.div>
                <motion.h2 variants={fadeUp} className="font-display text-4xl sm:text-5xl font-bold text-[#1A1A1A] mb-4">
                  Your network awaits.
                </motion.h2>
                <motion.p variants={fadeUp} className="text-[#666666] mb-8 max-w-md mx-auto text-sm leading-relaxed">
                  Join the platform built for career-defining conversations between students and the alumni who've been there.
                </motion.p>
                <motion.div variants={fadeUp} className="flex flex-col sm:flex-row justify-center gap-3">
                  <Button
                    size="lg"
                    asChild
                    className="h-12 px-9 text-sm font-semibold tracking-wide bg-[#E31E24] hover:bg-[#C41A1F] text-[#FFFFFF] shadow-xl shadow-[#E31E24]/20"
                  >
                    <Link href="/register">
                      Create Account <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                  <Button
                    size="lg"
                    variant="ghost"
                    asChild
                    className="h-12 px-9 text-sm text-[#666666] hover:text-[#E31E24] hover:bg-[#E31E24]/5"
                  >
                    <Link href="/login">Sign In</Link>
                  </Button>
                </motion.div>
              </div>
            </motion.div>
          </AnimatedSection>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-[#E31E24]/8 py-10">
        <div className="container mx-auto px-4 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <img src="/logo.jpeg" alt="Alumni Network" className="h-6 w-auto rounded border border-[#E31E24]/15" />
            <span className="font-display font-semibold text-[#1A1A1A] text-sm tracking-wide">Alumni Network</span>
          </div>
          <p className="text-xs text-[#666666]">© 2026 Alumni Network. A platform for students and graduates.</p>
          <div className="flex gap-6 text-xs text-[#666666]">
            <Link href="/login" className="hover:text-[#E31E24] transition-colors">Login</Link>
            <Link href="/register" className="hover:text-[#E31E24] transition-colors">Register</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
