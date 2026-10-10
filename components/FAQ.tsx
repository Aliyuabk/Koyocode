"use client";

import { useState } from "react";
import Reveal from "./Reveal";
import type { FAQ as FAQType } from "@/lib/types";

export default function FAQ({ faqs }: { faqs: FAQType[] }) {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section id="faq" className="scroll-mt-24 bg-slate-50 px-5 py-20 sm:px-8 lg:py-24">
      <div className="mx-auto max-w-3xl">
        <Reveal>
          <div className="text-center">
            <p className="text-sm font-extrabold uppercase tracking-[0.18em] text-blue-700">
              Got questions?
            </p>
            <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">
              Frequently asked questions.
            </h2>
          </div>
        </Reveal>

        <Reveal delay={0.1}>
          <div className="mt-10 divide-y divide-slate-200 rounded-2xl border border-slate-200 bg-white px-6">
            {faqs.map((faq, i) => (
              <div key={faq.id} className="py-5">
                <button
                  onClick={() => setOpen(open === i ? null : i)}
                  className="flex w-full items-center justify-between gap-4 text-left font-bold text-slate-900"
                  aria-expanded={open === i}
                >
                  <span>{faq.question}</span>
                  <span className="text-xl text-blue-700">
                    {open === i ? "−" : "+"}
                  </span>
                </button>
                <div
                  className={`grid overflow-hidden transition-all duration-300 ${
                    open === i ? "mt-3 grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                  }`}
                >
                  <p className="pr-8 leading-7 text-slate-600">{faq.answer}</p>
                </div>
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}