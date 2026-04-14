// src/components/UserDropdown.tsx
"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut, ChevronDown, Home } from "lucide-react";

interface UserDropdownProps {
  lang: "en" | "ar";
  userName?: string | null;
  userEmail?: string | null;
  userAvatar?: string | null;

  /**
   * ✅ IMPORTANT:
   * Pass a REAL route that exists in your app:
   *   /parent/dashboard | /student/dashboard | /teacher/dashboard | /admin/dashboard
   */
  dashboardHref: string;

  logout: () => Promise<void>;
  onClose?: () => void;
}

function withLang(path: string, lang: "en" | "ar") {
  const sep = path.includes("?") ? "&" : "?";
  return `${path}${sep}lang=${lang}`;
}

function getUserInitials(userName?: string | null) {
  if (!userName) return "U";
  const nameParts = userName.trim().split(/\s+/).filter(Boolean);
  if (nameParts.length >= 2) {
    return (nameParts[0].charAt(0) + nameParts[1].charAt(0)).toUpperCase();
  }
  return nameParts[0].charAt(0).toUpperCase();
}

export function UserDropdown({
  lang,
  userName,
  userEmail,
  userAvatar,
  dashboardHref,
  logout,
  onClose,
}: UserDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const isRTL = lang === "ar";
  const router = useRouter();

  const dashboardLink = useMemo(() => withLang(dashboardHref, lang), [dashboardHref, lang]);

  // Close helper
  const closeDropdown = () => {
    setIsOpen(false);
    onClose?.();
  };

  // Toggle
  const toggleDropdown = () => setIsOpen((prev) => !prev);

  // Click outside to close
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        closeDropdown();
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onClose]);

  // Escape key to close
  useEffect(() => {
    function handleEscapeKey(event: KeyboardEvent) {
      if (event.key === "Escape") closeDropdown();
    }
    document.addEventListener("keydown", handleEscapeKey);
    return () => document.removeEventListener("keydown", handleEscapeKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onClose]);

  const handleLogout = async () => {
    await logout();
    closeDropdown();

    // Update any server bits + go home
    router.refresh();
    router.push(withLang("/", lang));
  };

  return (
    <div className="relative z-50" ref={dropdownRef}>
      {/* Avatar Button */}
      <button
        type="button"
        onClick={toggleDropdown}
        className="flex items-center gap-2 rounded-full p-1 hover:bg-white/20 transition-colors focus:outline-none focus:ring-2 focus:ring-white/50"
        aria-label={lang === "en" ? "User menu" : "قائمة المستخدم"}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center border-2 border-white overflow-hidden">
          {userAvatar ? (
            // ✅ use <img> to avoid Next/Image remote domain config issues
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={userAvatar}
              alt={userName || "User"}
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="text-white font-semibold text-sm">{getUserInitials(userName)}</span>
          )}
        </div>

        <ChevronDown
          className={`h-4 w-4 text-white transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Dropdown Menu */}
      <div
        className={`absolute top-full mt-2 w-64 rounded-xl border border-gray-200 bg-white py-2 shadow-2xl transition-all duration-200 ${
          isOpen ? "visible scale-100 opacity-100" : "invisible scale-95 opacity-0 pointer-events-none"
        } ${isRTL ? "left-0" : "right-0"}`}
        role="menu"
        aria-orientation="vertical"
      >
        {/* User Info */}
        <div className={`px-4 py-3 border-b border-gray-100 ${isRTL ? "text-right" : "text-left"}`}>
          <p className="font-semibold text-[#111624] truncate" title={userName || undefined}>
            {userName || (lang === "en" ? "User" : "مستخدم")}
          </p>
          {userEmail && (
            <p className="text-xs text-[#111624]/60 truncate mt-1" title={userEmail}>
              {userEmail}
            </p>
          )}
        </div>

        {/* Menu Items */}
        <div className="py-1">
          <Link
            href={dashboardLink}
            className={`group/item flex items-center gap-3 px-4 py-3 text-sm text-[#111624] transition-colors hover:bg-[#F8F9FA] ${
              isRTL ? "flex-row-reverse text-right" : ""
            }`}
            onClick={closeDropdown}
            role="menuitem"
          >
            <div className="h-8 w-8 rounded-full bg-[#08ABD3]/10 flex items-center justify-center">
              <Home className="h-4 w-4 text-[#08ABD3]" />
            </div>
            <span className="font-medium">{lang === "en" ? "Dashboard" : "لوحة التحكم"}</span>
          </Link>
        </div>

        {/* Logout Button */}
        <div className="border-t border-gray-100 pt-1">
          <button
            type="button"
            onClick={handleLogout}
            className={`group/item flex items-center gap-3 w-full px-4 py-3 text-sm text-[#EB420E] transition-colors hover:bg-[#F8F9FA] ${
              isRTL ? "flex-row-reverse text-right" : ""
            }`}
            role="menuitem"
          >
            <div className="h-8 w-8 rounded-full bg-[#EB420E]/10 flex items-center justify-center">
              <LogOut className="h-4 w-4 text-[#EB420E]" />
            </div>
            <span className="font-medium">{lang === "en" ? "Logout" : "تسجيل الخروج"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

// Optional: simple mobile variant
export function MobileUserDropdown({
  lang,
  userName,
  logout,
}: {
  lang: "en" | "ar";
  userName?: string | null;
  logout: () => Promise<void>;
}) {
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.refresh();
    router.push(withLang("/", lang));
  };

  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <div className="h-10 w-10 rounded-full bg-[#08ABD3] flex items-center justify-center">
        <span className="text-white font-semibold text-sm">
          {userName ? userName.charAt(0).toUpperCase() : "U"}
        </span>
      </div>

      <div className="flex-1">
        <p className="font-semibold text-[#111624]">
          {userName || (lang === "en" ? "User" : "مستخدم")}
        </p>
      </div>

      <button
        type="button"
        onClick={handleLogout}
        className="p-2 text-[#EB420E] hover:bg-[#EB420E]/10 rounded-lg"
        aria-label={lang === "en" ? "Logout" : "تسجيل الخروج"}
      >
        <LogOut className="h-5 w-5" />
      </button>
    </div>
  );
}
