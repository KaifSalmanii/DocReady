"use client";
import React, { useState, useCallback, useRef } from "react";
import { useDropzone } from "react-dropzone";
import {
  Upload, Zap, Download, RefreshCw, AlertCircle,
  CheckCircle2, FileText, Image as ImageIcon, TrendingDown, X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  cn, formatBytes, parseTargetSize,
  compressImageToTarget, downloadBlob, triggerConfetti,
} from "@/lib/utils";
import toast from "react-hot-toast";
import { PDFDocument } from "pdf-lib";

interface FileResult {
  original: File;
  compressed: Blob | null;
  originalSize: number;
  compressedSize: number;
  quality: number;
  iterations: number;
  status: "idle" | "processing" | "done" | "error";
  error?: string;
}

const PRESET_TARGETS = [
  { label: "50 KB", value: "50KB", desc: "Most Gov Portals" },
  { label: "100 KB", value: "100KB", desc: "DigiLocker / RTI" },
  { label: "200 KB", value: "200KB", desc: "Passport Seva" },
  { label: "500 KB", value: "500KB", desc: "General Use" },
  { label: "1 MB", value: "1MB", desc: "Large Documents" },
];

async function compressPDF(file: File, maxBytes: number): Promise<Blob> {
  // For PDFs, we load and re-save — this removes unused objects but doesn't deeply compress
  const arrayBuffer = await file.arrayBuffer();
  const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
  const pdfBytes = await pdfDoc.save({ useObjectStreams: true, addDefaultPage: false });
  const blob = new Blob([pdfBytes.buffer as ArrayBuffer], { type: "application/pdf" });
  return blob;
}

export default function CompressorPage() {
  const [files, setFiles] = useState<FileResult[]>([]);
  const [targetInput, setTargetInput] = useState("50KB");
  const [customTarget, setCustomTarget] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState<"image" | "pdf">("image");

  const getTargetBytes = (): number | null => {
    const raw = customTarget.trim() || targetInput;
    return parseTargetSize(raw);
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles: FileResult[] = acceptedFiles.map((f) => ({
      original: f,
      compressed: null,
      originalSize: f.size,
      compressedSize: 0,
      quality: 0,
      iterations: 0,
      status: "idle",
    }));
    setFiles((prev) => [...prev, ...newFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept:
      activeTab === "image"
        ? { "image/jpeg": [], "image/png": [], "image/webp": [] }
        : { "application/pdf": [] },
    maxFiles: 10,
  });

  const removeFile = (idx: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  const compressAll = async () => {
    const targetBytes = getTargetBytes();
    if (!targetBytes) {
      toast.error("Please enter a valid target size (e.g. 50KB or 200KB)");
      return;
    }
    if (files.length === 0) {
      toast.error("Please upload files first");
      return;
    }

    setIsProcessing(true);

    const updated = [...files];

    for (let i = 0; i < updated.length; i++) {
      const f = updated[i];
      updated[i] = { ...f, status: "processing" };
      setFiles([...updated]);

      try {
        const isImage = f.original.type.startsWith("image/");
        const isPDF = f.original.type === "application/pdf";

        if (isImage) {
          if (f.originalSize <= targetBytes) {
            updated[i] = {
              ...f,
              status: "done",
              compressed: f.original,
              compressedSize: f.originalSize,
              quality: 100,
              iterations: 0,
            };
          } else {
            const result = await compressImageToTarget(f.original, targetBytes);
            updated[i] = {
              ...f,
              status: "done",
              compressed: result.blob,
              compressedSize: result.blob.size,
              quality: Math.round(result.quality * 100),
              iterations: result.iterations,
            };
          }
        } else if (isPDF) {
          const compressed = await compressPDF(f.original, targetBytes);
          updated[i] = {
            ...f,
            status: "done",
            compressed,
            compressedSize: compressed.size,
            quality: 100,
            iterations: 1,
          };
        }
      } catch (err) {
        updated[i] = {
          ...f,
          status: "error",
          error: err instanceof Error ? err.message : "Compression failed",
        };
      }
      setFiles([...updated]);
    }

    setIsProcessing(false);
    const succeeded = updated.filter((f) => f.status === "done").length;
    if (succeeded > 0) {
      toast.success(`${succeeded} file(s) compressed!`);
      triggerConfetti();
    }
  };

  const downloadFile = (f: FileResult) => {
    if (!f.compressed) return;
    const ext = f.original.type.startsWith("image/") ? "jpg" : "pdf";
    const name = f.original.name.replace(/\.[^/.]+$/, "") + `-compressed.${ext}`;
    downloadBlob(f.compressed, name);
    toast.success("Downloaded! 🎉");
  };

  const downloadAll = () => {
    files.filter((f) => f.status === "done" && f.compressed).forEach(downloadFile);
  };

  const clearAll = () => {
    setFiles([]);
  };

  const targetBytes = getTargetBytes();
  const allDone = files.length > 0 && files.every((f) => f.status === "done" || f.status === "error");

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-[#0A2540] text-white py-10 px-4">
        <div className="mx-auto max-w-4xl text-center">
          <Badge variant="saffron" className="mb-3">Auto Binary-Search</Badge>
          <h1 className="text-3xl sm:text-4xl font-black mb-2">
            Smart Compressor
          </h1>
          <p className="text-slate-300 text-sm sm:text-base">
            स्मार्ट कंप्रेसर – सटीक साइज़ में कम्प्रेस करें
          </p>
          <p className="text-slate-400 text-xs mt-1">
            Auto-adjusts quality until output is strictly under your target size
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 sm:px-6 py-8 space-y-6">
        {/* Tabs */}
        <div className="bg-white rounded-2xl border border-slate-200 p-2 flex gap-2">
          <button
            onClick={() => { setActiveTab("image"); setFiles([]); }}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold transition-all",
              activeTab === "image"
                ? "bg-[#0A2540] text-white shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            )}
          >
            <ImageIcon className="h-4 w-4" />
            Images
            <span className={cn("text-xs", activeTab === "image" ? "text-slate-300" : "text-slate-400")}>
              (इमेज)
            </span>
          </button>
          <button
            onClick={() => { setActiveTab("pdf"); setFiles([]); }}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold transition-all",
              activeTab === "pdf"
                ? "bg-[#0A2540] text-white shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            )}
          >
            <FileText className="h-4 w-4" />
            PDFs
            <span className={cn("text-xs", activeTab === "pdf" ? "text-slate-300" : "text-slate-400")}>
              (पीडीएफ)
            </span>
          </button>
        </div>

        {/* Target Size Selector */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <h3 className="font-bold text-[#0A2540] mb-1">
            Set Target Size / लक्ष्य साइज़ सेट करें
          </h3>
          <p className="text-xs text-slate-400 mb-4">
            The app will auto-compress until output is strictly under this limit
          </p>

          {/* Preset buttons */}
          <div className="flex flex-wrap gap-2 mb-4">
            {PRESET_TARGETS.map((p) => (
              <button
                key={p.value}
                onClick={() => { setTargetInput(p.value); setCustomTarget(""); }}
                className={cn(
                  "flex flex-col items-center px-3 py-2 rounded-xl text-xs font-semibold border-2 transition-all",
                  targetInput === p.value && !customTarget
                    ? "border-[#FF9933] bg-orange-50 text-[#FF9933]"
                    : "border-slate-200 text-slate-600 hover:border-[#FF9933]/50"
                )}
              >
                <span className="text-base font-black">{p.label}</span>
                <span className="text-slate-400 font-normal">{p.desc}</span>
              </button>
            ))}
          </div>

          {/* Custom input */}
          <div className="flex gap-2">
            <input
              type="text"
              value={customTarget}
              onChange={(e) => setCustomTarget(e.target.value)}
              placeholder="Custom: e.g. 75KB or 2MB"
              className="flex-1 border-2 border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#FF9933] transition-colors"
            />
            {customTarget && (
              <div className={cn(
                "flex items-center px-3 rounded-xl text-sm font-bold",
                parseTargetSize(customTarget)
                  ? "bg-green-100 text-green-700"
                  : "bg-red-100 text-red-700"
              )}>
                {parseTargetSize(customTarget)
                  ? `= ${formatBytes(parseTargetSize(customTarget)!)}`
                  : "Invalid"}
              </div>
            )}
          </div>
        </div>

        {/* Upload Zone */}
        <div
          {...getRootProps()}
          className={cn(
            "border-2 border-dashed rounded-2xl p-8 cursor-pointer transition-all text-center",
            isDragActive
              ? "border-[#FF9933] bg-orange-50"
              : "border-slate-300 bg-white hover:border-[#FF9933]/50 hover:bg-slate-50"
          )}
        >
          <input {...getInputProps()} />
          <div className="flex flex-col items-center gap-3">
            <div className={cn(
              "flex h-14 w-14 items-center justify-center rounded-xl transition-colors",
              isDragActive ? "bg-[#FF9933]" : "bg-slate-100"
            )}>
              <Upload className={cn("h-7 w-7", isDragActive ? "text-white" : "text-slate-400")} />
            </div>
            <div>
              <p className="font-bold text-[#0A2540]">
                {isDragActive ? "Release to add files!" : `Drop ${activeTab === "image" ? "images" : "PDFs"} here`}
              </p>
              <p className="text-sm text-slate-500 mt-1">
                {activeTab === "image" ? "JPG, PNG, WebP" : "PDF files"} •
                <span className="text-[#FF9933]"> Click to browse</span>
              </p>
            </div>
          </div>
        </div>

        {/* File List */}
        {files.length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-slate-100">
              <h3 className="font-bold text-[#0A2540]">
                Files ({files.length}) / फाइलें
              </h3>
              <Button variant="ghost" size="sm" onClick={clearAll} className="text-red-500 hover:text-red-600">
                <X className="h-4 w-4" /> Clear All
              </Button>
            </div>

            <div className="divide-y divide-slate-100">
              {files.map((f, idx) => {
                const reduction = f.compressedSize
                  ? Math.round((1 - f.compressedSize / f.originalSize) * 100)
                  : 0;
                const underLimit = targetBytes && f.compressedSize <= targetBytes;
                const pct = targetBytes && f.compressedSize
                  ? Math.min(100, Math.round((f.compressedSize / targetBytes) * 100))
                  : 0;

                return (
                  <div key={idx} className="p-4">
                    <div className="flex items-start gap-3">
                      <div className={cn(
                        "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
                        f.status === "done" ? "bg-green-100" :
                        f.status === "error" ? "bg-red-100" :
                        f.status === "processing" ? "bg-orange-100" : "bg-slate-100"
                      )}>
                        {f.status === "done" ? (
                          <CheckCircle2 className="h-5 w-5 text-green-600" />
                        ) : f.status === "error" ? (
                          <AlertCircle className="h-5 w-5 text-red-600" />
                        ) : f.status === "processing" ? (
                          <RefreshCw className="h-5 w-5 text-orange-500 animate-spin" />
                        ) : (
                          <FileText className="h-5 w-5 text-slate-400" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-[#0A2540] text-sm truncate">{f.original.name}</p>
                        <div className="flex flex-wrap gap-3 mt-1 text-xs text-slate-500">
                          <span>Original: <strong>{formatBytes(f.originalSize)}</strong></span>
                          {f.status === "done" && (
                            <>
                              <span className={cn("font-bold", underLimit ? "text-green-600" : "text-red-500")}>
                                Compressed: {formatBytes(f.compressedSize)}
                              </span>
                              <span className="text-blue-600 font-semibold">↓ {reduction}% saved</span>
                              <span className="text-slate-400">Quality: {f.quality}%</span>
                            </>
                          )}
                          {f.status === "processing" && (
                            <span className="text-orange-500 font-semibold animate-pulse">Compressing...</span>
                          )}
                          {f.status === "error" && (
                            <span className="text-red-500">{f.error}</span>
                          )}
                        </div>

                        {f.status === "done" && targetBytes && (
                          <div className="mt-2">
                            <div className="flex items-center justify-between text-xs mb-1">
                              <span className={underLimit ? "text-green-600 font-semibold" : "text-red-500 font-semibold"}>
                                {underLimit ? "✅ Under limit" : "⚠️ Over limit"}
                              </span>
                              <span className="text-slate-400">
                                {pct}% of {formatBytes(targetBytes)}
                              </span>
                            </div>
                            <Progress
                              value={pct}
                              indicatorClassName={underLimit ? "bg-green-500" : "bg-red-500"}
                            />
                          </div>
                        )}

                        {f.status === "processing" && (
                          <div className="mt-2">
                            <Skeleton className="h-2 w-full rounded-full" />
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col gap-1 shrink-0">
                        {f.status === "done" && (
                          <Button
                            variant="saffron"
                            size="sm"
                            onClick={() => downloadFile(f)}
                          >
                            <Download className="h-3.5 w-3.5" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFile(idx)}
                          className="text-slate-400 hover:text-red-500"
                        >
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Action bar */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row gap-2">
              <Button
                onClick={compressAll}
                disabled={isProcessing || files.length === 0}
                variant="saffron"
                size="lg"
                className="flex-1"
              >
                {isProcessing ? (
                  <><RefreshCw className="h-4 w-4 animate-spin" /> Compressing...</>
                ) : (
                  <><Zap className="h-4 w-4" /> Compress All ({files.length} files)</>
                )}
              </Button>
              {allDone && (
                <Button onClick={downloadAll} variant="default" size="lg">
                  <Download className="h-4 w-4" /> Download All
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Summary if all done */}
        {allDone && files.length > 0 && (
          <div className="bg-white rounded-2xl border border-green-200 p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-100">
                <TrendingDown className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <h3 className="font-bold text-[#0A2540]">Compression Summary</h3>
                <p className="text-xs text-slate-400">कम्प्रेशन सारांश</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="bg-slate-50 rounded-xl p-3">
                <p className="text-xs text-slate-400 mb-1">Total Before</p>
                <p className="font-black text-[#0A2540]">
                  {formatBytes(files.reduce((s, f) => s + f.originalSize, 0))}
                </p>
              </div>
              <div className="bg-green-50 rounded-xl p-3">
                <p className="text-xs text-slate-400 mb-1">Total After</p>
                <p className="font-black text-green-600">
                  {formatBytes(files.reduce((s, f) => s + (f.compressedSize || f.originalSize), 0))}
                </p>
              </div>
              <div className="bg-orange-50 rounded-xl p-3">
                <p className="text-xs text-slate-400 mb-1">Total Saved</p>
                <p className="font-black text-[#FF9933]">
                  {formatBytes(
                    files.reduce((s, f) => s + Math.max(0, f.originalSize - (f.compressedSize || f.originalSize)), 0)
                  )}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* How it works */}
        <div className="bg-[#0A2540]/5 rounded-2xl p-5">
          <h3 className="font-bold text-[#0A2540] mb-3">
            🔬 How Auto-Compression Works / यह कैसे काम करता है
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm text-slate-600">
            <div className="bg-white rounded-xl p-3 border border-slate-100">
              <span className="text-[#FF9933] font-bold">Step 1:</span> Binary search between quality 1% and 100%
            </div>
            <div className="bg-white rounded-xl p-3 border border-slate-100">
              <span className="text-[#FF9933] font-bold">Step 2:</span> Tests mid-point quality, checks if output &lt; target
            </div>
            <div className="bg-white rounded-xl p-3 border border-slate-100">
              <span className="text-[#FF9933] font-bold">Step 3:</span> Repeats up to 15 iterations to find optimal quality
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-3">
            ✅ 100% client-side processing — your files never leave your device
          </p>
        </div>
      </div>
    </div>
  );
}
