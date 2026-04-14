// src/app/admin/dashboard/components/UsersPanel.tsx
"use client";

import React, { useState, useMemo, useCallback } from "react";
import type {
  Lang,
  StudentAdminRow,
  ParentAdminRow,
  ParentStudentLinkRow,
} from "../adminTypes";
import type { LangTexts } from "../adminTexts";
import { safeBool } from "../adminTypes";

export type UsersPanelProps = {
  lang: Lang;
  t: LangTexts;

  // -------------------------------------------------------------------------
  // Students table
  // -------------------------------------------------------------------------
  students: StudentAdminRow[];
  studentsLoading: boolean;
  studentsError: string | null;
  loadStudents: () => Promise<void>; // For data refresh

  // -------------------------------------------------------------------------
  // Parents table
  // -------------------------------------------------------------------------
  parents: ParentAdminRow[];
  parentsLoading: boolean;
  parentsError: string | null;
  loadParents: () => Promise<void>; // For data refresh

  // -------------------------------------------------------------------------
  // Shared user actions (activate / deactivate)
  // -------------------------------------------------------------------------
  updatingUserId: number | null;
  userActionError: string | null;
  toggleUserActive: (userId: number, currentActive: boolean) => Promise<void>;

  // -------------------------------------------------------------------------
  // Parent ↔ Student links management
  // -------------------------------------------------------------------------
  parentStudentLinks: ParentStudentLinkRow[];
  parentStudentLinksLoading: boolean;
  parentStudentLinksError: string | null;

  creatingLink: boolean;
  creatingLinkError: string | null;

  deletingLinkId: number | null;
  deletingLinkError: string | null;

  onCreateLink: (input: {
    parentId: number;
    studentId: number;
    relationship: "mother" | "father" | "guardian";
  }) => Promise<void>;

  onDeleteLink: (id: number) => Promise<void>;
  loadParentStudentLinks: () => Promise<void>; // For data refresh
};

// ---------------------------------------------------------------------------
// Local extended types (to avoid `any` but still support legacy field names)
// ---------------------------------------------------------------------------
type StudentRowExtended = StudentAdminRow & {
  id?: number;
  user_id?: number;
  full_name?: string;
  fullName?: string;
  name?: string;
  email?: string;
  is_active?: boolean | 0 | 1 | null;
  isActive?: boolean | 0 | 1 | null;
  active?: boolean | 0 | 1 | null;
};

type ParentRowExtended = ParentAdminRow & {
  id?: number;
  user_id?: number;
  full_name?: string;
  fullName?: string;
  name?: string;
  email?: string;
  is_active?: boolean | 0 | 1 | null;
  isActive?: boolean | 0 | 1 | null;
  active?: boolean | 0 | 1 | null;
};

type ParentStudentLinkRowExtended = ParentStudentLinkRow & {
  id?: number;
  parent_name?: string;
  parentName?: string;
  parent_full_name?: string;
  parent_id?: number;
  student_name?: string;
  studentName?: string;
  student_full_name?: string;
  student_id?: number;
  relationship?: string;
  created_at?: string | null;
  createdAt?: string | null;
};

// ---------------------------------------------------------------------------
// Custom confirmation hook
// ---------------------------------------------------------------------------
const useConfirmation = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [resolveCallback, setResolveCallback] =
    useState<((value: boolean) => void) | null>(null);

  const confirm = useCallback((msg: string): Promise<boolean> => {
    return new Promise((resolve) => {
      setMessage(msg);
      setIsOpen(true);
      setResolveCallback(() => resolve);
    });
  }, []);

  const handleConfirm = () => {
    setIsOpen(false);
    if (resolveCallback) {
      resolveCallback(true);
      setResolveCallback(null);
    }
  };

  const handleCancel = () => {
    setIsOpen(false);
    if (resolveCallback) {
      resolveCallback(false);
      setResolveCallback(null);
    }
  };

  return { isOpen, message, handleConfirm, handleCancel, confirm };
};

// ============================================================================
// Component
// ============================================================================
export const UsersPanel: React.FC<UsersPanelProps> = ({
  lang,
  t,

  // Students
  students,
  studentsLoading,
  studentsError,
  loadStudents,

  // Parents
  parents,
  parentsLoading,
  parentsError,
  loadParents,

  // User actions
  updatingUserId,
  userActionError,
  toggleUserActive,

  // Links
  parentStudentLinks,
  parentStudentLinksLoading,
  parentStudentLinksError,
  creatingLink,
  creatingLinkError,
  deletingLinkId,
  deletingLinkError,
  onCreateLink,
  onDeleteLink,
  loadParentStudentLinks,
}) => {
  // Local UI state for the "Create link" mini-form
  const [newParentId, setNewParentId] = useState<string>("");
  const [newStudentId, setNewStudentId] = useState<string>("");
  const [newRelationship, setNewRelationship] =
    useState<"mother" | "father" | "guardian">("mother");

  // Custom confirmation dialog
  const {
    isOpen: confirmOpen,
    message: confirmMessage,
    handleConfirm,
    handleCancel,
    confirm,
  } = useConfirmation();

  // Direction (RTL / LTR)
  const dir = lang === "ar" ? "rtl" : "ltr";

  // Pretty-print dates coming from the DB
  const formatDate = useCallback(
    (iso: string | null | undefined) => {
      if (!iso) return "—";
      const d = new Date(iso);
      if (Number.isNaN(d.getTime())) return iso;
      return d.toLocaleString(lang === "ar" ? "ar-EG" : "en-GB", {
        year: "numeric",
        month: "short",
        day: "2-digit",
      });
    },
    [lang]
  );

  // Render a colored chip showing active / inactive status
  const renderStatusChip = useCallback(
    (active: boolean) => {
      if (active) {
        return (
          <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 ring-1 ring-emerald-100">
            {t.usersStatusActive}
          </span>
        );
      }
      return (
        <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600 ring-1 ring-slate-200">
          {t.usersStatusInactive}
        </span>
      );
    },
    [t]
  );

  // Enhanced toggle handler with confirmation
  const handleToggleUserActive = useCallback(
    async (userId: number, currentActive: boolean, userName: string) => {
      const message =
        lang === "ar"
          ? `هل أنت متأكد أنك تريد ${
              currentActive ? "تعطيل" : "تفعيل"
            } ${userName}؟`
          : `Are you sure you want to ${
              currentActive ? "deactivate" : "activate"
            } ${userName}?`;

      const confirmed = await confirm(message);
      if (!confirmed) return;

      try {
        await toggleUserActive(userId, currentActive);
        // Refresh data after successful toggle
        await loadStudents();
        await loadParents();
      } catch (error) {
        
        console.error("Failed to toggle user status:", error);
      }
    },
    [lang, confirm, toggleUserActive, loadStudents, loadParents]
  );

  // Render the per-row "Activate" / "Deactivate" button
  const renderActionButton = useCallback(
    (userId: number, isActive: boolean, userName: string) => {
      const isUpdating = updatingUserId === userId;
      const label = isActive
        ? t.usersActionDeactivate
        : t.usersActionActivate;

      return (
        <button
          type="button"
          disabled={isUpdating}
          onClick={() => handleToggleUserActive(userId, isActive, userName)}
          className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium shadow-sm transition ${
            isActive
              ? "bg-rose-50 text-rose-700 hover:bg-rose-100 disabled:bg-rose-50"
              : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 disabled:bg-emerald-50"
          } disabled:cursor-not-allowed`}
        >
          {isUpdating && (
            <svg
              className="mr-1 h-3 w-3 animate-spin"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 0 1 8-8v4a4 4 0 0 0-4 4H4z"
              />
            </svg>
          )}
          <span>{isUpdating ? t.usersUpdatingStatus : label}</span>
        </button>
      );
    },
    [updatingUserId, t, handleToggleUserActive]
  );

  // Normalized links array
  const links = useMemo(
    () => parentStudentLinks ?? [],
    [parentStudentLinks]
  );

  // Handle submit of the "Create parent–student link" form
  const handleSubmitLink: React.FormEventHandler<HTMLFormElement> = async (
    e
  ) => {
    e.preventDefault();

    const parentIdNum = Number.parseInt(newParentId, 10);
    const studentIdNum = Number.parseInt(newStudentId, 10);

    if (!parentIdNum || !studentIdNum) {
      return;
    }

    try {
      await onCreateLink({
        parentId: parentIdNum,
        studentId: studentIdNum,
        relationship: newRelationship,
      });

      // Reset form after successful creation
      setNewParentId("");
      setNewStudentId("");
      setNewRelationship("mother");

      await loadParentStudentLinks();
    } catch (error) {
      
      console.error("Failed to create link:", error);
    }
  };

  return (
    <>
      {/* Confirmation Modal */}
      {confirmOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md" dir={dir}>
            <h3 className="text-lg font-semibold text-slate-900 mb-4">
              {lang === "ar" ? "تأكيد الإجراء" : "Confirm Action"}
            </h3>
            <p className="text-sm text-slate-600 mb-6">{confirmMessage}</p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={handleCancel}
                className="bg-slate-500 text-white px-4 py-2 rounded-md text-sm hover:bg-slate-600"
              >
                {lang === "ar" ? "إلغاء" : "Cancel"}
              </button>
              <button
                onClick={handleConfirm}
                className="bg-red-500 text-white px-4 py-2 rounded-md text-sm hover:bg-red-600"
              >
                {lang === "ar" ? "تأكيد" : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="space-y-8" dir={dir}>
        {/* Global error for user actions */}
        {userActionError && (
          <div className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {userActionError}
          </div>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* Students section                                                   */}
        {/* ------------------------------------------------------------------ */}
        <section>
          <div className="mb-3 flex items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-slate-800">
              {lang === "ar" ? "الطلاب" : "Students"}
            </h2>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">
                {lang === "ar" ? "الإجمالي:" : "Total:"} {students.length}
              </span>
              <button
                type="button"
                onClick={loadStudents}
                className="inline-flex items-center rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                {lang === "ar" ? "تحديث" : "Refresh"}
              </button>
              {studentsLoading && (
                <span className="ml-1 inline-flex h-3 w-3 animate-spin rounded-full border border-emerald-500 border-t-transparent" />
              )}
            </div>
          </div>

          {studentsError && (
            <p className="mb-2 text-xs text-rose-600">{studentsError}</p>
          )}

          <div className="overflow-x-auto rounded-lg border border-slate-100 bg-white">
            <table className="min-w-full divide-y divide-slate-100 text-xs">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-3 py-2 text-left font-medium text-slate-500">
                    #
                  </th>
                  <th className="px-3 py-2 text-left font-medium text-slate-500">
                    {lang === "ar" ? "الاسم" : "Name"}
                  </th>
                  <th className="px-3 py-2 text-left font-medium text-slate-500">
                    Email
                  </th>
                  <th className="px-3 py-2 text-left font-medium text-slate-500">
                    {lang === "ar" ? "الحالة" : "Status"}
                  </th>
                  <th className="px-3 py-2 text-right font-medium text-slate-500">
                    {lang === "ar" ? "إجراءات" : "Actions"}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {students.length === 0 && !studentsLoading ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-3 py-4 text-center text-xs text-slate-400"
                    >
                      {lang === "ar"
                        ? "لا توجد بيانات طلاب حالياً."
                        : "No students found."}
                    </td>
                  </tr>
                ) : (
                  students.map((student, index) => {
                    const sRow = student as StudentRowExtended;
                    const id = sRow.id ?? sRow.user_id ?? index;
                    const name =
                      sRow.full_name ??
                      sRow.fullName ??
                      sRow.name ??
                      `#${id}`;
                    const email = sRow.email ?? "—";
                    const active = safeBool(
                      sRow.is_active ?? sRow.isActive ?? sRow.active ?? false
                    );

                    return (
                      <tr key={id}>
                        <td className="px-3 py-2 text-slate-500">
                          {index + 1}
                        </td>
                        <td className="px-3 py-2 text-slate-800">{name}</td>
                        <td className="px-3 py-2 text-slate-600">{email}</td>
                        <td className="px-3 py-2">{renderStatusChip(active)}</td>
                        <td className="px-3 py-2 text-right">
                          {renderActionButton(id, active, name)}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* ------------------------------------------------------------------ */}
        {/* Parents section                                                    */}
        {/* ------------------------------------------------------------------ */}
        <section>
          <div className="mb-3 flex items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-slate-800">
              {lang === "ar" ? "أولياء الأمور" : "Parents"}
            </h2>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">
                {lang === "ar" ? "الإجمالي:" : "Total:"} {parents.length}
              </span>
              <button
                type="button"
                onClick={loadParents}
                className="inline-flex items-center rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                {lang === "ar" ? "تحديث" : "Refresh"}
              </button>
              {parentsLoading && (
                <span className="ml-1 inline-flex h-3 w-3 animate-spin rounded-full border border-emerald-500 border-t-transparent" />
              )}
            </div>
          </div>

          {parentsError && (
            <p className="mb-2 text-xs text-rose-600">{parentsError}</p>
          )}

          <div className="overflow-x-auto rounded-lg border border-slate-100 bg-white">
            <table className="min-w-full divide-y divide-slate-100 text-xs">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-3 py-2 text-left font-medium text-slate-500">
                    #
                  </th>
                  <th className="px-3 py-2 text-left font-medium text-slate-500">
                    {lang === "ar" ? "الاسم" : "Name"}
                  </th>
                  <th className="px-3 py-2 text-left font-medium text-slate-500">
                    Email
                  </th>
                  <th className="px-3 py-2 text-left font-medium text-slate-500">
                    {lang === "ar" ? "الحالة" : "Status"}
                  </th>
                  <th className="px-3 py-2 text-right font-medium text-slate-500">
                    {lang === "ar" ? "إجراءات" : "Actions"}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {parents.length === 0 && !parentsLoading ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-3 py-4 text-center text-xs text-slate-400"
                    >
                      {lang === "ar"
                        ? "لا توجد بيانات أولياء أمور حالياً."
                        : "No parents found."}
                    </td>
                  </tr>
                ) : (
                  parents.map((parent, index) => {
                    const pRow = parent as ParentRowExtended;
                    const id = pRow.id ?? pRow.user_id ?? index;
                    const name =
                      pRow.full_name ??
                      pRow.fullName ??
                      pRow.name ??
                      `#${id}`;
                    const email = pRow.email ?? "—";
                    const active = safeBool(
                      pRow.is_active ?? pRow.isActive ?? pRow.active ?? false
                    );

                    return (
                      <tr key={id}>
                        <td className="px-3 py-2 text-slate-500">
                          {index + 1}
                        </td>
                        <td className="px-3 py-2 text-slate-800">{name}</td>
                        <td className="px-3 py-2 text-slate-600">{email}</td>
                        <td className="px-3 py-2">{renderStatusChip(active)}</td>
                        <td className="px-3 py-2 text-right">
                          {renderActionButton(id, active, name)}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* ------------------------------------------------------------------ */}
        {/* Parent–Student links section                                      */}
        {/* ------------------------------------------------------------------ */}
        <section>
          <div className="mb-3 flex items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-slate-800">
              {lang === "ar"
                ? "روابط أولياء الأمور بالطلاب"
                : "Parent–Student links"}
            </h2>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">
                {lang === "ar" ? "الإجمالي:" : "Total:"} {links.length}
              </span>
              <button
                type="button"
                onClick={loadParentStudentLinks}
                className="inline-flex items-center rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                {lang === "ar" ? "تحديث" : "Refresh"}
              </button>
              {parentStudentLinksLoading && (
                <span className="ml-1 inline-flex h-3 w-3 animate-spin rounded-full border border-emerald-500 border-t-transparent" />
              )}
            </div>
          </div>

          {(parentStudentLinksError ||
            creatingLinkError ||
            deletingLinkError) && (
            <div className="mb-2 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700 space-y-1">
              {parentStudentLinksError && <div>{parentStudentLinksError}</div>}
              {creatingLinkError && <div>{creatingLinkError}</div>}
              {deletingLinkError && <div>{deletingLinkError}</div>}
            </div>
          )}

          {/* Create link form */}
          <form
            onSubmit={handleSubmitLink}
            className="mb-4 grid gap-2 rounded-lg border border-slate-100 bg-slate-50 p-3 text-xs md:grid-cols-4"
          >
            <div>
              <label className="mb-1 block text-[11px] font-medium text-slate-600">
                {lang === "ar" ? "ولي الأمر" : "Parent"}
              </label>
              <select
                value={newParentId}
                onChange={(e) => setNewParentId(e.target.value)}
                className="w-full rounded-md border border-slate-200 bg-white px-2 py-1 text-xs"
              >
                <option value="">
                  {lang === "ar" ? "اختر ولي الأمر" : "Select parent"}
                </option>
                {parents.map((parent) => {
                  const pRow = parent as ParentRowExtended;
                  const id = pRow.id ?? pRow.user_id;
                  const name =
                    pRow.full_name ?? pRow.fullName ?? pRow.name ?? `#${id}`;
                  return (
                    <option key={id} value={id}>
                      {name}
                    </option>
                  );
                })}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-[11px] font-medium text-slate-600">
                {lang === "ar" ? "الطالب" : "Student"}
              </label>
              <select
                value={newStudentId}
                onChange={(e) => setNewStudentId(e.target.value)}
                className="w-full rounded-md border border-slate-200 bg-white px-2 py-1 text-xs"
              >
                <option value="">
                  {lang === "ar" ? "اختر الطالب" : "Select student"}
                </option>
                {students.map((student) => {
                  const sRow = student as StudentRowExtended;
                  const id = sRow.id ?? sRow.user_id;
                  const name =
                    sRow.full_name ?? sRow.fullName ?? sRow.name ?? `#${id}`;
                  return (
                    <option key={id} value={id}>
                      {name}
                    </option>
                  );
                })}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-[11px] font-medium text-slate-600">
                {lang === "ar" ? "العلاقة" : "Relationship"}
              </label>
              <select
                value={newRelationship}
                onChange={(e) =>
                  setNewRelationship(
                    e.target.value as "mother" | "father" | "guardian"
                  )
                }
                className="w-full rounded-md border border-slate-200 bg-white px-2 py-1 text-xs"
              >
                <option value="mother">
                  {lang === "ar" ? "الأم" : "Mother"}
                </option>
                <option value="father">
                  {lang === "ar" ? "الأب" : "Father"}
                </option>
                <option value="guardian">
                  {lang === "ar" ? "ولي أمر" : "Guardian"}
                </option>
              </select>
            </div>

            <div className="flex items-end justify-end">
              <button
                type="submit"
                disabled={creatingLink}
                className="inline-flex items-center rounded-md bg-emerald-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-600 disabled:bg-emerald-300"
              >
                {creatingLink && (
                  <span className="mr-1 inline-flex h-3 w-3 animate-spin rounded-full border border-white border-t-transparent" />
                )}
                {creatingLink
                  ? t.usersLinksCreatingButton
                  : lang === "ar"
                  ? "إنشاء رابط"
                  : "Create link"}
              </button>
            </div>
          </form>

          {/* Links table */}
          <div className="overflow-x-auto rounded-lg border border-slate-100 bg-white">
            <table className="min-w-full divide-y divide-slate-100 text-xs">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-3 py-2 text-left font-medium text-slate-500">
                    #
                  </th>
                  <th className="px-3 py-2 text-left font-medium text-slate-500">
                    {lang === "ar" ? "ولي الأمر" : "Parent"}
                  </th>
                  <th className="px-3 py-2 text-left font-medium text-slate-500">
                    {lang === "ar" ? "الطالب" : "Student"}
                  </th>
                  <th className="px-3 py-2 text-left font-medium text-slate-500">
                    {lang === "ar" ? "العلاقة" : "Relationship"}
                  </th>
                  <th className="px-3 py-2 text-left font-medium text-slate-500">
                    {lang === "ar" ? "تم الإنشاء" : "Created at"}
                  </th>
                  <th className="px-3 py-2 text-right font-medium text-slate-500">
                    {lang === "ar" ? "إجراءات" : "Actions"}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {links.length === 0 && !parentStudentLinksLoading ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-3 py-4 text-center text-xs text-slate-400"
                    >
                      {lang === "ar"
                        ? "لا توجد روابط حالياً."
                        : "No links found."}
                    </td>
                  </tr>
                ) : (
                  links.map((link, index) => {
                    const lRow = link as ParentStudentLinkRowExtended;
                    const id = lRow.id ?? index;
                    const parentName =
                      lRow.parent_name ??
                      lRow.parentName ??
                      lRow.parent_full_name ??
                      `#${lRow.parent_id ?? ""}`;
                    const studentName =
                      lRow.student_name ??
                      lRow.studentName ??
                      lRow.student_full_name ??
                      `#${lRow.student_id ?? ""}`;
                    const relationship =
                      lRow.relationship ??
                      (lang === "ar" ? "غير محدد" : "Unknown");
                    const createdAt = formatDate(
                      lRow.created_at ?? lRow.createdAt ?? null
                    );
                    const isDeleting = deletingLinkId === id;

                    return (
                      <tr key={id}>
                        <td className="px-3 py-2 text-slate-500">
                          {index + 1}
                        </td>
                        <td className="px-3 py-2 text-slate-800">
                          {parentName}
                        </td>
                        <td className="px-3 py-2 text-slate-800">
                          {studentName}
                        </td>
                        <td className="px-3 py-2 text-slate-600">
                          {relationship}
                        </td>
                        <td className="px-3 py-2 text-slate-500">
                          {createdAt}
                        </td>
                        <td className="px-3 py-2 text-right">
                          <button
                            type="button"
                            disabled={isDeleting}
                            onClick={async () => {
                              const msg =
                                lang === "ar"
                                  ? "هل أنت متأكد أنك تريد حذف هذا الرابط؟"
                                  : "Are you sure you want to delete this link?";
                              const ok = await confirm(msg);
                              if (!ok) return;
                              try {
                                await onDeleteLink(id);
                                await loadParentStudentLinks();
                              } catch (err) {
                                
                                console.error("Failed to delete link:", err);
                              }
                            }}
                            className="inline-flex items-center rounded-md bg-rose-50 px-2 py-1 text-xs font-medium text-rose-700 hover:bg-rose-100 disabled:bg-rose-100 disabled:text-rose-400"
                          >
                            {isDeleting ? (
                              <>
                                <span className="mr-1 inline-flex h-3 w-3 animate-spin rounded-full border border-rose-500 border-t-transparent" />
                                {lang === "ar" ? "جاري الحذف..." : "Deleting..."}
                              </>
                            ) : (
                              <>{lang === "ar" ? "حذف" : "Delete"}</>
                            )}
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </>
  );
};
