"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Field, inputCls, Btn, toast } from "@/components/admin/ui";

type Course = {
  id: string;
  title: string;
  icon: string | null;
  is_premium: boolean;
  price_kobo: number;
};

// Simple, reliable email regex (matches what browsers use)
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ScholarshipForm({ courses }: { courses: Course[] }) {
  const supabase = createClient();

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
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);

  const premiumCourses = courses.filter((c) => c.is_premium);
  const otherCourses = courses.filter((c) => !c.is_premium);

  // Live validation
  const isEmailValid = EMAIL_RE.test(email.trim());
  const isNameValid = fullName.trim().length >= 2;
  const isMotivationValid = motivation.trim().length >= 50;
  const isFormValid = isEmailValid && isNameValid && isMotivationValid;

  async function submit() {
    if (!isEmailValid) {
      toast("Please enter a valid email address", "err");
      return;
    }
    if (!isNameValid) {
      toast("Please enter your full name", "err");
      return;
    }
    if (!isMotivationValid) {
      toast("Please write at least 50 characters", "err");
      return;
    }

    setSubmitting(true);
    setEmailError(null);

    const { data: inserted, error } = await supabase
      .from("scholarship_applications")
      .insert({
        full_name: fullName.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim() || null,
        city: city.trim() || null,
        age_range: ageRange,
        background,
        motivation: motivation.trim(),
        course_id: courseId || null,
        status: "pending",
      })
      .select("id")
      .single();

    setSubmitting(false);

    if (error) {
      // Friendly error for duplicate emails
      if (error.code === "23505") {
        setEmailError("This email has already applied.");
        toast("This email has already applied.", "err");
        return;
      }
      setEmailError(error.message);
      toast(error.message, "err");
      return;
    }

    if (!inserted) {
      toast("Submission failed — please try again", "err");
      return;
    }

    setDone(true);
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
        <p className="mt-3 text-xs text-emerald-600 dark:text-emerald-400">
          Check your spam folder too. From:{" "}
          <strong>koyocode@kowagurutech.ng</strong>
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

      <div className="mt-5 space-y-4">
        <Field label="Full name *">
          <input
            className={inputCls}
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="e.g. Aisha Bello"
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Field label="Email address *">
              <input
                type="email"
                className={inputCls}
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setEmailError(null);
                }}
                onBlur={() => {
                  if (email.trim() && !isEmailValid) {
                    setEmailError("Please enter a valid email address");
                  }
                }}
                placeholder="you@example.com"
              />
            </Field>
            {emailError && (
              <p className="mt-1.5 text-xs font-medium text-red-600 dark:text-red-400">
                ⚠ {emailError}
              </p>
            )}
            {email.trim() && isEmailValid && !emailError && (
              <p className="mt-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                ✓ Valid email format
              </p>
            )}
          </div>

          <Field label="Phone / WhatsApp">
            <input
              className={inputCls}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+234..."
            />
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="City / Town">
            <input
              className={inputCls}
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="e.g. Kano"
            />
          </Field>
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
        </div>

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
          hint={`${motivation.length} characters · minimum 50`}
        >
          <textarea
            className={inputCls}
            rows={6}
            value={motivation}
            onChange={(e) => setMotivation(e.target.value)}
            placeholder="Tell us what you want to build, why coding matters to you, and how you'll use this course. Be honest — we read every word."
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
            Please complete all required fields to enable submission.
          </p>
        )}
      </div>
    </div>
  );
}