// src/app/admin/dashboard/components/TeachersPanel.tsx
// ============================================================================
// TeachersPanel Component
// ----------------------------------------------------------------------------
// Responsibilities:
//  - Render the "Teachers" tab content.
//  - Show "Add new teacher" form (name, bio, gender, photo, active).
//  - Show "Assign teacher to subject" UI with teacher/subject dropdowns.
//  - Display loading / error / success states for assignment.
//  - List all teachers with avatar, bio, subjects, and active status pill.
//  - Trigger loadAssignSubjects() on mount to fetch subjects for assignment.
//  - Actions column to Activate / Deactivate teachers using toggleTeacherActive()
//    with per-row loading and error feedback.
//  - Local search / filter / sort UI for teachers:
//      • search by name
//      • filter by subject
//      • filter by active status
//      • sort by name or status
//  - Client-side pagination over filtered & sorted teachers so the list
//    doesn’t grow beyond the screen (page size = 10 by default).
// ============================================================================

import type React from "react";
import { useEffect, useMemo, useState, useCallback } from "react";
import Image from "next/image";
import type { Lang, SubjectAdminRow, TeacherAdminRow } from "../adminTypes";
import { safeBool } from "../adminTypes";
import type { LangTexts } from "../adminTexts";

export type TeachersPanelProps = {
  lang: Lang;
  t: LangTexts;

  // Teachers list & loading/error
  teachers: TeacherAdminRow[];
  teachersLoading: boolean;
  teachersError: string | null;
  loadTeachers: () => Promise<void>; // NEW: For data refresh

  // Create teacher form state
  newTeacherName: string;
  newTeacherBio: string;
  newTeacherGender: string;
  newTeacherPhotoUrl: string;
  newTeacherActive: boolean;
  creatingTeacher: boolean;
  creatingTeacherError: string | null; // NEW: Error state for create
  teacherMessage: string | null;
  setNewTeacherName: (v: string) => void;
  setNewTeacherBio: (v: string) => void;
  setNewTeacherGender: (v: string) => void;
  setNewTeacherPhotoUrl: (v: string) => void;
  setNewTeacherActive: (v: boolean) => void;
  handleCreateTeacher: (e: React.FormEvent) => void;

  // Assign teacher to subject
  subjects: SubjectAdminRow[];
  assignTeacherId: string;
  assignSubjectId: string;
  assignPriority: string;
  assigning: boolean;
  assignError: string | null;
  assignSuccess: string | null;
  assignSubjectsLoading: boolean;
  assignSubjectsError: string | null;
  setAssignTeacherId: (v: string) => void;
  setAssignSubjectId: (v: string) => void;
  setAssignPriority: (v: string) => void;
  handleAssignTeacher: (e: React.FormEvent) => void;
  loadAssignSubjects: () => Promise<void>;

  // Teacher status toggle
  updatingTeacherId: number | null;
  updatingTeacherError: string | null; // NEW: Error for toggle action
  toggleTeacherActive: (id: number, currentActive: boolean) => Promise<void>;
};

// Local sort types
type TeacherSortKey = "name" | "status";
type SortDir = "asc" | "desc";

// Page size for teachers list
const PAGE_SIZE = 10;

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

export function TeachersPanel(props: TeachersPanelProps) {
  const {
    lang,
    t,
    teachers,
    teachersLoading,
    teachersError,
    loadTeachers, // NEW

    // create teacher
    newTeacherName,
    newTeacherBio,
    newTeacherGender,
    newTeacherPhotoUrl,
    newTeacherActive,
    creatingTeacher,
    creatingTeacherError, // NEW
    teacherMessage,
    setNewTeacherName,
    setNewTeacherBio,
    setNewTeacherGender,
    setNewTeacherPhotoUrl,
    setNewTeacherActive,
    handleCreateTeacher,

    // assign teacher
    subjects,
    assignTeacherId,
    assignSubjectId,
    assignPriority,
    assigning,
    assignError,
    assignSuccess,
    assignSubjectsLoading,
    assignSubjectsError,
    setAssignTeacherId,
    setAssignSubjectId,
    setAssignPriority,
    handleAssignTeacher,
    loadAssignSubjects,

    // status toggle
    updatingTeacherId,
    updatingTeacherError, // NEW
    toggleTeacherActive,
  } = props;

  const dir = lang === "ar" ? "rtl" : "ltr";

  // -------------------------------------------------------------------------
  // Local UI state: search / filter / sort / pagination
  // -------------------------------------------------------------------------
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">(
    "all"
  );
  const [subjectFilter, setSubjectFilter] = useState<string>("all");
  const [sortKey, setSortKey] = useState<TeacherSortKey>("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [page, setPage] = useState(1);

  // Debounced search term for better performance
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Load subjects for assignment when the panel mounts
  useEffect(() => {
    void loadAssignSubjects();
  }, [loadAssignSubjects]);

  // Helper: display label for subject in current language
  const subjectLabel = useCallback((sub: SubjectAdminRow): string =>
    lang === "ar" ? sub.name_ar : sub.name_en, [lang]);

  // -------------------------------------------------------------------------
  // Derived list: apply search, filters, sort
  // -------------------------------------------------------------------------
  const filteredAndSortedTeachers = useMemo(() => {
    const term = debouncedSearchTerm.trim().toLowerCase();

    const result = teachers
      .filter((teacher) => {
        // Search by name
        if (term) {
          const nameLc = teacher.name.toLowerCase();
          if (!nameLc.includes(term)) return false;
        }

        // Filter by status
        const active = safeBool(teacher.is_active);
        if (statusFilter === "active" && !active) return false;
        if (statusFilter === "inactive" && active) return false;

        // Filter by subject (string match in teacher.subjects)
        if (subjectFilter !== "all") {
          const teacherSubjects = (teacher.subjects || "").toLowerCase();
          const selectedSubjectLabel = subjectFilter.toLowerCase();
          if (!teacherSubjects.includes(selectedSubjectLabel)) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortKey === "name") {
          const aName = a.name.toLowerCase();
          const bName = b.name.toLowerCase();
          if (aName < bName) return sortDir === "asc" ? -1 : 1;
          if (aName > bName) return sortDir === "asc" ? 1 : -1;
          return 0;
        }

        // sortKey === "status"
        const aActive = safeBool(a.is_active);
        const bActive = safeBool(b.is_active);

        if (aActive === bActive) return 0;

        // "asc" => inactive first, "desc" => active first
        if (sortDir === "asc") {
          return aActive ? 1 : -1;
        }
        return aActive ? -1 : 1;
      });

    return result;
  }, [teachers, debouncedSearchTerm, statusFilter, subjectFilter, sortKey, sortDir]);

  // Pagination: total pages
  const totalPages = Math.max(
    1,
    Math.ceil(filteredAndSortedTeachers.length / PAGE_SIZE)
  );

  // Clamp page safely without mutating in an effect
  const safePage = useMemo(() => {
    if (page < 1) return 1;
    if (page > totalPages) return totalPages;
    return page;
  }, [page, totalPages]);

  // Slice for current page
  const pagedTeachers = useMemo(() => {
    const start = (safePage - 1) * PAGE_SIZE;
    const end = start + PAGE_SIZE;
    return filteredAndSortedTeachers.slice(start, end);
  }, [filteredAndSortedTeachers, safePage]);

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

  const handleSubjectFilterChange = (value: string) => {
    setSubjectFilter(value);
    setPage(1);
  };

  const handleSortChange = (value: string) => {
    const [key, dir] = value.split("-");
    setSortKey(key as TeacherSortKey);
    setSortDir(dir as SortDir);
    setPage(1);
  };

  const clearFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setSubjectFilter("all");
    setSortKey("name");
    setSortDir("asc");
    setPage(1);
  };

  // Enhanced toggle handler with confirmation and error handling
  const handleToggleActive = async (teacherId: number, currentActive: boolean, teacherName: string) => {
    if (!window.confirm(
      lang === "ar"
        ? `هل أنت متأكد أنك تريد ${currentActive ? "تعطيل" : "تفعيل"} ${teacherName}؟`
        : `Are you sure you want to ${currentActive ? "deactivate" : "activate"} ${teacherName}?`
    )) {
      return;
    }

    try {
      await toggleTeacherActive(teacherId, currentActive);
      // Refresh teachers list after successful toggle
      await loadTeachers();
    } catch (error) {
      // Error is handled by parent component via updatingTeacherError
      console.error("Failed to toggle teacher status:", error);
    }
  };

  // Convenience: can we submit the assignment form?
  const canSubmitAssignment =
    !!assignTeacherId && !!assignSubjectId && !assigning;

  // Convenience: can we submit the create teacher form?
  const canCreateTeacher = newTeacherName.trim().length > 0 && !creatingTeacher;

  // Get unique subjects for filter dropdown
  const uniqueSubjects = useMemo(() => {
    const allSubjects = teachers.flatMap(teacher => 
      teacher.subjects ? teacher.subjects.split(',').map(s => s.trim()) : []
    );
    return Array.from(new Set(allSubjects)).filter(Boolean);
  }, [teachers]);

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------
  return (
    <section
      className="rounded-2xl bg-white border border-slate-100 shadow-sm p-5 space-y-6"
      dir={dir}
    >
      <header className="flex flex-col gap-2 md:flex-row md:items-baseline md:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">
            {t.teachersTitle}
          </h2>
          <p className="text-xs text-slate-500">{t.teachersDesc}</p>
        </div>
        <div className="text-xs text-slate-500">
          {lang === "ar" ? "إجمالي المعلمين:" : "Total teachers:"} {teachers.length}
        </div>
      </header>

      {/* Global error for teacher actions */}
      {updatingTeacherError && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
          {updatingTeacherError}
        </div>
      )}

      {/* Add teacher + Assign panels side-by-side on desktop */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Create teacher */}
        <form
          onSubmit={handleCreateTeacher}
          className="rounded-xl bg-slate-50 p-4 space-y-3"
        >
          <h3 className="text-sm font-semibold text-slate-800 mb-1">
            {t.teacherCreateTitle}
          </h3>
          <div className="space-y-2">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                {t.teacherCreateName} <span className="text-red-500">*</span>
              </label>
              <input
                value={newTeacherName}
                onChange={(e) => setNewTeacherName(e.target.value)}
                className="w-full rounded-md border border-slate-200 bg-white px-2 py-1.5 text-xs shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                {t.teacherCreateBio}
              </label>
              <textarea
                value={newTeacherBio}
                onChange={(e) => setNewTeacherBio(e.target.value)}
                className="w-full rounded-md border border-slate-200 bg-white px-2 py-1.5 text-xs shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                rows={3}
                maxLength={500}
              />
              <div className="text-[10px] text-slate-400 text-right mt-1">
                {newTeacherBio.length}/500
              </div>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  {t.teacherCreateGender}
                </label>
                <select
                  value={newTeacherGender}
                  onChange={(e) => setNewTeacherGender(e.target.value)}
                  className="w-full rounded-md border border-slate-200 bg-white px-2 py-1.5 text-xs shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                >
                  <option value="">{lang === "ar" ? "اختر..." : "Select..."}</option>
                  <option value="male">{lang === "ar" ? "ذكر" : "Male"}</option>
                  <option value="female">{lang === "ar" ? "أنثى" : "Female"}</option>
                  <option value="other">{lang === "ar" ? "أخرى" : "Other"}</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  {t.teacherCreatePhotoUrl}
                </label>
                <input
                  type="url"
                  value={newTeacherPhotoUrl}
                  onChange={(e) => setNewTeacherPhotoUrl(e.target.value)}
                  className="w-full rounded-md border border-slate-200 bg-white px-2 py-1.5 text-xs shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  placeholder="https://example.com/photo.jpg"
                />
              </div>
            </div>
            <label className="inline-flex items-center gap-1 text-xs text-slate-700">
              <input
                type="checkbox"
                checked={newTeacherActive}
                onChange={(e) => setNewTeacherActive(e.target.checked)}
              />
              {t.teacherCreateIsActive}
            </label>
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={!canCreateTeacher}
              className={`rounded-md px-4 py-1.5 text-xs font-medium text-white ${
                !canCreateTeacher
                  ? "bg-emerald-200 cursor-not-allowed"
                  : "bg-emerald-500 hover:bg-emerald-600"
              }`}
            >
              {creatingTeacher
                ? t.teacherCreateSubmitting
                : t.teacherCreateSubmit}
            </button>
          </div>
          {creatingTeacherError && (
            <p className="mt-1 text-xs text-red-600">{creatingTeacherError}</p>
          )}
          {teacherMessage && (
            <p className="mt-1 text-xs text-emerald-600">{teacherMessage}</p>
          )}
        </form>

        {/* Assign teacher to subject */}
        <form
          onSubmit={handleAssignTeacher}
          className="rounded-xl bg-slate-50 p-4 space-y-3"
        >
          <h3 className="text-sm font-semibold text-slate-800 mb-1">
            {t.teachersAssignTitle}
          </h3>
          <div className="space-y-2">
            {/* Teacher dropdown */}
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                {t.teachersAssignSelectTeacher} <span className="text-red-500">*</span>
              </label>
              {teachersLoading && teachers.length === 0 ? (
                <p className="text-xs text-slate-500">
                  {lang === "ar" ? "جاري تحميل المعلمين..." : "Loading teachers…"}
                </p>
              ) : (
                <select
                  value={assignTeacherId}
                  onChange={(e) => setAssignTeacherId(e.target.value)}
                  className="w-full rounded-md border border-slate-200 bg-white px-2 py-1.5 text-xs shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  required
                >
                  <option value="">
                    {lang === "ar" ? "اختر..." : "Select…"}
                  </option>
                  {teachers.map((teacher) => (
                    <option key={teacher.id} value={teacher.id}>
                      {teacher.name} {safeBool(teacher.is_active) ? "" : `(${t.teachersStatusInactive})`}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Subject dropdown */}
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                {t.teachersAssignSelectSubject} <span className="text-red-500">*</span>
              </label>
              {assignSubjectsLoading ? (
                <p className="text-xs text-slate-500">
                  {t.teachersSubjectsLoading}
                </p>
              ) : assignSubjectsError ? (
                <p className="text-xs text-red-600">
                  {t.teachersSubjectsError}
                </p>
              ) : (
                <select
                  value={assignSubjectId}
                  onChange={(e) => setAssignSubjectId(e.target.value)}
                  className="w-full rounded-md border border-slate-200 bg-white px-2 py-1.5 text-xs shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  required
                >
                  <option value="">
                    {lang === "ar" ? "اختر..." : "Select…"}
                  </option>
                  {subjects.map((sub) => (
                    <option key={sub.id} value={sub.id}>
                      {subjectLabel(sub)} {safeBool(sub.is_active) ? "" : `(${t.subjectsStatusInactive})`}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Priority */}
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                {t.teachersAssignPriority}
              </label>
              <input
                type="number"
                min="0"
                max="10"
                value={assignPriority}
                onChange={(e) => {
                  const value = parseInt(e.target.value);
                  if (value >= 0 && value <= 10) {
                    setAssignPriority(e.target.value);
                  }
                }}
                className="w-32 rounded-md border border-slate-200 bg-white px-2 py-1.5 text-xs shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                placeholder="0"
              />
              <p className="text-[10px] text-slate-500 mt-1">
                {lang === "ar" 
                  ? "0 = أقل أولوية، 10 = أعلى أولوية"
                  : "0 = lowest priority, 10 = highest priority"}
              </p>
            </div>

            <p className="text-[11px] text-slate-500">
              {t.teachersAssignHint}
            </p>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={!canSubmitAssignment}
              className={`rounded-md px-4 py-1.5 text-xs font-medium text-white ${
                !canSubmitAssignment
                  ? "bg-emerald-200 cursor-not-allowed"
                  : "bg-emerald-500 hover:bg-emerald-600"
              }`}
            >
              {assigning ? t.teachersAssignAssigning : t.teachersAssignButton}
            </button>
          </div>
          {assignError && (
            <p className="mt-1 text-xs text-red-600">{assignError}</p>
          )}
          {assignSuccess && (
            <p className="mt-1 text-xs text-emerald-600">{assignSuccess}</p>
          )}
        </form>
      </div>

      {/* Toolbar: search + filters + sort */}
      <div className="flex flex-col gap-2 rounded-xl border border-slate-100 bg-slate-50 px-3 py-3 md:flex-row md:items-center md:justify-between">
        {/* Search */}
        <div className="flex-1">
          <label className="block text-[11px] font-medium text-slate-600 mb-1">
            {lang === "ar" ? "بحث بالاسم" : "Search by name"}
          </label>
          <div className="relative">
            <input
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder={
                lang === "ar" ? "اكتب اسم المعلم..." : "Type teacher name..."
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
              <option value="active">{t.teachersStatusActive}</option>
              <option value="inactive">{t.teachersStatusInactive}</option>
            </select>
          </div>

          {/* Subject filter */}
          <div>
            <label className="block text-[11px] font-medium text-slate-600 mb-1">
              {lang === "ar" ? "المادة" : "Subject"}
            </label>
            <select
              value={subjectFilter}
              onChange={(e) => handleSubjectFilterChange(e.target.value)}
              className="rounded-md border border-slate-200 bg-white px-2 py-1.5 text-xs shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <option value="all">
                {lang === "ar" ? "كل المواد" : "All subjects"}
              </option>
              {uniqueSubjects.map((subject) => (
                <option key={subject} value={subject}>
                  {subject}
                </option>
              ))}
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
              <option value="name-asc">
                {lang === "ar" ? "الاسم (أ-ي)" : "Name (A–Z)"}
              </option>
              <option value="name-desc">
                {lang === "ar" ? "الاسم (ي-أ)" : "Name (Z–A)"}
              </option>
              <option value="status-desc">
                {lang === "ar"
                  ? "الحالة (فعّال أولاً)"
                  : "Status (Active first)"}
              </option>
              <option value="status-asc">
                {lang === "ar"
                  ? "الحالة (غير فعّال أولاً)"
                  : "Status (Inactive first)"}
              </option>
            </select>
          </div>

          {/* Clear filters button */}
          {(searchTerm || statusFilter !== "all" || subjectFilter !== "all") && (
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

      {/* Teachers table + pagination */}
      <div className="rounded-xl border border-slate-100 overflow-hidden">
        {teachersLoading ? (
          <div className="p-4 text-sm text-slate-500 text-center">
            <div className="animate-pulse">
              <div className="h-4 bg-slate-200 rounded w-1/4 mx-auto mb-2"></div>
              <div className="h-3 bg-slate-200 rounded w-1/3 mx-auto"></div>
            </div>
          </div>
        ) : teachersError ? (
          <div className="p-4 text-sm text-red-600 text-center">
            {t.teachersError}: {teachersError}
          </div>
        ) : filteredAndSortedTeachers.length === 0 ? (
          <div className="p-4 text-sm text-slate-500 text-center">
            {searchTerm || subjectFilter !== "all" || statusFilter !== "all"
              ? lang === "ar"
                ? "لا توجد نتائج مطابقة."
                : "No teachers match your filters."
              : t.teachersNone}
          </div>
        ) : (
          <>
            <table className="min-w-full divide-y divide-slate-100 text-xs">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-3 py-2 text-left font-semibold text-slate-600">
                    {t.teachersTableName}
                  </th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-600 hidden md:table-cell">
                    {t.teachersTableSubjects}
                  </th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-600">
                    {t.teachersTableStatus}
                  </th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-600">
                    {lang === "ar" ? "إجراءات" : "Actions"}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {pagedTeachers.map((teacher) => {
                  const isActive = safeBool(teacher.is_active);
                  const isUpdating = updatingTeacherId === teacher.id;

                  return (
                    <tr key={teacher.id}>
                      <td className="px-3 py-2 align-top">
                        <div className="flex items-center gap-2">
                          {teacher.photo_url ? (
                            <div className="relative">
                              <Image
                                src={teacher.photo_url}
                                alt={teacher.name}
                                width={32}
                                height={32}
                                className="h-8 w-8 rounded-full object-cover border border-slate-200"
                                onError={(e) => {
                                  // Fallback if image fails to load
                                  const target = e.target as HTMLImageElement;
                                  target.style.display = 'none';
                                  target.nextElementSibling?.classList.remove('hidden');
                                }}
                              />
                              <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-[10px] text-slate-500">
                                {teacher.name.charAt(0).toUpperCase()}
                              </div>
                            </div>
                          ) : (
                            <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-[10px] text-slate-500">
                              {teacher.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <div className="text-xs font-medium text-slate-900">
                              {teacher.name}
                            </div>
                            {teacher.gender && (
                              <div className="text-[10px] text-slate-500">
                                {teacher.gender}
                              </div>
                            )}
                            {teacher.bio_short && (
                              <div className="text-[10px] text-slate-500 line-clamp-2 max-w-xs">
                                {teacher.bio_short}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-2 align-top hidden md:table-cell">
                        <div className="text-[11px] text-slate-600 whitespace-pre-wrap">
                          {teacher.subjects ? (
                            <div className="flex flex-wrap gap-1">
                              {teacher.subjects.split(',').map((subject, idx) => (
                                <span key={idx} className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[10px]">
                                  {subject.trim()}
                                </span>
                              ))}
                            </div>
                          ) : (
                            "—"
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-2 align-top">
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium ${
                            isActive
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                              : "bg-slate-50 text-slate-500 border border-slate-100"
                          }`}
                        >
                          {isActive
                            ? t.teachersStatusActive
                            : t.teachersStatusInactive}
                        </span>
                      </td>
                      <td className="px-3 py-2 align-top">
                        <button
                          type="button"
                          disabled={isUpdating}
                          onClick={() => handleToggleActive(teacher.id, isActive, teacher.name)}
                          className={`rounded-md px-2 py-1 text-[11px] font-medium text-white ${
                            isUpdating
                              ? "bg-slate-300 cursor-not-allowed"
                              : isActive
                              ? "bg-red-500 hover:bg-red-600"
                              : "bg-emerald-500 hover:bg-emerald-600"
                          }`}
                          aria-label={isActive 
                            ? (lang === "ar" ? `تعطيل ${teacher.name}` : `Deactivate ${teacher.name}`)
                            : (lang === "ar" ? `تفعيل ${teacher.name}` : `Activate ${teacher.name}`)
                          }
                        >
                          {isUpdating
                            ? lang === "ar"
                              ? "جاري التحديث..."
                              : "Updating..."
                            : isActive
                            ? lang === "ar"
                              ? "تعطيل"
                              : "Deactivate"
                            : lang === "ar"
                            ? "تفعيل"
                            : "Activate"}
                        </button>
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
                  const total = filteredAndSortedTeachers.length;
                  const start = (safePage - 1) * PAGE_SIZE + 1;
                  const end = Math.min(safePage * PAGE_SIZE, total);

                  return lang === "ar"
                    ? `عرض ${start}–${end} من ${total} معلم`
                    : `Showing ${start}–${end} of ${total} teachers`;
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
  );
}