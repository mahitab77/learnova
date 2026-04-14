// src/app/teacher/layout.tsx
import type { ReactNode } from "react";

export const metadata = {
  title: "Teacher",
};

export default function TeacherLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh w-full bg-slate-50 overflow-x-hidden">
      {/* IMPORTANT:
          - No max-width container here
          - No horizontal padding here
          - Let each /teacher page control its own spacing (like Admin dashboard does)
      */}
      <main className="w-full">{children}</main>
    </div>
  );
}
