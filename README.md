Here's the complete **KoyoCode System Documentation v1.0** — ready to save as a PDF, share with a team, or hand to a technical co-founder.

---

# KoyoCode — System Documentation v1.0

**Platform:** Free coding education for Arewa youth in Hausa + English
**Live URL:** https://koyocode.vercel.app
**Founder:** Aliyu Abubakar
**Support email:** aliyuabubakar11117@gmail.com
**YouTube:** https://www.youtube.com/@aliyudev
**Document version:** 1.0
**Last updated:** October 2026

---

## Table of Contents

1. [Product Overview](#1-product-overview)
2. [Technology Stack](#2-technology-stack)
3. [System Architecture](#3-system-architecture)
4. [Database Schema](#4-database-schema)
5. [Authentication & Authorization](#5-authentication--authorization)
6. [Feature Walkthrough](#6-feature-walkthrough)
7. [User Roles](#7-user-roles)
8. [Monetization System](#8-monetization-system)
9. [Scholarship Program](#9-scholarship-program)
10. [Admin Panel](#10-admin-panel)
11. [Security Model](#11-security-model)
12. [Environment Variables](#12-environment-variables)
13. [Deployment](#13-deployment)
14. [API Reference](#14-api-reference)
15. [File Structure](#15-file-structure)
16. [Testing Checklist](#16-testing-checklist)
17. [Known Limitations](#17-known-limitations)
18. [Roadmap](#18-roadmap)

---

## 1. Product Overview

### 1.1 What KoyoCode Is

KoyoCode is a free, browser-based learning platform that teaches programming to young people in Northern Nigeria (Arewa). Lessons are delivered in **Hausa and English**, making technical education accessible to students who are more comfortable in their native language.

### 1.2 Core Value Proposition

| For Students | For Employers | For Founder |
|---|---|---|
| Free structured coding courses | Verifiable certificate system | Ad revenue + paid certificates |
| Bilingual (Hausa + English) | Real skill validation via exams | Premium course sales |
| In-browser code playground | QR-verifiable credentials | YouTube channel growth |
| Progress tracking & streaks | — | Scholarship program pipeline |
| AI-generated final exams | — | Corporate training potential |

### 1.3 Target Audience

- **Primary:** Students and graduates aged 16–30 in Northern Nigeria
- **Secondary:** Self-taught learners across Nigeria
- **Tertiary:** Employers verifying coding credentials

### 1.4 Current State (v1.0)

| Aspect | Status |
|---|---|
| Public site | ✅ Live |
| User registration / login | ✅ Working |
| Free courses | ✅ 4 courses |
| Lessons with videos | ✅ YouTube-embedded |
| Progress tracking | ✅ Working |
| AI-generated exams | ✅ Gemini-powered |
| Certificates with QR | ✅ Verifiable |
| Premium courses | ✅ Live |
| Paid certificates (Paystack) | ✅ Working |
| Ad monetization (Adsterra) | ✅ Live |
| Scholarship program | ✅ Live |
| Admin panel | ✅ Full CRUD |
| Notifications | ✅ In-app + email |
| Email (Gmail SMTP) | ⚠️ Testing |
| YouTube channel | 🟡 Planned |
| Mobile app | 🟡 Phase 4 |

---

## 2. Technology Stack

### 2.1 Frontend

| Layer | Technology | Why |
|---|---|---|
| Framework | **Next.js 16** (App Router) | Server components, SSR, edge functions |
| Language | **TypeScript 5** | Type safety across the codebase |
| UI | **Tailwind CSS v4** | Utility-first, dark mode built-in |
| Animations | **Framer Motion** + custom CSS | Smooth page transitions |
| Code Editor | **CodeMirror 6** | Lightweight, runs in the playground |
| QR Codes | **qrcode** | Certificate verification |

### 2.2 Backend

| Layer | Technology | Why |
|---|---|---|
| Database | **Supabase Postgres** | Free tier, RLS, real-time |
| Auth | **Supabase Auth** | Built-in, integrates with DB |
| File storage | **Supabase Storage** | For future video/file hosting |
| Server logic | **Next.js API routes** | Co-located with frontend |
| Email | **Gmail SMTP + nodemailer** | Testing (move to Resend for production) |
| AI | **Google Gemini 1.5 Flash** | Free tier, generates exams |

### 2.3 Infrastructure

| Service | Purpose | Cost |
|---|---|---|
| **Vercel** | Hosting + edge functions | Free |
| **Supabase** | DB + Auth | Free (Pro later) |
| **Cloudflare** | WAF, SSL, DDoS protection | Free |
| **GitHub** | Source control + CI/CD | Free |
| **WhoGoHost** | Custom domain (planned) | ₦10k/year |

### 2.4 External Services

| Service | Purpose | Cost |
|---|---|---|
| **Paystack** | Payment processing (test mode) | 1.5% + ₦100 |
| **Adsterra** | Ad network | Free to join |
| **Paxum** | Payout for ad revenue | $1 fee |
| **YouTube** | Video hosting | Free |
| **Google Gemini** | AI exam generation | Free tier |

---

## 3. System Architecture

### 3.1 High-Level Diagram

```
┌─────────────────────────────────────────────────────┐
│                   USER BROWSER                       │
│  ┌──────────────────────────────────────────────┐   │
│  │         Next.js App (Vercel)                 │   │
│  │  ┌────────────┬────────────┬─────────────┐  │   │
│  │  │ Public     │ Student    │ Admin       │  │   │
│  │  │ Pages      │ Dashboard  │ Panel       │  │   │
│  │  └────────────┴────────────┴─────────────┘  │   │
│  └──────────────────────────────────────────────┘   │
└────────────────────┬────────────────────────────────┘
                     │ HTTPS
                     ▼
        ┌────────────────────────┐
        │   VERCEL EDGE NETWORK  │
        │  - Middleware          │
        │  - API Routes          │
        │  - Server Components   │
        └───────────┬────────────┘
                    │
        ┌───────────┴───────────┬──────────────┐
        ▼                       ▼              ▼
 ┌─────────────┐       ┌─────────────┐  ┌──────────┐
 │  SUPABASE   │       │  PAYSTACK   │  │ GEMINI   │
 │  - Postgres │       │  - Payments │  │  - AI    │
 │  - Auth     │       │  - Webhooks │  │  - Exams │
 │  - Storage  │       └─────────────┘  └──────────┘
 │  - RLS      │
 └─────────────┘
        │
        ▼
 ┌─────────────┐       ┌─────────────┐
 │  GMAIL SMTP │       │  ADSTERRA   │
 │  (nodemailer│       │  (ad network│
 │  + Supabase)│       │   + Paxum)  │
 └─────────────┘       └─────────────┘
```

### 3.2 Request Flow

**Example: Student watches a lesson**

```
1. Student clicks lesson card
2. Middleware checks: logged in? enrolled?
3. Server component fetches lesson + progress from Supabase
4. Renders page with ProVideoPlayer
5. Player loads YouTube video (custom UI)
6. Every 1s: getCurrentTime() → compute % → save to progress table
7. At 95%: mark completed, unlock next lesson
```

**Example: Admin approves scholarship**

```
1. Admin clicks Approve
2. POST /api/admin/scholarship/approve
3. Verify caller is admin via middleware + profile check
4. Create auth user with temp password
5. Enroll user in course, grant premium access
6. Tag profile as is_scholarship, scholarship_course_id, password_changed=false
7. Send welcome email via Gmail SMTP
8. Return temp password to admin UI
9. Show modal with credentials + WhatsApp copy button
```

---

## 4. Database Schema

### 4.1 Tables Overview

| Table | Purpose | Rows (typical) |
|---|---|---|
| `profiles` | User profile data | = auth.users |
| `courses` | Course catalog | 4–20 |
| `lessons` | Individual video lessons | 20–200 |
| `enrollments` | User ↔ Course relationship | 100–5k |
| `progress` | Per-user lesson progress | 1k–50k |
| `certificates` | Issued certificates | 50–1k |
| `exam_attempts` | Exam results per user | 100–5k |
| `course_exam_settings` | Per-course exam config | = courses |
| `lesson_questions` | Timed quiz questions | Optional |
| `payments` | All transactions | 50–2k |
| `notifications` | Admin → users messages | 20–100 |
| `user_notifications` | Per-user inbox | 1k–50k |
| `scholarship_applications` | Scholarship applications | 30–500 |
| `platform_settings` | Single-row global config | 1 |
| `faqs` | Homepage FAQ items | 4 |
| `newsletter` | Email signups | 0–1k |
| `activity_log` | Audit trail | 1k–50k |

### 4.2 Key Relationships

```
auth.users (Supabase)
    │
    ├──► profiles (1:1, cascade delete)
    │        │
    │        ├── is_scholarship (bool)
    │        ├── scholarship_course_id (FK → courses)
    │        └── password_changed (bool)
    │
    ├──► enrollments (1:N)
    │        │
    │        └──► courses (N:1)
    │
    ├──► progress (1:N)
    │        │
    │        └──► lessons (N:1)
    │
    ├──► certificates (1:N)
    │        │
    │        └──► courses (N:1)
    │
    ├──► payments (1:N)
    │
    └──► scholarship_applications (1:1)

courses
    │
    ├──► lessons (1:N)
    │
    ├──► enrollments (1:N)
    │
    └──► course_exam_settings (1:1)

lessons
    ├──► progress (1:N)
    └──► lesson_questions (1:N)
```

### 4.3 Critical Columns

**`profiles`**
```sql
id uuid PK → auth.users
full_name text
avatar_url text
role text DEFAULT 'student'  -- 'student' | 'admin'
theme_mode text DEFAULT 'system'
theme_accent text DEFAULT 'blue'
is_scholarship boolean DEFAULT false      -- v1.0 addition
scholarship_course_id uuid FK → courses   -- v1.0 addition
password_changed boolean DEFAULT true     -- v1.0 addition
created_at timestamptz
updated_at timestamptz
```

**`courses`**
```sql
id uuid PK
slug text UNIQUE
title text
category text
level text
duration text
icon text        -- emoji
color text       -- tailwind classes
description text
tag text
lessons_count int  -- auto-synced via trigger
is_published boolean
sort_order int
is_premium boolean DEFAULT false          -- v1.0
price_kobo int DEFAULT 0                  -- v1.0
preview_lesson_count int DEFAULT 0        -- v1.0
certificate_price_kobo int                -- v1.0 (null = default)
certificate_enabled boolean DEFAULT true  -- v1.0
```

**`enrollments`**
```sql
id uuid PK
user_id uuid FK → auth.users
course_id uuid FK → courses
enrolled_at timestamptz
paid_at timestamptz            -- v1.0 (null = free)
payment_reference text         -- v1.0
amount_paid_kobo int           -- v1.0
UNIQUE(user_id, course_id)
```

**`payments`**
```sql
id uuid PK
user_id uuid FK → auth.users
reference text UNIQUE          -- e.g. KC_course_xxx
amount_kobo int
status text  -- pending | success | failed | refunded
type text    -- certificate | course
target_id uuid  -- course_id or certificate_id
provider text DEFAULT 'paystack'
metadata jsonb
paid_at timestamptz
```

### 4.4 Row-Level Security

Every table has RLS enabled. Key policies:

```sql
-- Admin check (bypasses recursion)
public.is_admin() → SECURITY DEFINER function

-- courses: public read published
create policy "courses_select_published" ...
  using (is_published = true);

-- profiles: users read own
create policy "profiles_select_own" ...
  using (auth.uid() = id);

-- progress: users manage own
create policy "progress_self_all" ...
  using (auth.uid() = user_id);

-- payments: users read own, admins all
-- certificates: users own, public verify by code
-- scholarship_applications: anyone insert, admin all
```

---

## 5. Authentication & Authorization

### 5.1 Authentication Flow

**Standard Signup:**
```
/signup → POST to Supabase auth.signUp()
       → Trigger creates profiles row
       → Redirect to /dashboard
```

**Login:**
```
/login → auth.signInWithPassword()
      → Look up role in profiles
      → Admin lands on /admin, students on /dashboard
```

**Password Reset:**
```
/forgot-password → auth.resetPasswordForEmail()
                 → Email link → /reset-password
                 → auth.updateUser({ password })
```

### 5.2 Middleware Guards

`lib/supabase/middleware.ts` runs on every request:

| Route | Guard |
|---|---|
| `/dashboard/*` | Must be logged in |
| `/dashboard/*` (if `password_changed = false`) | Force redirect to `/dashboard/change-password` |
| `/admin/*` | Must be logged in AND `role = 'admin'` |
| `/courses/[slug]/lessons/*` | Must be enrolled |
| `/playground` | Must be logged in |

### 5.3 Server-Side Auth Helpers

```ts
// lib/supabase/server.ts
export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient(url, anonKey, {
    cookies: { getAll, setAll }
  });
}

// Usage in any Server Component
const supabase = await createClient();
const { data: { user } } = await supabase.auth.getUser();
```

### 5.4 Access Control Matrix

| Resource | Guest | Student | Admin |
|---|---|---|---|
| Homepage | ✅ | ✅ | ✅ |
| Free courses | ✅ | ✅ | ✅ |
| Premium courses (preview) | ✅ 2 lessons | ✅ 2 lessons | ✅ Full |
| Premium courses (full) | ❌ | Paid only | ✅ |
| Lessons (video) | ❌ | Enrolled only | ✅ |
| Playground | ❌ | ✅ | ✅ |
| Certificates (own) | ❌ | After exam | ✅ |
| Certificates (verify) | ✅ by code | ✅ by code | ✅ |
| Dashboard | ❌ | ✅ | ✅ |
| Scholarship apply | ✅ | ✅ | ✅ |
| Admin panel | ❌ | ❌ | ✅ |
| Revenue settings | ❌ | ❌ | ✅ |

---

## 6. Feature Walkthrough

### 6.1 Public Site

**Homepage (`/`):**
- Hero with Hausa tagline "Koyi coding. Gina makomarka."
- Code editor mockup
- Scholarship banner (if enabled)
- Benefits strip
- Course grid (search, filter by category)
- How-it-works section
- About / CTA
- YouTube subscribe widget
- FAQ accordion
- Newsletter form
- Optional ad slot at bottom

**Courses page (`/courses`):**
- Full course catalog
- Filter chips: All / Free only / Premium
- Search bar
- Premium badges with prices
- Sidebar (desktop): ad + info card

**Course detail (`/courses/[slug]`):**
- Course info + lesson count + duration
- Sticky sidebar card showing:
  - **Guest:** Enroll button or price
  - **Enrolled student:** Progress %, Continue button
  - **Enrolled + premium unpaid:** Price + Unlock button
  - **Scholarship student:** Free access to approved course only
- Lesson list with locked/unlocked states
- Free preview labels
- Final exam CTA (when all lessons complete)

### 6.2 Learning Experience

**Lesson page (`/courses/[slug]/lessons/[lessonSlug]`):**
- Custom YouTube player (no YouTube controls)
- Progress bar with chapters
- 95% completion tracking
- Forward-seek blocked
- Resume from last position
- Transcript, notes, files sidebar tabs
- Popup quiz questions (if configured)
- Prev / Next navigation
- Related YouTube subscribe widget

**Exam page (`/courses/[slug]/exam`):**
- Checks all lessons completed
- Generates 10 AI questions from course content
- One question per screen
- Question navigator (dot grid)
- Submit → server-side scoring
- Pass → certificate unlocked
- Fail → retry available

**Certificate page (`/courses/[slug]/certificate`):**
- Locked until exam passed
- If certificate requires payment → paywall
- After payment → CertificateView
- Printable (A4 landscape)
- QR code linking to verify page

**Certificate verification (`/verify/[code]`):**
- Public — no login needed
- Shows holder name, course, issue date
- Green "Verified" badge
- Copy link button

### 6.3 User Dashboard

**`/dashboard`**
- Profile card (avatar, name, role badge)
- Scholarship banner (if applicable)
- Password change banner (if applicable)
- 4 stat cards: Lessons started, Completed, Day streak, Certificates
- Overall progress bar
- Recent activity feed
- Recommended courses
- Account summary
- YouTube subscribe
- Optional ad slot

**`/dashboard/progress`**
- Full list of started lessons with progress bars

**`/dashboard/certificates`**
- Grid of earned certificates
- Links to verify each one

**`/dashboard/settings`**
- Appearance: theme mode + accent color
- Profile: name, avatar URL
- Email: read-only
- Danger zone: log out of all devices

**`/dashboard/notifications`**
- Full inbox
- Filter: All / Unread
- Mark all read

**`/dashboard/change-password`**
- Forced page if `password_changed = false`
- Live password strength meter
- Verify current, set new

### 6.4 Code Playground (`/playground`)

Two-column layout:

| Left | Right |
|---|---|
| HTML / CSS / JS tabs | Live preview |
| Switch to Python, Java, C++, C | Output panel |

**HTML mode:** Three editors side-by-side, live iframe preview, auto-refresh after 500ms debounce.

**Other modes:** Single editor + Run button (uses external code runner — currently disabled, see Known Limitations).

### 6.5 Notifications

**Admin side (`/admin/notifications`):**
- Compose form: title, message, link, link label, audience
- Audience options: All users / Students only / Admins only / Specific user
- "Also send by email" checkbox
- Sent history with search

**User side:**
- Bell icon in navbar with unread count
- Dropdown with last 20 notifications
- Full inbox at `/dashboard/notifications`
- Real-time updates via Supabase Realtime

---

## 7. User Roles

### 7.1 Student

Standard user. Can:
- Register, log in, manage profile
- Enroll in free courses
- Purchase premium courses
- Watch lessons, track progress
- Take exams, earn certificates
- Use playground
- Receive notifications

### 7.2 Scholarship Student

Same as student, plus:
- `is_scholarship = true` on profile
- Free access to one specific course (`scholarship_course_id`)
- Forced password change on first login
- Scholarship badge on dashboard
- Cannot unlock other premium courses for free

### 7.3 Admin

Full access:
- All student abilities
- Create/edit/delete courses
- Create/edit/delete lessons
- Manage users (promote, delete)
- Approve scholarship applications
- Configure payments, certificates, ads
- Send notifications
- View revenue dashboard
- Access activity log
- Manage exams

---

## 8. Monetization System

### 8.1 Revenue Streams

| Stream | Model | Status |
|---|---|---|
| **Paid certificates** | ₦500 one-time after exam pass | ✅ Live |
| **Premium courses** | ₦1,000–2,500 one-time | ✅ Live |
| **Ads** | Adsterra display ads | ✅ Live |
| **YouTube** | Ad revenue after monetization | 🟡 Pending |
| **Corporate training** | B2B deals | 🟡 Planned |

### 8.2 Payment Flow

```
User clicks Unlock/Buy
    ↓
POST /api/payments/initialize
    ↓
Verify user enrolled + course premium + not already paid
    ↓
Create payments row (status = pending)
    ↓
Call Paystack /transaction/initialize
    ↓
Return authorization_url
    ↓
User redirected to Paystack
    ↓
User pays with card / Opay / USSD
    ↓
Paystack redirects to /payments/callback?reference=xxx
    ↓
Client calls /api/payments/verify
    ↓
Server verifies with Paystack API
    ↓
On success: update payments.status = success
           update enrollments.paid_at = now
           OR certificates.is_paid = true
           log to activity_log
    ↓
Redirect to /dashboard
```

### 8.3 Webhook (Belt + Suspenders)

`/api/payments/webhook` receives Paystack's `charge.success` event:

1. Verify signature with HMAC SHA-512
2. Find payment by reference
3. Update status, grant access
4. Log activity

**Idempotent:** Checks `status !== 'success'` before processing.

### 8.4 Ad System

**Configuration in `/admin/revenue` → Ads tab:**
- Master switch (`ads_enabled`)
- Provider (Adsterra / AdSense / Custom)
- Client ID
- Slot toggles (homepage_top, homepage_bottom, courses_sidebar, lesson_bottom, dashboard_sidebar)
- Safety rules: skip for admins, skip on exam, skip on checkout

**AdSlotAdsterra component:**
- Reads config from `<AdConfig />` in layout
- Injects script + container dynamically
- Renders nothing if disabled

### 8.5 Adsterra Integration

**Current setup:**
- Site approved
- 4 ad units created:
  - 728×90 (leaderboard)
  - 300×250 (medium rectangle)
  - 160×600 (skyscraper)
  - Native banner
- Payout via Paxum ($5 min, $1 fee, 1–2 days)

---

## 9. Scholarship Program

### 9.1 Program Flow

```
1. Admin enables scholarship in /admin/revenue
        ↓
2. Students apply at /scholarship
        ↓
3. Application saved with status = 'pending'
        ↓
4. Admin reviews in /admin/scholarships
        ↓
5. Admin clicks Approve
        ↓
6. API:
   - Creates auth user with random temp password
   - Enrolls them in their chosen course
   - Sets is_scholarship = true
   - Sets scholarship_course_id
   - Sets password_changed = false
   - Sends welcome email with credentials
        ↓
7. Student logs in → forced to /dashboard/change-password
        ↓
8. After password change → full course access
```

### 9.2 Admin Config (`/admin/revenue` → Scholarship tab)

- **Master toggle** — Open/close applications
- **Title** — shown on public page
- **Description** — shown under title
- **Max seats** — limit for the cohort
- **Link** to `/admin/scholarships` for review

### 9.3 Public Page (`/scholarship`)

- Shows title + description
- Seats remaining counter
- "What you get" benefits list
- Application form:
  - Full name
  - Email
  - Phone
  - City
  - Age range
  - Background
  - Course selection
  - Motivation (min 50 chars)
  - Commitment checkbox
- Success state after submit

### 9.4 Access Restriction

A scholarship student:
- ✅ Can access their `scholarship_course_id` course for free
- ✅ Can access any free course
- ❌ Cannot access other premium courses without paying
- Sees a friendly "Not your scholarship course" message with a buy option

---

## 10. Admin Panel

### 10.1 Sidebar Navigation

| Page | Purpose |
|---|---|
| **Overview** | Stats, recent activity, top courses |
| **Courses** | Full CRUD, publish toggle, exam config |
| **Scholarships** | Review applications, approve/reject |
| **Lessons** | Full CRUD, YouTube URL parser |
| **Users** | View, edit, promote, delete |
| **Enrollments** | View, filter, remove |
| **Exams** | Per-course settings + attempts |
| **Certificates** | View, revoke, verify |
| **Revenue** | Payments, keys, ads, scholarship config |
| **Notifications** | Send + history |
| **Activity log** | Full audit trail |

### 10.2 Common Admin Actions

| Task | Path |
|---|---|
| Add course | Courses → + New course |
| Add lesson | Lessons → + New lesson |
| Publish course | Courses → card → Publish |
| Set exam score | Courses → Open → Exam settings |
| Approve scholarship | Scholarships → Approve |
| Send notification | Notifications → Compose → Send |
| Change certificate price | Revenue → Certificates tab |
| Enable ads | Revenue → Ads tab |
| Toggle payments | Revenue → Overview → Payments |
| View revenue | Revenue → Overview |
| Export data | Any table → CSV button |

---

## 11. Security Model

### 11.1 Authentication

- **Passwords** hashed with bcrypt by Supabase
- **Sessions** stored in HTTP-only cookies
- **Password reset** via email link, 1-hour expiry
- **Strong password** enforced: 8+ chars, upper, lower, number

### 11.2 Authorization

| Layer | What it does |
|---|---|
| **Middleware** | Guards `/dashboard/*` and `/admin/*` routes |
| **Server components** | Re-verify auth + role |
| **RLS policies** | Row-level access in Postgres |
| **Service role** | Only in API routes for admin actions |

### 11.3 Payment Security

- **Server-side verification** — Paystack API call every time
- **Webhook signature** — HMAC SHA-512
- **Idempotency** — status check before processing
- **Amount validation** — matches DB record
- **No secret keys in frontend** — `PAYSTACK_SECRET_KEY` server-only

### 11.4 Data Protection

- **RLS** on every table
- **Cascade deletes** on user removal
- **Audit trail** in `activity_log`
- **No card data stored** — Paystack handles PCI

### 11.5 RLS Recursion Prevention

Use `is_admin()` SECURITY DEFINER function:

```sql
create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select coalesce(
    (select role = 'admin' from public.profiles where id = auth.uid() limit 1),
    false
  );
$$;
```

This bypasses RLS on the profiles lookup, avoiding infinite recursion.

---

## 12. Environment Variables

### 12.1 Required (`.env.local` + Vercel)

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Site
NEXT_PUBLIC_SITE_URL=https://koyocode.vercel.app

# Paystack
PAYSTACK_SECRET_KEY=sk_test_...  (or sk_live_)

# Gmail SMTP
GMAIL_USER=aliyububakar11117@gmail.com
GMAIL_APP_PASSWORD=xxxxxxxxxxxxxxxx

# Gemini AI
GEMINI_API_KEY=AIza...

# YouTube
NEXT_PUBLIC_YOUTUBE_CHANNEL_HANDLE=@aliyudev
NEXT_PUBLIC_YOUTUBE_CHANNEL_URL=https://www.youtube.com/@aliyudev
```

### 12.2 Environment-Specific Values

| Variable | Local | Vercel |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | `http://localhost:3000` | `https://koyocode.vercel.app` |

**⚠️ Never commit `.env.local`** — must be in `.gitignore`.

---

## 13. Deployment

### 13.1 Local Development

```bash
npm install
npm run dev
# Opens on http://localhost:3000
```

### 13.2 Vercel Deployment

**Automatic:** Every push to `main` triggers a deploy.

```bash
git add .
git commit -m "feat: your change"
git push
```

**Watch at:** vercel.com → your project → Deployments

### 13.3 Environment Variables on Vercel

1. Project → Settings → Environment Variables
2. Add each from §12.1
3. Set for **Production, Preview, Development**
4. **Redeploy after any change** (env vars baked at build time)

### 13.4 Custom Domain (Planned)

1. Buy `koyocode.com.ng` from WhoGoHost (~₦10k/year)
2. Add to Vercel → Project → Domains
3. Point DNS to Vercel nameservers
4. Enable Cloudflare in front (optional but recommended)

### 13.5 Supabase Auth URLs

**Site URL:** `https://koyocode.vercel.app`

**Redirect URLs:**
```
https://koyocode.vercel.app/reset-password
https://koyocode.vercel.app/**
http://localhost:3000/reset-password
```

---

## 14. API Reference

### 14.1 Payment APIs

**`POST /api/payments/initialize`**

Initializes a Paystack transaction.

**Body:**
```json
{
  "type": "course" | "certificate",
  "course_id": "uuid"
}
```

**Response:**
```json
{
  "ok": true,
  "reference": "KC_course_xxx",
  "authorization_url": "https://checkout.paystack.com/...",
  "access_code": "xxx"
}
```

---

**`POST /api/payments/verify`**

Server-side verification of a payment.

**Body:** `{ "reference": "KC_course_xxx" }`

**Response:** `{ "ok": true, "status": "success" }`

---

**`POST /api/payments/webhook`**

Receives Paystack events. No auth required (verified by signature).

### 14.2 Exam APIs

**`POST /api/exams/generate-for-user`**

Generates an AI exam from course curriculum.

**Body:** `{ "course_id": "uuid" }`

**Response:**
```json
{
  "ok": true,
  "questions": [
    {
      "question": "...",
      "options": ["A", "B", "C", "D"],
      "correct_index": 0,
      "explanation": "..."
    }
  ],
  "model": "gemini-2.5-flash"
}
```

### 14.3 Admin APIs

**`POST /api/admin/scholarship/approve`**

Approves a scholarship application, creates user, sends email.

**Body:** `{ "application_id": "uuid" }`

**Response:**
```json
{
  "ok": true,
  "user_id": "uuid",
  "temp_password": "Xk9pQm3Rt7wZ@1",
  "email_sent": true
}
```

---

**`POST /api/admin/send-notification`**

Sends a notification to a target audience.

**Body:**
```json
{
  "title": "New lesson added",
  "message": "Check out the CSS Box Model lesson!",
  "link": "/courses/css-web-design",
  "link_label": "Open course",
  "audience": "all" | "students" | "admins" | "user",
  "target_user": "uuid",
  "send_email": true
}
```

---

## 15. File Structure

```
koyocode/
├── app/
│   ├── (auth)/
│   │   ├── actions.ts
│   │   ├── login/page.tsx
│   │   ├── signup/page.tsx
│   │   ├── forgot-password/page.tsx
│   │   └── reset-password/page.tsx
│   ├── admin/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── courses/
│   │   ├── lessons/
│   │   ├── users/
│   │   ├── enrollments/
│   │   ├── exams/
│   │   ├── certificates/
│   │   ├── scholarships/
│   │   ├── notifications/
│   │   ├── revenue/
│   │   └── activity/
│   ├── api/
│   │   ├── payments/{initialize,verify,webhook}/route.ts
│   │   ├── exams/generate-for-user/route.ts
│   │   └── admin/{scholarship/approve,send-notification}/route.ts
│   ├── courses/
│   │   ├── page.tsx
│   │   └── [slug]/
│   │       ├── page.tsx
│   │       ├── buy/page.tsx
│   │       ├── certificate/page.tsx
│   │       ├── exam/page.tsx
│   │       └── lessons/[lessonSlug]/page.tsx
│   ├── dashboard/
│   │   ├── page.tsx
│   │   ├── progress/page.tsx
│   │   ├── certificates/page.tsx
│   │   ├── settings/page.tsx
│   │   ├── notifications/page.tsx
│   │   └── change-password/page.tsx
│   ├── scholarship/page.tsx
│   ├── verify/[code]/page.tsx
│   ├── playground/page.tsx
│   ├── payments/callback/page.tsx
│   ├── layout.tsx
│   ├── globals.css
│   ├── loading.tsx
│   ├── not-found.tsx
│   └── page.tsx
├── components/
│   ├── ui/
│   │   ├── Alert.tsx
│   │   ├── Avatar.tsx
│   │   ├── Button.tsx
│   │   ├── Icons.tsx
│   │   ├── Input.tsx
│   │   └── PasswordStrength.tsx
│   ├── admin/
│   │   ├── AdminSidebar.tsx
│   │   ├── AdminTopbar.tsx
│   │   ├── CertificatesManager.tsx
│   │   ├── CoursesManager.tsx
│   │   ├── EnrollmentsManager.tsx
│   │   ├── ExamSettingsForm.tsx
│   │   ├── ExamsManager.tsx
│   │   ├── LessonsManager.tsx
│   │   ├── NotificationsComposer.tsx
│   │   ├── RevenueManager.tsx
│   │   ├── ScholarshipsManager.tsx
│   │   ├── UsersManager.tsx
│   │   └── ui.tsx
│   ├── AdConfig.tsx
│   ├── AdSlotAdsterra.tsx
│   ├── BuyButton.tsx
│   ├── CertificateView.tsx
│   ├── CopyLinkButton.tsx
│   ├── CourseCard.tsx
│   ├── CourseGrid.tsx
│   ├── EnrollButton.tsx
│   ├── ExamRunner.tsx
│   ├── FAQ.tsx
│   ├── Footer.tsx
│   ├── Navbar.tsx
│   ├── NotificationBell.tsx
│   ├── NotificationsInbox.tsx
│   ├── Playground.tsx
│   ├── Preloader.tsx
│   ├── ProVideoPlayer.tsx
│   ├── Reveal.tsx
│   ├── ScholarshipForm.tsx
│   ├── ThemeProvider.tsx
│   ├── ThemeSwitcher.tsx
│   └── YouTubeSubscribe.tsx
├── lib/
│   ├── supabase/
│   │   ├── client.ts
│   │   ├── server.ts
│   │   └── middleware.ts
│   ├── password.ts
│   ├── progress.ts
│   ├── queries.ts
│   ├── settings.ts
│   ├── types.ts
│   └── utils.ts
├── proxy.ts         (middleware)
├── public/
├── .env.local       (gitignored)
├── package.json
├── tsconfig.json
├── next.config.ts
└── README.md
```

---

## 16. Testing Checklist

### 16.1 Auth Flow

- [ ] Sign up with new email works
- [ ] Duplicate email rejected
- [ ] Weak password rejected on signup
- [ ] Login works with correct credentials
- [ ] Wrong password shows error
- [ ] Forgot password sends reset email
- [ ] Reset link lands on `/reset-password`
- [ ] New password accepted, old one rejected after change
- [ ] Logout works from any page

### 16.2 Student Flow

- [ ] Browse homepage, all sections load
- [ ] Filter courses by category
- [ ] Search courses by name
- [ ] Enroll in free course
- [ ] Watch lesson — progress saves
- [ ] 95% → next lesson unlocks
- [ ] Refresh — resume from same position
- [ ] Complete all lessons
- [ ] Take exam — AI generates questions
- [ ] Pass exam → certificate available
- [ ] Download certificate (print → PDF)
- [ ] QR code opens `/verify/[code]`

### 16.3 Payment Flow

- [ ] Set `payments_enabled = true` in admin
- [ ] Add Paystack public key
- [ ] Set certificate price
- [ ] Mark course as premium
- [ ] Student sees paywall
- [ ] Click Buy → Paystack checkout
- [ ] Pay with test card `4084 0840 8408 4081`
- [ ] Redirect to `/payments/callback`
- [ ] Payment verified
- [ ] Access unlocked
- [ ] Webhook fires (check Supabase `payments` table)
- [ ] Admin revenue dashboard shows sale

### 16.4 Scholarship Flow

- [ ] Admin enables scholarship
- [ ] Public page shows form
- [ ] Submit with valid data — success message
- [ ] Admin sees application
- [ ] Approve → user created + email sent
- [ ] Student logs in with temp password
- [ ] Forced password change
- [ ] After change → full course access
- [ ] Cannot access other premium courses
- [ ] Cannot access other scholarship features

### 16.5 Admin Panel

- [ ] Overview shows correct stats
- [ ] Create course → visible on homepage
- [ ] Edit course → changes reflect
- [ ] Publish/unpublish toggles work
- [ ] Add lesson with YouTube URL → parses ID
- [ ] Publish lesson → appears on course page
- [ ] Delete lesson → removed
- [ ] Promote user to admin → can access `/admin`
- [ ] Send notification → appears in bell

### 16.6 Dark Mode

- [ ] Toggle in navbar works
- [ ] All pages render correctly in dark
- [ ] No white patches or unreadable text
- [ ] Accent color changes apply everywhere
- [ ] Preference persists across reload

### 16.7 Mobile

- [ ] Navbar collapses to hamburger
- [ ] Mobile menu shows all links
- [ ] Forms usable on mobile
- [ ] Lesson player usable on mobile
- [ ] Course cards stack vertically
- [ ] Exam questions fit screen

### 16.8 Ads

- [ ] Enable in admin → ads appear
- [ ] Disable → ads disappear immediately
- [ ] Slot toggles work individually
- [ ] No ads on exam pages
- [ ] No ads for admins

---

## 17. Known Limitations

### 17.1 Email

**Current:** Gmail SMTP via Supabase + nodemailer.
**Issue:** Gmail blocks bulk sending; rate limits ~500/day.
**Fix:** Migrate to Resend (3,000 free/month) or Brevo (300/day free) before scaling beyond 30 emails/day.

### 17.2 Payment (Test Mode Only)

**Current:** Paystack test keys.
**Issue:** No real money moves. Paystack account still under review.
**Fix:** Complete Paystack compliance — provide NIN, BVN, address, and correct name match.

### 17.3 Code Playground

**Current:** HTML/CSS/JS works (browser-only). Python/Java/C++ runners disabled.
**Issue:** Piston public API requires whitelist approval. Judge0 requires subscription.
**Fix:** Self-host Piston on a free Oracle Cloud VPS, or subscribe to Judge0 CE.

### 17.4 Ads

**Current:** Adsterra with low CPM ($0.003–$0.05).
**Issue:** Low-quality ads; no meaningful revenue until ~5,000 daily visitors.
**Fix:** Apply to AdSense once 20+ lessons exist and traffic stabilizes.

### 17.5 Certificates

**Current:** "KoyoCode course-completion certificate" — no external accreditation.
**Issue:** Some employers won't recognize it as authoritative.
**Fix:** Partner with local companies who agree to recognize KoyoCode certificates as proof of basic coding skill.

### 17.6 Storage

**Current:** Supabase free tier — 500 MB database, 1 GB storage.
**Issue:** Won't scale past ~5,000 users or ~200 videos.
**Fix:** Upgrade to Supabase Pro ($25/mo) when limits approach.

### 17.7 No Mobile App

**Current:** Web only — responsive but no native app.
**Fix:** Wrap with Capacitor.js in Phase 4 (~1 day of work).

### 17.8 No Real-Time Notifications

**Current:** Notification bell loads on page visit.
**Fix:** Subscribe to Supabase Realtime channel for instant updates.

---

## 18. Roadmap

### Phase 1 — Now (v1.0)

- [x] Core learning platform
- [x] User authentication
- [x] Free courses + lessons
- [x] Progress tracking
- [x] AI exams
- [x] Certificates with QR verification
- [x] Payment integration (test)
- [x] Scholarship program
- [x] Admin panel
- [x] Notifications
- [x] Ads (Adsterra)

### Phase 2 — Next 30 days

- [ ] Fix Gmail SMTP reliability
- [ ] Complete Paystack verification
- [ ] Publish 10 YouTube videos
- [ ] Launch first scholarship cohort (30 students)
- [ ] Custom domain (`koyocode.com.ng`)
- [ ] Add mobile app via Capacitor

### Phase 3 — Months 2–3

- [ ] Apply to Google AdSense
- [ ] Add 3–5 more premium courses
- [ ] Build corporate training page
- [ ] Reach 200 regular users
- [ ] Set up self-hosted Piston for playground

### Phase 4 — Months 4–6

- [ ] Reach 500 regular users
- [ ] Launch referral program
- [ ] Add discussion/comments on lessons
- [ ] Issue first paid certificates
- [ ] Pitch 3 corporate training deals

### Phase 5 — Year 1

- [ ] Reach 2,000 regular users
- [ ] ₦200k+/month revenue
- [ ] Professional certification partnerships
- [ ] Hire 1 part-time instructor
- [ ] Publish on Google Play Store

---

## Appendix A — Glossary

| Term | Meaning |
|---|---|
| **Arewa** | Northern Nigeria |
| **Hausa** | Dominant language in Northern Nigeria |
| **RLS** | Row-Level Security (Postgres feature) |
| **CPM** | Cost Per Mille (per 1,000 impressions) |
| **CTR** | Click-Through Rate |
| **RPM** | Revenue Per Mille |
| **PKCE** | Proof Key for Code Exchange (auth flow) |
| **JWT** | JSON Web Token |
| **CRUD** | Create, Read, Update, Delete |
| **SSR** | Server-Side Rendering |
| **ISR** | Incremental Static Regeneration |

## Appendix B — Contact

**Founder:** Aliyu Abubakar
**Email:** aliyuabubakar11117@gmail.com
**YouTube:** https://www.youtube.com/@aliyudev
**Platform:** https://koyocode.vercel.app

---

**End of KoyoCode System Documentation v1.0**

*This document should be updated with every major release. Save it as `docs/SYSTEM_v1.md` in your repository.*

---

Would you like me to also produce:

1. **A user guide PDF** for students?
2. **A one-page pitch deck** for corporate sponsors?
3. **A README.md** for the GitHub repo?