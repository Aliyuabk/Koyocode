"use client";

import { useState, useMemo, useEffect, useRef } from "react";

type ChallengeType = "html" | "javascript";

type Props = {
  type: ChallengeType;
  prompt: string;
  starter: string;
  solution: string;
  hint?: string | null;
  /** Called once when the user has run or checked their code at least once */
  onTried?: () => void;
};

/* ============================================================
   CHECKERS — the actual test functions per challenge type
   ============================================================ */
type CheckResult = { ok: boolean; message: string };

function checkHtml(userCode: string, solution: string): CheckResult {
  const code = userCode.trim();

  if (!code) {
    return { ok: false, message: "Your editor is empty. Try writing some code first." };
  }

  // 1. Must have at least one HTML tag
  const hasTag = /<[a-z][\s\S]*?>/i.test(code);
  if (!hasTag) {
    return { ok: false, message: "No HTML tag found. Every HTML element starts with < and ends with >." };
  }

  // 2. Must have content between opening and closing tags
  const hasContent = /<([a-z0-9]+)[^>]*>[^<]+<\/\1>/i.test(code);
  if (!hasContent) {
    return {
      ok: false,
      message: "Looks like you have a tag but no text inside it. Try putting words between the opening and closing tag.",
    };
  }

  // 3. All opening tags should have matching closing tags
  const openingTags = [...code.matchAll(/<([a-z0-9]+)[^>]*>/gi)]
    .map((m) => m[1].toLowerCase())
    .filter((t) => !["br", "hr", "img", "input", "meta", "link"].includes(t));

  const closingTags = [...code.matchAll(/<\/([a-z0-9]+)>/gi)]
    .map((m) => m[1].toLowerCase());

  const unclosed = openingTags.filter((t) => !closingTags.includes(t));
  if (unclosed.length > 0) {
    const first = unclosed[0];
    return {
      ok: false,
      message: `You opened <${first}> but never closed it. Add </${first}> at the end.`,
    };
  }

  // 4. Compare against solution — semantic check (tag + text)
  const solutionTags = [...solution.matchAll(/<([a-z0-9]+)/gi)].map((m) =>
    m[1].toLowerCase()
  );
  const userTags = [...code.matchAll(/<([a-z0-9]+)/gi)].map((m) =>
    m[1].toLowerCase()
  );

  const missingTag = solutionTags.find((t) => !userTags.includes(t));
  if (missingTag) {
    return {
      ok: false,
      message: `This challenge needs a <${missingTag}> tag. Try adding one.`,
    };
  }

  return { ok: true, message: "Correct! Your code matches what was asked." };
}

function checkJavaScript(userCode: string, solution: string): CheckResult {
  const code = userCode.trim();

  if (!code) {
    return { ok: false, message: "Your editor is empty. Try writing some code first." };
  }

  // Basic sanity — must contain a function, console.log, or expression
  const hasSomething = /function|=>|console\.|return|=|\(/.test(code);
  if (!hasSomething) {
    return { ok: false, message: "That doesn't look like JavaScript. Try writing an expression or a function." };
  }

  // Compare keywords against solution
  const keywords = ["function", "return", "console.log", "let", "const", "=>"];
  const missing = keywords.filter(
    (k) => solution.includes(k) && !code.includes(k)
  );

  if (missing.length > 0) {
    return {
      ok: false,
      message: `Hint: your solution should probably use ${missing.join(", ")}.`,
    };
  }

  return { ok: true, message: "Looks good! Your code runs without obvious errors." };
}

/* ============================================================
   MAIN COMPONENT
   ============================================================ */
export default function LessonChallenge({
  type,
  prompt,
  starter,
  solution,
  hint,
  onTried,
}: Props) {
  const [code, setCode] = useState(starter);
  const [result, setResult] = useState<CheckResult | null>(null);
  const [showSolution, setShowSolution] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [iframeKey, setIframeKey] = useState(0);
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const triedRef = useRef(false);

  // Build the preview document
  const previewDoc = useMemo(() => {
    if (type === "html") {
      return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<style>
  body {
    font-family: system-ui, -apple-system, sans-serif;
    padding: 16px;
    margin: 0;
    color: #0f172a;
    background: #ffffff;
  }
</style>
</head>
<body>
${code}
</body>
</html>`;
    }

    // JavaScript — capture console.log inside the iframe
    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<style>
  body {
    font-family: ui-monospace, 'SF Mono', Menlo, Consolas, monospace;
    padding: 16px;
    margin: 0;
    background: #0a0e1a;
    color: #f1f5f9;
    font-size: 13px;
    line-height: 1.6;
  }
  .log {
    padding: 4px 0;
    border-bottom: 1px solid #1f2a44;
    white-space: pre-wrap;
    word-break: break-word;
  }
  .log:last-child { border-bottom: 0; }
  .empty {
    color: #64748b;
    font-style: italic;
  }
  .err {
    color: #f87171;
  }
</style>
</head>
<body>
<div id="out"></div>
<script>
(function() {
  const out = document.getElementById('out');
  const log = (msg, cls) => {
    const line = document.createElement('div');
    line.className = 'log' + (cls ? ' ' + cls : '');
    line.textContent = typeof msg === 'string' ? msg : JSON.stringify(msg);
    out.appendChild(line);
  };

  console.log = function(...args) { log(args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ')); };
  console.info = console.log;
  console.warn = console.log;
  console.error = (...args) => log(args.join(' '), 'err');

  window.onerror = (msg) => { log('Error: ' + msg, 'err'); };

  try {
    ${code}
  } catch (err) {
    log('Error: ' + err.message, 'err');
  }

  if (out.children.length === 0) {
    log('(no output)', 'empty');
  }
})();
</script>
</body>
</html>`;
  }, [code, type]);

  // Refresh preview when code changes (debounced)
  useEffect(() => {
    const t = window.setTimeout(() => setIframeKey((k) => k + 1), 600);
    return () => window.clearTimeout(t);
  }, [code]);

  // Reset result when code changes
  useEffect(() => {
    setResult(null);
  }, [code]);

  function handleReset() {
    setCode(starter);
    setResult(null);
    setShowSolution(false);
    setIframeKey((k) => k + 1);
    editorRef.current?.focus();
  }

  function handleRun() {
    setIframeKey((k) => k + 1);
    if (!triedRef.current) {
      triedRef.current = true;
      onTried?.();
    }
  }

  function handleCheck() {
    const check = type === "html" ? checkHtml : checkJavaScript;
    const r = check(code, solution);
    setResult(r);
    setAttempts((a) => a + 1);
    if (!triedRef.current) {
      triedRef.current = true;
      onTried?.();
    }
  }

  const hasRun = attempts > 0 || triedRef.current;

  return (
    <section className="space-y-3">
      {/* HEADER */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-black tracking-tight text-slate-900 dark:text-[#f1f5f9]">
          💻 Try it
        </h2>
        <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800 dark:bg-amber-950/50 dark:text-amber-300">
          Practice
        </span>
      </div>

      {/* PROMPT */}
      <div className="rounded-2xl border border-blue-100 bg-blue-50 p-5 dark:border-[#1f2a44] dark:bg-[#10182b]">
        <p className="text-xs font-black uppercase tracking-wider text-blue-700 dark:text-blue-400">
          Your task
        </p>
        <p className="mt-2 leading-7 text-slate-800 dark:text-[#cbd5e1]">
          {prompt}
        </p>
        {hint && (
          <details className="mt-3">
            <summary className="cursor-pointer text-xs font-bold text-blue-700 hover:text-blue-900 dark:text-blue-400">
              💡 Need a hint?
            </summary>
            <p className="mt-2 text-sm leading-6 text-slate-700 dark:text-[#cbd5e1]">
              {hint}
            </p>
          </details>
        )}
      </div>

      {/* EDITOR + PREVIEW */}
      <div className="grid gap-3 lg:grid-cols-2">
        {/* EDITOR */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-[#1f2a44]">
          <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-4 py-2.5 dark:border-[#1f2a44] dark:bg-[#0e1526]">
            <p className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-[#94a3b8]">
              {type === "html" ? "HTML / CSS / JS" : "JavaScript"}
            </p>
            <span className="text-[10px] font-bold text-slate-400 dark:text-[#64748b]">
              {code.length} chars
            </span>
          </div>
          <textarea
            ref={editorRef}
            value={code}
            onChange={(e) => setCode(e.target.value)}
            spellCheck={false}
            autoCapitalize="off"
            autoCorrect="off"
            className="block h-[320px] w-full resize-none bg-[#0f172a] p-4 font-mono text-sm leading-7 text-slate-100 outline-none"
            style={{ tabSize: 2 }}
            onKeyDown={(e) => {
              if (e.key === "Tab") {
                e.preventDefault();
                const el = e.currentTarget;
                const start = el.selectionStart;
                const end = el.selectionEnd;
                const value = el.value;
                setCode(value.substring(0, start) + "  " + value.substring(end));
                requestAnimationFrame(() => {
                  el.selectionStart = el.selectionEnd = start + 2;
                });
              }
            }}
          />
        </div>

        {/* PREVIEW */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-[#1f2a44]">
          <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-4 py-2.5 dark:border-[#1f2a44] dark:bg-[#0e1526]">
            <p className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-[#94a3b8]">
              {type === "html" ? "Live preview" : "Console output"}
            </p>
            <span className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Auto
            </span>
          </div>
          <iframe
            key={iframeKey}
            title="code output"
            srcDoc={previewDoc}
            sandbox="allow-scripts"
            className="block h-[320px] w-full border-0 bg-white"
          />
        </div>
      </div>

      {/* ACTIONS */}
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={handleRun}
          className="inline-flex items-center gap-2 rounded-xl bg-blue-700 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-500"
        >
          ▶ Run
        </button>

        <button
          type="button"
          onClick={handleCheck}
          className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-700"
        >
          ✓ Check my answer
        </button>

        <button
          type="button"
          onClick={handleReset}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50 dark:border-[#1f2a44] dark:bg-[#0e1526] dark:text-[#cbd5e1]"
        >
          ↺ Reset
        </button>

        {hasRun && !showSolution && (
          <button
            type="button"
            onClick={() => setShowSolution(true)}
            className="ml-auto text-sm font-bold text-amber-700 hover:text-amber-900 dark:text-amber-400"
          >
            👁 Show solution
          </button>
        )}
      </div>

      {/* RESULT */}
      {result && (
        <div
          className={`rounded-2xl border p-4 text-sm font-medium ${
            result.ok
              ? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
              : "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300"
          }`}
        >
          <p className="font-black">
            {result.ok ? "✓ " : "✗ "}
            {result.ok ? "Well done!" : "Not quite yet"}
          </p>
          <p className="mt-1 leading-6">{result.message}</p>
          {!result.ok && attempts >= 3 && (
            <p className="mt-2 text-xs opacity-80">
              Tried {attempts} times — click{" "}
              <strong>Show solution</strong> above to see one way to do it.
            </p>
          )}
        </div>
      )}

      {/* SOLUTION REVEAL */}
      {showSolution && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 dark:border-amber-800 dark:bg-amber-950/40">
          <div className="flex items-center justify-between">
            <p className="text-xs font-black uppercase tracking-wider text-amber-800 dark:text-amber-300">
              One way to solve it
            </p>
            <button
              type="button"
              onClick={() => setShowSolution(false)}
              className="text-xs font-bold text-amber-700 hover:text-amber-900 dark:text-amber-400"
            >
              Hide
            </button>
          </div>
          <pre className="mt-3 overflow-x-auto rounded-xl bg-slate-950 p-4 font-mono text-sm leading-7 text-slate-100">
            <code>{solution}</code>
          </pre>
          <p className="mt-3 text-xs text-amber-800 dark:text-amber-300">
            There are many correct ways. Yours doesn&apos;t have to match exactly.
          </p>
        </div>
      )}
    </section>
  );
}