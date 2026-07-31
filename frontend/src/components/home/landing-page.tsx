"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Share2, Mic, GraduationCap, Heart, Menu, X } from "lucide-react";

// ── Config ───────────────────────────────────────────────────────────────────
const navItems = [
  { label: "Home", target: "home" },
  { label: "Our Story", target: "story" },
  { label: "Community", target: "network" },
  { label: "Spotlight", target: "spotlight" },
  { label: "Events", target: "testimonials" },
];

const testimonials = [
  "This network keeps me connected wherever I am.",
  "A beautiful way to relive memories and grow.",
  "Mentorship here changed my journey completely.",
];

const features = [
  { icon: Share2, t: "Share Your Journey", c: "bg-red-50 text-[#E31E24]" },
  { icon: Mic, t: "Host Sessions", c: "bg-yellow-100 text-[#F5A623]" },
  { icon: GraduationCap, t: "Mentor & Grow", c: "bg-green-100 text-green-600" },
  { icon: Heart, t: "Revive the Bond", c: "bg-purple-100 text-purple-600" },
];

function scrollToSection(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
}

// ── Navbar ───────────────────────────────────────────────────────────────────
function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav
      className={`fixed w-full z-50 px-6 md:px-10 py-4 md:py-5 flex justify-between items-center transition-all duration-300 ${
        scrolled ? "bg-[#1A1A1A]/90 backdrop-blur-md shadow-lg" : "bg-transparent"
      }`}
    >
      <img
        src="/logo.jpeg"
        alt="Alumni Network logo"
        className="h-10 w-auto rounded cursor-pointer hover:scale-105 transition border border-[#E31E24]/30"
        onClick={() => scrollToSection("home")}
      />

      <div className="hidden md:flex items-center gap-8 text-white text-sm tracking-wide">
        {navItems.map((item, i) => (
          <button
            key={item.label}
            onClick={() => scrollToSection(item.target)}
            className={`group relative ${i === 0 ? "text-[#F5A623]" : "hover:text-[#F5A623] transition-colors"}`}
          >
            {item.label}
            <span className="absolute left-0 -bottom-2 w-0 h-[2px] bg-[#F5A623] transition-all duration-300 group-hover:w-full" />
          </button>
        ))}

        <button
          onClick={() => scrollToSection("cta")}
          className="bg-[#E31E24] px-6 py-2 rounded-lg hover:bg-[#C41A1F] transition shadow-lg shadow-[#E31E24]/25"
        >
          Reconnect →
        </button>
      </div>

      {/* Mobile toggle */}
      <button
        className="md:hidden text-white p-1"
        onClick={() => setMobileOpen((open) => !open)}
        aria-label="Toggle menu"
      >
        {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </button>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="absolute top-full left-0 right-0 bg-[#1A1A1A]/95 backdrop-blur-md border-t border-white/10 md:hidden flex flex-col items-center gap-5 py-6 text-white text-sm tracking-wide">
          {navItems.map((item, i) => (
            <button
              key={item.label}
              onClick={() => {
                scrollToSection(item.target);
                setMobileOpen(false);
              }}
              className={`${i === 0 ? "text-[#F5A623]" : ""}`}
            >
              {item.label}
            </button>
          ))}
          <button
            onClick={() => {
              scrollToSection("cta");
              setMobileOpen(false);
            }}
            className="bg-[#E31E24] px-6 py-2 rounded-lg hover:bg-[#C41A1F] transition"
          >
            Reconnect →
          </button>
        </div>
      )}
    </nav>
  );
}

// ── Testimonial carousel (isolated so only it re-renders on the 4s tick) ─────
function TestimonialCarousel() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % testimonials.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="max-w-3xl mx-auto relative">
      <div className="bg-white p-10 md:p-12 rounded-3xl shadow-lg relative">
        <div className="absolute top-6 left-6 text-[80px] text-[#E31E24]/10 font-serif leading-none">“</div>

        <p className="text-xl md:text-3xl text-gray-700 leading-relaxed mb-10 min-h-16 md:min-h-24 flex items-center justify-center">
          {testimonials[index]}
        </p>

        <div className="absolute bottom-6 right-6 text-[80px] text-[#E31E24]/10 font-serif leading-none">”</div>

        <p className="font-semibold text-[#1A1A1A]">Alumni Name</p>
        <p className="text-sm text-[#666666]">Batch</p>
      </div>

      {/* Arrows */}
      <div className="flex justify-between mt-6">
        <button
          onClick={() => setIndex((index - 1 + testimonials.length) % testimonials.length)}
          className="bg-white px-4 py-2 rounded-full shadow hover:scale-110 hover:shadow-[#E31E24]/20 transition text-[#1A1A1A]"
          aria-label="Previous testimonial"
        >
          ←
        </button>
        <button
          onClick={() => setIndex((index + 1) % testimonials.length)}
          className="bg-white px-4 py-2 rounded-full shadow hover:scale-110 hover:shadow-[#E31E24]/20 transition text-[#1A1A1A]"
          aria-label="Next testimonial"
        >
          →
        </button>
      </div>

      {/* Dots */}
      <div className="flex justify-center gap-2 mt-4">
        {testimonials.map((_, i) => (
          <button
            key={i}
            onClick={() => setIndex(i)}
            className={`h-2 w-2 rounded-full transition-colors ${i === index ? "bg-[#E31E24]" : "bg-gray-300 hover:bg-gray-400"}`}
            aria-label={`Go to testimonial ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────
export default function LandingPage() {
  return (
    <div className="font-sans text-gray-800">

      <Navbar />

      {/* HERO */}
      <section
        id="home"
        className="h-screen relative flex items-center justify-center text-center text-white overflow-hidden bg-[#1A1A1A]"
      >
        {/* Gradient + glow backdrop (no image asset needed) */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#1A1A1A]/80 via-[#C41A1F]/30 to-[#1A1A1A]" />
        <div className="absolute top-[-10%] left-[15%] w-[55%] h-[60%] rounded-full bg-[#E31E24]/25 blur-[140px]" />
        <div className="absolute bottom-[-10%] right-[10%] w-[45%] h-[55%] rounded-full bg-[#F5A623]/15 blur-[130px]" />
        <div className="absolute inset-0 noise" />

        <div className="relative z-10 max-w-3xl px-6">
          <p className="text-xs tracking-[0.3em] text-[#F5A623] mb-3 font-semibold">
            CHITKARA HAPPINESS CENTER
          </p>

          <h1 className="text-5xl md:text-7xl font-extrabold leading-tight mb-6">
            ALUMNI{" "}
            <span className="gradient-red">NETWORK</span>
          </h1>

          <p className="text-lg text-gray-300 mb-8 leading-relaxed">
            Connected by memories,
            <br />
            growing through journeys.
          </p>

          <button
            onClick={() => scrollToSection("cta")}
            className="bg-[#E31E24] px-7 py-3 rounded-lg text-lg hover:bg-[#C41A1F] hover:scale-105 transition shadow-xl shadow-[#E31E24]/30"
          >
            Reconnect →
          </button>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center text-white opacity-80">
          <div className="w-6 h-10 border-2 border-white/70 rounded-full flex justify-center p-1">
            <div className="w-1 h-2 bg-[#F5A623] rounded-full animate-bounce"></div>
          </div>
          <p className="text-xs mt-2 tracking-widest text-gray-400">SCROLL</p>
        </div>
      </section>

      {/* STORY */}
      <section id="story" className="py-24 md:py-28 px-6 md:px-10 bg-white">
        <div className="grid md:grid-cols-2 gap-14 md:gap-16 max-w-6xl mx-auto items-center">
          <div>
            <p className="text-[#F5A623] text-sm font-semibold mb-3 tracking-wide uppercase">Our Story</p>
            <h2 className="text-4xl md:text-5xl font-bold leading-tight mb-6 text-[#1A1A1A]">
              More Than a Place,
              <br />
              It&apos;s a Feeling.
            </h2>
            <p className="text-[#666666] leading-relaxed">
              The Happiness Center was never just a place—it was a feeling.
              A space where we learned, laughed, and supported each other.
            </p>

            <div className="mt-8 flex gap-3">
              <button
                onClick={() => scrollToSection("cta")}
                className="bg-[#1A1A1A] px-6 py-2.5 rounded-lg text-white text-sm font-medium hover:bg-[#E31E24] transition"
              >
                Join the Network
              </button>
              <button
                onClick={() => scrollToSection("testimonials")}
                className="border border-[#E31E24]/30 text-[#E31E24] px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-[#E31E24]/5 transition"
              >
                Hear Alumni Voices
              </button>
            </div>
          </div>

          {/* Decorative panel (replaces missing photo asset) */}
          <div className="relative rounded-2xl gradient-border p-10 md:p-12 shadow-lg">
            <div className="absolute -top-6 -left-2 text-[90px] text-[#E31E24]/10 font-serif leading-none select-none">“</div>
            <p className="text-lg md:text-xl text-[#1A1A1A] leading-relaxed font-medium">
              We believe every goodbye on campus is really a &quot;see you later&quot;
              — this network keeps that promise alive.
            </p>
            <div className="absolute -bottom-6 -right-2 text-[90px] text-[#E31E24]/10 font-serif leading-none select-none">”</div>
          </div>
        </div>
      </section>

      {/* NETWORK */}
      <section id="network" className="py-24 md:py-28 px-6 md:px-10 bg-[#F5F5F5] text-center">
        <p className="text-[#F5A623] text-sm font-semibold mb-3 tracking-wide uppercase">Stay Connected</p>
        <h2 className="text-4xl font-bold mb-14 md:mb-16 text-[#1A1A1A]">Your Network, Your Way</h2>

        <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-8 md:gap-10 max-w-6xl mx-auto">
          {features.map((x) => (
            <div
              key={x.t}
              className="bg-white p-8 rounded-2xl shadow-sm border border-[#E31E24]/10 hover:shadow-xl hover:shadow-[#E31E24]/10 hover:-translate-y-3 transition duration-300"
            >
              <div className={`h-14 w-14 ${x.c} rounded-full mx-auto mb-6 flex items-center justify-center`}>
                <x.icon className="h-6 w-6" />
              </div>

              <h3 className="font-semibold text-[#1A1A1A] mb-3">{x.t}</h3>

              <p className="text-sm text-[#666666]">
                Build meaningful connections beyond campus.
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* SPOTLIGHT */}
      <section id="spotlight" className="py-24 md:py-28 px-6 md:px-10 bg-white">
        <div className="grid md:grid-cols-2 gap-14 md:gap-16 max-w-6xl mx-auto items-center">
          <div className="relative">
            <div className="absolute -top-8 -left-4 text-[100px] text-[#E31E24]/10 font-serif leading-none select-none">“</div>

            <p className="text-2xl md:text-3xl text-gray-700 leading-relaxed mb-6">
              Happiness Center gave me the confidence to dream bigger.
            </p>

            <div className="absolute -bottom-10 right-0 text-[100px] text-[#E31E24]/10 font-serif leading-none select-none">”</div>

            <p className="font-semibold text-[#1A1A1A] mt-10">Muskaan Arora</p>
            <p className="text-sm text-[#666666]">Batch of 2022</p>
          </div>

          {/* Decorative profile panel (replaces missing photo asset) */}
          <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-[#1A1A1A] via-[#C41A1F] to-[#E31E24] p-10 md:p-12 text-white shadow-xl">
            <div className="absolute inset-0 noise" />
            <div className="relative z-10 flex flex-col items-center text-center gap-4">
              <div className="h-24 w-24 rounded-full bg-white/10 border-2 border-[#F5A623] flex items-center justify-center text-3xl font-bold">
                MA
              </div>
              <p className="text-[#F5A623] text-xs tracking-[0.25em] uppercase font-semibold">Alumni Spotlight</p>
              <p className="text-lg leading-relaxed text-white/90">
                From campus volunteer to product leader — the Happiness Center
                community cheered her on at every step.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section id="testimonials" className="py-24 md:py-28 px-6 md:px-10 bg-[#F5F5F5] text-center">
        <p className="text-[#F5A623] text-sm font-semibold mb-3 tracking-wide uppercase">Voices of Happiness</p>
        <h2 className="text-4xl font-bold mb-12 text-[#1A1A1A]">What Our Alumni Say</h2>

        <TestimonialCarousel />
      </section>

      {/* CTA */}
      <section
        id="cta"
        className="py-24 md:py-28 px-6 md:px-10 text-white text-center bg-gradient-to-r from-[#1A1A1A] to-[#C41A1F] relative overflow-hidden"
      >
        <div className="absolute inset-0 noise opacity-40"></div>
        <div className="absolute top-[-30%] left-1/2 -translate-x-1/2 w-[70%] h-[80%] rounded-full bg-[#E31E24]/30 blur-[130px]" />

        <div className="relative z-10 max-w-2xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Be Part of the Journey
          </h2>

          <p className="text-lg text-gray-300 mb-8 leading-relaxed">
            Stay connected with the Happiness Center, wherever life takes you.
          </p>

          <div className="flex flex-col sm:flex-row justify-center gap-3">
            <Link
              href="/register"
              className="bg-[#F5A623] text-[#1A1A1A] px-7 py-3 rounded-lg font-semibold hover:bg-[#FFB83D] hover:scale-105 transition shadow-xl shadow-black/20"
            >
              Reconnect →
            </Link>
            <Link
              href="/login"
              className="border border-white/30 px-7 py-3 rounded-lg font-medium hover:bg-white/10 transition"
            >
              Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-[#1A1A1A] py-10 px-6 md:px-10 text-white/70">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-5">
          <div className="flex items-center gap-2.5">
            <img src="/logo.jpeg" alt="Alumni Network logo" className="h-7 w-auto rounded border border-[#E31E24]/40" />
            <span className="font-semibold text-white text-sm tracking-wide">Alumni Network</span>
          </div>

          <div className="flex gap-6 text-sm">
            <button onClick={() => scrollToSection("home")} className="hover:text-[#F5A623] transition-colors">Home</button>
            <button onClick={() => scrollToSection("story")} className="hover:text-[#F5A623] transition-colors">Our Story</button>
            <Link href="/login" className="hover:text-[#F5A623] transition-colors">Sign In</Link>
            <Link href="/register" className="hover:text-[#F5A623] transition-colors">Register</Link>
          </div>

          <p className="text-xs text-white/40">© 2026 Alumni Network · Chitkara Happiness Center</p>
        </div>
      </footer>

    </div>
  );
}
