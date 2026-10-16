"use client";

import { useState } from "react";
import AdminSidebar from "./AdminSidebar";
import AdminTopbar from "./AdminTopbar";

export default function AdminShell({
  children,
  userName,
  userEmail,
  userAvatar,
}: {
  children: React.ReactNode;
  userName: string;
  userEmail: string;
  userAvatar: string;
}) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-[#0a0e1a]">
      <AdminSidebar
        userName={userName}
        userEmail={userEmail}
        userAvatar={userAvatar}
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
      />

      <div className="flex flex-1 flex-col overflow-hidden">
        <AdminTopbar
          userName={userName}
          userEmail={userEmail}
          userAvatar={userAvatar} onMenuClick={() => setMenuOpen(true)}
        />
        <main className="flex-1 overflow-y-auto px-4 py-6 sm:px-6 sm:py-8 lg:px-10">
          {children}
        </main>
      </div>
    </div>
  );
}