import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
}

export function parseTargetSize(input: string): number | null {
  const match = input.match(/(\d+(?:\.\d+)?)\s*(kb|mb|bytes?)/i);
  if (!match) return null;
  const value = parseFloat(match[1]);
  const unit = match[2].toLowerCase();
  if (unit === "mb") return value * 1024 * 1024;
  if (unit.startsWith("kb")) return value * 1024;
  return value;
}

export async function compressImageToTarget(
  file: File,
  targetBytes: number
): Promise<{ blob: Blob; quality: number; iterations: number }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("Canvas not supported"));
        ctx.drawImage(img, 0, 0);

        let low = 0.01;
        let high = 1.0;
        let best: Blob | null = null;
        let bestQuality = 0.5;
        let iterations = 0;
        const MAX_ITER = 15;

        const attempt = () => {
          if (iterations >= MAX_ITER || high - low < 0.01) {
            if (best) {
              resolve({ blob: best, quality: bestQuality, iterations });
            } else {
              canvas.toBlob(
                (b) => {
                  if (b) resolve({ blob: b, quality: low, iterations });
                  else reject(new Error("Compression failed"));
                },
                "image/jpeg",
                low
              );
            }
            return;
          }

          const mid = (low + high) / 2;
          iterations++;
          canvas.toBlob(
            (blob) => {
              if (!blob) return reject(new Error("Blob creation failed"));
              if (blob.size <= targetBytes) {
                best = blob;
                bestQuality = mid;
                low = mid;
              } else {
                high = mid;
              }
              attempt();
            },
            "image/jpeg",
            mid
          );
        };

        attempt();
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
}

export function dataURLtoBlob(dataURL: string): Blob {
  const arr = dataURL.split(",");
  const mime = arr[0].match(/:(.*?);/)![1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) u8arr[n] = bstr.charCodeAt(n);
  return new Blob([u8arr], { type: mime });
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function triggerConfetti() {
  if (typeof window === "undefined") return;
  import("canvas-confetti").then(({ default: confetti }) => {
    confetti({
      particleCount: 120,
      spread: 80,
      origin: { y: 0.6 },
      colors: ["#FF9933", "#ffffff", "#138808", "#0A2540"],
    });
  });
}
