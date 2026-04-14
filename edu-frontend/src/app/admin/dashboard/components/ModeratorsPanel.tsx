"use client";

// ============================================================================
// ModeratorsPanel
// ----------------------------------------------------------------------------
// - List existing moderator accounts
// - Create new moderator (name, email, password)
// - Admin-only: no activate/deactivate here (use UsersPanel pattern if needed)
// ============================================================================

import { useState } from "react";
import type { Lang, ModeratorAdminRow } from "../adminTypes";
import type { LangTexts } from "../adminTexts";

interface Props {
  lang: Lang;
  t: LangTexts;
  moderators: ModeratorAdminRow[];
  moderatorsLoading: boolean;
  moderatorsError: string | null;
  loadModerators: () => void;
  creatingModerator: boolean;
  creatingModeratorError: string | null;
  moderatorMessage: string | null;
  onCreateModerator: (input: {
    full_name: string;
    email: string;
    password: string;
  }) => Promise<void>;
}

export function ModeratorsPanel({
  lang,
  moderators,
  moderatorsLoading,
  moderatorsError,
  loadModerators,
  creatingModerator,
  creatingModeratorError,
  moderatorMessage,
  onCreateModerator,
}: Props) {
  const dir = lang === "ar" ? "rtl" : "ltr";

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const isAr = lang === "ar";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    if (!fullName.trim()) {
      setLocalError(isAr ? "الاسم مطلوب." : "Full name is required.");
      return;
    }
    if (!email.trim()) {
      setLocalError(isAr ? "البريد الإلكتروني مطلوب." : "Email is required.");
      return;
    }
    if (password.length < 6) {
      setLocalError(isAr ? "كلمة المرور يجب أن تكون 6 أحرف على الأقل." : "Password must be at least 6 characters.");
      return;
    }

    await onCreateModerator({ full_name: fullName.trim(), email: email.trim(), password });
    setFullName("");
    setEmail("");
    setPassword("");
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleDateString(isAr ? "ar-EG" : "en-GB", {
      year: "numeric",
      month: "short",
      day: "2-digit",
    });
  };

  return (
    <div dir={dir} className="space-y-6">
      {/* Create form */}
      <section className="rounded-2xl bg-white border border-slate-100 shadow-sm p-5">
        <h2 className="text-lg font-semibold text-slate-900 mb-1">
          {isAr ? "إضافة مشرف مساعد جديد" : "Add New Moderator"}
        </h2>
        <p className="text-xs text-slate-500 mb-4">
          {isAr
            ? "أنشئ حساب مشرف مساعد. يتم تعيين كلمة المرور الأولية من قِبَل المشرف العام."
            : "Create a moderator account. The initial password is set by the admin."}
        </p>

        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-3 max-w-sm">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              {isAr ? "الاسم الكامل" : "Full Name"}
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              placeholder={isAr ? "اسم المشرف المساعد" : "Moderator full name"}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              {isAr ? "البريد الإلكتروني" : "Email"}
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              placeholder="moderator@example.com"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              {isAr ? "كلمة المرور" : "Password"}
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 pe-10"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword((p) => !p)}
                className="absolute inset-y-0 end-0 flex items-center px-3 text-slate-400 hover:text-slate-600"
              >
                {showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {(localError ?? creatingModeratorError) && (
            <p className="text-xs text-red-600">{localError ?? creatingModeratorError}</p>
          )}
          {moderatorMessage && (
            <p className="text-xs text-emerald-600">{moderatorMessage}</p>
          )}

          <button
            type="submit"
            disabled={creatingModerator}
            className="inline-flex items-center rounded-md bg-emerald-500 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-600 disabled:opacity-50"
          >
            {creatingModerator
              ? (isAr ? "جاري الإنشاء..." : "Creating...")
              : (isAr ? "إنشاء حساب" : "Create Account")}
          </button>
        </form>
      </section>

      {/* Existing moderators list */}
      <section className="rounded-2xl bg-white border border-slate-100 shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-900">
            {isAr ? "المشرفون المساعدون الحاليون" : "Current Moderators"}
          </h2>
          <button
            onClick={loadModerators}
            className="text-xs rounded-md border px-3 py-1 bg-white hover:bg-slate-50"
          >
            {isAr ? "تحديث" : "Refresh"}
          </button>
        </div>

        {moderatorsLoading ? (
          <p className="text-sm text-slate-500">{isAr ? "جاري التحميل..." : "Loading..."}</p>
        ) : moderatorsError ? (
          <p className="text-sm text-red-600">{moderatorsError}</p>
        ) : moderators.length === 0 ? (
          <p className="text-sm text-slate-500">
            {isAr ? "لا يوجد مشرفون مساعدون بعد." : "No moderators yet."}
          </p>
        ) : (
          <div className="rounded-xl border border-slate-100 overflow-hidden">
            <table className="min-w-full divide-y divide-slate-100 text-xs">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-3 py-2 text-left font-semibold text-slate-600">
                    {isAr ? "الاسم" : "Name"}
                  </th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-600">
                    {isAr ? "البريد الإلكتروني" : "Email"}
                  </th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-600">
                    {isAr ? "الحالة" : "Status"}
                  </th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-600">
                    {isAr ? "تاريخ الإنشاء" : "Created"}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-100">
                {moderators.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50">
                    <td className="px-3 py-2 font-medium text-slate-800">{m.full_name}</td>
                    <td className="px-3 py-2 text-slate-500">{m.email}</td>
                    <td className="px-3 py-2">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] ${m.is_active ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
                        {m.is_active
                          ? (isAr ? "فعّال" : "Active")
                          : (isAr ? "غير فعّال" : "Inactive")}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-slate-500">{formatDate(m.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
