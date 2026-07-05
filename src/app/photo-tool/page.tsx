"use client";
import React, { useState, useRef, useCallback } from "react";
import Cropper from "react-easy-crop";
import type { Area, Point } from "react-easy-crop";
import { useDropzone } from "react-dropzone";
import {
  Upload, ZoomIn, ZoomOut, RotateCcw, RotateCw,
  Download, RefreshCw, CheckCircle2, ChevronDown, Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn, downloadBlob, triggerConfetti, formatBytes } from "@/lib/utils";
import toast from "react-hot-toast";

const PRESETS = [
  {
    label: "Passport Photo",
    labelHi: "पासपोर्ट फोटो",
    width: 413,
    height: 531,
    aspect: 413 / 531,
    info: "35×45mm | 413×531px",
    category: "passport",
  },
  {
    label: "PAN Card Photo",
    labelHi: "पैन कार्ड फोटो",
    width: 213,
    height: 213,
    aspect: 1,
    info: "25×25mm | 213×213px",
    category: "pan",
  },
  {
    label: "Aadhaar Photo",
    labelHi: "आधार फोटो",
    width: 200,
    height: 230,
    aspect: 200 / 230,
    info: "200×230px",
    category: "aadhaar",
  },
  {
    label: "Signature (PAN)",
    labelHi: "हस्ताक्षर (पैन)",
    width: 560,
    height: 140,
    aspect: 560 / 140,
    info: "4:1 | 560×140px",
    category: "signature",
  },
  {
    label: "Passport Size (US)",
    labelHi: "US पासपोर्ट",
    width: 600,
    height: 600,
    aspect: 1,
    info: "2×2 inch | 600×600px",
    category: "passport",
  },
  {
    label: "Driving Licence",
    labelHi: "ड्राइविंग लाइसेंस",
    width: 276,
    height: 197,
    aspect: 276 / 197,
    info: "276×197px",
    category: "licence",
  },
];

async function getCroppedImg(
  imageSrc: string,
  pixelCrop: Area,
  rotation: number,
  outputWidth: number,
  outputHeight: number
): Promise<Blob> {
  const image = await createImageBitmap(
    await (await fetch(imageSrc)).blob()
  );

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d")!;

  const maxSize = Math.max(image.width, image.height);
  const safeArea = 2 * ((maxSize / 2) * Math.sqrt(2));

  canvas.width = safeArea;
  canvas.height = safeArea;

  ctx.translate(safeArea / 2, safeArea / 2);
  ctx.rotate((rotation * Math.PI) / 180);
  ctx.translate(-safeArea / 2, -safeArea / 2);
  ctx.drawImage(
    image,
    safeArea / 2 - image.width / 2,
    safeArea / 2 - image.height / 2
  );

  const data = ctx.getImageData(0, 0, safeArea, safeArea);

  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  ctx.putImageData(
    data,
    Math.round(0 - safeArea / 2 + image.width * 0.5 - pixelCrop.x),
    Math.round(0 - safeArea / 2 + image.height * 0.5 - pixelCrop.y)
  );

  // Resize to exact output dimensions
  const outputCanvas = document.createElement("canvas");
  outputCanvas.width = outputWidth;
  outputCanvas.height = outputHeight;
  const outCtx = outputCanvas.getContext("2d")!;
  outCtx.drawImage(canvas, 0, 0, outputWidth, outputHeight);

  return new Promise((resolve, reject) => {
    outputCanvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Canvas is empty"));
      },
      "image/jpeg",
      0.95
    );
  });
}

export default function PhotoToolPage() {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [selectedPreset, setSelectedPreset] = useState(PRESETS[0]);
  const [croppedImage, setCroppedImage] = useState<string | null>(null);
  const [croppedBlob, setCroppedBlob] = useState<Blob | null>(null);
  const [processing, setProcessing] = useState(false);
  const [showPresets, setShowPresets] = useState(false);

  const onCropComplete = useCallback((_: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setImageSrc(reader.result as string);
      setCroppedImage(null);
      setCroppedBlob(null);
      setZoom(1);
      setRotation(0);
      setCrop({ x: 0, y: 0 });
    };
    reader.readAsDataURL(file);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/jpeg": [], "image/png": [], "image/webp": [] },
    maxFiles: 1,
  });

  const handleCrop = async () => {
    if (!imageSrc || !croppedAreaPixels) return;
    setProcessing(true);
    try {
      const blob = await getCroppedImg(
        imageSrc,
        croppedAreaPixels,
        rotation,
        selectedPreset.width,
        selectedPreset.height
      );
      const url = URL.createObjectURL(blob);
      setCroppedImage(url);
      setCroppedBlob(blob);
      toast.success("Photo cropped successfully!");
    } catch {
      toast.error("Cropping failed. Please try again.");
    } finally {
      setProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!croppedBlob) return;
    downloadBlob(croppedBlob, `docready-${selectedPreset.label.replace(/\s+/g, "-").toLowerCase()}.jpg`);
    triggerConfetti();
    toast.success("Downloaded successfully! 🎉");
  };

  const handleReset = () => {
    setImageSrc(null);
    setCroppedImage(null);
    setCroppedBlob(null);
    setZoom(1);
    setRotation(0);
    setCrop({ x: 0, y: 0 });
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-[#0A2540] text-white py-10 px-4">
        <div className="mx-auto max-w-5xl text-center">
          <Badge variant="saffron" className="mb-3">Advanced Cropper</Badge>
          <h1 className="text-3xl sm:text-4xl font-black mb-2">
            Passport Photo & Signature
          </h1>
          <p className="text-slate-300 text-sm sm:text-base">
            पासपोर्ट फोटो और हस्ताक्षर ट्रिम करें
          </p>
          <p className="text-slate-400 text-xs mt-1">
            Fixed crop box — Pan & Pinch-zoom the image inside
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 sm:px-6 py-8">
        {!imageSrc ? (
          /* Upload Zone */
          <div
            {...getRootProps()}
            className={cn(
              "border-2 border-dashed rounded-2xl p-12 sm:p-16 cursor-pointer transition-all text-center",
              isDragActive
                ? "border-[#FF9933] bg-orange-50"
                : "border-slate-300 bg-white hover:border-[#FF9933]/50 hover:bg-slate-50"
            )}
          >
            <input {...getInputProps()} />
            <div className="flex flex-col items-center gap-4">
              <div className={cn(
                "flex h-20 w-20 items-center justify-center rounded-2xl transition-colors",
                isDragActive ? "bg-[#FF9933]" : "bg-slate-100"
              )}>
                <Upload className={cn("h-10 w-10", isDragActive ? "text-white" : "text-slate-400")} />
              </div>
              <div>
                <p className="text-xl font-bold text-[#0A2540] mb-1">
                  {isDragActive ? "Drop your photo here!" : "Upload Photo"}
                </p>
                <p className="text-slate-500 text-sm">
                  अपनी फोटो यहाँ खींचें या <span className="text-[#FF9933] underline">चुनें</span>
                </p>
                <p className="text-slate-400 text-xs mt-2">JPG, PNG, WebP supported</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Controls panel */}
            <div className="lg:col-span-1 space-y-4">
              {/* Preset Selector */}
              <div className="bg-white rounded-2xl border border-slate-200 p-4">
                <h3 className="font-bold text-[#0A2540] mb-3 text-sm flex items-center gap-2">
                  <Info className="h-4 w-4 text-[#FF9933]" />
                  Select Format
                  <span className="text-slate-400 font-normal">/ फॉर्मेट चुनें</span>
                </h3>
                <div className="space-y-2">
                  {PRESETS.map((preset) => (
                    <button
                      key={preset.label}
                      onClick={() => setSelectedPreset(preset)}
                      className={cn(
                        "w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left text-sm transition-all",
                        selectedPreset.label === preset.label
                          ? "bg-[#0A2540] text-white"
                          : "bg-slate-50 text-slate-700 hover:bg-slate-100"
                      )}
                    >
                      <div>
                        <div className="font-semibold">{preset.label}</div>
                        <div className={cn("text-xs", selectedPreset.label === preset.label ? "text-slate-300" : "text-slate-400")}>
                          {preset.labelHi}
                        </div>
                      </div>
                      <Badge
                        variant={selectedPreset.label === preset.label ? "saffron" : "secondary"}
                        className="text-[10px]"
                      >
                        {preset.info}
                      </Badge>
                    </button>
                  ))}
                </div>
              </div>

              {/* Zoom & Rotate Controls */}
              <div className="bg-white rounded-2xl border border-slate-200 p-4">
                <h3 className="font-bold text-[#0A2540] mb-3 text-sm">Controls / नियंत्रण</h3>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setZoom((z) => Math.min(z + 0.2, 3))}
                    className="flex-col h-14 gap-1"
                  >
                    <ZoomIn className="h-4 w-4" />
                    <span className="text-xs">Zoom In</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setZoom((z) => Math.max(z - 0.2, 1))}
                    className="flex-col h-14 gap-1"
                  >
                    <ZoomOut className="h-4 w-4" />
                    <span className="text-xs">Zoom Out</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setRotation((r) => r - 15)}
                    className="flex-col h-14 gap-1"
                  >
                    <RotateCcw className="h-4 w-4" />
                    <span className="text-xs">Rotate L</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setRotation((r) => r + 15)}
                    className="flex-col h-14 gap-1"
                  >
                    <RotateCw className="h-4 w-4" />
                    <span className="text-xs">Rotate R</span>
                  </Button>
                </div>
                <div className="mt-3 text-xs text-slate-400 bg-slate-50 rounded-lg p-2">
                  <p>📱 <strong>Mobile:</strong> Pinch to zoom, drag to pan</p>
                  <p className="mt-1">🖥️ <strong>Desktop:</strong> Scroll to zoom, drag to move</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2">
                <Button
                  onClick={handleCrop}
                  disabled={processing}
                  className="w-full"
                  variant="saffron"
                  size="lg"
                >
                  {processing ? (
                    <><RefreshCw className="h-4 w-4 animate-spin" /> Processing...</>
                  ) : (
                    <><CheckCircle2 className="h-4 w-4" /> Crop Photo</>
                  )}
                </Button>
                <Button
                  onClick={handleReset}
                  variant="secondary"
                  size="sm"
                  className="w-full"
                >
                  <RefreshCw className="h-4 w-4" /> Change Photo
                </Button>
              </div>
            </div>

            {/* Cropper */}
            <div className="lg:col-span-2 space-y-4">
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                <div className="p-3 border-b border-slate-100 flex items-center justify-between">
                  <span className="text-sm font-bold text-[#0A2540]">
                    {selectedPreset.label} — {selectedPreset.info}
                  </span>
                  <Badge variant="secondary" className="text-xs">Fixed Box</Badge>
                </div>
                {/* Cropper Container */}
                <div className="relative w-full" style={{ height: "420px" }}>
                  <Cropper
                    image={imageSrc}
                    crop={crop}
                    zoom={zoom}
                    rotation={rotation}
                    aspect={selectedPreset.aspect}
                    onCropChange={setCrop}
                    onZoomChange={setZoom}
                    onCropComplete={onCropComplete}
                    cropShape="rect"
                    showGrid
                    style={{
                      containerStyle: { background: "#1e293b" },
                      cropAreaStyle: {
                        border: "2px solid #FF9933",
                        boxShadow: "0 0 0 9999em rgba(0,0,0,0.6)",
                      },
                    }}
                    zoomWithScroll
                    restrictPosition
                  />
                </div>
              </div>

              {/* Preview */}
              {croppedImage && (
                <div className="bg-white rounded-2xl border border-slate-200 p-5">
                  <h3 className="font-bold text-[#0A2540] mb-4 flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                    Cropped Preview
                    <span className="text-slate-400 text-sm font-normal">/ क्रॉप्ड पूर्वावलोकन</span>
                  </h3>
                  <div className="flex flex-col sm:flex-row items-center gap-6">
                    <div className="flex items-center justify-center bg-slate-100 rounded-xl p-4" style={{ minWidth: 140 }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={croppedImage}
                        alt="Cropped"
                        className="max-h-40 max-w-full rounded-lg shadow-md object-cover"
                      />
                    </div>
                    <div className="flex-1 space-y-2">
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="bg-slate-50 rounded-lg p-3">
                          <p className="text-slate-400 text-xs">Format</p>
                          <p className="font-bold text-[#0A2540]">{selectedPreset.label}</p>
                        </div>
                        <div className="bg-slate-50 rounded-lg p-3">
                          <p className="text-slate-400 text-xs">Size</p>
                          <p className="font-bold text-[#0A2540]">
                            {selectedPreset.width}×{selectedPreset.height}px
                          </p>
                        </div>
                        <div className="bg-slate-50 rounded-lg p-3">
                          <p className="text-slate-400 text-xs">File Size</p>
                          <p className="font-bold text-green-600">
                            {croppedBlob ? formatBytes(croppedBlob.size) : "–"}
                          </p>
                        </div>
                        <div className="bg-slate-50 rounded-lg p-3">
                          <p className="text-slate-400 text-xs">Format</p>
                          <p className="font-bold text-[#0A2540]">JPEG / 95%</p>
                        </div>
                      </div>
                      <Button
                        onClick={handleDownload}
                        variant="saffron"
                        className="w-full"
                      >
                        <Download className="h-4 w-4" />
                        Download Photo
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {processing && (
                <div className="bg-white rounded-2xl border border-slate-200 p-5">
                  <Skeleton className="h-40 w-full mb-3" />
                  <Skeleton className="h-6 w-2/3 mb-2" />
                  <Skeleton className="h-10 w-full" />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tips */}
        <div className="mt-8 bg-[#0A2540]/5 rounded-2xl p-5">
          <h3 className="font-bold text-[#0A2540] mb-3 text-sm">
            💡 Tips / टिप्स
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-slate-600">
            <div className="bg-white rounded-lg p-3 border border-slate-100">
              <strong>White Background:</strong> Use a photo with white/light background for best results.
            </div>
            <div className="bg-white rounded-lg p-3 border border-slate-100">
              <strong>Good Lighting:</strong> Ensure face is well-lit. No shadows on face.
            </div>
            <div className="bg-white rounded-lg p-3 border border-slate-100">
              <strong>File Size:</strong> Use Compressor tool if output is too large for portal upload.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
