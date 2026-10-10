"use client";

import { useState } from "react";
import CourseCard from "./CourseCard";
import Reveal from "./Reveal";
import type { Course } from "@/lib/types";

export default function CourseGrid({ courses }: { courses: Course[] }) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");

  const categories = [
    "All",
    ...Array.from(new Set(courses.map((c) => c.category))),
  ];

  const filtered = courses.filter((c) => {
    const matchesSearch =
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      (c.description ?? "").toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === "All" || c.category === filter;
    return matchesSearch && matchesFilter;
  });

  return (
    <section
      id="courses"
      className="scroll-mt-24 px-5 py-20 sm:px-8 lg:py-28"
    >
      <div className="mx-auto max-w-7xl">
        {/* HEADER */}
        <Reveal>
          <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
            <div>
              <p className="text-sm font-extrabold uppercase tracking-[0.18em] text-blue-700 dark:text-blue-400">
                Your learning path
              </p>
              <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl dark:text-[#f1f5f9]">
                Choose your first course.
              </h2>
              <p className="mt-4 max-w-2xl leading-7 text-slate-600 dark:text-[#94a3b8]">
                Start with the fundamentals, practise what you learn, and
                gradually build your confidence.
              </p>
            </div>

            <div className="w-full lg:max-w-sm">
              <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 transition focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 dark:border-[#1f2a44] dark:bg-[#0e1526] dark:focus-within:border-blue-500 dark:focus-within:ring-blue-950/50">
                <span aria-hidden="true" className="text-slate-400 dark:text-[#64748b]">
                  ⌕
                </span>
                <input
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search courses..."
                  className="w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400 dark:text-[#f1f5f9] dark:placeholder:text-[#64748b]"
                />
              </div>
            </div>
          </div>
        </Reveal>

        {/* FILTERS */}
        <Reveal delay={0.05}>
          <div className="mt-8 flex flex-wrap gap-2">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setFilter(cat)}
                className={`rounded-full px-5 py-2.5 text-sm font-bold transition ${
                  filter === cat
                    ? "bg-blue-700 text-white dark:bg-blue-600"
                    : "border border-slate-200 bg-white text-slate-600 hover:border-blue-200 hover:text-blue-700 dark:border-[#1f2a44] dark:bg-[#0e1526] dark:text-[#cbd5e1] dark:hover:border-blue-600 dark:hover:text-blue-400"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </Reveal>

        {/* GRID */}
        {filtered.length > 0 ? (
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map((course, i) => (
              <Reveal key={course.id} delay={i * 0.05}>
                <CourseCard course={course} />
              </Reveal>
            ))}
          </div>
        ) : (
          <Reveal>
            <div className="mt-8 rounded-2xl border border-slate-200 bg-slate-50 p-10 text-center dark:border-[#1f2a44] dark:bg-[#10182b]">
              <p className="text-3xl">🔍</p>
              <p className="mt-3 font-bold text-slate-900 dark:text-[#f1f5f9]">
                No courses found.
              </p>
              <p className="mt-2 text-sm text-slate-600 dark:text-[#94a3b8]">
                Try another search or select a different category.
              </p>
              <button
                onClick={() => {
                  setSearch("");
                  setFilter("All");
                }}
                className="mt-5 inline-flex rounded-full bg-blue-700 px-6 py-3 font-bold text-white transition hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-500"
              >
                Clear filters
              </button>
            </div>
          </Reveal>
        )}
      </div>
    </section>
  );
}