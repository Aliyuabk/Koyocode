"use client";

import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import Image from "next/image";
import CopyLinkButton from "./CopyLinkButton";

export default function CertificateView({
  studentName,
  courseTitle,
  courseIcon,
  verificationCode,
  issuedAt,
  score,
}: {
  studentName: string;
  courseTitle: string;
  courseIcon: string;
  verificationCode: string;
  issuedAt: string;
  score: number | null;
}) {
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);
  const certRef = useRef<HTMLDivElement>(null);

  const verifyUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/verify/${verificationCode}`
      : `/verify/${verificationCode}`;

  useEffect(() => {
    let cancelled = false;
    QRCode.toDataURL(verifyUrl, {
      width: 220,
      margin: 1,
      errorCorrectionLevel: "M",
      color: { dark: "#1e3a8a", light: "#fbfaf7" },
    })
      .then((url) => {
        if (!cancelled) setQrDataUrl(url);
      })
      .catch(() => {
        if (!cancelled) setQrDataUrl(null);
      });
    return () => {
      cancelled = true;
    };
  }, [verifyUrl]);

  const issuedDate = new Date(issuedAt).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const displayUrl = verifyUrl.replace(/^https?:\/\//, "");
  const shortCode = verificationCode.slice(0, 12).toUpperCase();

  function handlePrint() {
    window.print();
  }

  /**
   * Generate a pixel-perfect A4 landscape PDF from the certificate DOM.
   * Uses html2canvas + jspdf (loaded dynamically so they don't bloat
   * the initial bundle).
   */
  async function handleDownloadPdf() {
    if (!certRef.current) return;
    setDownloading(true);

    try {
      // Dynamic import — only pulled in when user clicks Download
      const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
        import("html2canvas-pro"),
        import("jspdf"),
      ]);

      const node = certRef.current;

      const canvas = await html2canvas(node, {
        backgroundColor: "#fbfaf7",
        scale: 2, // 2x for crisp output
        useCORS: true,
        logging: false,
        windowWidth: node.scrollWidth,
        windowHeight: node.scrollHeight,
      });

      const imgData = canvas.toDataURL("image/png", 1.0);

      // A4 landscape: 297 x 210 mm
      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4",
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      // Fit canvas to page with a small margin
      const margin = 6;
      const availW = pageWidth - margin * 2;
      const availH = pageHeight - margin * 2;
      const imgAspect = canvas.width / canvas.height;
      const pageAspect = availW / availH;

      let renderW = availW;
      let renderH = availH;

      if (imgAspect > pageAspect) {
        // Image is wider — constrain by width
        renderH = availW / imgAspect;
      } else {
        // Image is taller — constrain by height
        renderW = availH * imgAspect;
      }

      const x = (pageWidth - renderW) / 2;
      const y = (pageHeight - renderH) / 2;

      pdf.addImage(imgData, "PNG", x, y, renderW, renderH);

      // Filename: koyocode-cert-<course-slug>-<shortcode>.pdf
      const safeCourse = courseTitle
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
      pdf.save(`koyocode-certificate-${safeCourse}-${shortCode}.pdf`);
    } catch (err) {
      console.error("PDF generation failed:", err);
      alert("Could not generate PDF. Try the Print button instead.");
    } finally {
      setDownloading(false);
    }
  }

  return (
    <>
      {/* ACTIONS — hidden when printing */}
      <div className="mb-6 flex flex-wrap justify-center gap-3 print:hidden">
        <button
          onClick={handleDownloadPdf}
          disabled={downloading}
          className="inline-flex items-center gap-2 rounded-full bg-blue-700 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-blue-700/20 transition hover:-translate-y-0.5 hover:bg-blue-800 disabled:opacity-60 dark:bg-blue-600 dark:hover:bg-blue-500"
        >
          {downloading ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
              Generating PDF…
            </>
          ) : (
            <>⬇ Download PDF</>
          )}
        </button>
 

        <CopyLinkButton url={verifyUrl} />
      </div>

      {/* ============================================================
          CERTIFICATE
          Fixed light theme (cream paper). Ignores dark mode by design.
         ============================================================ */}
      <div
        id="certificate"
        ref={certRef}
        className="certificate-print relative mx-auto shadow-2xl shadow-blue-900/20"
        style={{
          maxWidth: "1120px",
          aspectRatio: "1.414 / 1",
          background: "#fbfaf7",
          color: "#0f172a",
          fontFamily:
            "'Playfair Display', Georgia, 'Times New Roman', serif",
        }}
      >
        {/* Corner brackets */}
        <Bracket className="left-4 top-4" />
        <Bracket className="right-4 top-4 rotate-90" />
        <Bracket className="right-4 bottom-4 rotate-180" />
        <Bracket className="left-4 bottom-4 -rotate-90" />

        {/* Watermark K */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 flex items-center justify-center"
        >
          <span
            className="select-none text-[420px] font-black leading-none opacity-[0.035]"
            style={{
              fontFamily: "Georgia, 'Times New Roman', serif",
              color: "#1d4ed8",
            }}
          >
            K
          </span>
        </div>

        {/* MAIN LAYOUT — content | ribbon */}
        <div className="absolute inset-8 flex gap-6">
          {/* ======================= LEFT ======================= */}
          <div className="relative flex flex-1 flex-col">
            {/* HEADER — logo */}
            <div className="flex flex-col items-center">
              {/*
                The logo asset is a "reversed" (light-on-transparent) version.
                On cream background it disappears — we render a solid
                KoyoCode-blue wordmark via text instead, using the brand color.
                If you later add a dark-on-light logo asset at
                /koyocode-logo.png, swap the <Image> below.
              */}
              <div className="flex items-center gap-3">
                <span
                  className="flex h-12 w-12 items-center justify-center rounded-xl text-2xl font-black"
                  style={{ background: "#1d4ed8", color: "#fbfaf7" }}
                >
                  K
                </span>
                <span
                  className="text-3xl font-bold tracking-tight"
                  style={{
                    color: "#1d4ed8",
                    fontFamily:
                      "'Playfair Display', Georgia, 'Times New Roman', serif",
                  }}
                >
                  KoyoCode
                </span>
              </div>
              <p
                className="mt-2 text-[10px] font-semibold uppercase tracking-[0.32em]"
                style={{ color: "#1d4ed8", fontFamily: "Inter, sans-serif" }}
              >
                New Generation Tech Academy
              </p>
            </div>

            {/* TITLE */}
            <div className="mt-6 text-center">
              <p
                className="text-[10px] font-bold uppercase tracking-[0.4em]"
                style={{ color: "#1d4ed8", fontFamily: "Inter, sans-serif" }}
              >
                Certificate of Completion
              </p>
              <div
                className="mx-auto mt-3 h-[3px] w-24 rounded-full"
                style={{
                  background:
                    "linear-gradient(90deg, transparent, #1d4ed8, transparent)",
                }}
              />
            </div>

            {/* BODY */}
            <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
              <p
                className="text-xs uppercase tracking-[0.25em]"
                style={{ color: "#64748b", fontFamily: "Inter, sans-serif" }}
              >
                This certificate is proudly presented to
              </p>

              <h1
                className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl lg:text-[64px]"
                style={{
                  color: "#0f172a",
                  fontFamily:
                    "'Playfair Display', Georgia, 'Times New Roman', serif",
                  lineHeight: 1.05,
                }}
              >
                {studentName}
              </h1>

              <div className="mt-3 flex items-center gap-2">
                <div
                  className="h-px w-12"
                  style={{ background: "#1d4ed8", opacity: 0.4 }}
                />
                <div
                  className="h-1.5 w-1.5 rotate-45"
                  style={{ background: "#1d4ed8" }}
                />
                <div
                  className="h-px w-12"
                  style={{ background: "#1d4ed8", opacity: 0.4 }}
                />
              </div>

              <p
                className="mt-6 max-w-md text-sm leading-relaxed"
                style={{ color: "#475569", fontFamily: "Inter, sans-serif" }}
              >
                for successfully completing all lessons and passing the final
                examination of
              </p>

              <h2
                className="mt-4 text-2xl font-bold tracking-tight sm:text-3xl"
                style={{
                  color: "#1d4ed8",
                  fontFamily:
                    "'Playfair Display', Georgia, 'Times New Roman', serif",
                }}
              >
                {courseTitle}
              </h2>

              <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
                {score !== null && (
                  <Badge color="#059669" bg="#ecfdf5">
                    ✓ Final score · {score}%
                  </Badge>
                )}
                <Badge color="#1d4ed8" bg="#eff6ff">
                  ID · {shortCode}
                </Badge>
              </div>
            </div>

            {/* FOOTER */}
            <div className="grid grid-cols-3 items-end gap-4 pt-4">
              <div className="text-center">
                <p
                  className="text-xl italic leading-none"
                  style={{
                    fontFamily: "'Brush Script MT', 'Segoe Script', cursive",
                    color: "#1e3a8a",
                  }}
                >
                  Aliyu Abubakar
                </p>
                <div
                  className="mx-auto mt-1 h-px w-24"
                  style={{ background: "#1d4ed8" }}
                />
                <p
                  className="mt-2 text-[9px] font-bold uppercase tracking-[0.18em]"
                  style={{
                    color: "#475569",
                    fontFamily: "Inter, sans-serif",
                  }}
                >
                  Founder &amp; Lead Instructor
                </p>
              </div>

              <div className="text-center">
                <p
                  className="text-xs font-bold"
                  style={{ color: "#0f172a", fontFamily: "Inter, sans-serif" }}
                >
                  {issuedDate}
                </p>
                <div
                  className="mx-auto mt-1 h-px w-24"
                  style={{ background: "#cbd5e1" }}
                />
                <p
                  className="mt-2 text-[9px] font-bold uppercase tracking-[0.18em]"
                  style={{
                    color: "#475569",
                    fontFamily: "Inter, sans-serif",
                  }}
                >
                  Date of Issue
                </p>
              </div>

              <div className="flex flex-col items-center">
                <div
                  className="flex h-[88px] w-[88px] items-center justify-center overflow-hidden rounded-md border"
                  style={{ borderColor: "#cbd5e1", background: "#fbfaf7" }}
                >
                  {qrDataUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={qrDataUrl}
                      alt="Verification QR code"
                      width={80}
                      height={80}
                      style={{ display: "block" }}
                    />
                  ) : (
                    <span
                      className="text-[8px] tracking-wider"
                      style={{
                        color: "#94a3b8",
                        fontFamily: "Inter, sans-serif",
                      }}
                    >
                      LOADING
                    </span>
                  )}
                </div>
                <p
                  className="mt-2 text-[8px] font-bold uppercase tracking-[0.18em]"
                  style={{
                    color: "#475569",
                    fontFamily: "Inter, sans-serif",
                  }}
                >
                  Scan to verify
                </p>
              </div>
            </div>

            {/* Verify URL */}
            <div
              className="mt-4 border-t pt-3 text-center"
              style={{ borderColor: "#e2e8f0" }}
            >
              <p
                className="text-[9px] font-semibold uppercase tracking-[0.2em]"
                style={{ color: "#94a3b8", fontFamily: "Inter, sans-serif" }}
              >
                Verify this credential at
              </p>
              <p
                className="mt-0.5 break-all text-[10px] font-medium"
                style={{ color: "#1d4ed8", fontFamily: "Inter, sans-serif" }}
              >
                {displayUrl}
              </p>
            </div>
          </div>

          {/* ======================= RIGHT: RIBBON ======================= */}
          <div
            className="relative hidden w-[26%] max-w-[260px] shrink-0 overflow-hidden rounded-l-[80px] sm:block"
            style={{
              background:
                "linear-gradient(160deg, #dbeafe 0%, #eef4ff 45%, #e0eaff 100%)",
            }}
          >
            <div
              className="absolute inset-3 rounded-l-[68px] border"
              style={{ borderColor: "rgba(29,78,216,0.18)" }}
            />

            <div className="relative flex h-full flex-col items-center justify-between py-8">
              <div className="flex flex-col items-center">
                <div
                  className="flex h-9 w-9 items-center justify-center rounded-full"
                  style={{ background: "#1d4ed8" }}
                >
                  <span
                    className="text-lg font-black"
                    style={{ color: "#fbfaf7" }}
                  >
                    K
                  </span>
                </div>
                <p
                  className="mt-3 text-[10px] font-bold uppercase tracking-[0.3em]"
                  style={{ color: "#1d4ed8", fontFamily: "Inter, sans-serif" }}
                >
                  Verified
                </p>
              </div>

              <div className="flex flex-col items-center">
                <HexSeal />
                <p
                  className="mt-4 text-[9px] font-bold uppercase tracking-[0.25em]"
                  style={{
                    color: "#1e3a8a",
                    fontFamily: "Inter, sans-serif",
                  }}
                >
                  KoyoCode · {new Date(issuedAt).getFullYear()}
                </p>
              </div>

              <div className="flex flex-col items-center gap-3">
                <p
                  className="text-3xl"
                  aria-label="Course icon"
                  style={{ lineHeight: 1 }}
                >
                  {courseIcon}
                </p>
                <div className="flex items-center gap-1.5">
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      className="h-1 w-1 rounded-full"
                      style={{ background: "#1d4ed8", opacity: 0.5 }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* PRINT STYLES — fallback if user hits Ctrl+P directly */}
      <style>{`
        @media print {
          @page { size: A4 landscape; margin: 0; }
          html, body { background: #fbfaf7 !important; }
          .print\\:hidden { display: none !important; }
          header, footer, nav, aside { display: none !important; }
          .certificate-print {
            box-shadow: none !important;
            width: 100% !important;
            height: 100% !important;
            max-width: none !important;
            aspect-ratio: auto !important;
            margin: 0 !important;
            color-scheme: light !important;
          }
        }
      `}</style>
    </>
  );
}

/* ============================================================
   Corner bracket
   ============================================================ */
function Bracket({ className = "" }: { className?: string }) {
  return (
    <svg
      aria-hidden
      className={`pointer-events-none absolute h-14 w-14 ${className}`}
      viewBox="0 0 56 56"
      fill="none"
      style={{ color: "#1d4ed8" }}
    >
      <path d="M2 22 V2 H22" stroke="currentColor" strokeWidth="3" />
      <path
        d="M8 22 V8 H22"
        stroke="currentColor"
        strokeWidth="1"
        opacity="0.5"
      />
    </svg>
  );
}

/* ============================================================
   Badge
   ============================================================ */
function Badge({
  children,
  color,
  bg,
}: {
  children: React.ReactNode;
  color: string;
  bg: string;
}) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.15em]"
      style={{ color, background: bg, fontFamily: "Inter, sans-serif" }}
    >
      {children}
    </span>
  );
}

/* ============================================================
   Hexagonal seal
   ============================================================ */
function HexSeal() {
  const hexPoints = "100,10 178,55 178,145 100,190 22,145 22,55";

  return (
    <div className="relative h-[130px] w-[130px] sm:h-[150px] sm:w-[150px]">
      <svg
        viewBox="0 0 200 200"
        className="absolute inset-0 h-full w-full"
        aria-hidden
      >
        <defs>
          <linearGradient id="hexFill" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#fbfaf7" />
            <stop offset="100%" stopColor="#dbeafe" />
          </linearGradient>
        </defs>

        <polygon
          points={hexPoints}
          fill="url(#hexFill)"
          stroke="#1d4ed8"
          strokeWidth="4"
        />

        <polygon
          points={hexPoints}
          fill="none"
          stroke="#1d4ed8"
          strokeWidth="1"
          opacity="0.35"
          transform="translate(100 100) scale(0.86) translate(-100 -100)"
        />

        <line
          x1="60"
          y1="86"
          x2="140"
          y2="86"
          stroke="#1d4ed8"
          strokeWidth="1"
          opacity="0.5"
        />
        <line
          x1="60"
          y1="122"
          x2="140"
          y2="122"
          stroke="#1d4ed8"
          strokeWidth="1"
          opacity="0.5"
        />

        <text
          x="100"
          y="78"
          textAnchor="middle"
          fontSize="11"
          fontWeight="700"
          letterSpacing="3"
          fill="#1d4ed8"
          style={{ fontFamily: "Inter, sans-serif" }}
        >
          KOYOCODE
        </text>

        <text
          x="100"
          y="110"
          textAnchor="middle"
          fontSize="22"
          fontWeight="800"
          letterSpacing="1"
          fill="#0f172a"
          style={{ fontFamily: "Georgia, serif" }}
        >
          CERT
        </text>

        <text
          x="100"
          y="138"
          textAnchor="middle"
          fontSize="9"
          fontWeight="700"
          letterSpacing="4"
          fill="#1d4ed8"
          style={{ fontFamily: "Inter, sans-serif" }}
        >
          VERIFIED
        </text>
      </svg>
    </div>
  );
}