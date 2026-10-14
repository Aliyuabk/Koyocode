/* ============================================================
   COURSES
   ============================================================ */
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
  is_premium: boolean;
  price_kobo: number;
  preview_lesson_count: number;
  certificate_price_kobo: number | null;
  certificate_enabled: boolean;
  created_at?: string;
  updated_at?: string;
};

/* ============================================================
   LESSONS
   ============================================================ */
export type LessonConcept = {
  icon: string;
  title: string;
  body: string;
  code?: string;
};

export type LessonExerciseType = "none" | "html" | "javascript";

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

  // Concept cards (main lesson body)
  concepts: LessonConcept[] | null;

  // In-browser exercise
  exercise_type: LessonExerciseType;
  exercise_prompt: string | null;
  exercise_starter: string | null;
  exercise_solution: string | null;
  exercise_hint: string | null;

  // AI quick check
  quick_check_question: string | null;
  quick_check_options: string[] | null;
  quick_check_correct_index: number | null;
  quick_check_explanation: string | null;

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

export type LessonQuestion = {
  id: string;
  lesson_id: string;
  trigger_at: number;
  position_seconds: number | null;
  question: string;
  options: string[];
  correct_index: number;
  explanation: string | null;
  created_at?: string;
};

/* ============================================================
   FAQS
   ============================================================ */
export type FAQ = {
  id: string;
  question: string;
  answer: string;
  sort_order: number;
};

/* ============================================================
   PROGRESS
   ============================================================ */
export type Progress = {
  id: string;
  user_id: string;
  lesson_id: string;
  watched_percent: number;
  completed: boolean;
  completed_at: string | null;
  updated_at: string;
  notes?: string | null;
};

/* ============================================================
   ENROLLMENTS
   ============================================================ */
export type Enrollment = {
  id: string;
  user_id: string;
  course_id: string;
  enrolled_at: string;
  paid_at: string | null;
  payment_reference: string | null;
  amount_paid_kobo: number | null;
};

/* ============================================================
   PROFILES
   ============================================================ */
export type Profile = {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  role: "student" | "admin";
  theme_mode: "light" | "dark" | "system";
  theme_accent: "blue" | "emerald" | "purple" | "rose" | "amber";
  is_scholarship: boolean;
  scholarship_course_id: string | null;
  password_changed: boolean;
  created_at: string;
  updated_at: string;
};

/* ============================================================
   CERTIFICATES
   ============================================================ */
export type Certificate = {
  id: string;
  user_id: string;
  course_id: string;
  verification_code: string;
  issued_at: string;
  is_paid: boolean;
  payment_reference: string | null;
  paid_at: string | null;
};

/* ============================================================
   PAYMENTS
   ============================================================ */
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

/* ============================================================
   PLATFORM SETTINGS
   ============================================================ */
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
  scholarship_enabled: boolean;
  scholarship_title: string;
  scholarship_description: string;
  scholarship_max_seats: number;
  updated_at: string;
  updated_by: string | null;
};

/* ============================================================
   SCHOLARSHIP
   ============================================================ */
export type ScholarshipApplication = {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  city: string | null;
  age_range: string | null;
  background: string | null;
  motivation: string;
  course_id: string | null;
  status: "pending" | "approved" | "rejected" | "waitlisted";
  user_id: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  admin_notes: string | null;
  created_at: string;
};

export type EmailVerification = {
  id: string;
  email: string;
  code: string;
  purpose: "scholarship" | "signup";
  used: boolean;
  expires_at: string;
  created_at: string;
};

/* ============================================================
   NOTIFICATIONS
   ============================================================ */
export type Notification = {
  id: string;
  title: string;
  message: string;
  link: string | null;
  link_label: string | null;
  audience: "all" | "students" | "admins" | "user";
  target_user: string | null;
  send_email: boolean;
  created_by: string | null;
  sent_at: string;
  recipients: number;
};

export type UserNotification = {
  id: string;
  user_id: string;
  notification_id: string;
  read: boolean;
  read_at: string | null;
  created_at: string;
};

/* ============================================================
   ACTIVITY LOG
   ============================================================ */
export type ActivityLogEntry = {
  id: string;
  user_id: string | null;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  metadata: any;
  created_at: string;
};