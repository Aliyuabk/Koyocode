"use client";

import { useState, useEffect } from "react";
import { Modal, Btn, Field, inputCls, toast } from "./ui";
import { adminSendUserNotification } from "@/app/admin/users/actions";

export default function SendNotificationModal({
  open,
  onClose,
  onSent,
  user,
}: {
  open: boolean;
  onClose: () => void;
  onSent: () => void;
  user: { id: string; full_name: string | null } | null;
}) {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [link, setLink] = useState("");
  const [linkLabel, setLinkLabel] = useState("");
  const [sendEmail, setSendEmail] = useState(false);
  const [busy, setBusy] = useState(false);

  // Reset the form every time the modal opens
  useEffect(() => {
    if (open) {
      setTitle("");
      setMessage("");
      setLink("");
      setLinkLabel("");
      setSendEmail(false);
      setBusy(false);
    }
  }, [open]);

  async function handleSend() {
    if (!user) return;

    if (!title.trim() || !message.trim()) {
      toast("Title and message are required.", "err");
      return;
    }

    setBusy(true);

    const res = await adminSendUserNotification({
      userId: user.id,
      title,
      message,
      link: link || undefined,
      linkLabel: linkLabel || undefined,
      sendEmail,
    });

    setBusy(false);

    if (!res.ok) {
      toast(res.error ?? "Failed to send.", "err");
      return;
    }

    // Report email status honestly
    if (sendEmail) {
      if (res.emailFailed && res.emailFailed > 0) {
        toast(
          `In-app sent · email failed for ${res.emailFailed} recipient${
            res.emailFailed === 1 ? "" : "s"
          }`,
          "err"
        );
      } else if (res.emailSent === 0) {
        toast("In-app sent · no email was dispatched", "err");
      } else {
        toast("In-app + email sent ✓");
      }
    } else {
      toast("Notification sent ✓");
    }

    onSent();
    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Notify ${user?.full_name ?? "user"}`}
      footer={
        <>
          <Btn variant="ghost" onClick={onClose} disabled={busy}>
            Cancel
          </Btn>
          <Btn onClick={handleSend} disabled={busy}>
            {busy ? "Sending…" : "Send notification"}
          </Btn>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="Title">
          <input
            className={inputCls}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Welcome to KoyoCode"
          />
        </Field>

        <Field label="Message">
          <textarea
            className={inputCls}
            rows={5}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type your message…"
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Link (optional)">
            <input
              className={inputCls}
              value={link}
              onChange={(e) => setLink(e.target.value)}
              placeholder="/courses"
            />
          </Field>
          <Field label="Button label (optional)">
            <input
              className={inputCls}
              value={linkLabel}
              onChange={(e) => setLinkLabel(e.target.value)}
              placeholder="Open course"
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
            <br />
            The user will receive the same message in their inbox. If Gmail
            SMTP fails, the in-app notification will still be delivered.
          </span>
        </label>
      </div>
    </Modal>
  );
}