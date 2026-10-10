"use client";

import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
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
  const qrRef = useRef<HTMLCanvasElement>(null);
  const [qrReady, setQrReady] = useState(false);

  // Full code in the URL — no truncation
  const verifyUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/verify/${verificationCode}`
      : `/verify/${verificationCode}`;

  useEffect(() => {
    if (!qrRef.current) return;
    QRCode.toCanvas(
      qrRef.current,
      verifyUrl,
      {
        width: 140,
        margin: 1,
        color: { dark: "#0f172a", light: "#ffffff" },
      },
      (err) => {
        if (!err) setQrReady(true);
      }
    );
  }, [verifyUrl]);

  const issuedDate = new Date(issuedAt).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  function handlePrint() {
    window.print();
  }

  return (
    <>
      {/* ACTIONS — hidden when printing */}
      <div className="mb-6 flex flex-wrap justify-center gap-3 print:hidden">
        <button
          onClick={handlePrint}
          className="inline-flex items-center gap-2 rounded-full bg-blue-700 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-blue-700/20 transition hover:-translate-y-0.5 hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-500"
        >
          🖨️ Print / Save as PDF
        </button>

        <CopyLinkButton url={verifyUrl} />
      </div>

      {/* CERTIFICATE */}
      <div
        id="certificate"
        className="certificate-print relative mx-auto overflow-hidden rounded-3xl border-[10px] border-blue-700 bg-white p-8 shadow-2xl shadow-blue-900/20 sm:p-14 dark:border-blue-600"
        style={{ maxWidth: "900px", aspectRatio: "1.414 / 1" }}
      >
        {/* Decorative corners */}
        <div className="pointer-events-none absolute left-0 top-0 h-20 w-20 rounded-br-[60px] bg-blue-700 sm:h-24 sm:w-24" />
        <div className="pointer-events-none absolute right-0 top-0 h-20 w-20 rounded-bl-[60px] bg-blue-700 sm:h-24 sm:w-24" />
        <div className="pointer-events-none absolute bottom-0 left-0 h-20 w-20 rounded-tr-[60px] bg-blue-700 sm:h-24 sm:w-24" />
        <div className="pointer-events-none absolute bottom-0 right-0 h-20 w-20 rounded-tl-[60px] bg-blue-700 sm:h-24 sm:w-24" />

        {/* CONTENT */}
        <div className="relative flex h-full flex-col items-center justify-between text-center">
          {/* HEADER */}
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-700 text-2xl font-black text-white">
              K
            </span>
            <div className="text-left">
              <p className="text-lg font-black tracking-tight text-slate-900">
                KoyoCode
              </p>
              <p className="text-xs font-semibold uppercase tracking-wider text-blue-700">
                New Generation Tech Academy
              </p>
            </div>
          </div>

          {/* TITLE */}
          <div className="mt-6">
            <p className="text-xs font-black uppercase tracking-[0.3em] text-blue-700 sm:text-sm">
              Certificate of Completion
            </p>
            <div className="mx-auto mt-3 h-px w-32 bg-blue-200" />
          </div>

          {/* BODY */}
          <div className="mt-6 flex flex-1 flex-col items-center justify-center">
            <p className="text-sm font-medium text-slate-500">
              This is to certify that
            </p>
            <p
              className="mt-3 text-3xl font-black tracking-tight text-slate-900 sm:text-5xl"
              style={{ fontFamily: "Georgia, serif" }}
            >
              {studentName}
            </p>
            <p className="mt-4 max-w-lg text-sm leading-7 text-slate-600">
              has successfully completed the final examination and all lessons
              of
            </p>
            <p className="mt-3 text-xl font-black text-blue-700 sm:text-2xl">
              {courseIcon} {courseTitle}
            </p>

            {score !== null && (
              <p className="mt-3 inline-block rounded-full bg-emerald-50 px-4 py-1.5 text-xs font-bold text-emerald-700">
                Final score: {score}%
              </p>
            )}
          </div>

          {/* FOOTER */}
          <div className="mt-6 grid w-full grid-cols-3 items-end gap-4 sm:gap-6">
            <div className="text-center">
              <p
                className="text-base font-black text-slate-900 sm:text-lg"
                style={{ fontFamily: "Georgia, serif" }}
              >
                Aliyu Abubakar
              </p>
              <div className="mx-auto mt-1 h-px w-24 bg-slate-300 sm:w-32" />
              <p className="mt-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Founder
              </p>
            </div>

            <div className="text-center">
              <p className="text-xs font-bold text-slate-900">{issuedDate}</p>
              <div className="mx-auto mt-1 h-px w-20 bg-slate-300 sm:w-24" />
              <p className="mt-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Issued
              </p>
              <p className="mt-2 font-mono text-[8px] text-slate-400 sm:text-[9px]">
                {verificationCode.slice(0, 16).toUpperCase()}
              </p>
            </div>

            <div className="flex flex-col items-center">
              <canvas
                ref={qrRef}
                className="rounded-lg border border-slate-200"
                width={140}
                height={140}
              />
              <p className="mt-2 text-[9px] font-bold uppercase tracking-wider text-slate-500">
                {qrReady ? "Scan to verify" : "Loading…"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* PRINT STYLES */}
      <style>{`
        @media print {
          @page { size: A4 landscape; margin: 0; }
          html, body { background: white !important; }
          .print\\:hidden { display: none !important; }
          header, footer, nav, aside { display: none !important; }
          .certificate-print {
            box-shadow: none !important;
            border-width: 8px !important;
            border-radius: 0 !important;
            width: 100% !important;
            height: 100% !important;
            max-width: none !important;
            aspect-ratio: auto !important;
            margin: 0 !important;
          }
        }
      `}</style>
    </>
  );
}