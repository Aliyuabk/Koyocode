I need you to generate a complete SQL INSERT script to add ONE new course 
to my Supabase database for KoyoCode, a coding education platform.

═══════════════════════════════════════════════════════════
SECTION 1 — WHAT I'LL TELL YOU
═══════════════════════════════════════════════════════════

I will fill in these 6 variables:

COURSE_SLUG:        (e.g. "python-basics")
COURSE_TITLE:       (e.g. "Python Basics")
COURSE_CATEGORY:    (e.g. "Programming")
COURSE_ICON:        (an emoji, e.g. "🐍")
COURSE_COLOR:       (a Tailwind class pair, e.g. "bg-emerald-100 text-emerald-700")
LESSON_COUNT:       (a number, e.g. 14)
LESSON_OUTLINE:     (a numbered list of lesson titles — I'll provide this)


═══════════════════════════════════════════════════════════
SECTION 2 — OUTPUT FORMAT (FOLLOW EXACTLY)
═══════════════════════════════════════════════════════════

Output ONLY valid SQL. No prose before or after. No markdown fences 
around the whole thing. Structure:

-- ============================================================
-- KOYOCODE COURSE IMPORT — [Course Title]
-- ============================================================
begin;

with new_course as (
  insert into public.courses
    (slug, title, category, level, duration, icon, color, description, tag,
     lessons_count, is_published, sort_order, is_premium, price_kobo,
     preview_lesson_count, certificate_enabled)
  values
    ('COURSE_SLUG', 'COURSE_TITLE', 'COURSE_CATEGORY', 'Beginner',
     'Xh Ym', 'COURSE_ICON', 'COURSE_COLOR',
     'A 1-sentence description, max 200 characters.',
     'Available', LESSON_COUNT, true, [NEXT_SORT_ORDER], false, 0, 0, true)
  returning id
)
insert into public.lessons
  (course_id, slug, title, description, duration_minutes, sort_order,
   is_published, notes, concepts, exercise_type, exercise_prompt,
   exercise_starter, exercise_solution, exercise_hint,
   quick_check_question, quick_check_options, quick_check_correct_index,
   quick_check_explanation)
select new_course.id, x.* from new_course, (values

-- LESSON 1
('lesson-slug', 'Lesson Title',
 'A one-sentence description for the lesson.',
 8, 1, true,
E'## Heading\n\nLesson content in Markdown here...',
 '[{"title":"Concept 1","body":"Explanation."},{"title":"Concept 2","body":"Explanation."}]'::jsonb,
 'none', null, null, null, null,
 'The quiz question?',
 '["Option A","Option B","Option C","Option D"]'::jsonb,
 0,
 'Why the correct answer is correct.'),

-- LESSON 2
('lesson-slug-2', 'Second Lesson Title',
 '...',
 10, 2, true,
E'...',
 '[...]'::jsonb,
 'none', null, null, null, null,
 '...',
 '["A","B","C","D"]'::jsonb,
 1,
 '...')

-- (repeat for every lesson)

) as x(slug, title, description, duration_minutes, sort_order, is_published,
       notes, concepts, exercise_type, exercise_prompt, exercise_starter,
       exercise_solution, exercise_hint, quick_check_question,
       quick_check_options, quick_check_correct_index, quick_check_explanation);

commit;


═══════════════════════════════════════════════════════════
SECTION 3 — SCHEMA (DO NOT DEVIATE)
═══════════════════════════════════════════════════════════

COURSES table columns you must fill:
  slug, title, category, level, duration, icon, color, description, tag,
  lessons_count, is_published, sort_order, is_premium, price_kobo,
  preview_lesson_count, certificate_enabled

LESSONS table columns you must fill:
  course_id, slug, title, description, duration_minutes, sort_order,
  is_published, notes, concepts, exercise_type, exercise_prompt,
  exercise_starter, exercise_solution, exercise_hint,
  quick_check_question, quick_check_options, quick_check_correct_index,
  quick_check_explanation

Values that are always the same:
  - level:              'Beginner'
  - tag:                'Available'
  - is_published:       true
  - is_premium:         false
  - price_kobo:         0
  - preview_lesson_count: 0
  - certificate_enabled:  true

For lessons:
  - exercise_type:      'none' (unless I say otherwise)
  - For 'none' type:    exercise_prompt, exercise_starter, exercise_solution,
                        exercise_hint must all be null (as SQL NULL, not the
                        string 'null')


═══════════════════════════════════════════════════════════
SECTION 4 — CRITICAL RULES (VIOLATING THESE BREAKS THE SQL)
═══════════════════════════════════════════════════════════

RULE 1 — NO NESTED DOUBLE QUOTES IN JSONB
The concepts and quick_check_options fields are JSONB. Inside a JSONB 
string, you MUST NOT use double quotes.

  WRONG:  {"title":"X","body":"This is called "separation of concerns"."}
  RIGHT:  {"title":"X","body":"This is called separation of concerns."}

If you need to emphasize a word, use single quotes 'like this' or 
Markdown **bold** instead. Never "nested double quotes".

RULE 2 — VALID JSON ONLY
  - Keys use double quotes
  - String values use double quotes
  - No trailing commas
  - No comments inside JSON
  - No line breaks inside a JSON string — use \n for line breaks

  WRONG (multi-line string in JSON):
  {"title":"X","body":"Line 1
  Line 2"}

  RIGHT:
  {"title":"X","body":"Line 1\nLine 2"}

RULE 3 — NOTES FIELD USES POSTGRES E-STRINGS
The notes field is a Markdown string. Use E'...' syntax (E before the 
single quote) so \n, \t, and \\ are interpreted correctly.

  E'## Title\n\nSome text.\n\n### Subheading\n\nMore text.'

Inside an E-string:
  - \n = newline
  - To write an actual backslash, use \\
  - Single quotes inside are allowed but must be escaped as \' if the 
    string contains them awkwardly

RULE 4 — JSONB FIELDS NEED ::jsonb CAST
Every JSONB literal must end with ::jsonb.

  '[...]'::jsonb
  '[{"title":"X","body":"Y"}]'::jsonb

RULE 5 — LESSON SLUGS ARE UNIQUE PER COURSE
Each lesson's slug must be lowercase, hyphenated, and unique within 
the course.

RULE 6 — SORT_ORDER IS SEQUENTIAL
Lesson 1 has sort_order 1, lesson 2 has sort_order 2, etc.

RULE 7 — SINGLE VALUES BLOCK
All lessons for one course go inside ONE (values ...) block, comma-
separated. Do not write a separate INSERT per lesson.

RULE 8 — END WITH COMMIT
The transaction begins with `begin;` and ends with `commit;`.

RULE 9 — NO EXPLANATION
Do not write prose before or after the SQL. No "here is the SQL" 
introduction. No "let me know if you need changes". Just the SQL.

RULE 10 — NO TRUNCATION
Generate the FULL SQL for all lessons. If it's long, that's fine. 
Never use "..." to skip lessons.


═══════════════════════════════════════════════════════════
SECTION 5 — CONTENT QUALITY
═══════════════════════════════════════════════════════════

Audience: complete beginners in Northern Nigeria. Many have never 
written code. Many speak Hausa as a first language and English as a 
second. Use plain, clear English.

For each lesson, produce:

1. notes (Markdown, 200-400 words)
   - ## Heading at the top
   - Explanation in plain language
   - A code example
   - Why it matters
   - A common mistake to avoid
   - Use ## and ### headings
   - Use ```code fences``` for code examples
   - Use inline `code` for short identifiers

2. concepts (3-5 items)
   - Each has title (short phrase, no period) and body (1-3 sentences)
   - These render as expandable cards

3. quick_check
   - ONE question that tests understanding
   - FOUR options (strings)
   - correct_index: 0-3 (which option is correct)
   - explanation: 1-2 sentences explaining the answer

4. exercise (only if I ask for a specific exercise_type)
   - If exercise_type = 'none': all 4 exercise fields are null
   - If exercise_type = 'html' or 'javascript': provide prompt, starter,
     solution, hint

Tone:
  - Encouraging: "You've got this." "Great question."
  - Concrete: use real examples from Nigerian daily life
    (jollof rice, Lagos, suya, football, school)
  - Short sentences. No jargon without explanation.
  - Never say "obviously" or "as you know"

Quality bar:
  - Every notes field must actually TEACH the concept, not summarize it
  - Every quick_check must test understanding, not trivia
  - Every code example must be complete and runnable
  - Do not use placeholder text like "..." or "TODO"


═══════════════════════════════════════════════════════════
SECTION 6 — HERE IS THE COURSE I WANT
═══════════════════════════════════════════════════════════

COURSE_SLUG:      [FILL IN]
COURSE_TITLE:     [FILL IN]
COURSE_CATEGORY:  [FILL IN]
COURSE_ICON:      [FILL IN]
COURSE_COLOR:     [FILL IN]
LESSON_COUNT:     [FILL IN]
NEXT_SORT_ORDER:  [FILL IN — the next available sort_order in my courses table]

LESSON_OUTLINE:
1. [Lesson title]
2. [Lesson title]
3. [Lesson title]
...

Generate the complete SQL now.