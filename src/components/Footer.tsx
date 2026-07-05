import React from "react";
import Link from "next/link";
import { FileText, Share2, Shield, Smartphone } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-[#0A2540] text-white mt-auto">
      {/* Tricolor bar */}
      <div className="h-1 w-full bg-gradient-to-r from-[#FF9933] via-white to-[#138808]" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#FF9933]">
                <FileText className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-black">
                Doc<span className="text-[#FF9933]">Ready</span>
              </span>
            </div>
            <p className="text-slate-300 text-sm leading-relaxed mb-2">
              Government Documents Ready in Seconds.
            </p>
            <p className="text-slate-400 text-xs leading-relaxed mb-4">
              सरकारी दस्तावेज़ – फ़ॉर्मेट, ऑप्टिमाइज़ और कम्प्रेस करें।
            </p>
            {/* Privacy badge */}
            <div className="inline-flex items-center gap-2 bg-white/10 rounded-lg px-3 py-2 text-xs text-slate-300">
              <Shield className="h-3.5 w-3.5 text-green-400 flex-shrink-0" />
              <span>100% Local Processing • No Data Uploaded</span>
            </div>
          </div>

          {/* Tools */}
          <div>
            <h4 className="text-sm font-bold text-[#FF9933] uppercase tracking-wider mb-4">Tools</h4>
            <ul className="space-y-2">
              {[
                { href: "/photo-tool", label: "Passport Photo Cropper" },
                { href: "/compressor", label: "Smart Compressor" },
                { href: "/templates", label: "Gov Templates" },
                { href: "/tools", label: "Image to PDF" },
                { href: "/tools", label: "Format Validator" },
              ].map((item) => (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    className="text-slate-400 hover:text-white text-sm transition-colors"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Developer */}
          <div>
            <h4 className="text-sm font-bold text-[#FF9933] uppercase tracking-wider mb-4">Developer</h4>
            <div className="space-y-3">
              <p className="text-slate-300 text-sm font-semibold">Kaif Salmani</p>
              <a
                href="https://www.instagram.com/oyeeee_kaif"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-slate-400 hover:text-[#FF9933] text-sm transition-colors"
              >
                <Share2 className="h-4 w-4" />
                @oyeeee_kaif
              </a>
              <div className="flex items-center gap-2 text-slate-400 text-xs mt-3">
                <Smartphone className="h-3.5 w-3.5 text-green-400" />
                <span>PWA – Install on your phone!</span>
              </div>
            </div>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="mt-10 pt-6 border-t border-white/10">
          <p className="text-slate-400 text-xs text-center leading-relaxed">
            ⚠️ <strong className="text-slate-300">Disclaimer:</strong> This tool is for formatting and
            compression purposes only. All processing happens locally on your device. No files are
            uploaded to any server.
          </p>
          <p className="text-slate-500 text-xs text-center mt-3">
            © {new Date().getFullYear()} DocReady • Developed by{" "}
            <a
              href="https://www.instagram.com/oyeeee_kaif"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#FF9933] hover:underline"
            >
              KaifSalmani
            </a>{" "}
            | All rights reserved
          </p>
        </div>
      </div>
    </footer>
  );
}
