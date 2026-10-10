"use client";

import { useState, useMemo, useEffect } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { html } from "@codemirror/lang-html";
import { css } from "@codemirror/lang-css";
import { javascript } from "@codemirror/lang-javascript";
import { oneDark } from "@codemirror/theme-one-dark";

type Tab = "html" | "css" | "js" | "preview";

const STARTER_HTML = `<div class="card">
  <div class="logo">K</div>
  <h1>Barka da KoyoCode! 👋</h1>
  <p>Sannu, duniya! Welcome to your first webpage.</p>
  <button id="btn">Click me</button>
  <p id="out"></p>
</div>`;

const STARTER_CSS = `body {
  font-family: system-ui, -apple-system, sans-serif;
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
  color: #f1f5f9;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  margin: 0;
  padding: 2rem;
}

.card {
  background: #1e293b;
  padding: 2.5rem;
  border-radius: 1.5rem;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
  border: 1px solid #334155;
  text-align: center;
  max-width: 420px;
  width: 100%;
}

.logo {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 56px;
  height: 56px;
  background: #2563eb;
  color: white;
  font-size: 1.5rem;
  font-weight: 900;
  border-radius: 14px;
  margin-bottom: 1.5rem;
  box-shadow: 0 8px 24px rgba(37, 99, 235, 0.4);
}

h1 {
  color: #60a5fa;
  margin: 0 0 0.75rem;
  font-size: 1.75rem;
}

p {
  color: #94a3b8;
  margin: 0.5rem 0;
  line-height: 1.6;
}

button {
  background: #2563eb;
  color: white;
  border: 0;
  padding: 0.875rem 1.75rem;
  border-radius: 0.75rem;
  cursor: pointer;
  font-weight: 700;
  font-size: 1rem;
  margin-top: 1.5rem;
  transition: all 0.2s;
}

button:hover {
  background: #1d4ed8;
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(37, 99, 235, 0.4);
}`;

const STARTER_JS = `const btn = document.getElementById('btn');
const out = document.getElementById('out');

btn.addEventListener('click', () => {
  out.textContent = 'Ka danna! (You clicked!) 🎉';
  out.style.color = '#34d399';
  out.style.fontWeight = 'bold';
  out.style.marginTop = '1rem';
});

console.log('Playground loaded. Try clicking the button!');`;

export default function Playground({
  userId,
  userName,
}: {
  userId: string;
  userName: string;
}) {
  const [tab, setTab] = useState<Tab>("html");
  const [htmlCode, setHtmlCode] = useState(STARTER_HTML);
  const [cssCode, setCssCode] = useState(STARTER_CSS);
  const [jsCode, setJsCode] = useState(STARTER_JS);
  const [autoPreview, setAutoPreview] = useState(true);
  const [previewKey, setPreviewKey] = useState(0);

  const previewDoc = useMemo(() => {
    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<style>${cssCode}</style>
</head>
<body>
${htmlCode}
<script>
try {
  ${jsCode}
} catch (err) {
  document.body.insertAdjacentHTML(
    'beforeend',
    '<pre style="color:#f87171;background:#1e293b;padding:1rem;border-radius:0.5rem;margin:1rem;font-family:monospace;">⚠ JS Error: ' + err.message + '</pre>'
  );
  console.error(err);
}
</script>
</body>
</html>`;
  }, [htmlCode, cssCode, jsCode]);

  // Auto-refresh the preview (debounced)
  useEffect(() => {
    if (!autoPreview) return;
    const t = setTimeout(() => setPreviewKey((k) => k + 1), 500);
    return () => clearTimeout(t);
  }, [htmlCode, cssCode, jsCode, autoPreview]);

  function resetAll() {
    if (!confirm("Reset all code to the starter example?")) return;
    setHtmlCode(STARTER_HTML);
    setCssCode(STARTER_CSS);
    setJsCode(STARTER_JS);
  }

  function refreshPreview() {
    setPreviewKey((k) => k + 1);
  }

  const TABS: { key: Tab; label: string; color: string }[] = [
    { key: "html", label: "HTML", color: "text-orange-500" },
    { key: "css", label: "CSS", color: "text-blue-500" },
    { key: "js", label: "JavaScript", color: "text-amber-500" },
    { key: "preview", label: "Preview", color: "text-emerald-500" },
  ];

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
      {/* ==================== LEFT: EDITOR PANEL ==================== */}
      <div className="flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-[#1f2a44] dark:bg-[#131c33]">
        {/* TABS */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 bg-slate-50 px-3 py-2.5 dark:border-[#1f2a44] dark:bg-[#0e1526]">
          <div className="flex gap-1">
            {TABS.filter((t) => t.key !== "preview").map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                  tab === t.key
                    ? "bg-blue-700 text-white dark:bg-blue-600"
                    : "text-slate-600 hover:bg-slate-200 dark:text-[#cbd5e1] dark:hover:bg-[#1b2742]"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={resetAll}
              className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-bold text-slate-700 transition hover:bg-slate-50 dark:border-[#1f2a44] dark:bg-[#131c33] dark:text-[#cbd5e1]"
            >
              ↺ Reset
            </button>
          </div>
        </div>

        {/* EDITOR */}
        <div className="flex-1">
          {tab === "html" && (
            <Editor
              label="HTML"
              value={htmlCode}
              onChange={setHtmlCode}
              extensions={[html()]}
            />
          )}
          {tab === "css" && (
            <Editor
              label="CSS"
              value={cssCode}
              onChange={setCssCode}
              extensions={[css()]}
            />
          )}
          {tab === "js" && (
            <Editor
              label="JavaScript"
              value={jsCode}
              onChange={setJsCode}
              extensions={[javascript()]}
            />
          )}
          {tab === "preview" && <PreviewPane />}
        </div>
      </div>

      {/* ==================== RIGHT: LIVE PREVIEW ==================== */}
      <div className="flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-[#1f2a44] dark:bg-[#131c33]">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 bg-slate-50 px-3 py-2.5 dark:border-[#1f2a44] dark:bg-[#0e1526]">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-[#94a3b8]">
              Live preview
            </span>
          </div>

          <div className="flex items-center gap-2">
            <label className="flex items-center gap-1.5 text-[11px] font-bold text-slate-600 dark:text-[#cbd5e1]">
              <input
                type="checkbox"
                checked={autoPreview}
                onChange={(e) => setAutoPreview(e.target.checked)}
                className="h-3 w-3 rounded border-slate-300 text-blue-700"
              />
              Auto
            </label>
            <button
              onClick={refreshPreview}
              className="rounded-lg bg-emerald-600 px-2.5 py-1.5 text-[11px] font-bold text-white transition hover:bg-emerald-700"
            >
              ↻ Refresh
            </button>
          </div>
        </div>

        <iframe
          key={previewKey}
          title="preview"
          srcDoc={previewDoc}
          sandbox="allow-scripts allow-modals"
          className="h-full min-h-[700px] w-full flex-1 border-0 bg-white"
        />
      </div>
    </div>
  );
}

/* ============================================================
   Editor wrapper with dark-mode awareness
   ============================================================ */
function Editor({
  label,
  value,
  onChange,
  extensions,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  extensions: any[];
}) {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
    const observer = new MutationObserver(() => {
      setDark(document.documentElement.classList.contains("dark"));
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => observer.disconnect();
  }, []);

  return (
    <CodeMirror
      value={value}
      height="700px"
      theme={dark ? oneDark : "light"}
      extensions={extensions}
      onChange={onChange}
      basicSetup={{
        lineNumbers: true,
        foldGutter: true,
        highlightActiveLine: true,
        autocompletion: true,
        bracketMatching: true,
        indentOnInput: true,
      }}
      style={{ fontSize: "13px" }}
    />
  );
}

function PreviewPane() {
  return (
    <div className="flex h-[700px] items-center justify-center bg-slate-50 p-8 text-center dark:bg-[#0e1526]">
      <div>
        <p className="text-4xl">👈</p>
        <p className="mt-4 font-bold text-slate-900 dark:text-[#f1f5f9]">
          Preview is on the right
        </p>
        <p className="mt-2 text-sm text-slate-600 dark:text-[#94a3b8]">
          Edit HTML, CSS, or JavaScript. The preview updates automatically.
        </p>
      </div>
    </div>
  );
}