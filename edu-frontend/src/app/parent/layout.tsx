"use client";
/**
 * Parent Dashboard Layout
 * -------------------------------------------------------------
 * - Provides shared sidebar and top header for all dashboard tabs.
 * - Auto-mirrors for RTL when lang=ar (detected from ?lang param).
 * - ✅ Safe unread badge (polls lightly + on tab focus, session-cookie auth)
 */

import { Suspense, useEffect, useMemo, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  Users,
  ClipboardList,
  FileText,
  Settings,
  HelpCircle,
  UserCircle2,
  Bell,
} from "lucide-react";
import type { ReactNode } from "react";
import { parentDashboardTexts } from "./dashboard/parentDashboardTexts";
import { apiFetch, type ApiError } from "@/src/lib/api";

/* -------------------------------------------------------------------------- */
/* Safe unread badge helper                                                   */
/* -------------------------------------------------------------------------- */

type NotificationsApi = { unreadCount: number };

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

function getNumber(v: unknown): number | undefined {
  return typeof v === "number" && Number.isFinite(v) ? v : undefined;
}

async function safeGetUnreadCount(): Promise<number> {
  try {
    const payload: unknown = await apiFetch("/parent/notifications");

    // Backend returns envelope: { success:true, data:{ unreadCount, items } }
    if (isRecord(payload) && "success" in payload) {
      const data = (payload as { data?: unknown }).data;
      if (isRecord(data)) {
        return getNumber((data as NotificationsApi).unreadCount) ?? 0;
      }
      return 0;
    }

    // Fallback: plain object { unreadCount }
    if (isRecord(payload)) {
      return getNumber((payload as NotificationsApi).unreadCount) ?? 0;
    }

    return 0;
  } catch (err) {
    if (isApiError(err) && (err.status === 401 || err.status === 403)) {
      return 0;
    }

    // Network errors: don't show badge rather than flashing errors
    return 0;
  }
}

function isApiError(err: unknown): err is ApiError {
  return (
    typeof err === "object" &&
    err !== null &&
    "status" in err &&
    typeof (err as { status?: unknown }).status === "number" &&
    "message" in err &&
    typeof (err as { message?: unknown }).message === "string"
  );
}

function useSidebarUnreadBadge() {
  const [unread, setUnread] = useState<number>(0);

  useEffect(() => {
    let mounted = true;
    let intervalId: number | null = null;

    const refresh = async () => {
      const n = await safeGetUnreadCount();
      if (mounted) setUnread(n);
    };

    // 1) initial fetch
    void refresh();

    // 2) light polling (once per minute)
    intervalId = window.setInterval(() => {
      void refresh();
    }, 60_000);

    // 3) refresh when tab becomes visible again (avoid stale badge)
    const onVisibility = () => {
      if (document.visibilityState === "visible") void refresh();
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      mounted = false;
      if (intervalId != null) window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  // clamp to avoid ridiculous values
  return unread > 99 ? 99 : unread < 0 ? 0 : unread;
}

function ParentLayoutContent({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const lang = searchParams.get("lang") === "ar" ? "ar" : "en";
  const t = parentDashboardTexts[lang];
  const dir = lang === "ar" ? "rtl" : "ltr";

  // ✅ Safe unread badge number (0 => hidden)
  const unread = useSidebarUnreadBadge();

  const tabs = useMemo(
    () => [
      { href: "/parent/dashboard", id: "overview", icon: LayoutDashboard, label: t.navOverview },
      { href: "/parent/dashboard/children", id: "children", icon: Users, label: t.navChildren },
      { href: "/parent/dashboard/assignments", id: "assignments", icon: ClipboardList, label: t.navAssignments },
      { href: "/parent/dashboard/requests", id: "requests", icon: FileText, label: t.navRequests },
      { href: "/parent/dashboard/messages", id: "messages", icon: Bell, label: t.navMessages },
      { href: "/parent/dashboard/account", id: "account", icon: Settings, label: t.navAccount },
    ],
    [t]
  );

  const activeTab = tabs.find((tab) => pathname === tab.href)?.id;

  return (
    <div className="min-h-screen bg-slate-50 font-sans" dir={dir}>
      <div className="mx-auto flex max-w-7xl gap-6 p-4">
        {/* Sidebar */}
        <aside
          className={`hidden w-64 shrink-0 rounded-2xl border border-slate-100 bg-white/90 p-4 shadow-sm backdrop-blur-sm lg:block ${
            dir === "rtl" ? "order-last" : ""
          }`}
        >
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50">
              <UserCircle2 className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">
                {lang === "ar" ? "لوحة ولي الأمر" : "Parent Area"}
              </p>
              <p className="text-[12px] text-slate-500">
                {lang === "ar"
                  ? "إدارة الأبناء والواجبات والطلبات"
                  : "Manage children, assignments & requests"}
              </p>
            </div>
          </div>

          <nav className="space-y-1 text-sm">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;

              return (
                <Link
                  key={tab.id}
                  href={`${tab.href}?lang=${lang}`}
                  className={`flex items-center justify-between rounded-lg px-3 py-2 font-medium transition ${
                    isActive
                      ? "bg-emerald-50 text-emerald-800"
                      : "text-slate-700 hover:bg-slate-50 hover:text-emerald-800"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <Icon className="h-4 w-4 text-emerald-500" />
                    <span>{tab.label}</span>
                  </span>

                  {/* ✅ Unread badge only on Messages tab, hidden when 0 */}
                  {tab.id === "messages" && unread > 0 && (
                    <span
                      className={`inline-flex min-w-[22px] items-center justify-center rounded-full px-2 py-0.5 text-[12px] font-semibold ${
                        isActive ? "bg-emerald-600 text-white" : "bg-slate-200 text-slate-700"
                      }`}
                      aria-label={lang === "ar" ? `غير مقروء: ${unread}` : `Unread: ${unread}`}
                      title={lang === "ar" ? `غير مقروء: ${unread}` : `Unread: ${unread}`}
                    >
                      {unread}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          <div className="mt-6 rounded-xl bg-slate-50 p-3 text-[12px] text-slate-600">
            <div className="mb-1 flex items-center gap-1.5">
              <HelpCircle className="h-4 w-4 text-emerald-500" />
              <span className="font-medium">{lang === "ar" ? "نصيحة" : "Tip"}</span>
            </div>
            <p>
              {lang === "ar"
                ? "يمكنك التنقل بين التبويبات لمتابعة كل ما يخص أبناءك."
                : "Switch between tabs to track all your children’s info."}
            </p>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}

export default function ParentLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50">{children}</div>}>
      <ParentLayoutContent>{children}</ParentLayoutContent>
    </Suspense>
  );
}
