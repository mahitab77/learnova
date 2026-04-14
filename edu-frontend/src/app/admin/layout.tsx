// src/app/admin/layout.tsx
"use client";

import { Suspense, type ReactNode } from "react";
import { useSearchParams } from "next/navigation";

type AdminLayoutProps = {
  children: ReactNode;
};

function AdminLayoutContent({ children }: AdminLayoutProps) {
  const searchParams = useSearchParams();

  // lang from ?lang=ar (fallback: en)
  const langParam = searchParams.get("lang");
  const lang = langParam === "ar" ? "ar" : "en";
  const dir = lang === "ar" ? "rtl" : "ltr";

  // No header / navbar here at all – global MainNavbar comes from RootLayout
  return (
    <div dir={dir} className="bg-slate-50">
      {children}
    </div>
  );
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <Suspense fallback={<div className="bg-slate-50">{children}</div>}>
      <AdminLayoutContent>{children}</AdminLayoutContent>
    </Suspense>
  );
}
