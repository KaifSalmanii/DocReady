"use client";
import { Toaster } from "react-hot-toast";

export function ToastProvider() {
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 4000,
        style: {
          background: "#0A2540",
          color: "#fff",
          borderRadius: "12px",
          padding: "12px 16px",
          fontSize: "14px",
          fontWeight: 500,
        },
        success: {
          iconTheme: { primary: "#FF9933", secondary: "#fff" },
        },
        error: {
          style: { background: "#dc2626", color: "#fff" },
        },
      }}
    />
  );
}
