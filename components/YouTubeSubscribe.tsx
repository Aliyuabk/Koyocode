"use client";

export default function YouTubeSubscribe({
  variant = "default",
}: {
  variant?: "default" | "compact";
}) {
  const handle =
    process.env.NEXT_PUBLIC_YOUTUBE_CHANNEL_HANDLE ?? "@aliyudev";
  const channelUrl =
    process.env.NEXT_PUBLIC_YOUTUBE_CHANNEL_URL ??
    `https://www.youtube.com/${handle}`;

  const subscribeUrl = `${channelUrl}?sub_confirmation=1`;

  if (variant === "compact") {
    return (
      <a
        href={subscribeUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 rounded-full bg-red-600 px-4 py-2 text-sm font-bold text-white shadow-lg shadow-red-600/25 transition hover:-translate-y-0.5 hover:bg-red-700"
      >
        <YouTubeIcon size={16} />
        Subscribe
      </a>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-red-100 bg-red-50 p-6 dark:border-red-900/40 dark:bg-red-950/20">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-600 text-white shadow-lg shadow-red-600/25">
            <YouTubeIcon size={28} />
          </span>
          <div>
            <p className="text-xs font-extrabold uppercase tracking-wider text-red-600 dark:text-red-400">
              Watch on YouTube
            </p>
            <p className="mt-1 font-black text-slate-900 dark:text-[#f1f5f9]">
              Aliyu Abubakar · KoyoCode
            </p>
            <p className="mt-0.5 text-sm text-slate-600 dark:text-[#94a3b8]">
              Free coding lessons in Hausa + English
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <a
            href={subscribeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-red-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-red-600/25 transition hover:-translate-y-0.5 hover:bg-red-700"
          >
            <YouTubeIcon />
            Subscribe
          </a>
          <a
            href={channelUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-6 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50 dark:border-[#1f2a44] dark:bg-[#0e1526] dark:text-[#cbd5e1]"
          >
            Visit channel →
          </a>
        </div>
      </div>
    </div>
  );
}

function YouTubeIcon({ size = 20 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.6 12 3.6 12 3.6s-7.5 0-9.4.5A3 3 0 0 0 .5 6.2 31 31 0 0 0 0 12a31 31 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.5 9.4.5 9.4.5s7.5 0 9.4-.5a3 3 0 0 0 2.1-2.1 31 31 0 0 0 .5-5.8 31 31 0 0 0-.5-5.8ZM9.6 15.6V8.4l6.2 3.6-6.2 3.6Z" />
    </svg>
  );
}