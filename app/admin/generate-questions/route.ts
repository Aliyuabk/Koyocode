import { NextResponse } from "next/server";
import { createClient as createUserClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const maxDuration = 60;

type Body = {
  concepts: { icon?: string; title: string; body: string; code?: string }[];
  lesson_title: string;
  course_title?: string;
  kind: "quick_check" | "exercise";
};

const MODELS = ["gemini-2.0-flash", "gemini-1.5-flash", "gemini-1.5-pro"];

async function callGemini(apiKey: string, model: string, prompt: string) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 2048,
        responseMimeType: "application/json",
      },
    }),
  });
  if (!res.ok) {
    const raw = await res.text();
    return { ok: false as const, error: raw.slice(0, 300), status: res.status };
  }
  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
  if (!text) return { ok: false as const, error: "Empty response", status: 500 };
  return { ok: true as const, text };
}

function extractJson(raw: string): any | null {
  try { return JSON.parse(raw); } catch {}
  const cleaned = raw
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
  try { return JSON.parse(cleaned); } catch {}
  const s = cleaned.indexOf("{");
  const e = cleaned.lastIndexOf("}");
  if (s >= 0 && e > s) {
    try { return JSON.parse(cleaned.slice(s, e + 1)); } catch {}
  }
  return null;
}

export async function POST(req: Request) {
  // 1. Admin check
  const userSupabase = await createUserClient();
  const {
    data: { user },
  } = await userSupabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  }
  const { data: profile } = await userSupabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "admin") {
    return NextResponse.json({ error: "Admin only" }, { status: 403 });
  }

  // 2. Parse body
  let body: Body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const { concepts, lesson_title, course_title, kind } = body;

  if (!Array.isArray(concepts) || concepts.length === 0) {
    return NextResponse.json(
      { error: "At least one concept is required to generate content" },
      { status: 400 }
    );
  }

  const API_KEY = process.env.GEMINI_API_KEY;
  if (!API_KEY) {
    return NextResponse.json(
      { error: "GEMINI_API_KEY not set" },
      { status: 500 }
    );
  }

  const curriculum = concepts
    .map(
      (c, i) =>
        `Concept ${i + 1}: ${c.title}\n${c.body}${c.code ? `\nCode example:\n${c.code}` : ""}`
    )
    .join("\n\n");

  // 3. Different prompts per kind
  let prompt = "";

  if (kind === "quick_check") {
    prompt = `You are writing an ungraded multiple-choice question for a beginner coding lesson.

Lesson title: "${lesson_title}"
${course_title ? `Course: ${course_title}` : ""}

Concepts covered in this lesson:
${curriculum}

Write ONE multiple-choice question that checks whether the student understood the concepts above.

Rules:
- Exactly 4 options.
- Exactly 1 correct option.
- Question and options must be simple enough for a beginner.
- Options should be short (under 40 characters each).
- Include a clear explanation for why the correct answer is right.
- Do NOT ask about material outside the concepts above.

Return ONLY valid JSON:
{
  "question": "string",
  "options": ["string", "string", "string", "string"],
  "correct_index": 0,
  "explanation": "string"
}`;
  } else {
    prompt = `You are designing a beginner coding exercise for a lesson.

Lesson title: "${lesson_title}"
${course_title ? `Course: ${course_title}` : ""}

Concepts covered in this lesson:
${curriculum}

Design a SHORT coding exercise that a beginner can complete in 2-5 minutes in a browser code editor.

Rules:
- The exercise must test the concepts above.
- It must be solvable with HTML and/or CSS and/or JavaScript (browser-only, no server).
- The starter code should be a partial skeleton (NOT the solution).
- The solution must be simple, working code.
- The hint should be one sentence pointing the student in the right direction.

Return ONLY valid JSON:
{
  "prompt": "string",
  "starter": "string",
  "solution": "string",
  "hint": "string",
  "language": "html" | "javascript"
}`;
  }

  // 4. Try models in order
  let raw = "";
  let lastError = "";
  let lastStatus = 500;

  for (const model of MODELS) {
    const r = await callGemini(API_KEY, model, prompt);
    if (r.ok) {
      raw = r.text;
      lastError = "";
      break;
    }
    lastError = r.error;
    lastStatus = r.status;
  }

  if (!raw) {
    return NextResponse.json(
      { error: `AI failed (${lastStatus})`, detail: lastError },
      { status: 500 }
    );
  }

  const parsed = extractJson(raw);
  if (!parsed) {
    return NextResponse.json(
      { error: "AI returned invalid JSON", detail: raw.slice(0, 300) },
      { status: 500 }
    );
  }

  // 5. Validate
  if (kind === "quick_check") {
    const q = parsed.question;
    const opts = parsed.options;
    const ci = parsed.correct_index;

    if (
      typeof q !== "string" ||
      !Array.isArray(opts) ||
      opts.length !== 4 ||
      typeof ci !== "number" ||
      ci < 0 ||
      ci > 3
    ) {
      return NextResponse.json(
        { error: "AI returned invalid quick check" },
        { status: 500 }
      );
    }
  } else {
    if (
      typeof parsed.prompt !== "string" ||
      typeof parsed.starter !== "string" ||
      typeof parsed.solution !== "string"
    ) {
      return NextResponse.json(
        { error: "AI returned invalid exercise" },
        { status: 500 }
      );
    }
  }

  return NextResponse.json({ ok: true, data: parsed });
}