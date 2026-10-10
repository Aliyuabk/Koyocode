export type Course = {
  id: string;
  slug: string;
  title: string;
  category: string;
  level: string;
  duration: string | null;
  icon: string | null;
  color: string | null;
  description: string | null;
  tag: string | null;
  lessons_count: number;
  is_published: boolean;
  sort_order: number;
  created_at?: string;
  updated_at?: string;
};

export type LessonChapter = {
  time: number;
  title: string;
};

export type LessonResource = {
  name: string;
  url: string;
};

export type Lesson = {
  id: string;
  course_id: string;
  slug: string;
  title: string;
  description: string | null;
  youtube_id: string | null;
  hausa_audio_url: string | null;
  notes: string | null;
  starter_code: string | null;
  duration_minutes: number;
  sort_order: number;
  is_published: boolean;
  transcript: string | null;
  chapters: LessonChapter[] | null;
  resources: LessonResource[] | null;
  created_at?: string;
  updated_at?: string;
};

export type LessonQuestion = {
  id: string;
  lesson_id: string;
  trigger_at: number;
  question: string;
  options: string[];
  correct_index: number;
  explanation: string | null;
  created_at?: string;
};

export type FAQ = {
  id: string;
  question: string;
  answer: string;
  sort_order: number;
};

export type Progress = {
  id: string;
  user_id: string;
  lesson_id: string;
  watched_percent: number;
  completed: boolean;
  completed_at: string | null;
  updated_at: string;
};

export type Enrollment = {
  id: string;
  user_id: string;
  course_id: string;
  enrolled_at: string;
};

export type Profile = {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  role: "student" | "admin";
  theme_mode: "light" | "dark" | "system";
  theme_accent: "blue" | "emerald" | "purple" | "rose" | "amber";
  created_at: string;
  updated_at: string;
};