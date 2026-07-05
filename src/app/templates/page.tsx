"use client";
import React, { useState } from "react";
import {
  FileText, Download, Edit3, X, ChevronRight,
  Printer, CheckCircle2, AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn, downloadBlob, triggerConfetti } from "@/lib/utils";
import toast from "react-hot-toast";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

interface Template {
  id: string;
  title: string;
  titleHi: string;
  desc: string;
  category: string;
  fields: { key: string; label: string; labelHi: string; multiline?: boolean; required?: boolean }[];
  color: string;
  icon: string;
}

const TEMPLATES: Template[] = [
  {
    id: "rti",
    title: "RTI Application",
    titleHi: "आरटीआई आवेदन",
    desc: "Right to Information Act, 2005 — Standard application format",
    category: "RTI",
    color: "from-blue-600 to-blue-800",
    icon: "📋",
    fields: [
      { key: "applicantName", label: "Applicant Name", labelHi: "आवेदक का नाम", required: true },
      { key: "address", label: "Full Address", labelHi: "पूरा पता", multiline: true, required: true },
      { key: "mobile", label: "Mobile Number", labelHi: "मोबाइल नंबर", required: true },
      { key: "email", label: "Email Address", labelHi: "ईमेल पता" },
      { key: "department", label: "Department/Office", labelHi: "विभाग/कार्यालय", required: true },
      { key: "infoRequired", label: "Information Required", labelHi: "मांगी गई जानकारी", multiline: true, required: true },
      { key: "period", label: "Time Period of Information", labelHi: "जानकारी की अवधि" },
      { key: "date", label: "Date", labelHi: "दिनांक", required: true },
      { key: "place", label: "Place", labelHi: "स्थान", required: true },
    ],
  },
  {
    id: "affidavit",
    title: "Affidavit",
    titleHi: "शपथ पत्र",
    desc: "General affidavit format for various government purposes",
    category: "Legal",
    color: "from-purple-600 to-purple-800",
    icon: "⚖️",
    fields: [
      { key: "deponentName", label: "Deponent Name", labelHi: "शपथकर्ता का नाम", required: true },
      { key: "fatherName", label: "Father's Name", labelHi: "पिता का नाम", required: true },
      { key: "age", label: "Age", labelHi: "आयु", required: true },
      { key: "address", label: "Full Address", labelHi: "पूरा पता", multiline: true, required: true },
      { key: "purpose", label: "Purpose of Affidavit", labelHi: "शपथ पत्र का उद्देश्य", required: true },
      { key: "statement", label: "Statement (Fact Declaration)", labelHi: "कथन/घोषणा", multiline: true, required: true },
      { key: "date", label: "Date", labelHi: "दिनांक", required: true },
      { key: "place", label: "Place", labelHi: "स्थान", required: true },
    ],
  },
  {
    id: "domicile",
    title: "Domicile Certificate Application",
    titleHi: "अधिवास प्रमाण पत्र आवेदन",
    desc: "Application for Domicile/Residence Certificate from Tehsildar",
    category: "Certificate",
    color: "from-green-600 to-green-800",
    icon: "🏠",
    fields: [
      { key: "applicantName", label: "Applicant Name", labelHi: "आवेदक का नाम", required: true },
      { key: "fatherName", label: "Father's Name", labelHi: "पिता का नाम", required: true },
      { key: "dob", label: "Date of Birth", labelHi: "जन्म तिथि", required: true },
      { key: "address", label: "Permanent Address", labelHi: "स्थायी पता", multiline: true, required: true },
      { key: "residenceSince", label: "Residing in state since", labelHi: "राज्य में निवास से", required: true },
      { key: "purpose", label: "Purpose", labelHi: "उद्देश्य", required: true },
      { key: "mobile", label: "Mobile Number", labelHi: "मोबाइल नंबर" },
      { key: "date", label: "Date", labelHi: "दिनांक", required: true },
    ],
  },
  {
    id: "complaint",
    title: "Complaint Letter",
    titleHi: "शिकायत पत्र",
    desc: "Formal complaint letter to government officer/department",
    category: "Complaint",
    color: "from-red-600 to-red-800",
    icon: "📝",
    fields: [
      { key: "complainantName", label: "Complainant Name", labelHi: "शिकायतकर्ता का नाम", required: true },
      { key: "address", label: "Address", labelHi: "पता", multiline: true, required: true },
      { key: "mobile", label: "Mobile Number", labelHi: "मोबाइल नंबर", required: true },
      { key: "officerName", label: "To (Officer Name & Designation)", labelHi: "प्रति (अधिकारी नाम)", required: true },
      { key: "department", label: "Department", labelHi: "विभाग", required: true },
      { key: "subject", label: "Subject of Complaint", labelHi: "शिकायत का विषय", required: true },
      { key: "complaint", label: "Complaint Details", labelHi: "शिकायत का विवरण", multiline: true, required: true },
      { key: "relief", label: "Relief Sought", labelHi: "मांगी गई राहत", multiline: true },
      { key: "date", label: "Date", labelHi: "दिनांक", required: true },
    ],
  },
];

async function generatePDF(template: Template, values: Record<string, string>): Promise<Blob> {
  const pdfDoc = await PDFDocument.create();
  const timesRomanFont = await pdfDoc.embedFont(StandardFonts.TimesRoman);
  const timesRomanBold = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);

  const page = pdfDoc.addPage([595.28, 841.89]); // A4
  const { width, height } = page.getSize();
  const margin = 60;
  const contentWidth = width - margin * 2;

  let y = height - margin;

  // Header
  page.drawRectangle({ x: 0, y: height - 50, width, height: 50, color: rgb(0.04, 0.145, 0.251) });
  page.drawText("GOVERNMENT OF INDIA", {
    x: margin,
    y: height - 32,
    size: 12,
    font: timesRomanBold,
    color: rgb(1, 1, 1),
  });
  page.drawText("DocReady – Official Document Format", {
    x: width - margin - 200,
    y: height - 32,
    size: 8,
    font: timesRomanFont,
    color: rgb(0.9, 0.9, 0.9),
  });

  // Saffron line
  page.drawRectangle({ x: 0, y: height - 53, width, height: 3, color: rgb(1, 0.6, 0.2) });

  y = height - 80;

  // Title
  const titleText = template.title.toUpperCase();
  const titleSize = 16;
  const titleWidth = timesRomanBold.widthOfTextAtSize(titleText, titleSize);
  page.drawText(titleText, {
    x: (width - titleWidth) / 2,
    y,
    size: titleSize,
    font: timesRomanBold,
    color: rgb(0.04, 0.145, 0.251),
  });

  y -= 8;
  page.drawLine({
    start: { x: margin, y },
    end: { x: width - margin, y },
    thickness: 1,
    color: rgb(0.04, 0.145, 0.251),
  });

  y -= 24;

  // Date and Place at top right if present
  if (values.place || values.date) {
    page.drawText(`Place: ${values.place || "___________"}    Date: ${values.date || "___________"}`, {
      x: width - margin - 250,
      y,
      size: 10,
      font: timesRomanFont,
      color: rgb(0.2, 0.2, 0.2),
    });
    y -= 20;
  }

  y -= 8;

  // Body content
  const lineHeight = 18;
  const drawWrappedText = (text: string, startX: number, startY: number, maxWidth: number, size: number, bold = false) => {
    const font = bold ? timesRomanBold : timesRomanFont;
    const words = text.split(" ");
    let line = "";
    let currentY = startY;

    for (const word of words) {
      const testLine = line + (line ? " " : "") + word;
      const textWidth = font.widthOfTextAtSize(testLine, size);
      if (textWidth > maxWidth && line) {
        page.drawText(line, { x: startX, y: currentY, size, font, color: rgb(0.1, 0.1, 0.1) });
        currentY -= lineHeight;
        line = word;
      } else {
        line = testLine;
      }
    }
    if (line) {
      page.drawText(line, { x: startX, y: currentY, size, font, color: rgb(0.1, 0.1, 0.1) });
      currentY -= lineHeight;
    }
    return startY - currentY;
  };

  // Render each field
  for (const field of template.fields) {
    if (field.key === "date" || field.key === "place") continue;
    const val = values[field.key] || "___________________________";

    // Label
    page.drawText(`${field.label}:`, {
      x: margin,
      y,
      size: 9,
      font: timesRomanBold,
      color: rgb(0.4, 0.4, 0.4),
    });
    y -= 14;

    const height2 = drawWrappedText(val, margin, y, contentWidth, 11);
    y -= height2 + 4;

    // Underline
    page.drawLine({
      start: { x: margin, y: y + 2 },
      end: { x: width - margin, y: y + 2 },
      thickness: 0.3,
      color: rgb(0.8, 0.8, 0.8),
    });
    y -= 12;

    if (y < 100) break; // Safety
  }

  // Signature area
  y -= 20;
  page.drawText("Signature of Applicant", {
    x: width - margin - 130,
    y: y - 30,
    size: 9,
    font: timesRomanFont,
    color: rgb(0.3, 0.3, 0.3),
  });
  page.drawLine({
    start: { x: width - margin - 140, y: y - 35 },
    end: { x: width - margin, y: y - 35 },
    thickness: 0.5,
    color: rgb(0.3, 0.3, 0.3),
  });

  // Footer
  page.drawRectangle({ x: 0, y: 0, width, height: 28, color: rgb(0.04, 0.145, 0.251) });
  page.drawText("Generated by DocReady | docready.app | All processing done locally on your device", {
    x: margin,
    y: 10,
    size: 7,
    font: timesRomanFont,
    color: rgb(0.7, 0.7, 0.7),
  });

  const pdfBytes = await pdfDoc.save();
  return new Blob([pdfBytes.buffer as ArrayBuffer], { type: "application/pdf" });
}

export default function TemplatesPage() {
  const [activeTemplate, setActiveTemplate] = useState<Template | null>(null);
  const [values, setValues] = useState<Record<string, string>>({});
  const [generating, setGenerating] = useState(false);
  const [errors, setErrors] = useState<Record<string, boolean>>({});

  const openTemplate = (t: Template) => {
    setActiveTemplate(t);
    setValues({});
    setErrors({});
  };

  const closeTemplate = () => {
    setActiveTemplate(null);
    setValues({});
  };

  const validate = () => {
    if (!activeTemplate) return false;
    const newErrors: Record<string, boolean> = {};
    for (const f of activeTemplate.fields) {
      if (f.required && !values[f.key]?.trim()) {
        newErrors[f.key] = true;
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleGenerate = async () => {
    if (!activeTemplate) return;
    if (!validate()) {
      toast.error("Please fill all required fields");
      return;
    }
    setGenerating(true);
    try {
      const blob = await generatePDF(activeTemplate, values);
      downloadBlob(blob, `${activeTemplate.id}-docready.pdf`);
      triggerConfetti();
      toast.success("PDF generated and downloaded! 🎉");
    } catch (e) {
      toast.error("Failed to generate PDF. Please try again.");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-[#0A2540] text-white py-10 px-4">
        <div className="mx-auto max-w-5xl text-center">
          <Badge variant="saffron" className="mb-3">Ready to Fill</Badge>
          <h1 className="text-3xl sm:text-4xl font-black mb-2">Government Templates</h1>
          <p className="text-slate-300 text-sm sm:text-base">सरकारी टेम्पलेट – भरें और डाउनलोड करें</p>
          <p className="text-slate-400 text-xs mt-1">
            A4 format • Times New Roman • 1.5 line spacing • Gov standard
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 sm:px-6 py-8">
        {!activeTemplate ? (
          /* Template Grid */
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {TEMPLATES.map((t) => (
              <div
                key={t.id}
                className="bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200"
              >
                <div className={`bg-gradient-to-r ${t.color} p-5`}>
                  <div className="flex items-center justify-between">
                    <span className="text-3xl">{t.icon}</span>
                    <Badge className="bg-white/20 text-white border-white/30 text-xs">
                      {t.category}
                    </Badge>
                  </div>
                  <h3 className="text-lg font-black text-white mt-3">{t.title}</h3>
                  <p className="text-white/70 text-sm">{t.titleHi}</p>
                </div>
                <div className="p-5">
                  <p className="text-sm text-slate-500 mb-4 leading-relaxed">{t.desc}</p>
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-slate-400">
                      {t.fields.length} fields • A4 PDF
                    </div>
                    <Button
                      onClick={() => openTemplate(t)}
                      variant="saffron"
                      size="sm"
                      className="gap-1"
                    >
                      <Edit3 className="h-3.5 w-3.5" />
                      Fill & Download
                      <ChevronRight className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Template Editor */
          <div className="max-w-2xl mx-auto">
            {/* Back & Header */}
            <div className="flex items-center gap-3 mb-6">
              <Button variant="secondary" size="sm" onClick={closeTemplate}>
                ← Back
              </Button>
              <div>
                <h2 className="font-black text-[#0A2540] text-lg">{activeTemplate.title}</h2>
                <p className="text-xs text-slate-400">{activeTemplate.titleHi}</p>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl mb-6">
                <AlertCircle className="h-4 w-4 text-amber-500 shrink-0" />
                <p className="text-xs text-amber-700">
                  Fill in the fields below. Required fields are marked with *. PDF will be generated in A4, Times New Roman format.
                </p>
              </div>

              <div className="space-y-4">
                {activeTemplate.fields.map((field) => (
                  <div key={field.key}>
                    <label className="block text-sm font-semibold text-[#0A2540] mb-1">
                      {field.label}
                      {field.required && <span className="text-red-500 ml-1">*</span>}
                      <span className="text-slate-400 font-normal ml-2 text-xs">/ {field.labelHi}</span>
                    </label>
                    {field.multiline ? (
                      <textarea
                        rows={3}
                        value={values[field.key] || ""}
                        onChange={(e) => {
                          setValues((v) => ({ ...v, [field.key]: e.target.value }));
                          if (errors[field.key]) setErrors((e2) => ({ ...e2, [field.key]: false }));
                        }}
                        className={cn(
                          "w-full border-2 rounded-xl px-4 py-2.5 text-sm resize-none focus:outline-none transition-colors",
                          errors[field.key]
                            ? "border-red-300 bg-red-50 focus:border-red-500"
                            : "border-slate-200 focus:border-[#FF9933]"
                        )}
                        placeholder={`Enter ${field.label.toLowerCase()}...`}
                      />
                    ) : (
                      <input
                        type="text"
                        value={values[field.key] || ""}
                        onChange={(e) => {
                          setValues((v) => ({ ...v, [field.key]: e.target.value }));
                          if (errors[field.key]) setErrors((e2) => ({ ...e2, [field.key]: false }));
                        }}
                        className={cn(
                          "w-full border-2 rounded-xl px-4 py-2.5 text-sm focus:outline-none transition-colors",
                          errors[field.key]
                            ? "border-red-300 bg-red-50 focus:border-red-500"
                            : "border-slate-200 focus:border-[#FF9933]"
                        )}
                        placeholder={`Enter ${field.label.toLowerCase()}...`}
                      />
                    )}
                    {errors[field.key] && (
                      <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" /> This field is required
                      </p>
                    )}
                  </div>
                ))}
              </div>

              <div className="mt-8 flex flex-col sm:flex-row gap-3">
                <Button
                  onClick={handleGenerate}
                  disabled={generating}
                  variant="saffron"
                  size="lg"
                  className="flex-1"
                >
                  {generating ? (
                    <><FileText className="h-4 w-4 animate-pulse" /> Generating PDF...</>
                  ) : (
                    <><Download className="h-4 w-4" /> Generate & Download PDF</>
                  )}
                </Button>
                <Button variant="secondary" size="lg" onClick={closeTemplate}>
                  <X className="h-4 w-4" /> Cancel
                </Button>
              </div>

              <div className="mt-4 flex items-center gap-2 text-xs text-slate-400">
                <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                A4 format • Times New Roman • Standard gov formatting
              </div>
            </div>
          </div>
        )}

        {/* Info box */}
        {!activeTemplate && (
          <div className="mt-8 bg-[#0A2540]/5 rounded-2xl p-5">
            <h3 className="font-bold text-[#0A2540] mb-3">📌 Important Notes / महत्वपूर्ण जानकारी</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-600">
              <div className="bg-white rounded-lg p-3 border border-slate-100">
                These templates are for reference only. Always check with the concerned authority for the latest format.
              </div>
              <div className="bg-white rounded-lg p-3 border border-slate-100">
                For RTI applications, Rs. 10/- court fee stamp may be required. Attach with the application.
              </div>
              <div className="bg-white rounded-lg p-3 border border-slate-100">
                Affidavits must be notarized/attested by a Notary or Executive Magistrate.
              </div>
              <div className="bg-white rounded-lg p-3 border border-slate-100">
                All processing happens on your device. No data is sent to any server.
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
