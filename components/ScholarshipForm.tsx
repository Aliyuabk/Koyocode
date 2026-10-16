"use client";

import { useState } from "react";
import Link from "next/link";
import { Field, inputCls, Btn, toast } from "@/components/admin/ui";
import {
  sendVerificationCode,
  verifyCode,
} from "@/app/scholarship/actions";

type Course = {
  id: string;
  title: string;
  icon: string | null;
  is_premium: boolean;
  price_kobo: number;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ScholarshipForm({ courses }: { courses: Course[] }) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [ageRange, setAgeRange] = useState("18-24");
  const [background, setBackground] = useState("Student");
  const [courseId, setCourseId] = useState(
    courses.find((c) => c.is_premium)?.id ?? courses[0]?.id ?? ""
  );
  const [motivation, setMotivation] = useState("");

  const [code, setCode] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const premiumCourses = courses.filter((c) => c.is_premium);
  const otherCourses = courses.filter((c) => !c.is_premium);

  const isEmailShapeValid = EMAIL_RE.test(email.trim());
  const isNameValid = fullName.trim().length >= 2;
  const isMotivationValid = motivation.trim().length >= 10;
  const isFormValid =
    isEmailShapeValid && isNameValid && isMotivationValid && emailVerified;

  async function handleSendCode() {
    setError(null);
    if (!isEmailShapeValid) {
      setError("Please enter a valid email address.");
      return;
    }
    setSending(true);
    const res = await sendVerificationCode(email);
    setSending(false);
    if (!res.ok) {
      setError(res.error ?? "Failed to send code.");
      return;
    }
    setCodeSent(true);
    toast("Verification code sent. Check your inbox.");
  }

  async function handleVerifyCode() {
    setError(null);
    if (!/^\d{6}$/.test(code.trim())) {
      setError("Please enter the 6-digit code.");
      return;
    }
    setVerifying(true);
    const res = await verifyCode(email, code);
    setVerifying(false);
    if (!res.ok) {
      setError(res.error ?? "Verification failed.");
      return;
    }
    setEmailVerified(true);
    toast("Email verified ✓");
  }

  async function submit() {
    setError(null);

    if (!emailVerified) {
      setError("Please verify your email first.");
      return;
    }
    if (!isFormValid) {
      setError("Please fill in all required fields.");
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch("/api/scholarship/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: fullName.trim(),
          email: email.trim().toLowerCase(),
          phone: phone.trim() || undefined,
          city: city.trim() || undefined,
          age_range: ageRange,
          background,
          motivation: motivation.trim(),
          course_id: courseId || undefined,
        }),
      });

      const data = await res.json();
      setSubmitting(false);

      if (!res.ok) {
        setError(data.error ?? "Submission failed. Please try again.");
        return;
      }

      setDone(true);
    } catch (e: any) {
      setSubmitting(false);
      setError(e.message ?? "Network error");
    }
  }

  if (done) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-8 text-center dark:border-emerald-800 dark:bg-emerald-950/40">
        <p className="text-5xl">🎉</p>
        <h2 className="mt-4 text-2xl font-black text-emerald-800 dark:text-emerald-300">
          Application received!
        </h2>
        <p className="mx-auto mt-3 max-w-md text-sm text-emerald-700 dark:text-emerald-300">
          We review every application personally. If you&apos;re selected,
          you&apos;ll receive an email with your login details within 3
          business days.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex rounded-full bg-emerald-600 px-6 py-3 font-bold text-white transition hover:bg-emerald-700"
        >
          Back to home
        </Link>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 dark:border-[#1f2a44] dark:bg-[#131c33]">
      <p className="text-xs font-extrabold uppercase tracking-wider text-blue-700 dark:text-blue-400">
        Application form
      </p>

      {error && (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 dark:border-red-800 dark:bg-red-950/40 dark:text-red-300">
          ⚠ {error}
        </div>
      )}

      <div className="mt-5 space-y-4">
        <Field label="Full name *">
          <input
            className={inputCls}
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="e.g. Aisha Bello"
          />
        </Field>

        <div>
          <label className="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-[#cbd5e1]">
            Email address *
          </label>
          <div className="flex gap-2">
            <input
              type="email"
              className={inputCls}
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setEmailVerified(false);
                setCodeSent(false);
                setCode("");
              }}
              placeholder="you@example.com"
              disabled={emailVerified}
            />
            {!emailVerified && (
              <button
                type="button"
                onClick={handleSendCode}
                disabled={sending || !isEmailShapeValid}
                className="shrink-0 rounded-xl bg-blue-700 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-blue-600"
              >
                {sending ? "Sending…" : "Send code"}
              </button>
            )}
          </div>
          {emailVerified && (
            <p className="mt-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
              ✓ Email verified
            </p>
          )}
        </div>

        {codeSent && !emailVerified && (
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-[#cbd5e1]">
              Enter the 6-digit code sent to your email
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                className={inputCls + " font-mono text-lg tracking-widest"}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                placeholder="000000"
              />
              <button
                type="button"
                onClick={handleVerifyCode}
                disabled={verifying || code.length !== 6}
                className="shrink-0 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {verifying ? "Verifying…" : "Verify"}
              </button>
            </div>
            <p className="mt-1.5 text-xs text-slate-500 dark:text-[#94a3b8]">
              Didn&apos;t get it? Wait 60 seconds and click Send code again.
            </p>
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Phone / WhatsApp">
            <input
              className={inputCls}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+234..."
            />
          </Field>
          <Field label="City / Town">
            <input
              className={inputCls}
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="e.g. Kano"
            />
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Age range">
            <select
              className={inputCls}
              value={ageRange}
              onChange={(e) => setAgeRange(e.target.value)}
            >
              <option value="Under 18">Under 18</option>
              <option value="18-24">18–24</option>
              <option value="25-30">25–30</option>
              <option value="31-40">31–40</option>
              <option value="41+">41+</option>
            </select>
          </Field>
          <Field label="I am currently a...">
            <select
              className={inputCls}
              value={background}
              onChange={(e) => setBackground(e.target.value)}
            >
              <option>Student</option>
              <option>Graduate</option>
              <option>Self-taught developer</option>
              <option>Working professional</option>
              <option>Between jobs</option>
              <option>Other</option>
            </select>
          </Field>
        </div>

        <Field label="Which course do you want? *">
          <select
            className={inputCls}
            value={courseId}
            onChange={(e) => setCourseId(e.target.value)}
          >
            {premiumCourses.length > 0 && (
              <optgroup label="⭐ Premium courses">
                {premiumCourses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.icon} {c.title} (worth ₦
                    {(c.price_kobo / 100).toLocaleString()})
                  </option>
                ))}
              </optgroup>
            )}
            {otherCourses.length > 0 && (
              <optgroup label="Free courses">
                {otherCourses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.icon} {c.title}
                  </option>
                ))}
              </optgroup>
            )}
          </select>
        </Field>

        <Field
          label="Why do you want this scholarship? *"
          hint={`${motivation.length} characters · minimum 10`}
        >
          <textarea
            className={inputCls}
            rows={6}
            value={motivation}
            onChange={(e) => setMotivation(e.target.value)}
            placeholder="Tell us what you want to build, why coding matters to you, and how you'll use this course."
          />
        </Field>

        <label className="flex items-start gap-2.5 text-sm text-slate-600 dark:text-[#94a3b8]">
          <input
            type="checkbox"
            required
            className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-700"
          />
          <span>
            I commit to completing the course within 30 days, filling in a
            feedback form, and (if I recommend it) writing a short testimonial.
          </span>
        </label>

        <Btn onClick={submit} disabled={submitting || !isFormValid}>
          {submitting ? "Submitting…" : "Submit application →"}
        </Btn>

        {!isFormValid && (
          <p className="text-center text-xs text-slate-500 dark:text-[#94a3b8]">
            {!emailVerified
              ? "Verify your email to enable submission."
              : "Complete all required fields to enable submission."}
          </p>
        )}
      </div>
    </div>
  );
}