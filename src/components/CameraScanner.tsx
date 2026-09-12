"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Camera,
  Check,
  Info,
  Plus,
  RefreshCw,
  ScanLine,
  SwitchCamera,
  Trash2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { autoFileName } from "@/lib/filename";
import toast from "react-hot-toast";

type FacingMode = "environment" | "user";
type Phase = "starting" | "live" | "review" | "error";

export interface CameraScannerProps {
  open: boolean;
  onClose: () => void;
  onFiles: (files: File[]) => void;
  /** Keep the camera open and capture several shots in a row. */
  multiple?: boolean;
  maxShots?: number;
  /** accept attribute for the native camera fallback input. */
  accept?: string;
  /** Prefix of the auto-generated, space-free random file name. */
  fileNamePrefix?: string;
  /** Extension for captured shots (they are encoded as JPEG). */
  fileExt?: string;
  title?: string;
  subtitle?: string;
}

interface Shot {
  file: File;
  url: string;
}

/** Every file that leaves the camera gets a random, space-free name. */
export function fileFromBlob(blob: Blob, prefix: string, ext: string): File {
  return new File([blob], autoFileName(prefix, ext), {
    type: blob.type || "image/jpeg",
    lastModified: Date.now(),
  });
}

export default function CameraScanner({
  open,
  onClose,
  onFiles,
  multiple = false,
  maxShots = 10,
  accept = "image/*",
  fileNamePrefix = "scan",
  fileExt = "jpg",
  title = "Scan with Camera",
  subtitle = "अपने कैमरे से फोटो / दस्तावेज़ स्कैन करें",
}: CameraScannerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fallbackInputRef = useRef<HTMLInputElement | null>(null);
  const shotsRef = useRef<Shot[]>([]);

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [phase, setPhase] = useState<Phase>("starting");
  const [error, setError] = useState<string | null>(null);
  const [facing, setFacing] = useState<FacingMode>("environment");
  const [shots, setShots] = useState<Shot[]>([]);
  const [reviewUrl, setReviewUrl] = useState<string | null>(null);

  const hintName = useMemo(() => autoFileName(fileNamePrefix, fileExt), [fileExt, fileNamePrefix]);

  const hasMediaApi =
    typeof navigator !== "undefined" && !!navigator.mediaDevices?.getUserMedia;

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setStream(null);
  }, []);

  const startCamera = useCallback(
    async (mode: FacingMode, isCancelled?: () => boolean) => {
      // Everything below runs after the promise boundary, so state is only ever
      // set from an async callback (never synchronously inside a render effect).
      await Promise.resolve();
      if (isCancelled?.()) return;

      if (!hasMediaApi) {
        setError(
          "This browser can't open a live camera (HTTPS or localhost is required). Use the device camera option below."
        );
        setPhase("error");
        return;
      }
      setPhase("starting");
      setError(null);
      stopStream();
      try {
        const media = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: mode },
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          },
          audio: false,
        });
        if (isCancelled?.()) {
          media.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = media;
        setStream(media);
        setFacing(mode);
        setPhase("live");
      } catch (err) {
        const name = err instanceof DOMException ? err.name : "";
        if (name === "NotAllowedError" || name === "SecurityError") {
          setError(
            "Camera permission was blocked. Allow camera access in your browser settings, or use the device camera option below."
          );
        } else if (name === "NotFoundError" || name === "NotReadableError" || name === "OverconstrainedError") {
          setError("No usable camera was found on this device. Use the device camera option below.");
        } else {
          setError("Could not start the camera. Use the device camera option below.");
        }
        setPhase("error");
      }
    },
    [hasMediaApi, stopStream]
  );

  const clearShots = useCallback(() => {
    shotsRef.current.forEach((s) => URL.revokeObjectURL(s.url));
    shotsRef.current = [];
    setShots([]);
  }, []);

  // Mounted while the dialog is open: turn the camera on, then release it again.
  // The camera is an external device, so the stream is handled in an effect and
  // state only changes from its async callbacks.
  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);

    let cancelled = false;
    // Kick the camera off the mount tick so the dialog paints immediately.
    const startTimer = window.setTimeout(() => {
      void startCamera("environment", () => cancelled);
    }, 0);

    return () => {
      cancelled = true;
      window.clearTimeout(startTimer);
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
      stopStream();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Release camera + object URLs when the dialog goes away for good.
  useEffect(
    () => () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      shotsRef.current.forEach((s) => URL.revokeObjectURL(s.url));
      shotsRef.current = [];
    },
    []
  );

  // Attach the stream once the <video> element exists.
  useEffect(() => {
    const el = videoRef.current;
    if (el && el.srcObject !== stream) {
      el.srcObject = stream;
      if (stream) void el.play().catch(() => undefined);
    }
  }, [stream, phase]);

  const emit = useCallback(
    (files: File[]) => {
      if (files.length === 0) {
        toast.error("Capture a photo first");
        return;
      }
      onFiles(files);
      toast.success(
        files.length === 1
          ? `Scanned → ${files[0].name}`
          : `${files.length} scans added`
      );
      clearShots();
      setReviewUrl(null);
      onClose();
    },
    [clearShots, onClose, onFiles]
  );

  const shoot = useCallback(() => {
    const video = videoRef.current;
    if (!video || !video.videoWidth) {
      toast.error("Camera is still warming up…");
      return;
    }
    if (shotsRef.current.length >= maxShots) {
      toast.error(`Maximum ${maxShots} scans per batch`);
      return;
    }
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      toast.error("This browser can't render the capture");
      return;
    }
    ctx.save();
    if (facing === "user") {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    ctx.restore();

    canvas.toBlob(
      (blob) => {
        if (!blob) {
          toast.error("Capture failed — please try again");
          return;
        }
        const shot: Shot = { file: fileFromBlob(blob, fileNamePrefix, fileExt), url: URL.createObjectURL(blob) };
        if (multiple) {
          shotsRef.current = [...shotsRef.current, shot];
          setShots(shotsRef.current);
        } else {
          clearShots();
          shotsRef.current = [shot];
          setShots([shot]);
          setReviewUrl(shot.url);
          stopStream(); // hand back the camera while reviewing
          setPhase("review");
        }
      },
      "image/jpeg",
      0.95
    );
  }, [clearShots, fileExt, fileNamePrefix, facing, maxShots, multiple, stopStream]);

  const retake = useCallback(() => {
    if (reviewUrl) URL.revokeObjectURL(reviewUrl);
    setReviewUrl(null);
    shotsRef.current = [];
    setShots([]);
    void startCamera(facing);
  }, [facing, reviewUrl, startCamera]);

  const dropShot = useCallback(
    (idx: number) => {
      const target = shotsRef.current[idx];
      if (target) URL.revokeObjectURL(target.url);
      shotsRef.current = shotsRef.current.filter((_, i) => i !== idx);
      setShots(shotsRef.current);
    },
    []
  );

  const onFallbackChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const picked = Array.from(e.target.files ?? []);
      e.target.value = "";
      if (picked.length === 0) return;
      emit(
        picked.map(
          (f) =>
            new File([f], autoFileName(fileNamePrefix, f.name.match(/\.([a-z0-9]{1,5})$/i)?.[1] ?? fileExt), {
              type: f.type,
              lastModified: f.lastModified,
            })
        )
      );
    },
    [emit, fileExt, fileNamePrefix]
  );

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-3 sm:p-6"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-3xl bg-[#0A2540] rounded-3xl overflow-hidden shadow-2xl border border-white/10 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 px-5 py-4 border-b border-white/10">
          <div>
            <h2 className="text-white font-black text-lg flex items-center gap-2">
              <Camera className="h-5 w-5 text-[#FF9933]" />
              {title}
            </h2>
            <p className="text-slate-400 text-xs mt-0.5">{subtitle}</p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close camera"
            className="p-2 rounded-lg text-slate-300 hover:bg-white/10 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Stage */}
        <div className="relative bg-black flex-1 min-h-0 flex items-center justify-center">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={cn(
              "w-full max-h-[52vh] object-contain transition-opacity duration-200",
              phase === "live" ? "opacity-100" : "opacity-0",
              facing === "user" && "-scale-x-100"
            )}
          />

          {phase === "live" && (
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center p-6">
              <div className="relative w-full max-w-sm aspect-[3/4] border-2 border-dashed border-white/45 rounded-2xl">
                <span className="absolute left-1/2 -translate-x-1/2 -top-3 bg-[#FF9933] text-[10px] font-bold text-white px-2 py-0.5 rounded-full flex items-center gap-1">
                  <ScanLine className="h-3 w-3" />
                  ALIGN PAGE
                </span>
              </div>
            </div>
          )}

          {phase === "starting" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-slate-300">
              <RefreshCw className="h-8 w-8 animate-spin text-[#FF9933]" />
              <p className="text-sm font-semibold">Requesting camera access…</p>
              <p className="text-xs text-slate-500">कैमरे की अनुमति दें</p>
            </div>
          )}

          {phase === "review" && reviewUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={reviewUrl} alt="Captured" className="w-full max-h-[52vh] object-contain" />
          )}

          {phase === "error" && (
            <div className="p-6 sm:p-10 text-center max-w-md">
              <div className="mx-auto h-14 w-14 rounded-2xl bg-[#FF9933]/15 flex items-center justify-center mb-4">
                <Info className="h-7 w-7 text-[#FF9933]" />
              </div>
              <p className="text-white font-bold mb-2">Live camera unavailable</p>
              <p className="text-slate-400 text-sm mb-5 leading-relaxed">{error}</p>
              <Button
                variant="saffron"
                onClick={() => fallbackInputRef.current?.click()}
                className="w-full"
              >
                <Camera className="h-4 w-4" />
                Use device camera / डिवाइस कैमरा खोलें
              </Button>
            </div>
          )}
        </div>

        {/* Filmstrip for batch scanning */}
        {multiple && shots.length > 0 && (
          <div className="px-5 py-3 border-t border-white/10 bg-black/25">
            <p className="text-[11px] uppercase tracking-wide text-slate-400 font-bold mb-2">
              Captured {shots.length}/{maxShots}
            </p>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {shots.map((s, i) => (
                <div key={s.url} className="relative shrink-0 group">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={s.url}
                    alt={s.file.name}
                    className="h-16 w-14 object-cover rounded-lg border border-white/15"
                  />
                  <button
                    onClick={() => dropShot(i)}
                    aria-label={`Remove capture ${i + 1}`}
                    className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                  <span className="absolute bottom-0.5 left-0.5 right-0.5 text-[8px] text-white bg-black/60 rounded px-1 truncate">
                    {s.file.name.slice(0, 18)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="p-4 sm:p-5 border-t border-white/10 flex flex-col gap-3">
          {phase === "live" && (
            <div className="flex items-center justify-center gap-3">
              <Button
                variant="ghost"
                className="text-slate-300 hover:bg-white/10 hover:text-white"
                onClick={() => void startCamera(facing === "user" ? "environment" : "user")}
                aria-label="Switch camera"
              >
                <SwitchCamera className="h-5 w-5" />
              </Button>

              <button
                onClick={shoot}
                aria-label="Capture photo"
                className="h-16 w-16 rounded-full bg-[#FF9933] hover:bg-[#e8872d] active:scale-95 transition-all flex items-center justify-center ring-4 ring-white/25"
              >
                <Camera className="h-7 w-7 text-white" />
              </button>

              <Button
                variant="ghost"
                className="text-slate-300 hover:bg-white/10 hover:text-white"
                onClick={() => fallbackInputRef.current?.click()}
                aria-label="Use device camera instead"
              >
                <Plus className="h-5 w-5" />
              </Button>
            </div>
          )}

          {phase === "review" && (
            <div className="flex flex-col sm:flex-row gap-2">
              <Button variant="secondary" onClick={retake} className="flex-1">
                <RefreshCw className="h-4 w-4" />
                Retake / दोबारा लें
              </Button>
              <Button
                variant="saffron"
                onClick={() => emit(shots.slice(-1).map((s) => s.file))}
                className="flex-1"
                disabled={shots.length === 0}
              >
                <Check className="h-4 w-4" />
                Use this photo
              </Button>
            </div>
          )}

          {multiple && (
            <Button
              variant={shots.length > 0 ? "saffron" : "secondary"}
              disabled={shots.length === 0}
              onClick={() => emit(shots.map((s) => s.file))}
              className="w-full"
            >
              <Check className="h-4 w-4" />
              Add {shots.length > 0 ? `${shots.length} scan${shots.length > 1 ? "s" : ""}` : "scans"}
            </Button>
          )}

          {phase !== "error" && (
            <p className="text-[11px] text-slate-500 text-center leading-relaxed">
              Everything stays on your device. Each scan is auto-named like{" "}
              <code className="text-slate-400">{hintName}</code>
            </p>
          )}
        </div>
      </div>

      {/* Native camera fallback */}
      <input
        ref={fallbackInputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        capture={multiple ? undefined : "environment"}
        onChange={onFallbackChange}
        className="hidden"
      />
    </div>
  );
}
