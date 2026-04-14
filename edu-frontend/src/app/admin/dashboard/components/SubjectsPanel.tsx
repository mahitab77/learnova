// src/app/admin/dashboard/components/SubjectsPanel.tsx
// ============================================================================
// SubjectsPanel Component
// ----------------------------------------------------------------------------
// Responsibilities:
//  - Render the "Subjects" tab content.
//  - Show create-subject form (Arabic/English name, sort order, active flag).
//  - List existing subjects with status pill & sort order.
//  - Allow inline edit of subject name/sort/active.
//  - Allow deletion of a subject with confirmation.
//  - Display loading / error / empty states and small feedback message.
//  - Local search / filter / sort for subjects:
//        • search by Arabic/English name
//        • filter by active status (all / active / inactive)
//        • sort by sort_order or name
//  - Client-side pagination over filtered & sorted subjects so the list
//    doesn’t grow beyond the screen (page size = 12 by default).
// ============================================================================

import type React from "react";
import { useMemo, useState, useCallback, useEffect } from "react";
import type { Lang, SubjectAdminRow } from "../adminTypes";
import { safeBool } from "../adminTypes";
import type { LangTexts } from "../adminTexts";

export type SubjectsPanelProps = {
  lang: Lang;
  t: LangTexts;

  // Data + loading/error
  subjects: SubjectAdminRow[];
  subjectsLoading: boolean;
  subjectsError: string | null;
  loadSubjects: () => Promise<void>; // NEW: For data refresh

  // Create subject form state
  newSubNameAr: string;
  newSubNameEn: string;
  newSubSort: string;
  newSubActive: boolean;
  creatingSubject: boolean;
  creatingSubjectError: string | null; // NEW: Error state for create

  // Edit subject inline state
  editingSubjectId: number | null;
  editSubNameAr: string;
  editSubNameEn: string;
  editSubSort: string;
  editSubActive: boolean;
  updatingSubject: boolean;
  updatingSubjectError: string | null; // NEW: Error state for update

  // Delete subject state
  deletingSubjectId: number | null; // NEW: Loading state for delete
  deletingSubjectError: string | null; // NEW: Error state for delete

  // Small feedback banner
  subjectMessage: string | null;

  // State setters from useAdminDashboard
  setNewSubNameAr: (v: string) => void;
  setNewSubNameEn: (v: string) => void;
  setNewSubSort: (v: string) => void;
  setNewSubActive: (v: boolean) => void;

  // Handlers from useAdminDashboard
  handleCreateSubject: (e: React.FormEvent) => void;
  startEditSubject: (sub: SubjectAdminRow) => void;
  cancelEditSubject: () => void;
  handleUpdateSubject: (id: number) => Promise<void>;
  handleDeleteSubject: (id: number) => Promise<void>;

  setEditSubNameAr: (v: string) => void;
  setEditSubNameEn: (v: string) => void;
  setEditSubSort: (v: string) => void;
  setEditSubActive: (v: boolean) => void;
};

// Local sort helpers
type SubjectSortKey = "order" | "name";
type SortDir = "asc" | "desc";

// Page size for subjects table
const PAGE_SIZE = 12;

// Debounce hook for search
const useDebounce = (value: string, delay: number) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

// Custom confirmation dialog to replace window.confirm
const useConfirmation = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [resolveCallback, setResolveCallback] = useState<((value: boolean) => void) | null>(null);

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

export function SubjectsPanel(props: SubjectsPanelProps) {
  const {
    lang,
    t,
    subjects,
    subjectsLoading,
    subjectsError,
    loadSubjects, // NEW

    // create subject
    newSubNameAr,
    newSubNameEn,
    newSubSort,
    newSubActive,
    creatingSubject,
    creatingSubjectError, // NEW

    // edit subject
    editingSubjectId,
    editSubNameAr,
    editSubNameEn,
    editSubSort,
    editSubActive,
    updatingSubject,
    updatingSubjectError, // NEW

    // delete subject
    deletingSubjectId, // NEW
    deletingSubjectError, // NEW

    // feedback
    subjectMessage,

    // state setters
    setNewSubNameAr,
    setNewSubNameEn,
    setNewSubSort,
    setNewSubActive,

    // handlers
    handleCreateSubject,
    startEditSubject,
    cancelEditSubject,
    handleUpdateSubject,
    handleDeleteSubject,

    setEditSubNameAr,
    setEditSubNameEn,
    setEditSubSort,
    setEditSubActive,
  } = props;

  const dir = lang === "ar" ? "rtl" : "ltr";

  // -------------------------------------------------------------------------
  // Local UI state: search / filter / sort / pagination
  // -------------------------------------------------------------------------
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">(
    "all"
  );
  const [sortKey, setSortKey] = useState<SubjectSortKey>("order");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [page, setPage] = useState(1);

  // Debounced search term for better performance
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Custom confirmation dialog
  const { isOpen: confirmOpen, message: confirmMessage, handleConfirm, handleCancel, confirm } = useConfirmation();

  // Helper to format sort order display
  const formatSortOrder = (order: number | null): string => {
    if (order === null) return "-";
    return order.toString();
  };

  // Validate sort order input
  const validateSortOrder = (value: string): string => {
    const num = parseInt(value);
    if (value === "") return "";
    if (isNaN(num)) return "0";
    if (num < 0) return "0";
    if (num > 999) return "999";
    return value;
  };

  // Convenience: can we submit the create form?
  const canCreate = useMemo(() => {
    return !creatingSubject && 
           (newSubNameAr.trim().length > 0 || newSubNameEn.trim().length > 0) &&
           (newSubSort === "" || !isNaN(parseInt(newSubSort)));
  }, [creatingSubject, newSubNameAr, newSubNameEn, newSubSort]);

  // Convenience: can we submit the edit form?
  const canUpdate = useMemo(() => {
    return !updatingSubject &&
           (editSubNameAr.trim().length > 0 || editSubNameEn.trim().length > 0) &&
           (editSubSort === "" || !isNaN(parseInt(editSubSort)));
  }, [updatingSubject, editSubNameAr, editSubNameEn, editSubSort]);

  // -------------------------------------------------------------------------
  // Derived list: apply search, filters, sort on subjects
  // -------------------------------------------------------------------------
  const filteredAndSortedSubjects = useMemo(() => {
    const term = debouncedSearchTerm.trim().toLowerCase();

    const result = subjects
      .filter((sub) => {
        // Search by Arabic or English name
        if (term) {
          const ar = sub.name_ar.toLowerCase();
          const en = sub.name_en.toLowerCase();
          if (!ar.includes(term) && !en.includes(term)) {
            return false;
          }
        }

        // Filter by status
        const active = safeBool(sub.is_active);
        if (statusFilter === "active" && !active) return false;
        if (statusFilter === "inactive" && active) return false;

        return true;
      })
      .sort((a, b) => {
        if (sortKey === "order") {
          const aOrder = a.sort_order ?? Number.POSITIVE_INFINITY;
          const bOrder = b.sort_order ?? Number.POSITIVE_INFINITY;

          if (aOrder < bOrder) return sortDir === "asc" ? -1 : 1;
          if (aOrder > bOrder) return sortDir === "asc" ? 1 : -1;
          return 0;
        }

        // sortKey === "name" → use current language label
        const aName = (lang === "ar" ? a.name_ar : a.name_en).toLowerCase();
        const bName = (lang === "ar" ? b.name_ar : b.name_en).toLowerCase();

        if (aName < bName) return sortDir === "asc" ? -1 : 1;
        if (aName > bName) return sortDir === "asc" ? 1 : -1;
        return 0;
      });

    return result;
  }, [subjects, debouncedSearchTerm, statusFilter, sortKey, sortDir, lang]);

  // -------------------------------------------------------------------------
  // Pagination helpers (safe, no setState in effects)
  // -------------------------------------------------------------------------
  const totalPages = Math.max(
    1,
    Math.ceil(filteredAndSortedSubjects.length / PAGE_SIZE)
  );

  const safePage = useMemo(() => {
    if (page < 1) return 1;
    if (page > totalPages) return totalPages;
    return page;
  }, [page, totalPages]);

  const pagedSubjects = useMemo(() => {
    const start = (safePage - 1) * PAGE_SIZE;
    const end = start + PAGE_SIZE;
    return filteredAndSortedSubjects.slice(start, end);
  }, [filteredAndSortedSubjects, safePage]);

  // -------------------------------------------------------------------------
  // Handlers that also reset page to 1 (event handlers, not effects)
  // -------------------------------------------------------------------------
  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setPage(1);
  };

  const handleStatusFilterChange = (value: "all" | "active" | "inactive") => {
    setStatusFilter(value);
    setPage(1);
  };

  const handleSortChange = (value: string) => {
    const [key, dir] = value.split("-");
    setSortKey(key as SubjectSortKey);
    setSortDir(dir as SortDir);
    setPage(1);
  };

  const clearFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setSortKey("order");
    setSortDir("asc");
    setPage(1);
  };

  const handleNewSortChange = (value: string) => {
    const validated = validateSortOrder(value);
    setNewSubSort(validated);
  };

  const handleEditSortChange = (value: string) => {
    const validated = validateSortOrder(value);
    setEditSubSort(validated);
  };

  // Enhanced delete handler with confirmation and data refresh
  const handleDeleteClick = async (id: number, nameAr: string, nameEn: string) => {
    const label = lang === "ar" ? nameAr || nameEn : nameEn || nameAr;
    const message = lang === "ar"
      ? `هل أنت متأكد من حذف المادة "${label}"؟ لا يمكن التراجع عن هذا الإجراء.`
      : `Are you sure you want to delete the subject "${label}"? This cannot be undone.`;

    const confirmed = await confirm(message);
    if (!confirmed) return;

    try {
      await handleDeleteSubject(id);
      // Refresh subjects list after successful delete
      await loadSubjects();
    } catch (error) {
      // Error is handled by parent component via deletingSubjectError
      console.error("Failed to delete subject:", error);
    }
  };

  // Enhanced update handler with data refresh
  const handleUpdateClick = async (id: number) => {
    try {
      await handleUpdateSubject(id);
      // Refresh subjects list after successful update
      await loadSubjects();
    } catch (error) {
      // Error is handled by parent component via updatingSubjectError
      console.error("Failed to update subject:", error);
    }
  };

  // Enhanced create handler with form reset
  const handleCreateClick = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await handleCreateSubject(e);
      // Reset form after successful creation
      setNewSubNameAr("");
      setNewSubNameEn("");
      setNewSubSort("");
      setNewSubActive(true);
      // Refresh subjects list
      await loadSubjects();
    } catch (error) {
      // Error is handled by parent component via creatingSubjectError
      console.error("Failed to create subject:", error);
    }
  };

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------
  return (
    <>
      {/* Confirmation Modal */}
      {confirmOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md" dir={dir}>
            <h3 className="text-lg font-semibold text-slate-900 mb-4">
              {lang === "ar" ? "تأكيد الحذف" : "Confirm Deletion"}
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
                {lang === "ar" ? "حذف" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      <section
        className="rounded-2xl bg-white border border-slate-100 shadow-sm p-5 space-y-5"
        dir={dir}
      >
        <header className="flex flex-col gap-2 md:flex-row md:items-baseline md:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              {t.subjectsTitle}
            </h2>
            <p className="text-xs text-slate-500">{t.subjectsDesc}</p>
          </div>
          <div className="text-xs text-slate-500">
            {lang === "ar" ? "إجمالي المواد:" : "Total subjects:"} {subjects.length}
          </div>
        </header>

        {/* Error messages */}
        {creatingSubjectError && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
            {lang === "ar" ? "خطأ في إنشاء المادة:" : "Error creating subject:"} {creatingSubjectError}
          </div>
        )}
        {updatingSubjectError && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
            {lang === "ar" ? "خطأ في تحديث المادة:" : "Error updating subject:"} {updatingSubjectError}
          </div>
        )}
        {deletingSubjectError && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
            {lang === "ar" ? "خطأ في حذف المادة:" : "Error deleting subject:"} {deletingSubjectError}
          </div>
        )}

        {/* Create subject */}
        <form
          onSubmit={handleCreateClick}
          className="rounded-xl bg-slate-50 p-4 space-y-3"
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-medium text-slate-800">
              {t.subjectsAddNew}
            </span>
          </div>
          <div className="grid gap-3 md:grid-cols-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                {t.subjectsNameAr} <span className="text-red-500">*</span>
              </label>
              <input
                value={newSubNameAr}
                onChange={(e) => setNewSubNameAr(e.target.value)}
                className="w-full rounded-md border border-slate-200 bg-white px-2 py-1.5 text-xs shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                placeholder={lang === "ar" ? "اسم المادة بالعربية" : "Subject name in Arabic"}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                {t.subjectsNameEn} <span className="text-red-500">*</span>
              </label>
              <input
                value={newSubNameEn}
                onChange={(e) => setNewSubNameEn(e.target.value)}
                className="w-full rounded-md border border-slate-200 bg-white px-2 py-1.5 text-xs shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                placeholder={lang === "ar" ? "اسم المادة بالإنجليزية" : "Subject name in English"}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                {t.subjectsSortOrder}
              </label>
              <input
                type="number"
                min="0"
                max="999"
                value={newSubSort}
                onChange={(e) => handleNewSortChange(e.target.value)}
                className="w-full rounded-md border border-slate-200 bg-white px-2 py-1.5 text-xs shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                placeholder="0"
              />
            </div>
            <div className="flex items-center gap-2 pt-5">
              <label className="flex items-center gap-1 text-xs text-slate-700">
                <input
                  type="checkbox"
                  checked={newSubActive}
                  onChange={(e) => setNewSubActive(e.target.checked)}
                />
                {t.subjectsActive}
              </label>
            </div>
          </div>
          <div className="flex justify-between items-center">
            <p className="text-[10px] text-slate-500">
              {lang === "ar" 
                ? "* حقل مطلوب على الأقل واحد من اسمي المادة (عربي/إنجليزي)"
                : "* At least one subject name (Arabic/English) is required"}
            </p>
            <button
              type="submit"
              disabled={!canCreate}
              className={`rounded-md px-4 py-1.5 text-xs font-medium text-white ${
                !canCreate
                  ? "bg-emerald-200 cursor-not-allowed"
                  : "bg-emerald-500 hover:bg-emerald-600"
              }`}
            >
              {creatingSubject ? t.subjectsCreating : t.subjectsCreate}
            </button>
          </div>
          {subjectMessage && (
            <p className="mt-1 text-xs text-emerald-600">{subjectMessage}</p>
          )}
        </form>

        {/* Toolbar: search + status filter + sort */}
        <div className="flex flex-col gap-2 rounded-xl border border-slate-100 bg-slate-50 px-3 py-3 md:flex-row md:items-center md:justify-between">
          {/* Search */}
          <div className="flex-1">
            <label className="block text-[11px] font-medium text-slate-600 mb-1">
              {lang === "ar" ? "بحث عن مادة" : "Search subjects"}
            </label>
            <div className="relative">
              <input
                value={searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder={
                  lang === "ar"
                    ? "اكتب اسم المادة بالعربي أو الإنجليزي..."
                    : "Type subject name (Arabic or English)..."
                }
                className="w-full rounded-md border border-slate-200 bg-white px-2 py-1.5 text-xs shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 pr-8"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => handleSearchChange("")}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  aria-label={lang === "ar" ? "مسح البحث" : "Clear search"}
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Filters & sort */}
          <div className="flex flex-wrap gap-2 md:justify-end">
            {/* Status filter */}
            <div>
              <label className="block text-[11px] font-medium text-slate-600 mb-1">
                {lang === "ar" ? "الحالة" : "Status"}
              </label>
              <select
                value={statusFilter}
                onChange={(e) =>
                  handleStatusFilterChange(
                    e.target.value as "all" | "active" | "inactive"
                  )
                }
                className="rounded-md border border-slate-200 bg-white px-2 py-1.5 text-xs shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                <option value="all">
                  {lang === "ar" ? "الكل" : "All"}
                </option>
                <option value="active">{t.subjectsStatusActive}</option>
                <option value="inactive">{t.subjectsStatusInactive}</option>
              </select>
            </div>

            {/* Sort */}
            <div>
              <label className="block text-[11px] font-medium text-slate-600 mb-1">
                {lang === "ar" ? "ترتيب حسب" : "Sort by"}
              </label>
              <select
                value={`${sortKey}-${sortDir}`}
                onChange={(e) => handleSortChange(e.target.value)}
                className="rounded-md border border-slate-200 bg-white px-2 py-1.5 text-xs shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                <option value="order-asc">
                  {lang === "ar"
                    ? "ترتيب العرض (تصاعدي)"
                    : "Sort order (ascending)"}
                </option>
                <option value="order-desc">
                  {lang === "ar"
                    ? "ترتيب العرض (تنازلي)"
                    : "Sort order (descending)"}
                </option>
                <option value="name-asc">
                  {lang === "ar" ? "الاسم (أ-ي)" : "Name (A–Z)"}
                </option>
                <option value="name-desc">
                  {lang === "ar" ? "الاسم (ي-أ)" : "Name (Z–A)"}
                </option>
              </select>
            </div>

            {/* Clear filters button */}
            {(searchTerm || statusFilter !== "all") && (
              <div className="flex items-end">
                <button
                  type="button"
                  onClick={clearFilters}
                  className="rounded-md border border-slate-300 bg-white px-2 py-1.5 text-xs text-slate-600 hover:bg-slate-50"
                >
                  {lang === "ar" ? "مسح الفلاتر" : "Clear filters"}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* List subjects + pagination */}
        <div className="rounded-xl border border-slate-100 overflow-hidden">
          {subjectsLoading ? (
            <div className="p-4 text-sm text-slate-500 text-center">
              <div className="animate-pulse">
                <div className="h-4 bg-slate-200 rounded w-1/4 mx-auto mb-2"></div>
                <div className="h-3 bg-slate-200 rounded w-1/3 mx-auto"></div>
              </div>
            </div>
          ) : subjectsError ? (
            <div className="p-4 text-sm text-red-600 text-center">
              {t.subjectsError}: {subjectsError}
            </div>
          ) : filteredAndSortedSubjects.length === 0 ? (
            <div className="p-4 text-sm text-slate-500 text-center">
              {searchTerm || statusFilter !== "all"
                ? lang === "ar"
                  ? "لا توجد مواد مطابقة للبحث أو الفلاتر."
                  : "No subjects match your filters."
                : t.subjectsNone}
            </div>
          ) : (
            <>
              <table className="min-w-full divide-y divide-slate-100 text-xs">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-3 py-2 text-left font-semibold text-slate-600">
                      {t.subjectsTableSubject}
                    </th>
                    <th className="px-3 py-2 text-left font-semibold text-slate-600 hidden sm:table-cell">
                      {t.subjectsTableOrder}
                    </th>
                    <th className="px-3 py-2 text-left font-semibold text-slate-600">
                      {t.subjectsTableStatus}
                    </th>
                    <th className="px-3 py-2 text-left font-semibold text-slate-600">
                      {t.subjectsActions}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {pagedSubjects.map((sub) => {
                    const isEditing = editingSubjectId === sub.id;
                    const isDeleting = deletingSubjectId === sub.id;
                    const isActive = safeBool(sub.is_active);

                    return (
                      <tr key={sub.id}>
                        {/* Names (AR/EN) */}
                        <td className="px-3 py-2 align-top">
                          {isEditing ? (
                            <div className="space-y-1">
                              <input
                                value={editSubNameAr}
                                onChange={(e) =>
                                  setEditSubNameAr(e.target.value)
                                }
                                className="mb-1 w-full rounded-md border border-slate-200 bg-white px-2 py-1 text-xs shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                placeholder={t.subjectsNameAr}
                                required
                              />
                              <input
                                value={editSubNameEn}
                                onChange={(e) =>
                                  setEditSubNameEn(e.target.value)
                                }
                                className="w-full rounded-md border border-slate-200 bg-white px-2 py-1 text-xs shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                placeholder={t.subjectsNameEn}
                                required
                              />
                            </div>
                          ) : (
                            <div>
                              <div className="font-medium text-slate-900">
                                {lang === "ar" ? sub.name_ar : sub.name_en}
                              </div>
                              <div className="text-[10px] text-slate-400 mt-0.5">
                                {lang === "ar" ? sub.name_en : sub.name_ar}
                              </div>
                            </div>
                          )}
                        </td>

                        {/* Sort order */}
                        <td className="px-3 py-2 align-top hidden sm:table-cell">
                          {isEditing ? (
                            <input
                              type="number"
                              min="0"
                              max="999"
                              value={editSubSort}
                              onChange={(e) => handleEditSortChange(e.target.value)}
                              className="w-16 rounded-md border border-slate-200 bg-white px-2 py-1 text-xs shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                            />
                          ) : (
                            <span className="text-xs text-slate-700">
                              {formatSortOrder(sub.sort_order)}
                            </span>
                          )}
                        </td>

                        {/* Active status / toggle */}
                        <td className="px-3 py-2 align-top">
                          {isEditing ? (
                            <label className="inline-flex items-center gap-1 text-xs text-slate-700">
                              <input
                                type="checkbox"
                                checked={editSubActive}
                                onChange={(e) =>
                                  setEditSubActive(e.target.checked)
                                }
                              />
                              {t.subjectsActive}
                            </label>
                          ) : (
                            <span
                              className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium ${
                                isActive
                                  ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                                  : "bg-slate-50 text-slate-500 border border-slate-100"
                              }`}
                            >
                              {isActive
                                ? t.subjectsStatusActive
                                : t.subjectsStatusInactive}
                            </span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="px-3 py-2 align-top">
                          {isEditing ? (
                            <div className="flex gap-2">
                              <button
                                type="button"
                                disabled={!canUpdate || updatingSubject}
                                onClick={() => handleUpdateClick(sub.id)}
                                className={`rounded-md px-2 py-1 text-[11px] font-medium text-white ${
                                  !canUpdate || updatingSubject
                                    ? "bg-emerald-300 cursor-not-allowed"
                                    : "bg-emerald-500 hover:bg-emerald-600"
                                }`}
                              >
                                {updatingSubject ? (
                                  lang === "ar" ? "جاري التحديث..." : "Updating..."
                                ) : t.subjectsUpdate}
                              </button>
                              <button
                                type="button"
                                onClick={cancelEditSubject}
                                className="rounded-md px-2 py-1 text-[11px] font-medium text-slate-600 hover:bg-slate-50"
                              >
                                {t.subjectsCancel}
                              </button>
                            </div>
                          ) : (
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() => startEditSubject(sub)}
                                className="rounded-md px-2 py-1 text-[11px] font-medium text-slate-700 border border-slate-200 hover:bg-slate-50"
                              >
                                {t.subjectsEdit}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteClick(sub.id, sub.name_ar, sub.name_en)}
                                disabled={isDeleting}
                                className={`rounded-md px-2 py-1 text-[11px] font-medium text-red-600 border border-red-200 hover:bg-red-50 ${
                                  isDeleting ? "opacity-50 cursor-not-allowed" : ""
                                }`}
                              >
                                {isDeleting ? (
                                  lang === "ar" ? "جاري الحذف..." : "Deleting..."
                                ) : t.subjectsDelete}
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* Pagination footer */}
              <div className="flex flex-col items-center justify-between gap-2 border-t border-slate-100 bg-slate-50 px-3 py-2 text-[11px] text-slate-600 md:flex-row">
                <div>
                  {(() => {
                    const total = filteredAndSortedSubjects.length;
                    const start = (safePage - 1) * PAGE_SIZE + 1;
                    const end = Math.min(safePage * PAGE_SIZE, total);

                    return lang === "ar"
                      ? `عرض ${start}–${end} من ${total} مادة`
                      : `Showing ${start}–${end} of ${total} subjects`;
                  })()}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={safePage === 1}
                    className={`rounded-md px-2 py-1 ${
                      safePage === 1
                        ? "cursor-not-allowed bg-slate-100 text-slate-400"
                        : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-100"
                    }`}
                    aria-label={lang === "ar" ? "الصفحة السابقة" : "Previous page"}
                  >
                    {lang === "ar" ? "السابق" : "Previous"}
                  </button>
                  <span>
                    {lang === "ar"
                      ? `صفحة ${safePage} من ${totalPages}`
                      : `Page ${safePage} of ${totalPages}`}
                  </span>
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={safePage === totalPages}
                    className={`rounded-md px-2 py-1 ${
                      safePage === totalPages
                        ? "cursor-not-allowed bg-slate-100 text-slate-400"
                        : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-100"
                    }`}
                    aria-label={lang === "ar" ? "الصفحة التالية" : "Next page"}
                  >
                    {lang === "ar" ? "التالي" : "Next"}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </section>
    </>
  );
}