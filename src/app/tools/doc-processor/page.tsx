"use client";

import React, { useState, useRef, useCallback } from "react";
import { Camera } from "lucide-react";
import { DOC_SIZES, loadImage } from "@/lib/utils";
import { removeBackground } from "@imgly/background-removal";
import CameraScanButton from "@/components/CameraScanButton";
import FileNameField from "@/components/FileNameField";
import { randomFileStem, slugPrefix } from "@/lib/filename";
import { useFileName } from "@/lib/use-file-name";

export default function DocProcessorPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [docType, setDocType] = useState<keyof typeof DOC_SIZES>("PAN");
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedUrl, setProcessedUrl] = useState<string | null>(null);
  const [scanned, setScanned] = useState(false);

  // Output name: random (date + time + code, no spaces) and renamable.
  const outName = useFileName("docready-doc", "jpg");

  const canvasRef = useRef<HTMLCanvasElement>(null);

  const applyFile = useCallback(
    (file: File, fromCamera = false) => {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setProcessedUrl(null);
      setScanned(fromCamera);
      outName.setName(randomFileStem(slugPrefix(`${docType}-processed`)));
    },
    [docType, outName]
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) applyFile(e.target.files[0]);
  };

  const handleScan = useCallback(
    (files: File[]) => {
      if (files[0]) applyFile(files[0], true);
    },
    [applyFile]
  );

  const handleProcess = async () => {
    if (!selectedFile || !previewUrl || !canvasRef.current) return;
    setIsProcessing(true);

    try {
      let finalImageUrl = previewUrl;

      // 1. Background Removal
      try {
        const bgRemovedBlob = await removeBackground(previewUrl);
        finalImageUrl = URL.createObjectURL(bgRemovedBlob);
      } catch (bgError) {
        console.log("Background removal skipped/failed:", bgError);
      }

      // 2. Load Image to Canvas
      const img = await loadImage(finalImageUrl);
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");

      if (!ctx) throw new Error("Canvas context failed");

      // 3. Set Dimensions for Standard ID
      const targetSize = DOC_SIZES[docType];
      const scale = 11.81; // 300 DPI scale
      const targetWidth = Math.round(targetSize.width * scale);
      const targetHeight = Math.round(targetSize.height * scale);

      canvas.width = targetWidth;
      canvas.height = targetHeight;

      // Set White Background
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, targetWidth, targetHeight);

      // Fit Image
      ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

      // 4. Output Final Image
      const finalDataUrl = canvas.toDataURL("image/jpeg", 0.9);
      setProcessedUrl(finalDataUrl);
      // New file -> new random name.
      outName.setName(randomFileStem(slugPrefix(`${docType}-processed`)));

    } catch (error) {
      console.error("Processing Error:", error);
      alert("Error processing document.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6 mt-10 bg-white rounded-lg shadow-md">
      <h1 className="text-2xl font-bold mb-4">Smart Document Processor</h1>
      <p className="text-sm text-gray-500 mb-6 border-l-4 border-blue-500 pl-3">
        Disclaimer: All processing happens locally on your device. No files are uploaded to any server.
      </p>

      <div className="flex flex-col gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium mb-1">Select Document Type:</label>
          <select
            className="w-full p-2 border rounded bg-white text-black"
            value={docType}
            onChange={(e) => setDocType(e.target.value as keyof typeof DOC_SIZES)}
          >
            {Object.entries(DOC_SIZES).map(([key, val]) => (
              <option key={key} value={key}>{val.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Upload File (Image):</label>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="w-full p-2 border rounded"
          />
          <div className="mt-3 flex flex-col sm:flex-row items-center gap-3 bg-slate-50 border border-dashed border-slate-300 rounded p-3">
            <CameraScanButton
              onFiles={handleScan}
              fileNamePrefix={`${docType.toLowerCase()}-scan`}
              title="Scan Document with Camera"
              subtitle="कैमरे से दस्तावेज़ की फोटो लें और यहीं प्रोसेस करें"
              label="Scan with Camera"
              size="sm"
            />
            <p className="text-xs text-gray-500 text-left">
              {scanned && selectedFile ? (
                <>
                  Scanned file: <code className="font-mono">{selectedFile.name}</code>
                </>
              ) : (
                <>
                  <Camera className="h-3.5 w-3.5 inline mr-1" />
                  Capture each side of the card — every scan gets a random, space-free file name.
                </>
              )}
            </p>
          </div>
          {selectedFile && (
            <p className="text-xs text-gray-500 mt-2">
              Selected: <code className="font-mono">{selectedFile.name}</code>
            </p>
          )}
        </div>

        <button
          onClick={handleProcess}
          disabled={!selectedFile || isProcessing}
          className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:bg-gray-400"
        >
          {isProcessing ? "Processing (Please wait)..." : "Auto-Crop & Remove BG"}
        </button>
      </div>

      <canvas ref={canvasRef} style={{ display: 'none' }}></canvas>

      {processedUrl && (
        <div className="mt-6 border-t pt-6">
          <h2 className="text-lg font-semibold mb-2">Processed Document:</h2>
          <div className="border-2 border-dashed border-gray-300 p-2 flex justify-center bg-gray-50 rounded">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={processedUrl} alt="Processed" className="max-w-full h-auto shadow-sm" />
          </div>

          <div className="mt-4">
            <FileNameField
              value={outName.stem}
              extension="jpg"
              onChange={outName.setName}
              onRandomize={outName.randomize}
              label="Download file name"
              hint={`Random name (date + time + code), no spaces — rename it if you want.`}
            />
          </div>

          <a
            href={processedUrl}
            download={outName.fileName}
            className="mt-4 inline-block bg-green-600 text-white py-2 px-6 rounded hover:bg-green-700 w-full text-center font-bold"
          >
            Download {outName.fileName}
          </a>
        </div>
      )}
    </div>
  );
}
