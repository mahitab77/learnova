// src/app/admin/dashboard/components/SchedulesPanel.tsx
"use client";

import { useMemo, useState } from "react";
import type { Lang } from "../adminTypes";
import type { LangTexts } from "../adminTexts";

/**
 * Matches GET /admin/schedules response:
 * - teacher_id is teachers.id
 * - teacher_name is teachers.name (aliased in SQL)
 */
export type TeacherScheduleRow = {
  id: number;
  teacher_id: number;
  teacher_name: string;
  weekday: number; // 0..6
  start_time: string; // "HH:MM"
  end_time: string; // "HH:MM"
  is_group: 0 | 1 | boolean;
  max_students: number | null;
  created_at: string;
};

/**
 * Optional helper type for a teacher dropdown.
 * GET /admin/teachers currently returns:
 * { id, name, subjects, ... }
 */
export type TeacherOption = {
  id: number;
  name: string;
  subjects?: string | null;
};

export type SchedulesPanelProps = {
  lang: Lang;
  t: LangTexts;

  schedules: TeacherScheduleRow[];
  schedulesLoading: boolean;
  schedulesError: string | null;

  onCreateSchedule: (data: {
    teacher_id: number;
    weekday: number;
    start_time: string;
    end_time: string;
    is_group?: boolean;
    max_students?: number | null;
  }) => Promise<void>;

  onUpdateSchedule: (
    id: number,
    data: Partial<{
      weekday: number;
      start_time: string;
      end_time: string;
      is_group: boolean;
      max_students: number | null;
    }>
  ) => Promise<void>;

  onDeleteSchedule: (id: number) => Promise<void>;

  /**
   * Optional: pass teachers list from admin dashboard.
   * If provided, create form uses a dropdown instead of raw numeric input.
   */
  teachers?: TeacherOption[];
};

const weekdays = [
  { id: 0, name_en: "Sunday", name_ar: "الأحد" },
  { id: 1, name_en: "Monday", name_ar: "الإثنين" },
  { id: 2, name_en: "Tuesday", name_ar: "الثلاثاء" },
  { id: 3, name_en: "Wednesday", name_ar: "الأربعاء" },
  { id: 4, name_en: "Thursday", name_ar: "الخميس" },
  { id: 5, name_en: "Friday", name_ar: "الجمعة" },
  { id: 6, name_en: "Saturday", name_ar: "السبت" },
];

const normalizeIsGroup = (isGroup: 0 | 1 | boolean): boolean =>
  isGroup === 1 || isGroup === true;

/**
 * Basic "HH:MM" -> minutes since 00:00
 * Returns null if invalid.
 */
function timeToMinutes(hhmm: string): number | null {
  if (!hhmm || typeof hhmm !== "string") return null;
  const m = /^(\d{2}):(\d{2})$/.exec(hhmm.trim());
  if (!m) return null;

  const hh = Number(m[1]);
  const mm = Number(m[2]);
  if (!Number.isFinite(hh) || !Number.isFinite(mm)) return null;
  if (hh < 0 || hh > 23) return null;
  if (mm < 0 || mm > 59) return null;

  return hh * 60 + mm;
}

function isValidWeekday(w: number): boolean {
  return Number.isFinite(w) && w >= 0 && w <= 6;
}

export function SchedulesPanel({
  lang,
  t,
  schedules,
  schedulesLoading,
  schedulesError,
  onCreateSchedule,
  onUpdateSchedule,
  onDeleteSchedule,
  teachers,
}: SchedulesPanelProps) {
  const dir = lang === "ar" ? "rtl" : "ltr";

  // UI state
  const [selectedDay, setSelectedDay] = useState<number | "all">("all");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<TeacherScheduleRow | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [sessionType, setSessionType] = useState<"all" | "group" | "individual">("all");
  const [sortBy, setSortBy] = useState<"time" | "teacher" | "created">("time");

  // Action state (prevent double submits + show errors nicely)
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Delete confirm modal state
  const [pendingDelete, setPendingDelete] = useState<TeacherScheduleRow | null>(null);

  // Create form state
  const [newSchedule, setNewSchedule] = useState({
    teacher_id: "", // kept as string for <select>/<input>
    weekday: 0,
    start_time: "09:00",
    end_time: "10:00",
    is_group: false,
    max_students: "",
  });

  // Edit form state
  const [editForm, setEditForm] = useState({
    weekday: 0,
    start_time: "",
    end_time: "",
    is_group: false,
    max_students: "",
  });

  // -----------------------------
  // Filtering + sorting
  // -----------------------------
  const filteredSchedules = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();

    return schedules.filter((sch) => {
      // Day
      const dayMatch = selectedDay === "all" || sch.weekday === selectedDay;

      // Search: teacher name OR teacher id
      const teacherName = String(sch.teacher_name || "").toLowerCase();
      const teacherIdStr = String(sch.teacher_id);

      const searchMatch =
        q === "" || teacherName.includes(q) || teacherIdStr.includes(q);

      // Session type
      const isGroup = normalizeIsGroup(sch.is_group);
      const sessionMatch =
        sessionType === "all" ||
        (sessionType === "group" && isGroup) ||
        (sessionType === "individual" && !isGroup);

      return dayMatch && searchMatch && sessionMatch;
    });
  }, [schedules, selectedDay, searchTerm, sessionType]);

  const sortedSchedules = useMemo(() => {
    const arr = [...filteredSchedules];
    arr.sort((a, b) => {
      switch (sortBy) {
        case "teacher":
          return a.teacher_name.localeCompare(b.teacher_name);
        case "created":
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case "time":
        default:
          return a.start_time.localeCompare(b.start_time);
      }
    });
    return arr;
  }, [filteredSchedules, sortBy]);

  const daysToRender = useMemo(() => {
    if (selectedDay === "all") return weekdays;
    return weekdays.filter((d) => d.id === selectedDay);
  }, [selectedDay]);

  const schedulesByDay = useMemo(() => {
    return daysToRender.map((day) => ({
      ...day,
      schedules: sortedSchedules.filter((s) => s.weekday === day.id),
    }));
  }, [daysToRender, sortedSchedules]);

  // -----------------------------
  // Form helpers
  // -----------------------------
  function resetCreateForm() {
    setNewSchedule({
      teacher_id: "",
      weekday: 0,
      start_time: "09:00",
      end_time: "10:00",
      is_group: false,
      max_students: "",
    });
  }

  function resetEditForm() {
    setEditForm({
      weekday: 0,
      start_time: "",
      end_time: "",
      is_group: false,
      max_students: "",
    });
  }

  function validateCommon({
    weekday,
    start_time,
    end_time,
    is_group,
    max_students,
  }: {
    weekday: number;
    start_time: string;
    end_time: string;
    is_group: boolean;
    max_students: string;
  }): string | null {
    if (!isValidWeekday(weekday)) return lang === "ar" ? "اليوم غير صالح." : "Invalid weekday.";

    const sMin = timeToMinutes(start_time);
    const eMin = timeToMinutes(end_time);

    if (sMin == null || eMin == null) {
      return lang === "ar" ? "الوقت غير صالح." : "Invalid time format.";
    }

    if (sMin >= eMin) {
      return lang === "ar"
        ? "وقت البداية يجب أن يكون قبل وقت النهاية."
        : "Start time must be before end time.";
    }

    if (is_group) {
      // Require max students for group sessions (recommended)
      if (!max_students || Number(max_students) <= 0) {
        return lang === "ar"
          ? "جلسة جماعية تتطلب عدد طلاب أقصى."
          : "Group sessions require a max students value.";
      }
    }

    return null;
  }

  // -----------------------------
  // Actions
  // -----------------------------
  const handleCreateSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const teacherIdNum = Number(newSchedule.teacher_id);
    if (!Number.isFinite(teacherIdNum) || teacherIdNum <= 0) {
      setFormError(lang === "ar" ? "اختر معلماً صحيحاً." : "Please select a valid teacher.");
      return;
    }

    const v = validateCommon({
      weekday: newSchedule.weekday,
      start_time: newSchedule.start_time,
      end_time: newSchedule.end_time,
      is_group: newSchedule.is_group,
      max_students: newSchedule.max_students,
    });
    if (v) {
      setFormError(v);
      return;
    }

    setBusy(true);
    try {
      await onCreateSchedule({
        teacher_id: teacherIdNum,
        weekday: newSchedule.weekday,
        start_time: newSchedule.start_time,
        end_time: newSchedule.end_time,
        is_group: newSchedule.is_group,
        max_students: newSchedule.is_group
          ? Number(newSchedule.max_students)
          : newSchedule.max_students
          ? Number(newSchedule.max_students)
          : null, // keep optional
      });

      setShowCreateForm(false);
      resetCreateForm();
    } catch (err) {
      console.log(err);
      setFormError(
        lang === "ar"
          ? "حدث خطأ أثناء إنشاء الجدول."
          : "Failed to create schedule."
      );
    } finally {
      setBusy(false);
    }
  };

  const handleEditSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSchedule) return;

    setFormError(null);

    const v = validateCommon({
      weekday: editForm.weekday,
      start_time: editForm.start_time,
      end_time: editForm.end_time,
      is_group: editForm.is_group,
      max_students: editForm.max_students,
    });
    if (v) {
      setFormError(v);
      return;
    }

    setBusy(true);
    try {
      await onUpdateSchedule(editingSchedule.id, {
        weekday: editForm.weekday,
        start_time: editForm.start_time,
        end_time: editForm.end_time,
        is_group: editForm.is_group,
        max_students: editForm.max_students ? Number(editForm.max_students) : null,
      });

      setEditingSchedule(null);
      resetEditForm();
    } catch (err) {
        console.log(err);
      setFormError(lang === "ar" ? "فشل تحديث الجدول." : "Failed to update schedule.");
    } finally {
      setBusy(false);
    }
  };

  const startEdit = (schedule: TeacherScheduleRow) => {
    setFormError(null);
    setShowCreateForm(false);

    setEditingSchedule(schedule);
    setEditForm({
      weekday: schedule.weekday,
      start_time: schedule.start_time,
      end_time: schedule.end_time,
      is_group: normalizeIsGroup(schedule.is_group),
      max_students: schedule.max_students?.toString() || "",
    });
  };

  const cancelEdit = () => {
    setEditingSchedule(null);
    resetEditForm();
    setFormError(null);
  };

  const requestDelete = (schedule: TeacherScheduleRow) => {
    setPendingDelete(schedule);
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    setFormError(null);

    setBusy(true);
    try {
      await onDeleteSchedule(pendingDelete.id);
      setPendingDelete(null);
    } catch (err) {
        console.log(err);
      setFormError(lang === "ar" ? "فشل حذف الجدول." : "Failed to delete schedule.");
    } finally {
      setBusy(false);
    }
  };

  // -----------------------------
  // Loading
  // -----------------------------
  if (schedulesLoading) {
    return (
      <section className="rounded-2xl bg-white border border-slate-100 shadow-sm p-6" dir={dir}>
        <div className="animate-pulse">
          <div className="h-6 bg-slate-200 rounded w-1/3 mb-4" />
          <div className="space-y-4">
            {[...Array(7)].map((_, i) => (
              <div key={i} className="bg-slate-200 h-28 rounded-lg" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  // -----------------------------
  // Render
  // -----------------------------
  return (
    <section className="rounded-2xl bg-white border border-slate-100 shadow-sm p-6 space-y-6" dir={dir}>
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">{t.schedulesTitle}</h2>
          <p className="text-sm text-slate-500 mt-1">{t.schedulesDesc}</p>
        </div>

        <button
          onClick={() => {
            setFormError(null);
            setEditingSchedule(null);
            resetEditForm();
            setShowCreateForm((v) => !v);
          }}
          className="bg-emerald-500 text-white px-4 py-2 rounded-md text-sm hover:bg-emerald-600 disabled:opacity-60"
          disabled={busy}
        >
          {showCreateForm ? (t.cancel || "Cancel") : t.schedulesCreateNew}
        </button>
      </header>

      {schedulesError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700 text-sm">{schedulesError}</p>
        </div>
      )}

      {formError && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <p className="text-amber-800 text-sm">{formError}</p>
        </div>
      )}

      {/* Search / Filter / Sort */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            {t.search || (lang === "ar" ? "بحث" : "Search")}
          </label>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={lang === "ar" ? "ابحث باسم المعلم أو ID..." : "Search by teacher name or ID..."}
            className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            {t.schedulesDay}
          </label>
          <select
            value={selectedDay}
            onChange={(e) => {
              const v = e.target.value;
              setSelectedDay(v === "all" ? "all" : Number(v));
            }}
            className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm"
          >
            <option value="all">{t.schedulesAllDays}</option>
            {weekdays.map((day) => (
              <option key={day.id} value={day.id}>
                {lang === "ar" ? day.name_ar : day.name_en}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            {t.schedulesSessionType || (lang === "ar" ? "نوع الحصة" : "Session Type")}
          </label>
          <select
            value={sessionType}
            onChange={(e) => setSessionType(e.target.value as "all" | "group" | "individual")}
            className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm"
          >
            <option value="all">{lang === "ar" ? "الكل" : "All"}</option>
            <option value="group">{t.schedulesGroup || (lang === "ar" ? "جماعي" : "Group")}</option>
            <option value="individual">{lang === "ar" ? "فردي" : "Individual"}</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            {t.sort || (lang === "ar" ? "ترتيب" : "Sort By")}
          </label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as "time" | "teacher" | "created")}
            className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm"
          >
            <option value="time">{lang === "ar" ? "الوقت" : "Time"}</option>
            <option value="teacher">{lang === "ar" ? "المعلم" : "Teacher"}</option>
            <option value="created">{lang === "ar" ? "الأحدث" : "Newest"}</option>
          </select>
        </div>
      </div>

      {/* Create */}
      {showCreateForm && !editingSchedule && (
        <div className="border border-slate-200 rounded-lg p-4 bg-slate-50">
          <h3 className="font-semibold text-slate-900 mb-4">{t.schedulesCreateNew}</h3>

          <form onSubmit={handleCreateSchedule} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Teacher */}
            <div className="lg:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">
                {t.schedulesTeacher}
              </label>

              {Array.isArray(teachers) && teachers.length > 0 ? (
                <select
                  value={newSchedule.teacher_id}
                  onChange={(e) => setNewSchedule((prev) => ({ ...prev, teacher_id: e.target.value }))}
                  className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm"
                  required
                >
                  <option value="">{lang === "ar" ? "اختر معلماً..." : "Select a teacher..."}</option>
                  {teachers.map((tr) => (
                    <option key={tr.id} value={String(tr.id)}>
                      #{tr.id} — {tr.name}
                      {tr.subjects ? ` (${tr.subjects})` : ""}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="number"
                  value={newSchedule.teacher_id}
                  onChange={(e) => setNewSchedule((prev) => ({ ...prev, teacher_id: e.target.value }))}
                  className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm"
                  placeholder={lang === "ar" ? "Teacher ID" : "Teacher ID"}
                  required
                />
              )}
            </div>

            {/* Day */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                {t.schedulesDay}
              </label>
              <select
                value={newSchedule.weekday}
                onChange={(e) => setNewSchedule((prev) => ({ ...prev, weekday: Number(e.target.value) }))}
                className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm"
              >
                {weekdays.map((day) => (
                  <option key={day.id} value={day.id}>
                    {lang === "ar" ? day.name_ar : day.name_en}
                  </option>
                ))}
              </select>
            </div>

            {/* Times */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                {t.schedulesStartTime}
              </label>
              <input
                type="time"
                value={newSchedule.start_time}
                onChange={(e) => setNewSchedule((prev) => ({ ...prev, start_time: e.target.value }))}
                className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                {t.schedulesEndTime}
              </label>
              <input
                type="time"
                value={newSchedule.end_time}
                onChange={(e) => setNewSchedule((prev) => ({ ...prev, end_time: e.target.value }))}
                className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm"
                required
              />
            </div>

            {/* Group */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={newSchedule.is_group}
                onChange={(e) => setNewSchedule((prev) => ({ ...prev, is_group: e.target.checked }))}
                className="rounded border-slate-300"
              />
              <label className="text-sm text-slate-700">{t.schedulesGroupSession}</label>
            </div>

            {/* Max students */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                {t.schedulesMaxStudents}
              </label>
              <input
                type="number"
                value={newSchedule.max_students}
                onChange={(e) => setNewSchedule((prev) => ({ ...prev, max_students: e.target.value }))}
                className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm"
                placeholder={lang === "ar" ? "اختياري" : "Optional"}
                min={1}
              />
            </div>

            {/* Submit */}
            <div className="flex gap-2 items-end">
              <button
                type="submit"
                className="bg-emerald-500 text-white px-4 py-2 rounded-md text-sm hover:bg-emerald-600 disabled:opacity-60"
                disabled={busy}
              >
                {busy ? (lang === "ar" ? "جارٍ الحفظ..." : "Saving...") : t.schedulesCreate}
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowCreateForm(false);
                  setFormError(null);
                  resetCreateForm();
                }}
                className="bg-slate-500 text-white px-4 py-2 rounded-md text-sm hover:bg-slate-600 disabled:opacity-60"
                disabled={busy}
              >
                {t.cancel || "Cancel"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Edit */}
      {editingSchedule && (
        <div className="border border-blue-200 rounded-lg p-4 bg-blue-50">
          <h3 className="font-semibold text-slate-900 mb-4">
            {t.edit} {lang === "ar" ? "جدول" : "Schedule"} — {editingSchedule.teacher_name}
          </h3>

          <form onSubmit={handleEditSchedule} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                {t.schedulesDay}
              </label>
              <select
                value={editForm.weekday}
                onChange={(e) => setEditForm((prev) => ({ ...prev, weekday: Number(e.target.value) }))}
                className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm"
              >
                {weekdays.map((day) => (
                  <option key={day.id} value={day.id}>
                    {lang === "ar" ? day.name_ar : day.name_en}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                {t.schedulesStartTime}
              </label>
              <input
                type="time"
                value={editForm.start_time}
                onChange={(e) => setEditForm((prev) => ({ ...prev, start_time: e.target.value }))}
                className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                {t.schedulesEndTime}
              </label>
              <input
                type="time"
                value={editForm.end_time}
                onChange={(e) => setEditForm((prev) => ({ ...prev, end_time: e.target.value }))}
                className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm"
                required
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={editForm.is_group}
                onChange={(e) => setEditForm((prev) => ({ ...prev, is_group: e.target.checked }))}
                className="rounded border-slate-300"
              />
              <label className="text-sm text-slate-700">{t.schedulesGroupSession}</label>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                {t.schedulesMaxStudents}
              </label>
              <input
                type="number"
                value={editForm.max_students}
                onChange={(e) => setEditForm((prev) => ({ ...prev, max_students: e.target.value }))}
                className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm"
                placeholder={lang === "ar" ? "اختياري" : "Optional"}
                min={1}
              />
              <p className="text-xs text-slate-600 mt-1">
                {lang === "ar"
                  ? "ملاحظة: إذا أرسلت null لمسح max_students، الـ backend الحالي لن يمسحه بسبب COALESCE."
                  : "Note: clearing max_students to null won’t work with current backend COALESCE logic."}
              </p>
            </div>

            <div className="flex gap-2 items-end">
              <button
                type="submit"
                className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-700 disabled:opacity-60"
                disabled={busy}
              >
                {busy ? (lang === "ar" ? "جارٍ التحديث..." : "Updating...") : t.update}
              </button>

              <button
                type="button"
                onClick={cancelEdit}
                className="bg-slate-500 text-white px-4 py-2 rounded-md text-sm hover:bg-slate-600 disabled:opacity-60"
                disabled={busy}
              >
                {t.cancel || "Cancel"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* List */}
      <div className="space-y-4">
        {schedulesByDay.map((day) => (
          <div key={day.id} className="border border-slate-200 rounded-lg">
            <div className="bg-slate-50 px-4 py-3 border-b border-slate-200">
              <h3 className="font-semibold text-slate-900">
                {lang === "ar" ? day.name_ar : day.name_en}
                <span className="text-slate-500 text-sm font-normal ml-2">
                  ({day.schedules.length} {lang === "ar" ? "مواعيد" : "slots"})
                </span>
              </h3>
            </div>

            <div className="p-4">
              {day.schedules.length === 0 ? (
                <p className="text-slate-500 text-sm">{t.schedulesNoneForDay}</p>
              ) : (
                <div className="space-y-3">
                  {day.schedules.map((schedule) => {
                    const isGroup = normalizeIsGroup(schedule.is_group);

                    return (
                      <div
                        key={schedule.id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-3 bg-white border border-slate-100 rounded-lg"
                      >
                        <div className="flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h4 className="font-medium text-slate-900">
                              {schedule.teacher_name}
                            </h4>
                            <span className="text-xs text-slate-500">#{schedule.teacher_id}</span>
                          </div>

                          <p className="text-sm text-slate-700">
                            {schedule.start_time} – {schedule.end_time}
                          </p>

                          <div className="flex flex-wrap gap-2 mt-2">
                            {isGroup ? (
                              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                                {t.schedulesGroup || (lang === "ar" ? "جماعي" : "Group")}
                              </span>
                            ) : (
                              <span className="bg-emerald-100 text-emerald-800 px-2 py-1 rounded text-xs">
                                {lang === "ar" ? "فردي" : "Individual"}
                              </span>
                            )}

                            {schedule.max_students != null && (
                              <span className="bg-slate-100 text-slate-700 px-2 py-1 rounded text-xs">
                                {t.schedulesMaxStudents}: {schedule.max_students}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={() => startEdit(schedule)}
                            className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 disabled:opacity-60"
                            disabled={busy}
                          >
                            {t.edit}
                          </button>

                          <button
                            onClick={() => requestDelete(schedule)}
                            className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700 disabled:opacity-60"
                            disabled={busy}
                          >
                            {t.delete}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Delete confirmation modal */}
      {pendingDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/30" onClick={() => setPendingDelete(null)} />
          <div className="relative w-full max-w-md rounded-2xl bg-white shadow-xl border border-slate-200 p-5">
            <h4 className="text-base font-semibold text-slate-900">
              {lang === "ar" ? "تأكيد الحذف" : "Confirm Delete"}
            </h4>
            <p className="text-sm text-slate-600 mt-2">
              {lang === "ar"
                ? `هل أنت متأكد أنك تريد حذف هذا الموعد للمعلم "${pendingDelete.teacher_name}"؟`
                : `Are you sure you want to delete this slot for "${pendingDelete.teacher_name}"?`}
            </p>

            <div className="mt-4 flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => setPendingDelete(null)}
                className="px-4 py-2 rounded-md text-sm bg-slate-100 text-slate-800 hover:bg-slate-200 disabled:opacity-60"
                disabled={busy}
              >
                {t.cancel || "Cancel"}
              </button>

              <button
                type="button"
                onClick={confirmDelete}
                className="px-4 py-2 rounded-md text-sm bg-red-600 text-white hover:bg-red-700 disabled:opacity-60"
                disabled={busy}
              >
                {busy ? (lang === "ar" ? "جارٍ الحذف..." : "Deleting...") : (lang === "ar" ? "حذف" : "Delete")}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
