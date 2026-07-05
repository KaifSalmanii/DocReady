"use client";

import React, { useState, useRef } from "react";
import { DOC_SIZES, loadImage } from "@/lib/utils";
import { removeBackground } from "@imgly/background-removal";


export default function DocProcessorPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [docType, setDocType] = useState<keyof typeof DOC_SIZES>("PAN");
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedUrl, setProcessedUrl] = useState<string | null>(null);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setProcessedUrl(null);
    }
  };

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
            <img src={processedUrl} alt="Processed" className="max-w-full h-auto shadow-sm" /> 
          </div>
          <a 
            href={processedUrl} 
            download={`${docType}_Processed.jpg`}
            className="mt-4 inline-block bg-green-600 text-white py-2 px-6 rounded hover:bg-green-700 w-full text-center font-bold"
          >
            Download Processed File
          </a>
        </div>
      )}
    </div>
  );
}
