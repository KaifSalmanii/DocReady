"use client";
import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, FileText, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

const navLinks = [
  { href: "/", label: "Home", labelHi: "होम" },
  { href: "/photo-tool", label: "Photo & Sign", labelHi: "फोटो और हस्ताक्षर" },
  { href: "/compressor", label: "Compressor", labelHi: "कंप्रेसर" },
  { href: "/templates", label: "Templates", labelHi: "टेम्पलेट" },
  { href: "/tools", label: "Tools", labelHi: "टूल्स" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-[#0A2540]/10 bg-white/95 backdrop-blur-md shadow-sm">
      {/* Top accent bar */}
      <div className="h-1 w-full bg-gradient-to-r from-[#FF9933] via-white to-[#138808]" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#0A2540] group-hover:bg-[#FF9933] transition-colors">
              <FileText className="h-5 w-5 text-white" />
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-lg font-black text-[#0A2540] tracking-tight">
                Doc<span className="text-[#FF9933]">Ready</span>
              </span>
              <span className="text-[10px] text-slate-500 font-medium -mt-0.5">
                Gov Document Formatter
              </span>
            </div>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "relative px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                  pathname === link.href
                    ? "text-[#FF9933] bg-orange-50"
                    : "text-slate-600 hover:text-[#0A2540] hover:bg-slate-50"
                )}
              >
                {link.label}
                {pathname === link.href && (
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-[#FF9933] rounded-full" />
                )}
              </Link>
            ))}
          </nav>

          {/* CTA + Hamburger */}
          <div className="flex items-center gap-3">
            <Link
              href="/photo-tool"
              className="hidden sm:inline-flex items-center gap-1.5 bg-[#FF9933] text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-[#e8872d] transition-colors active:scale-95"
            >
              Start Now
            </Link>
            <button
              onClick={() => setOpen(!open)}
              className="md:hidden p-2 rounded-lg text-[#0A2540] hover:bg-slate-100"
              aria-label="Toggle menu"
            >
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden border-t border-slate-100 bg-white">
          <nav className="flex flex-col p-4 gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-colors",
                  pathname === link.href
                    ? "bg-[#0A2540] text-white"
                    : "text-slate-700 hover:bg-slate-50"
                )}
              >
                <span>{link.label}</span>
                <span className={cn("text-xs", pathname === link.href ? "text-[#FF9933]" : "text-slate-400")}>
                  {link.labelHi}
                </span>
              </Link>
            ))}
            <Link
              href="/photo-tool"
              onClick={() => setOpen(false)}
              className="mt-2 flex items-center justify-center gap-2 bg-[#FF9933] text-white font-semibold px-4 py-3 rounded-xl hover:bg-[#e8872d] transition-colors"
            >
              Start Formatting
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
