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

export async function POST(req: Request) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  }

  const body = await req.json();
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
    return NextResponse.json({ error: "Not enrolled" }, { status: 403 });
  }

  // Load exam settings
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

  // Load course + lessons
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
      { error: "Course has no content" },
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

Generate exactly ${count} multiple-choice questions that test understanding of the above material.

Rules:
- 4 options per question, exactly one correct.
- Questions must be based only on the curriculum above.
- Mix conceptual and practical questions.
- Simple clear English.
- Vary the correct_index across questions (not always 0).

Return ONLY valid JSON, no markdown:
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
      { error: "GEMINI_API_KEY not set" },
      { status: 500 }
    );
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${API_KEY}`;

  const aiRes = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.85, // a bit of variety per user
        responseMimeType: "application/json",
      },
    }),
  });

  if (!aiRes.ok) {
    const detail = await aiRes.text();
    console.error("Gemini error:", detail);
    return NextResponse.json(
      { error: "AI generation failed", detail },
      { status: 500 }
    );
  }

  const aiData = await aiRes.json();
  const raw = aiData?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

  let parsed: { questions: GeneratedQuestion[] };
  try {
    parsed = JSON.parse(raw);
  } catch {
    const cleaned = raw.replace(/^```json|```$/g, "").trim();
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      return NextResponse.json({ error: "AI returned bad JSON" }, { status: 500 });
    }
  }

  const questions = (parsed.questions ?? []).filter(
    (q) =>
      q.question &&
      Array.isArray(q.options) &&
      q.options.length === 4 &&
      typeof q.correct_index === "number" &&
      q.correct_index >= 0 &&
      q.correct_index <= 3
  );

  if (questions.length === 0) {
    return NextResponse.json({ error: "No valid questions" }, { status: 500 });
  }

  return NextResponse.json({ questions });
}