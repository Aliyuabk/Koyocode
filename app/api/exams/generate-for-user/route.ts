import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const maxDuration = 60;

type GeneratedQuestion = {
  question: string;
  options: string[];
  correct_index: number;
  explanation?: string;
};

// Preferred models — filtered at runtime against what the key actually has
const PREFERRED_MODELS = [
  "gemini-2.5-flash",
  "gemini-2.5-flash-lite",
  "gemini-2.5-pro",
  "gemini-flash-latest",
  "gemini-flash-lite-latest",
  "gemini-3-flash-preview",
];

// Hard fallback if the model listing fails
const FALLBACK_MODELS = [
  "gemini-2.5-flash",
  "gemini-2.5-flash-lite",
  "gemini-2.5-pro",
];

/* ============================================================
   Discover which models the key supports
   ============================================================ */
async function listModels(apiKey: string): Promise<string[]> {
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
    );
    if (!res.ok) return FALLBACK_MODELS;

    const data = await res.json();
    const available = new Set<string>(
      (data.models ?? [])
        .filter((m: any) =>
          m.supportedGenerationMethods?.includes("generateContent")
        )
        .map((m: any) => String(m.name).replace(/^models\//, ""))
    );

    const ordered = PREFERRED_MODELS.filter((m) => available.has(m));

    if (ordered.length > 0) return ordered;

    // Nothing preferred exists — use anything flash/pro
    const anyFlashOrPro = Array.from(available).filter(
      (m) => m.includes("flash") || m.includes("pro")
    );

    return anyFlashOrPro.length > 0 ? anyFlashOrPro : FALLBACK_MODELS;
  } catch {
    return FALLBACK_MODELS;
  }
}

/* ============================================================
   Call a single model (tries v1beta then v1)
   ============================================================ */
async function callGemini(
  apiKey: string,
  model: string,
  prompt: string
): Promise<
  { ok: true; text: string } | { ok: false; error: string; status: number }
> {
  const versions = ["v1beta", "v1"];

  for (const v of versions) {
    const url = `https://generativelanguage.googleapis.com/${v}/models/${model}:generateContent?key=${apiKey}`;

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.9,
          maxOutputTokens: 4096,
          responseMimeType: "application/json",
          // Disable thinking to keep generation fast (<60s on Vercel)
          thinkingConfig: { thinkingBudget: 0 },
        },
      }),
    });

    if (res.ok) {
      const data = await res.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
      if (text) return { ok: true, text };
    }

    if (res.status === 404) continue;

    const raw = await res.text();
    return {
      ok: false,
      error: `${v}/${model}: ${raw.slice(0, 300)}`,
      status: res.status,
    };
  }

  return {
    ok: false,
    error: `${model}: not found in v1beta or v1`,
    status: 404,
  };
}

/* ============================================================
   Robust JSON extraction
   ============================================================ */
function extractJson(raw: string): { questions: GeneratedQuestion[] } | null {
  try {
    return JSON.parse(raw);
  } catch {}

  const cleaned = raw
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  try {
    return JSON.parse(cleaned);
  } catch {}

  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start >= 0 && end > start) {
    try {
      return JSON.parse(cleaned.slice(start, end + 1));
    } catch {}
  }

  return null;
}

/* ============================================================
   POST handler
   ============================================================ */
export async function POST(req: Request) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { course_id } = body ?? {};
  if (!course_id) {
    return NextResponse.json({ error: "course_id required" }, { status: 400 });
  }

  // Must be enrolled
  const { data: enrollment } = await supabase
    .from("enrollments")
    .select("id")
    .eq("user_id", user.id)
    .eq("course_id", course_id)
    .maybeSingle();

  if (!enrollment) {
    return NextResponse.json({ error: "Not enrolled" }, { status: 403 });
  }

  // Exam settings
  const { data: settings } = await supabase
    .from("course_exam_settings")
    .select("question_count, is_enabled")
    .eq("course_id", course_id)
    .maybeSingle();

  if (!settings || !settings.is_enabled) {
    return NextResponse.json(
      { error: "Exam not enabled for this course" },
      { status: 400 }
    );
  }

  // Course + lessons
  const { data: course } = await supabase
    .from("courses")
    .select("title, description, category, level")
    .eq("id", course_id)
    .single();

  const { data: lessons } = await supabase
    .from("lessons")
    .select("title, description, notes, transcript")
    .eq("course_id", course_id)
    .eq("is_published", true)
    .order("sort_order");

  if (!course || !lessons || lessons.length === 0) {
    return NextResponse.json(
      { error: "Course has no published content" },
      { status: 400 }
    );
  }

  const curriculum = lessons
    .map((l, i) => {
      const parts = [`Lesson ${i + 1}: ${l.title}`];
      if (l.description) parts.push(`  Summary: ${l.description}`);
      if (l.notes) parts.push(`  Notes: ${l.notes.slice(0, 700)}`);
      if (l.transcript) parts.push(`  Transcript: ${l.transcript.slice(0, 900)}`);
      return parts.join("\n");
    })
    .join("\n\n");

  const count = settings.question_count;

  const prompt = `You are an exam generator for KoyoCode, an online coding school in Nigeria.

Course: "${course.title}" (${course.category}, ${course.level})
${course.description ? `Description: ${course.description}` : ""}

Curriculum:
${curriculum}

Generate exactly ${count} multiple-choice questions testing understanding of the material above.

Rules:
- 4 options per question, exactly one correct.
- Questions must be based only on the curriculum above.
- Mix conceptual and practical questions.
- Simple, clear English.
- Vary the correct_index across questions.

Return ONLY valid JSON:
{
  "questions": [
    {
      "question": "string",
      "options": ["string","string","string","string"],
      "correct_index": 0,
      "explanation": "string"
    }
  ]
}`;

  const API_KEY = process.env.GEMINI_API_KEY;
  if (!API_KEY) {
    return NextResponse.json(
      {
        error: "GEMINI_API_KEY not configured",
        detail:
          "Add GEMINI_API_KEY to .env.local and to Vercel Environment Variables. Get a key at aistudio.google.com/app/apikey.",
      },
      { status: 500 }
    );
  }

  const models = await listModels(API_KEY);
  let raw = "";
  let lastError = "";
  let lastStatus = 500;
  let lastModel = "";

  for (const model of models) {
    const result = await callGemini(API_KEY, model, prompt);
    if (result.ok) {
      raw = result.text;
      lastModel = model;
      lastError = "";
      break;
    }
    lastError = result.error;
    lastStatus = result.status;
    lastModel = model;
    console.error(`Model ${model} failed:`, result.error);
  }

  if (!raw) {
    return NextResponse.json(
      {
        error: `AI generation failed (${lastStatus})`,
        detail: lastError,
        model_tried: lastModel,
        models_attempted: models,
      },
      { status: 500 }
    );
  }

  const parsed = extractJson(raw);
  if (!parsed) {
    return NextResponse.json(
      {
        error: "AI returned invalid JSON",
        detail: raw.slice(0, 400),
        model_tried: lastModel,
      },
      { status: 500 }
    );
  }

  const questions = (parsed.questions ?? []).filter(
    (q) =>
      q &&
      typeof q.question === "string" &&
      Array.isArray(q.options) &&
      q.options.length === 4 &&
      typeof q.correct_index === "number" &&
      q.correct_index >= 0 &&
      q.correct_index <= 3
  );

  if (questions.length === 0) {
    return NextResponse.json(
      {
        error: "AI returned no valid questions",
        detail: JSON.stringify(parsed).slice(0, 400),
        model_tried: lastModel,
      },
      { status: 500 }
    );
  }

  return NextResponse.json({
    ok: true,
    questions,
    model: lastModel,
  });
}