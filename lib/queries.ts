import { createClient } from "@/lib/supabase/server";
import type { Course, Lesson, FAQ } from "@/lib/types";

/* ============================================================
   COURSES
   ============================================================ */

export async function getCourses(): Promise<Course[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("courses")
    .select("*")
    .eq("is_published", true)
    .order("sort_order", { ascending: true });

  if (error) {
    console.error("getCourses error:", error.message);
    return [];
  }
  return data ?? [];
}

export async function getCourseBySlug(slug: string): Promise<Course | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("courses")
    .select("*")
    .eq("slug", slug)
    .eq("is_published", true)
    .maybeSingle();

  if (error) {
    console.error("getCourseBySlug error:", error.message);
    return null;
  }
  return data;
}

/* ============================================================
   LESSONS
   ============================================================ */

export async function getLessonsByCourse(courseId: string): Promise<Lesson[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("lessons")
    .select("*")
    .eq("course_id", courseId)
    .eq("is_published", true)
    .order("sort_order", { ascending: true });

  if (error) {
    console.error("getLessonsByCourse error:", error.message);
    return [];
  }
  return data ?? [];
}

export async function getLessonBySlug(
  courseId: string,
  lessonSlug: string
): Promise<Lesson | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("lessons")
    .select("*")
    .eq("course_id", courseId)
    .eq("slug", lessonSlug)
    .eq("is_published", true)
    .maybeSingle();

  if (error) {
    console.error("getLessonBySlug error:", error.message);
    return null;
  }
  return data;
}

/* ============================================================
   FAQS
   ============================================================ */

export async function getFAQs(): Promise<FAQ[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("faqs")
    .select("*")
    .order("sort_order", { ascending: true });

  if (error) {
    console.error("getFAQs error:", error.message);
    return [];
  }
  return data ?? [];
}