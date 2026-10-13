import YouTubeSubscribe from "@/components/YouTubeSubscribe";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CourseGrid from "@/components/CourseGrid";
import FAQ from "@/components/FAQ";
import Reveal from "@/components/Reveal";
import AdSlotAdsterra from "@/components/AdSlotAdsterra";
import { getCourses, getFAQs } from "@/lib/queries";
import { getPublicSettings } from "@/lib/settings";

export default async function Home() {
  const [courses, faqs, settings] = await Promise.all([
    getCourses(),
    getFAQs(),
    getPublicSettings(),
  ]);

  const adsOn = settings.ads_enabled;
  const slots = settings.ads_slots ?? {};

  return (
    <>
      <Navbar />

      <main>
        {/* ==================== HERO ==================== */}
        <section id="home" className="relative overflow-hidden">
          <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-blue-100/40 blur-3xl dark:bg-blue-900/20" />
          <div className="pointer-events-none absolute -bottom-20 left-0 h-72 w-72 rounded-full bg-sky-100/40 blur-3xl dark:bg-sky-900/15" />

          <div className="relative mx-auto grid max-w-7xl items-center gap-14 px-5 py-20 sm:px-8 sm:py-28 lg:grid-cols-2 lg:py-32">
            <Reveal>
              <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-800 dark:border-[#1f2a44] dark:bg-[#16233d] dark:text-blue-300">
                <span className="h-2 w-2 rounded-full bg-blue-600 animate-pulse-dot dark:bg-blue-400" />
                Your coding journey starts here
              </div>

              <h1 className="max-w-2xl text-4xl font-black leading-[1.12] tracking-tight text-slate-900 sm:text-5xl lg:text-6xl dark:text-[#f1f5f9]">
                Koyi coding.
                <br />
                <span className="text-blue-700 dark:text-blue-400">
                  Gina makomarka.
                </span>
              </h1>

              <p className="mt-6 max-w-xl text-lg leading-8 text-slate-600 dark:text-[#94a3b8]">
                Learn to code from the beginning with simple lessons in Hausa
                and English. Build real skills, create projects, and take your
                first step into technology.
              </p>

              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <a
                  href="#courses"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-blue-700 px-7 py-4 font-bold text-white shadow-xl shadow-blue-700/20 transition hover:-translate-y-0.5 hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-500"
                >
                  Explore courses →
                </a>
                <a
                  href="#how-it-works"
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-7 py-4 font-bold text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 dark:border-[#1f2a44] dark:bg-[#0e1526] dark:text-[#cbd5e1] dark:hover:border-blue-600 dark:hover:bg-[#1b2742]"
                >
                  How it works ↗
                </a>
              </div>

              <div className="mt-10 flex flex-wrap gap-x-6 gap-y-3 text-sm text-slate-600 dark:text-[#94a3b8]">
                {["Beginner-friendly", "Learn at your pace", "Hausa + English"].map(
                  (t) => (
                    <span key={t} className="flex items-center gap-2">
                      <span className="font-bold text-blue-700 dark:text-blue-400">
                        ✓
                      </span>
                      {t}
                    </span>
                  )
                )}
              </div>
            </Reveal>

            <Reveal delay={0.15}>
              <div className="relative mx-auto w-full max-w-xl">
                <div className="absolute -inset-5 rounded-[2rem] bg-blue-100/60 blur-2xl dark:bg-blue-900/20" />

                <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-blue-900/10 dark:border-[#1f2a44] dark:bg-[#131c33] dark:shadow-black/40">
                  <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-5 py-4 dark:border-[#1f2a44] dark:bg-[#0e1526]">
                    <div className="flex gap-2">
                      <span className="h-3 w-3 rounded-full bg-red-400" />
                      <span className="h-3 w-3 rounded-full bg-amber-400" />
                      <span className="h-3 w-3 rounded-full bg-emerald-400" />
                    </div>
                    <span className="text-xs font-semibold text-slate-500 dark:text-[#94a3b8]">
                      my-first-website.html
                    </span>
                    <span className="text-xs text-slate-400 dark:text-[#64748b]">
                      HTML
                    </span>
                  </div>

                  <div className="overflow-x-auto bg-white p-5 font-mono text-sm leading-8 sm:p-8 dark:bg-[#131c33]">
                    <div>
                      <span className="text-blue-700 dark:text-blue-400">
                        {"<h1>"}
                      </span>
                      <span className="text-slate-800 dark:text-[#f1f5f9]">
                        Hello, world!
                      </span>
                      <span className="text-blue-700 dark:text-blue-400">
                        {"</h1>"}
                      </span>
                    </div>
                    <div>
                      <span className="text-blue-700 dark:text-blue-400">
                        {"<p>"}
                      </span>
                      <span className="text-slate-800 dark:text-[#f1f5f9]">
                        I am learning to code.
                      </span>
                      <span className="text-blue-700 dark:text-blue-400">
                        {"</p>"}
                      </span>
                    </div>
                    <div>
                      <span className="text-blue-700 dark:text-blue-400">
                        {"<button>"}
                      </span>
                      <span className="text-slate-800 dark:text-[#f1f5f9]">
                        Start now
                      </span>
                      <span className="text-blue-700 dark:text-blue-400">
                        {"</button>"}
                      </span>
                    </div>

                    <div className="mt-5 rounded-xl border border-emerald-100 bg-emerald-50 p-4 dark:border-emerald-900/40 dark:bg-emerald-950/30">
                      <div className="mb-2 flex items-center gap-2 text-xs font-bold text-emerald-700 dark:text-emerald-400">
                        <span>●</span> YOUR FIRST CODE
                      </div>
                      <p className="font-sans text-base font-bold text-slate-800 dark:text-[#f1f5f9]">
                        Hello, world!
                      </p>
                      <p className="font-sans text-sm text-slate-500 dark:text-[#94a3b8]">
                        Every expert was once a beginner.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between bg-blue-700 px-5 py-4 text-sm text-white dark:bg-blue-700">
                    <span>Keep learning. Keep building.</span>
                    <span className="font-bold">KoyoCode ✦</span>
                  </div>
                </div>

                <div className="absolute -left-5 top-12 hidden rounded-xl border border-slate-100 bg-white p-4 shadow-xl sm:block animate-float dark:border-[#1f2a44] dark:bg-[#131c33]">
                  <span className="text-2xl">💻</span>
                  <p className="mt-1 text-xs font-bold text-slate-800 dark:text-[#f1f5f9]">
                    Learn by doing
                  </p>
                </div>

                <div className="absolute -bottom-5 -right-3 rounded-xl border border-slate-100 bg-white p-4 shadow-xl sm:-right-5 dark:border-[#1f2a44] dark:bg-[#131c33]">
                  <p className="text-xs text-slate-500 dark:text-[#94a3b8]">
                    Your next chapter
                  </p>
                  <p className="mt-1 text-sm font-extrabold text-blue-700 dark:text-blue-400">
                    Web Developer 🚀
                  </p>
                </div>
              </div>
            </Reveal>
          </div>
        </section>

        {/* ==================== BENEFITS ==================== */}
        <section className="border-y border-blue-100 bg-blue-50 dark:border-[#1f2a44] dark:bg-[#10182b]">
          <div className="mx-auto grid max-w-7xl gap-6 px-5 py-8 sm:grid-cols-2 sm:px-8 lg:grid-cols-4">
            {[
              ["01", "Start from zero", "No previous experience needed"],
              ["02", "Simple explanations", "Understand each concept clearly"],
              ["03", "Practical learning", "Learn by building projects"],
              ["04", "Your own pace", "Learn when you are ready"],
            ].map(([n, title, desc], i) => (
              <Reveal key={n} delay={i * 0.05}>
                <div className="flex gap-4">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white font-extrabold text-blue-700 shadow-sm dark:bg-[#16233d] dark:text-blue-400">
                    {n}
                  </span>
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-[#f1f5f9]">
                      {title}
                    </h3>
                    <p className="mt-1 text-sm text-slate-600 dark:text-[#94a3b8]">
                      {desc}
                    </p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        {/* ==================== COURSES ==================== */}
        <CourseGrid courses={courses} />

        {/* ==================== HOW IT WORKS ==================== */}
        <section
          id="how-it-works"
          className="scroll-mt-24 bg-slate-50 px-5 py-20 sm:px-8 lg:py-28 dark:bg-[#0e1526]"
        >
          <div className="mx-auto max-w-7xl">
            <Reveal>
              <div className="mx-auto max-w-2xl text-center">
                <p className="text-sm font-extrabold uppercase tracking-[0.18em] text-blue-700 dark:text-blue-400">
                  Simple steps
                </p>
                <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl dark:text-[#f1f5f9]">
                  From beginner to builder.
                </h2>
                <p className="mt-4 leading-7 text-slate-600 dark:text-[#94a3b8]">
                  You do not need to know everything today. You just need to
                  take the first step.
                </p>
              </div>
            </Reveal>

            <div className="mt-14 grid gap-8 md:grid-cols-3">
              {[
                {
                  n: "01",
                  i: "📚",
                  t: "Choose a lesson",
                  d: "Pick a beginner course and follow the topics in a clear learning order.",
                },
                {
                  n: "02",
                  i: "⌨️",
                  t: "Practise the code",
                  d: "Type examples, experiment with ideas, and learn by doing instead of only reading.",
                },
                {
                  n: "03",
                  i: "🚀",
                  t: "Build something",
                  d: "Use your new skills to create small projects and grow your confidence over time.",
                },
              ].map((s, i) => (
                <Reveal key={s.n} delay={i * 0.1}>
                  <article className="rounded-2xl border border-slate-200 bg-white p-7 transition hover:-translate-y-1 hover:shadow-xl hover:shadow-blue-900/5 dark:border-[#1f2a44] dark:bg-[#131c33] dark:hover:border-blue-700">
                    <div className="flex items-center justify-between">
                      <span className="text-3xl">{s.i}</span>
                      <span className="text-sm font-black text-blue-200 dark:text-blue-900">
                        STEP {s.n}
                      </span>
                    </div>
                    <h3 className="mt-6 text-xl font-extrabold text-slate-900 dark:text-[#f1f5f9]">
                      {s.t}
                    </h3>
                    <p className="mt-3 leading-7 text-slate-600 dark:text-[#94a3b8]">
                      {s.d}
                    </p>
                  </article>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ==================== ABOUT / CTA ==================== */}
        <section id="about" className="scroll-mt-24 px-5 py-20 sm:px-8 lg:py-28">
          <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-2">
            <Reveal>
              <p className="text-sm font-extrabold uppercase tracking-[0.18em] text-blue-700 dark:text-blue-400">
                About KoyoCode
              </p>
              <h2 className="mt-3 text-3xl font-black leading-tight tracking-tight text-slate-900 sm:text-4xl dark:text-[#f1f5f9]">
                Technology education that feels closer to home.
              </h2>
              <p className="mt-5 leading-8 text-slate-600 dark:text-[#94a3b8]">
                KoyoCode aims to make learning programming less intimidating
                for beginners. By combining practical examples with clear
                explanations in Hausa and English, the goal is to help more
                people take their first steps into the world of technology.
              </p>
              <a
                href="#courses"
                className="mt-7 inline-flex items-center gap-2 font-bold text-blue-700 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
              >
                Find your starting point →
              </a>
            </Reveal>

            <Reveal delay={0.15}>
              <div className="relative overflow-hidden rounded-3xl bg-blue-700 p-8 text-white sm:p-12">
                <div className="absolute -right-10 -top-10 h-48 w-48 rounded-full border-[30px] border-white/10" />
                <div className="absolute -bottom-12 -left-12 h-48 w-48 rounded-full bg-sky-400/20 blur-2xl" />
                <div className="relative">
                  <span className="inline-flex rounded-xl bg-white/15 px-4 py-2 text-sm font-bold">
                    Your future starts with a first step
                  </span>
                  <h3 className="mt-7 text-3xl font-black leading-tight sm:text-4xl">
                    You can learn to code.
                    <br />
                    Start today.
                  </h3>
                  <p className="mt-5 max-w-md leading-7 text-blue-100">
                    Be curious. Keep practising. Build your ideas into
                    something real.
                  </p>
                  <a
                    href="#courses"
                    className="mt-8 inline-flex rounded-full bg-white px-6 py-3.5 font-extrabold text-blue-800 transition hover:bg-blue-50"
                  >
                    Explore learning paths →
                  </a>
                </div>
              </div>
            </Reveal>
          </div>
        </section>

        {/* ==================== YOUTUBE ==================== */}
        <section className="px-5 py-12 sm:px-8">
          <div className="mx-auto max-w-5xl">
            <Reveal>
              <YouTubeSubscribe />
            </Reveal>
          </div>
        </section>

        {/* ==================== FAQ ==================== */}
        <FAQ faqs={faqs} />

        {/* ==================== NEWSLETTER ==================== */}
        <section className="px-5 pb-20 sm:px-8 lg:pb-28">
          <Reveal>
            <div className="mx-auto max-w-5xl rounded-3xl border border-blue-100 bg-blue-50 px-6 py-10 sm:px-12 sm:py-14 dark:border-[#1f2a44] dark:bg-[#10182b]">
              <div className="mx-auto max-w-2xl text-center">
                <p className="text-sm font-extrabold uppercase tracking-[0.18em] text-blue-700 dark:text-blue-400">
                  Stay connected
                </p>
                <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-900 dark:text-[#f1f5f9]">
                  Keep growing with KoyoCode.
                </h2>
                <p className="mt-4 leading-7 text-slate-600 dark:text-[#94a3b8]">
                  Get updates about new lessons and learning resources when
                  they become available.
                </p>

                <form className="mx-auto mt-7 flex max-w-xl flex-col gap-3 sm:flex-row">
                  <input
                    type="email"
                    placeholder="Enter your email address"
                    className="min-w-0 flex-1 rounded-full border border-blue-100 bg-white px-5 py-4 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-[#1f2a44] dark:bg-[#0e1526] dark:text-[#f1f5f9] dark:placeholder:text-[#64748b] dark:focus:border-blue-500 dark:focus:ring-blue-950/50"
                  />
                  <button
                    type="submit"
                    className="rounded-full bg-blue-700 px-7 py-4 font-bold text-white transition hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-500"
                  >
                    Keep me updated →
                  </button>
                </form>
              </div>
            </div>
          </Reveal>
        </section>

        {/* ==================== AD: HOMEPAGE BOTTOM ==================== */}
        {adsOn && slots.homepage_bottom && (
          <section className="border-t border-slate-100 bg-slate-50/50 dark:border-[#1f2a44] dark:bg-[#0e1526]/50">
            <div className="mx-auto flex max-w-5xl justify-center px-5 py-8 sm:px-8">
              <AdSlotAdsterra slot="300x250" />
            </div>
          </section>
        )}
      </main>

      <Footer />
    </>
  );
}