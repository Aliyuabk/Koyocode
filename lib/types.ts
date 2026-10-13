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

export type Payment = {
  id: string;
  user_id: string;
  reference: string;
  amount_kobo: number;
  status: "pending" | "success" | "failed" | "refunded";
  type: "certificate" | "course";
  target_id: string | null;
  provider: string;
  metadata: any;
  created_at: string;
  paid_at: string | null;
  refunded_at: string | null;
};

export type PlatformSettings = {
  id: number;
  site_name: string;
  support_email: string;
  certificate_enabled: boolean;
  certificate_default_price_kobo: number;
  certificate_require_payment: boolean;
  certificate_auto_issue_on_pass: boolean;
  premium_courses_enabled: boolean;
  premium_default_preview_lessons: number;
  payments_enabled: boolean;
  paystack_public_key: string | null;
  currency: string;
  ads_enabled: boolean;
  ads_provider: string | null;
  ads_client_id: string | null;
  ads_slots: Record<string, boolean>;
  ads_skip_for_admins: boolean;
  ads_skip_on_exam: boolean;
  ads_skip_on_checkout: boolean;
  updated_at: string;
  updated_by: string | null;
};

// Update Course type — add the new fields
export type Course = {
  // ... existing fields
  is_premium: boolean;
  price_kobo: number;
  preview_lesson_count: number;
  certificate_price_kobo: number | null;
  certificate_enabled: boolean;
};