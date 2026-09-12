"use client";

import React, { useCallback, useState } from "react";
import { Camera } from "lucide-react";
import CameraScanner from "@/components/CameraScanner";
import { Button, type ButtonProps } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface CameraScanButtonProps {
  onFiles: (files: File[]) => void;
  multiple?: boolean;
  maxShots?: number;
  accept?: string;
  fileNamePrefix?: string;
  fileExt?: string;
  title?: string;
  subtitle?: string;
  label?: string;
  labelHi?: string;
  variant?: ButtonProps["variant"];
  size?: ButtonProps["size"];
  className?: string;
  disabled?: boolean;
  fullWidth?: boolean;
}

/**
 * Drop-in "Scan with Camera" trigger + the camera dialog it opens.
 * Used by every place in DocReady where a photo can be uploaded.
 */
export default function CameraScanButton({
  onFiles,
  multiple = false,
  maxShots = 10,
  accept = "image/*",
  fileNamePrefix = "scan",
  fileExt = "jpg",
  title = "Scan with Camera",
  subtitle = "अपने कैमरे से फोटो / दस्तावेज़ स्कैन करें",
  label = "Scan with Camera",
  labelHi = "कैमरे से स्कैन करें",
  variant = "saffron",
  size = "default",
  className,
  disabled,
  fullWidth,
}: CameraScanButtonProps) {
  const [open, setOpen] = useState(false);

  const handleClose = useCallback(() => setOpen(false), []);
  const handleOpen = useCallback(
    (e: React.MouseEvent) => {
      // Keep the click from bubbling into a parent react-dropzone root.
      e.stopPropagation();
      setOpen(true);
    },
    []
  );

  const handleFiles = useCallback(
    (files: File[]) => {
      onFiles(files);
      setOpen(false);
    },
    [onFiles]
  );

  return (
    <>
      <Button
        type="button"
        variant={variant}
        size={size}
        onClick={handleOpen}
        disabled={disabled}
        className={cn(fullWidth && "w-full", className)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") e.stopPropagation();
        }}
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <Camera className={size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4"} />
        {label}
        {labelHi && <span className="font-normal opacity-80">/ {labelHi}</span>}
      </Button>

      {open && <CameraScanner
        open
        onClose={handleClose}
        onFiles={handleFiles}
        multiple={multiple}
        maxShots={maxShots}
        accept={accept}
        fileNamePrefix={fileNamePrefix}
        fileExt={fileExt}
        title={title}
        subtitle={subtitle}
      />}
    </>
  );
}
