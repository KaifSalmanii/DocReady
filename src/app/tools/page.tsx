"use client";
import React, { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import {
  Upload, Image as ImageIcon, FileText, CheckCircle2,
  AlertCircle, XCircle, Download, RefreshCw, Plus, GripVertical, X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn, formatBytes, downloadBlob, triggerConfetti } from "@/lib/utils";
import toast from "react-hot-toast";
import { PDFDocument } from "pdf-lib";

// Gov spec presets for format validation
const GOV_SPECS = [
  {
    name: "Passport Photo",
    nameHi: "पासपोर्ट फोटो",
    minWidth: 413,
    minHeight: 531,
    maxWidth: 600,
    maxHeight: 800,
    maxSize: 500 * 1024, // 500KB
    acceptedFormats: ["image/jpeg"],
    dpiMin: 300,
    colorMode: "RGB",
  },
  {
    name: "PAN Card Photo",
    nameHi: "पैन कार्ड फोटो",
    minWidth: 200,
    minHeight: 200,
    maxWidth: 400,
    maxHeight: 400,
    maxSize: 50 * 1024,
    acceptedFormats: ["image/jpeg"],
    dpiMin: 96,
    colorMode: "RGB",
  },
  {
    name: "Aadhaar Update Photo",
    nameHi: "आधार अपडेट फोटो",
    minWidth: 200,
    minHeight: 230,
    maxWidth: 800,
    maxHeight: 1000,
    maxSize: 200 * 1024,
    acceptedFormats: ["image/jpeg", "image/png"],
    dpiMin: 96,
    colorMode: "RGB",
  },
  {
    name: "DigiLocker Document",
    nameHi: "डिजिलॉकर दस्तावेज़",
    minWidth: 600,
    minHeight: 800,
    maxWidth: 5000,
    maxHeight: 7000,
    maxSize: 1024 * 1024,
    acceptedFormats: ["image/jpeg", "application/pdf"],
    dpiMin: 100,
    colorMode: "Any",
  },
  {
    name: "RTI Application Scan",
    nameHi: "आरटीआई आवेदन स्कैन",
    minWidth: 1240,
    minHeight: 1754,
    maxWidth: 4960,
    maxHeight: 7016,
    maxSize: 2 * 1024 * 1024,
    acceptedFormats: ["image/jpeg", "image/png", "application/pdf"],
    dpiMin: 150,
    colorMode: "Grayscale/RGB",
  },
];

interface ValidationResult {
  check: string;
  checkHi: string;
  status: "pass" | "fail" | "warning";
  detail: string;
}

interface ImageFile {
  file: File;
  url: string;
  id: string;
}

// Image to PDF
export default function ToolsPage() {
  const [activeTab, setActiveTab] = useState<"img2pdf" | "validator">("img2pdf");

  // --- Image to PDF state ---
  const [images, setImages] = useState<ImageFile[]>([]);
  const [pdfGenerating, setPdfGenerating] = useState(false);

  const onDropImages = useCallback((acceptedFiles: File[]) => {
    const newImgs = acceptedFiles.map((f) => ({
      file: f,
      url: URL.createObjectURL(f),
      id: Math.random().toString(36).slice(2),
    }));
    setImages((prev) => [...prev, ...newImgs]);
  }, []);

  const { getRootProps: getImgRootProps, getInputProps: getImgInputProps, isDragActive: isImgDragActive } =
    useDropzone({
      onDrop: onDropImages,
      accept: { "image/jpeg": [], "image/png": [], "image/webp": [] },
      maxFiles: 20,
    });

  const removeImage = (id: string) => {
    setImages((prev) => {
      const removed = prev.find((i) => i.id === id);
      if (removed) URL.revokeObjectURL(removed.url);
      return prev.filter((i) => i.id !== id);
    });
  };

  const moveImage = (from: number, to: number) => {
    setImages((prev) => {
      const arr = [...prev];
      const [item] = arr.splice(from, 1);
      arr.splice(to, 0, item);
      return arr;
    });
  };

  const generatePDFFromImages = async () => {
    if (images.length === 0) {
      toast.error("Please add at least one image");
      return;
    }
    setPdfGenerating(true);
    try {
      const pdfDoc = await PDFDocument.create();
      const A4_WIDTH = 595.28;
      const A4_HEIGHT = 841.89;
      const MARGIN = 40;

      for (const img of images) {
        const ab = await img.file.arrayBuffer();
        let embeddedImage;
        if (img.file.type === "image/png") {
          embeddedImage = await pdfDoc.embedPng(ab);
        } else {
          embeddedImage = await pdfDoc.embedJpg(ab);
        }

        const page = pdfDoc.addPage([A4_WIDTH, A4_HEIGHT]);
        const maxW = A4_WIDTH - MARGIN * 2;
        const maxH = A4_HEIGHT - MARGIN * 2;
        const ratio = Math.min(maxW / embeddedImage.width, maxH / embeddedImage.height);
        const drawW = embeddedImage.width * ratio;
        const drawH = embeddedImage.height * ratio;
        const x = (A4_WIDTH - drawW) / 2;
        const y = (A4_HEIGHT - drawH) / 2;

        page.drawImage(embeddedImage, { x, y, width: drawW, height: drawH });
      }

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes.buffer as ArrayBuffer], { type: "application/pdf" });
      downloadBlob(blob, "docready-images.pdf");
      triggerConfetti();
      toast.success(`${images.length} image(s) merged into PDF! 🎉`);
    } catch {
      toast.error("Failed to generate PDF. Please try again.");
    } finally {
      setPdfGenerating(false);
    }
  };

  // --- Validator state ---
  const [validatorFile, setValidatorFile] = useState<File | null>(null);
  const [selectedSpec, setSelectedSpec] = useState(GOV_SPECS[0]);
  const [validationResults, setValidationResults] = useState<ValidationResult[]>([]);
  const [validating, setValidating] = useState(false);
  const [imgDimensions, setImgDimensions] = useState<{ w: number; h: number } | null>(null);

  const onDropValidator = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;
    setValidatorFile(file);
    setValidationResults([]);
    setImgDimensions(null);

    if (file.type.startsWith("image/")) {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        setImgDimensions({ w: img.width, h: img.height });
        URL.revokeObjectURL(url);
      };
      img.src = url;
    }
  }, []);

  const { getRootProps: getValRootProps, getInputProps: getValInputProps, isDragActive: isValDragActive } =
    useDropzone({
      onDrop: onDropValidator,
      accept: { "image/jpeg": [], "image/png": [], "application/pdf": [] },
      maxFiles: 1,
    });

  const runValidation = async () => {
    if (!validatorFile) { toast.error("Please upload a file first"); return; }
    setValidating(true);

    await new Promise((r) => setTimeout(r, 500)); // Simulate processing

    const results: ValidationResult[] = [];
    const spec = selectedSpec;
    const fileSize = validatorFile.size;
    const isImage = validatorFile.type.startsWith("image/");

    // File format check
    results.push({
      check: "File Format",
      checkHi: "फ़ाइल फ़ॉर्मेट",
      status: spec.acceptedFormats.includes(validatorFile.type) ? "pass" : "fail",
      detail: `Your file: ${validatorFile.type.split("/")[1].toUpperCase()} | Accepted: ${spec.acceptedFormats.map((f) => f.split("/")[1].toUpperCase()).join(", ")}`,
    });

    // File size check
    results.push({
      check: "File Size",
      checkHi: "फ़ाइल साइज़",
      status: fileSize <= spec.maxSize ? "pass" : "fail",
      detail: `Your file: ${formatBytes(fileSize)} | Max allowed: ${formatBytes(spec.maxSize)}`,
    });

    // Dimensions check (only for images)
    if (isImage && imgDimensions) {
      const { w, h } = imgDimensions;
      const dimOk = w >= spec.minWidth && h >= spec.minHeight && w <= spec.maxWidth && h <= spec.maxHeight;
      results.push({
        check: "Image Dimensions",
        checkHi: "इमेज आयाम",
        status: dimOk ? "pass" : "fail",
        detail: `Your image: ${w}×${h}px | Required: ${spec.minWidth}–${spec.maxWidth} × ${spec.minHeight}–${spec.maxHeight}px`,
      });

      // Aspect ratio warning
      const yourRatio = w / h;
      const specRatio = spec.minWidth / spec.minHeight;
      const ratioDiff = Math.abs(yourRatio - specRatio) / specRatio;
      results.push({
        check: "Aspect Ratio",
        checkHi: "अनुपात",
        status: ratioDiff < 0.1 ? "pass" : "warning",
        detail: `Your ratio: ${yourRatio.toFixed(2)} | Expected: ~${specRatio.toFixed(2)}`,
      });
    }

    // Color mode advisory
    results.push({
      check: "Color Mode",
      checkHi: "रंग मोड",
      status: "warning",
      detail: `Required: ${spec.colorMode}. Ensure your image is in the correct color mode.`,
    });

    // DPI advisory
    results.push({
      check: "DPI / Resolution",
      checkHi: "रिज़ॉल्यूशन",
      status: "warning",
      detail: `Minimum recommended: ${spec.dpiMin} DPI. Browser cannot read DPI metadata — verify in image editor.`,
    });

    setValidationResults(results);
    setValidating(false);

    const failed = results.filter((r) => r.status === "fail").length;
    if (failed === 0) {
      toast.success("All critical checks passed! ✅");
      triggerConfetti();
    } else {
      toast.error(`${failed} check(s) failed. See details below.`);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-[#0A2540] text-white py-10 px-4">
        <div className="mx-auto max-w-4xl text-center">
          <Badge variant="saffron" className="mb-3">Utility Tools</Badge>
          <h1 className="text-3xl sm:text-4xl font-black mb-2">Document Tools</h1>
          <p className="text-slate-300 text-sm sm:text-base">दस्तावेज़ टूल्स</p>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 sm:px-6 py-8">
        {/* Tabs */}
        <div className="bg-white rounded-2xl border border-slate-200 p-2 flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab("img2pdf")}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold transition-all",
              activeTab === "img2pdf"
                ? "bg-[#0A2540] text-white"
                : "text-slate-500 hover:text-slate-700"
            )}
          >
            <ImageIcon className="h-4 w-4" />
            Image → PDF
            <span className="text-xs opacity-70">(मर्ज)</span>
          </button>
          <button
            onClick={() => setActiveTab("validator")}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold transition-all",
              activeTab === "validator"
                ? "bg-[#0A2540] text-white"
                : "text-slate-500 hover:text-slate-700"
            )}
          >
            <CheckCircle2 className="h-4 w-4" />
            Format Validator
            <span className="text-xs opacity-70">(जांच)</span>
          </button>
        </div>

        {/* === IMAGE TO PDF === */}
        {activeTab === "img2pdf" && (
          <div className="space-y-5">
            <div className="bg-white rounded-2xl border border-slate-200 p-5">
              <h2 className="font-black text-[#0A2540] text-lg mb-1">Image to PDF Converter</h2>
              <p className="text-sm text-slate-400 mb-5">
                Add multiple JPEGs/PNGs and merge them into a single A4 PDF. Great for scanning documents.
                <span className="block mt-0.5 text-xs">कई इमेज को A4 PDF में मर्ज करें।</span>
              </p>

              {/* Drop zone */}
              <div
                {...getImgRootProps()}
                className={cn(
                  "border-2 border-dashed rounded-xl p-8 cursor-pointer text-center transition-all",
                  isImgDragActive
                    ? "border-[#FF9933] bg-orange-50"
                    : "border-slate-300 hover:border-[#FF9933]/50"
                )}
              >
                <input {...getImgInputProps()} />
                <Plus className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                <p className="text-sm font-semibold text-slate-500">
                  {isImgDragActive ? "Drop images!" : "Add Images (JPG, PNG)"}
                </p>
                <p className="text-xs text-slate-400 mt-1">Supports up to 20 images</p>
              </div>

              {/* Image list */}
              {images.length > 0 && (
                <div className="mt-4">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-bold text-[#0A2540]">{images.length} image(s) added</p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setImages([])}
                      className="text-red-500"
                    >
                      <X className="h-4 w-4" /> Clear
                    </Button>
                  </div>
                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                    {images.map((img, idx) => (
                      <div key={img.id} className="relative group rounded-xl overflow-hidden border border-slate-200 aspect-square">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={img.url} alt={img.file.name} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                          <button
                            onClick={() => moveImage(idx, Math.max(0, idx - 1))}
                            className="text-white text-xs bg-black/50 rounded px-1"
                            disabled={idx === 0}
                          >
                            ←
                          </button>
                          <button
                            onClick={() => removeImage(img.id)}
                            className="text-white bg-red-500 rounded-full p-0.5"
                          >
                            <X className="h-3 w-3" />
                          </button>
                          <button
                            onClick={() => moveImage(idx, Math.min(images.length - 1, idx + 1))}
                            className="text-white text-xs bg-black/50 rounded px-1"
                            disabled={idx === images.length - 1}
                          >
                            →
                          </button>
                        </div>
                        <div className="absolute bottom-1 left-1 bg-black/60 text-white text-[10px] rounded px-1">
                          {idx + 1}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 p-3 bg-slate-50 rounded-xl text-xs text-slate-500">
                    <GripVertical className="h-3 w-3 inline mr-1" />
                    Hover over images to reorder using ← → buttons
                  </div>
                </div>
              )}
            </div>

            {images.length > 0 && (
              <Button
                onClick={generatePDFFromImages}
                disabled={pdfGenerating}
                variant="saffron"
                size="lg"
                className="w-full"
              >
                {pdfGenerating ? (
                  <><RefreshCw className="h-4 w-4 animate-spin" /> Generating PDF...</>
                ) : (
                  <><FileText className="h-4 w-4" /> Generate A4 PDF ({images.length} pages)</>
                )}
              </Button>
            )}

            <div className="bg-[#0A2540]/5 rounded-2xl p-4">
              <h3 className="font-bold text-[#0A2540] text-sm mb-2">📌 Use Cases / उपयोग</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-slate-600">
                <div className="bg-white rounded-lg p-2.5 border border-slate-100">
                  Scan multiple pages of an RTI application
                </div>
                <div className="bg-white rounded-lg p-2.5 border border-slate-100">
                  Combine income proof photos into one PDF
                </div>
                <div className="bg-white rounded-lg p-2.5 border border-slate-100">
                  Merge utility bills for address proof
                </div>
              </div>
            </div>
          </div>
        )}

        {/* === FORMAT VALIDATOR === */}
        {activeTab === "validator" && (
          <div className="space-y-5">
            <div className="bg-white rounded-2xl border border-slate-200 p-5">
              <h2 className="font-black text-[#0A2540] text-lg mb-1">Format Validator</h2>
              <p className="text-sm text-slate-400 mb-5">
                Check if your file meets government portal requirements before uploading.
                <span className="block mt-0.5 text-xs">अपलोड से पहले जांचें कि आपकी फ़ाइल सही है।</span>
              </p>

              {/* Spec selector */}
              <div className="mb-4">
                <label className="block text-sm font-bold text-[#0A2540] mb-2">
                  Select Government Portal Spec:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {GOV_SPECS.map((spec) => (
                    <button
                      key={spec.name}
                      onClick={() => { setSelectedSpec(spec); setValidationResults([]); }}
                      className={cn(
                        "text-left px-4 py-3 rounded-xl border-2 transition-all text-sm",
                        selectedSpec.name === spec.name
                          ? "border-[#FF9933] bg-orange-50"
                          : "border-slate-200 hover:border-[#FF9933]/40"
                      )}
                    >
                      <div className="font-semibold text-[#0A2540]">{spec.name}</div>
                      <div className="text-xs text-slate-400">{spec.nameHi} • Max {formatBytes(spec.maxSize)}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Validator Drop zone */}
              <div
                {...getValRootProps()}
                className={cn(
                  "border-2 border-dashed rounded-xl p-8 cursor-pointer text-center transition-all",
                  isValDragActive
                    ? "border-[#FF9933] bg-orange-50"
                    : validatorFile
                    ? "border-green-400 bg-green-50"
                    : "border-slate-300 hover:border-[#FF9933]/50"
                )}
              >
                <input {...getValInputProps()} />
                {validatorFile ? (
                  <div className="flex flex-col items-center gap-2">
                    <CheckCircle2 className="h-8 w-8 text-green-500" />
                    <p className="font-bold text-[#0A2540] text-sm">{validatorFile.name}</p>
                    <p className="text-xs text-slate-500">{formatBytes(validatorFile.size)}</p>
                    {imgDimensions && (
                      <p className="text-xs text-slate-400">{imgDimensions.w} × {imgDimensions.h} px</p>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <Upload className="h-8 w-8 text-slate-300" />
                    <p className="text-sm font-semibold text-slate-500">Upload file to validate</p>
                    <p className="text-xs text-slate-400">JPG, PNG, PDF</p>
                  </div>
                )}
              </div>

              {validatorFile && (
                <Button
                  onClick={runValidation}
                  disabled={validating}
                  variant="saffron"
                  size="lg"
                  className="w-full mt-4"
                >
                  {validating ? (
                    <><RefreshCw className="h-4 w-4 animate-spin" /> Validating...</>
                  ) : (
                    <><CheckCircle2 className="h-4 w-4" /> Run Validation for {selectedSpec.name}</>
                  )}
                </Button>
              )}
            </div>

            {/* Results */}
            {validationResults.length > 0 && (
              <div className="bg-white rounded-2xl border border-slate-200 p-5">
                <h3 className="font-bold text-[#0A2540] mb-4">
                  Validation Results — {selectedSpec.name}
                </h3>
                <div className="space-y-3">
                  {validationResults.map((r, i) => (
                    <div key={i} className={cn(
                      "flex items-start gap-3 p-3 rounded-xl border",
                      r.status === "pass" ? "bg-green-50 border-green-200" :
                      r.status === "fail" ? "bg-red-50 border-red-200" :
                      "bg-amber-50 border-amber-200"
                    )}>
                      {r.status === "pass" ? (
                        <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                      ) : r.status === "fail" ? (
                        <XCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
                      ) : (
                        <AlertCircle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                      )}
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-[#0A2540]">{r.check}</span>
                          <span className="text-xs text-slate-400">/ {r.checkHi}</span>
                          <Badge
                            variant={r.status === "pass" ? "success" : r.status === "fail" ? "destructive" : "saffron"}
                            className="text-[10px]"
                          >
                            {r.status.toUpperCase()}
                          </Badge>
                        </div>
                        <p className="text-xs text-slate-600 mt-0.5">{r.detail}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Overall */}
                <div className={cn(
                  "mt-4 p-4 rounded-xl text-center",
                  validationResults.every((r) => r.status !== "fail")
                    ? "bg-green-100 text-green-800"
                    : "bg-red-100 text-red-800"
                )}>
                  {validationResults.every((r) => r.status !== "fail") ? (
                    <p className="font-bold">
                      ✅ Your file meets {selectedSpec.name} requirements!
                      <span className="block text-sm font-normal mt-1">आपकी फ़ाइल आवश्यकताएं पूरी करती है</span>
                    </p>
                  ) : (
                    <p className="font-bold">
                      ❌ {validationResults.filter((r) => r.status === "fail").length} issue(s) found. Fix before uploading.
                      <span className="block text-sm font-normal mt-1">अपलोड करने से पहले ठीक करें</span>
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
