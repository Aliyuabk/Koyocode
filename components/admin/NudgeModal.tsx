"use client";

import { useEffect, useState } from "react";
import { Modal, Btn, Field, inputCls, toast } from "./ui";
import { previewNudge, sendNudge } from "@/app/admin/progress/actions";

export default function NudgeModal({
  open,
  onClose,
  onSent,
  userId,
  courseId,
  userName,
  courseTitle,
}: {
  open: boolean;
  onClose: () => void;
  onSent: () => void;
  userId: string | null;
  courseId: string | null;
  userName: string | null;
  courseTitle: string | null;
}) {
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [link, setLink] = useState("");
  const [linkLabel, setLinkLabel] = useState("");
  const [sendEmail, setSendEmail] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load preview when modal opens
  useEffect(() => {
    if (!open || !userId || !courseId) return;

    let cancelled = false;
    setLoading(true);
    setError(null);

    (async () => {
      const res = await previewNudge(userId, courseId);
      if (cancelled) return;
      setLoading(false);

      if (!res.ok) {
        setError(res.error ?? "Failed to load preview");
        return;
      }

      setTitle(res.content.title);
      setMessage(res.content.message);
      setLink(res.content.link);
      setLinkLabel(res.content.linkLabel);
      setSendEmail(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [open, userId, courseId]);

  async function handleSend() {
    if (!userId || !courseId) return;
    if (!title.trim() || !message.trim()) {
      toast("Title and message are required", "err");
      return;
    }

    setBusy(true);
    const res = await sendNudge({
      userId,
      courseId,
      title,
      message,
      sendEmail,
    });
    setBusy(false);

    if (!res.ok) {
      toast(res.error ?? "Failed to send", "err");
      return;
    }

    if (sendEmail && res.emailSent === 0) {
      toast("In-app sent · email not dispatched", "err");
    } else if (sendEmail) {
      toast("In-app + email sent ✓");
    } else {
      toast("Nudge sent ✓");
    }

    onSent();
    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Nudge ${userName ?? "student"}`}
      footer={
        <>
          <Btn variant="ghost" onClick={onClose} disabled={busy}>
            Cancel
          </Btn>
          <Btn onClick={handleSend} disabled={busy || loading || !!error}>
            {busy ? "Sending…" : "Send nudge"}
          </Btn>
        </>
      }
    >
      {loading && (
        <div className="py-8 text-center">
          <span className="mx-auto flex h-8 w-8 animate-spin rounded-full border-2 border-purple-200 border-t-purple-600" />
          <p className="mt-3 text-sm text-slate-500 dark:text-[#94a3b8]">
            Computing next lesson…
          </p>
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700 dark:border-red-800 dark:bg-red-950/40 dark:text-red-300">
          ⚠ {error}
        </div>
      )}

      {!loading && !error && (
        <div className="space-y-4">
          <div className="rounded-xl border border-purple-200 bg-purple-50 px-4 py-3 text-xs text-purple-800 dark:border-purple-800 dark:bg-purple-950/40 dark:text-purple-300">
            <p className="font-black uppercase tracking-wider">Auto-filled</p>
            <p className="mt-1">
              Course: <strong>{courseTitle}</strong>
            </p>
            <p className="mt-0.5">
              Link: <code className="font-mono">{link}</code>
            </p>
          </div>

          <Field label="Title">
            <input
              className={inputCls}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </Field>

          <Field label="Message">
            <textarea
              className={inputCls}
              rows={5}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Link">
              <input
                className={inputCls}
                value={link}
                onChange={(e) => setLink(e.target.value)}
              />
            </Field>
            <Field label="Button label">
              <input
                className={inputCls}
                value={linkLabel}
                onChange={(e) => setLinkLabel(e.target.value)}
              />
            </Field>
          </div>

          <label className="flex items-start gap-2.5 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600 dark:border-[#1f2a44] dark:bg-[#0e1526] dark:text-[#94a3b8]">
            <input
              type="checkbox"
              checked={sendEmail}
              onChange={(e) => setSendEmail(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-slate-300 text-purple-700"
            />
            <span>
              <span className="font-bold text-slate-900 dark:text-[#f1f5f9]">
                Also send by email
              </span>
            </span>
          </label>
        </div>
      )}
    </Modal>
  );
}