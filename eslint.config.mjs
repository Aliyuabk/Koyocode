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

// Try these in order — first working one wins
const GEMINI_MODELS = [
  "gemini-2.0-flash",
  "gemini-2.0-flash-lite",
  "gemini-1.5-flash",
  "gemini-1.5-flash-latest",
  "gemini-1.5-pro",
];

async function callGemini(
  apiKey: string,
  model: string,
  prompt: string
): Promise<{ ok: true; text: string } | { ok: false; error: string; status: number }> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.85,
        responseMimeType: "application/json",
      },
    }),
  });

  if (!res.ok) {
    const raw = await res.text();
    return { ok: false, error: raw.slice(0, 400), status: res.status };
  }

  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

  if (!text) {
    return { ok: false, error: "Empty response from model", status: 500 };
  }
  return { ok: true, text };
}

function extractJson(raw: string): { questions: GeneratedQuestion[] } | null {
  // Try direct parse
  try {
    return JSON.parse(raw);
  } catch {}

  // Strip ```json fences
  const cleaned = raw
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  try {
    return JSON.parse(cleaned);
  } catch {}

  // Extract first {...} block
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start >= 0 && end > start) {
    try {
      return JSON.parse(cleaned.slice(start, end + 1));
    } catch {}
  }

  return null;
}

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

  const { course_id } = body;
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
    return NextResponse.json({ error: "Not enrolled in this course" }, { status: 403 });
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

Generate exactly ${count} multiple-choice questions testing understanding of the above.

Rules:
- 4 options per question, exactly one correct.
- Questions must be based only on the curriculum above.
- Mix conceptual and practical questions.
- Simple, clear English.
- Vary the correct_index across questions (not always 0).

Return ONLY valid JSON (no markdown, no code fences):
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
          "Add GEMINI_API_KEY to your .env.local and to Vercel Environment Variables. Get a key at aistudio.google.com/app/apikey.",
      },
      { status: 500 }
    );
  }

  // Try each model until one works
  let lastError: string = "Unknown error";
  let lastStatus = 500;
  let lastModel = "";
  let raw = "";

  for (const model of GEMINI_MODELS) {
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
  }

  if (!raw) {
    console.error(`All Gemini models failed. Last: ${lastModel} →`, lastError);
    return NextResponse.json(
      {
        error: `AI generation failed (${lastStatus})`,
        detail: lastError,
        model_tried: lastModel,
      },
      { status: 500 }
    );
  }

  const parsed = extractJson(raw);
  if (!parsed) {
    console.error("Failed to parse AI JSON:", raw.slice(0, 500));
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