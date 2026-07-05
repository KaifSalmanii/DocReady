"use client";
import React, { useState, useCallback } from "react";
import Link from "next/link";
import { useDropzone } from "react-dropzone";
import { useRouter } from "next/navigation";
import {
  Upload,
  Crop,
  Zap,
  FileText,
  Image as ImageIcon,
  CheckCircle2,
  ArrowRight,
  Star,
  Shield,
  Smartphone,
  Users,
  ChevronRight,
  Lock,
  Globe,
  Clock,
  Award,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

const tools = [
  {
    icon: Crop,
    title: "Passport Photo & Signature",
    titleHi: "पासपोर्ट फोटो",
    desc: "Fixed crop box with touch pan/zoom. Pre-set for PAN, Aadhaar, Passport & more.",
    href: "/photo-tool",
    gradient: "from-[#0A2540] to-[#1a4a7a]",
    accentColor: "bg-blue-100 text-blue-700",
    badge: "Most Used",
    badgeColor: "bg-blue-600",
  },
  {
    icon: Zap,
    title: "Smart Compressor",
    titleHi: "स्मार्ट कंप्रेसर",
    desc: "Auto binary-search compression to meet exact size limits (e.g. under 50KB).",
    href: "/compressor",
    gradient: "from-[#FF9933] to-[#e8872d]",
    accentColor: "bg-orange-100 text-orange-700",
    badge: "Auto-Loop",
    badgeColor: "bg-orange-500",
  },
  {
    icon: FileText,
    title: "Government Templates",
    titleHi: "सरकारी टेम्पलेट",
    desc: "RTI, Affidavit, Complaint Letter — ready to fill and download as formatted PDF.",
    href: "/templates",
    gradient: "from-green-700 to-green-900",
    accentColor: "bg-green-100 text-green-700",
    badge: "Free",
    badgeColor: "bg-green-600",
  },
  {
    icon: ImageIcon,
    title: "Image to PDF & Validator",
    titleHi: "इमेज टू PDF",
    desc: "Merge JPEGs into A4 PDF. Auto-validates resolution, size & format for gov specs.",
    href: "/tools",
    gradient: "from-purple-700 to-purple-900",
    accentColor: "bg-purple-100 text-purple-700",
    badge: "New",
    badgeColor: "bg-purple-600",
  },
];

const stats = [
  { value: "10,000+", label: "Citizens Helped", labelHi: "नागरिक", icon: Users },
  { value: "50+", label: "Portal Formats", labelHi: "पोर्टल", icon: Globe },
  { value: "100%", label: "Private & Local", labelHi: "प्राइवेट", icon: Lock },
  { value: "< 3s", label: "Processing Time", labelHi: "प्रोसेसिंग", icon: Clock },
];

const portals = [
  { name: "RTI Online", emoji: "📋" },
  { name: "UIDAI (Aadhaar)", emoji: "🪪" },
  { name: "NSDL (PAN)", emoji: "💳" },
  { name: "DigiLocker", emoji: "📁" },
  { name: "Passport Seva", emoji: "✈️" },
  { name: "Income Tax", emoji: "📊" },
  { name: "State Portals", emoji: "🏛️" },
  { name: "EPFO", emoji: "🏦" },
];

const testimonials = [
  {
    text: "Finally got my passport photo right! The fixed crop box is exactly what I needed.",
    textHi: "पासपोर्ट फोटो पहली बार सही आई!",
    name: "Rahul M.",
    location: "Delhi",
  },
  {
    text: "Compressed my RTI PDF from 2MB to under 200KB in seconds. Brilliant tool!",
    textHi: "RTI PDF 2MB से 200KB में सेकंड में!",
    name: "Priya S.",
    location: "Mumbai",
  },
  {
    text: "The affidavit template saved me hours. Downloaded, filled, and submitted same day.",
    textHi: "शपथ पत्र टेम्पलेट ने घंटों बचाए।",
    name: "Amit K.",
    location: "Bengaluru",
  },
];

export default function HomePage() {
  const router = useRouter();

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0) return;
      const file = acceptedFiles[0];
      toast.success(`File detected: ${file.name}`);
      if (file.type === "application/pdf") {
        router.push("/compressor");
      } else if (file.type.startsWith("image/")) {
        router.push("/photo-tool");
      } else {
        toast.error("Unsupported file type");
      }
    },
    [router]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/jpeg": [],
      "image/png": [],
      "image/webp": [],
      "application/pdf": [],
    },
    maxFiles: 1,
  });

  return (
    <div className="overflow-hidden">
      {/* ===== HERO ===== */}
      <section className="relative bg-[#0A2540] text-white overflow-hidden min-h-[90vh] flex flex-col justify-center">
        {/* Decorative background */}
        <div className="absolute inset-0 pointer-events-none select-none overflow-hidden">
          <div
            className="absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage:
                "radial-gradient(circle, #FF9933 1px, transparent 1px)",
              backgroundSize: "44px 44px",
            }}
          />
          <div className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full bg-[#FF9933]/10 blur-3xl" />
          <div className="absolute bottom-0 -left-32 w-96 h-96 rounded-full bg-blue-500/10 blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-white/[0.015]" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20 sm:py-28 w-full">
          <div className="flex flex-col items-center text-center max-w-4xl mx-auto">
            {/* Top badge */}
            <div className="inline-flex items-center gap-2 bg-[#FF9933]/15 border border-[#FF9933]/25 rounded-full px-4 py-2 text-sm text-[#FF9933] font-semibold mb-8 animate-fade-in">
              <Star className="h-3.5 w-3.5 fill-current" />
              Trusted by 10,000+ Indian Citizens • 100% Free & Private
            </div>

            {/* Main headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-[64px] font-black leading-[1.1] mb-6 animate-slide-up">
              Government Documents
              <span className="block mt-1" style={{ color: "#FF9933" }}>
                Ready in Seconds.
              </span>
            </h1>

            <p className="text-slate-300 text-lg sm:text-xl leading-relaxed mb-2 max-w-2xl">
              Format, Optimize & Compress PDFs, Photos, and Signatures
              for RTI, PAN, Aadhaar, and State Portals.
            </p>
            <p className="text-slate-500 text-sm mb-10">
              आरटीआई, पैन, आधार और राज्य पोर्टल के लिए फ़ॉर्मेट करें।
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-14">
              <Link href="/photo-tool">
                <Button
                  size="xl"
                  variant="saffron"
                  className="w-full sm:w-auto shadow-2xl shadow-orange-500/20 animate-pulse-ring"
                >
                  Start Formatting
                  <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
              <Link href="/templates">
                <Button
                  size="xl"
                  className="w-full sm:w-auto border-2 border-white/20 bg-white/10 text-white hover:bg-white hover:text-[#0A2540] transition-all"
                >
                  Browse Templates
                  <FileText className="h-5 w-5" />
                </Button>
              </Link>
            </div>

            {/* Drop Zone */}
            <div
              {...getRootProps()}
              className={cn(
                "w-full max-w-2xl border-2 border-dashed rounded-3xl p-8 sm:p-12 cursor-pointer transition-all duration-300 group",
                isDragActive
                  ? "border-[#FF9933] bg-[#FF9933]/10 scale-[1.02]"
                  : "border-white/15 bg-white/[0.04] hover:border-[#FF9933]/40 hover:bg-white/[0.06]"
              )}
            >
              <input {...getInputProps()} />
              <div className="flex flex-col items-center gap-5">
                <div
                  className={cn(
                    "flex h-20 w-20 items-center justify-center rounded-2xl transition-all duration-300",
                    isDragActive
                      ? "bg-[#FF9933] scale-110"
                      : "bg-white/10 group-hover:bg-[#FF9933]/20 group-hover:scale-105"
                  )}
                >
                  <Upload
                    className={cn(
                      "h-10 w-10 transition-colors",
                      isDragActive ? "text-white" : "text-slate-400 group-hover:text-[#FF9933]"
                    )}
                  />
                </div>
                <div>
                  <p className="text-xl font-bold text-white mb-1">
                    {isDragActive ? "🎯 Release to process!" : "Drag & Drop your file here"}
                  </p>
                  <p className="text-slate-400 text-sm">
                    Or{" "}
                    <span className="text-[#FF9933] underline underline-offset-2">
                      click to browse
                    </span>{" "}
                    • Auto-routes to the right tool
                  </p>
                  <p className="text-slate-600 text-xs mt-1">
                    यहाँ फाइल खींचें – टूल अपने आप चुना जाएगा
                  </p>
                </div>
                <div className="flex gap-2 flex-wrap justify-center">
                  {["PDF", "JPG", "PNG", "WebP"].map((fmt) => (
                    <span
                      key={fmt}
                      className="px-3 py-1 bg-white/8 border border-white/10 rounded-full text-xs text-slate-400 font-mono tracking-wider"
                    >
                      .{fmt.toLowerCase()}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom wave */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 60" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
            <path d="M0 60L1440 60L1440 30C1200 0 960 60 720 30C480 0 240 60 0 30L0 60Z" fill="#f8fafc" />
          </svg>
        </div>
      </section>

      {/* ===== STATS ===== */}
      <section className="bg-slate-50 py-10">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="bg-white rounded-2xl border border-slate-200 p-5 text-center shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex justify-center mb-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FF9933]/10">
                    <stat.icon className="h-5 w-5 text-[#FF9933]" />
                  </div>
                </div>
                <div className="text-2xl sm:text-3xl font-black text-[#0A2540]">{stat.value}</div>
                <div className="text-xs font-semibold text-slate-600 mt-0.5">{stat.label}</div>
                <div className="text-[10px] text-slate-400">{stat.labelHi}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== TOOLS GRID ===== */}
      <section className="py-16 sm:py-20 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <Badge variant="saffron" className="mb-3 text-sm px-4 py-1.5">
              Complete Toolkit
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-black text-[#0A2540] mb-3">
              All Tools, Zero Signup
            </h2>
            <p className="text-slate-500 max-w-xl mx-auto text-sm sm:text-base">
              Professional-grade tools built specifically for Indian government document requirements.
              <span className="block mt-1 text-slate-400 text-sm">
                भारतीय सरकारी दस्तावेज़ों के लिए बनाए गए टूल।
              </span>
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {tools.map((tool) => (
              <Link key={tool.title} href={tool.href} className="group block">
                <div className="relative h-full bg-white rounded-3xl border border-slate-200 overflow-hidden hover:shadow-2xl hover:-translate-y-1 transition-all duration-300">
                  {/* Card top gradient strip */}
                  <div className={`h-2 w-full bg-gradient-to-r ${tool.gradient}`} />

                  <div className="p-6 sm:p-7">
                    <div className="flex items-start justify-between mb-4">
                      <div
                        className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${tool.gradient} group-hover:scale-110 transition-transform duration-300`}
                      >
                        <tool.icon className="h-7 w-7 text-white" />
                      </div>
                      <span
                        className={`px-2.5 py-1 rounded-full text-[11px] font-bold text-white ${tool.badgeColor}`}
                      >
                        {tool.badge}
                      </span>
                    </div>

                    <h3 className="text-lg font-black text-[#0A2540] mb-0.5">{tool.title}</h3>
                    <p className="text-xs text-slate-400 mb-3 font-medium">{tool.titleHi}</p>
                    <p className="text-sm text-slate-500 leading-relaxed mb-5">{tool.desc}</p>

                    <div className="flex items-center text-sm font-bold text-[#0A2540] group-hover:text-[#FF9933] transition-colors">
                      Open Tool
                      <ChevronRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ===== HOW IT WORKS ===== */}
      <section className="py-16 bg-[#0A2540] text-white">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <Badge variant="saffron" className="mb-3">Simple Process</Badge>
            <h2 className="text-3xl sm:text-4xl font-black mb-3">How It Works</h2>
            <p className="text-slate-400 text-sm">यह कैसे काम करता है</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              {
                step: "01",
                icon: Upload,
                title: "Upload Your File",
                titleHi: "फ़ाइल अपलोड करें",
                desc: "Drag & drop or click to upload. Supports PDF, JPG, PNG, WebP.",
              },
              {
                step: "02",
                icon: Zap,
                title: "Choose & Process",
                titleHi: "चुनें और प्रोसेस करें",
                desc: "Select crop preset, set target size, or pick a template. We handle the rest.",
              },
              {
                step: "03",
                icon: CheckCircle2,
                title: "Download & Use",
                titleHi: "डाउनलोड करें",
                desc: "Instantly download your optimized file. Ready for any government portal.",
              },
            ].map((item) => (
              <div key={item.step} className="relative">
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6 h-full hover:bg-white/8 transition-colors">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="text-5xl font-black text-[#FF9933]/20 leading-none">{item.step}</div>
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FF9933]/10">
                      <item.icon className="h-5 w-5 text-[#FF9933]" />
                    </div>
                  </div>
                  <h3 className="font-bold text-white mb-0.5">{item.title}</h3>
                  <p className="text-xs text-slate-400 mb-2">{item.titleHi}</p>
                  <p className="text-sm text-slate-300 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== PORTAL COMPAT ===== */}
      <section className="py-16 bg-slate-50">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-black text-[#0A2540] mb-2">
              Compatible with All Major Portals
            </h2>
            <p className="text-slate-400 text-sm">सभी प्रमुख सरकारी पोर्टल के साथ संगत</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {portals.map((p) => (
              <div
                key={p.name}
                className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-3 hover:border-[#FF9933]/40 hover:shadow-sm transition-all"
              >
                <span className="text-2xl">{p.emoji}</span>
                <span className="text-sm font-semibold text-[#0A2540] leading-tight">{p.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== TESTIMONIALS ===== */}
      <section className="py-16 bg-white">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <Badge className="mb-3">Reviews</Badge>
            <h2 className="text-2xl sm:text-3xl font-black text-[#0A2540] mb-2">
              What Citizens Say
            </h2>
            <p className="text-slate-400 text-sm">नागरिकों के अनुभव</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {testimonials.map((t) => (
              <div
                key={t.name}
                className="bg-slate-50 rounded-2xl border border-slate-200 p-5 hover:shadow-md transition-shadow"
              >
                <div className="flex gap-0.5 mb-3">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star key={i} className="h-4 w-4 text-[#FF9933] fill-current" />
                  ))}
                </div>
                <p className="text-sm text-slate-600 leading-relaxed mb-1">&ldquo;{t.text}&rdquo;</p>
                <p className="text-xs text-slate-400 italic mb-3">{t.textHi}</p>
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-[#0A2540] flex items-center justify-center text-white text-xs font-bold">
                    {t.name[0]}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-[#0A2540]">{t.name}</p>
                    <p className="text-xs text-slate-400">{t.location}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== PWA CTA ===== */}
      <section className="py-12 bg-slate-50">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div
            className="relative rounded-3xl overflow-hidden p-8 sm:p-12 text-center text-white"
            style={{ background: "linear-gradient(135deg, #0A2540 0%, #1a3a5c 50%, #0A2540 100%)" }}
          >
            <div
              className="absolute inset-0 opacity-5 pointer-events-none"
              style={{
                backgroundImage:
                  "radial-gradient(circle, #FF9933 1px, transparent 1px)",
                backgroundSize: "32px 32px",
              }}
            />
            {/* Tricolor accent */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#FF9933] via-white to-[#138808]" />

            <div className="relative">
              <div className="flex justify-center mb-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#FF9933]/20 border border-[#FF9933]/30">
                  <Smartphone className="h-8 w-8 text-[#FF9933]" />
                </div>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black mb-2">
                Install DocReady as an App
              </h2>
              <p className="text-slate-300 mb-1">
                Works offline • No app store • Instant install
              </p>
              <p className="text-slate-500 text-sm mb-7">
                ऑफलाइन भी काम करता है • ऐप स्टोर की ज़रूरत नहीं
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <div className="flex items-center gap-3 bg-white/10 border border-white/20 rounded-xl px-5 py-3 text-sm">
                  <span className="text-xl">🤖</span>
                  <div className="text-left">
                    <p className="font-bold text-xs text-slate-300">Android</p>
                    <p className="text-slate-400 text-xs">Menu → Add to Home Screen</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 bg-white/10 border border-white/20 rounded-xl px-5 py-3 text-sm">
                  <span className="text-xl">🍎</span>
                  <div className="text-left">
                    <p className="font-bold text-xs text-slate-300">iPhone</p>
                    <p className="text-slate-400 text-xs">Share → Add to Home Screen</p>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex items-center justify-center gap-2">
                <Award className="h-4 w-4 text-[#FF9933]" />
                <span className="text-slate-400 text-xs">
                  Progressive Web App (PWA) certified
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
