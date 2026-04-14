// src/app/teacher/dashboard/panels/TeacherExceptionsPanel.tsx
"use client";

import type { Lang, ScheduleExceptionRow } from "../teacherDashboardTypes";
import { Plus, Trash2, ToggleLeft, ToggleRight } from "lucide-react";

export type TeacherExceptionsPanelProps = {
  lang: Lang;
  exceptions: ScheduleExceptionRow[];
  exForm: {
    exception_date: string;
    start_time: string;
    end_time: string;
    exception_type: "block" | "add";
    is_group: boolean;
    max_students: string;
    note: string;
    reason: string;
    is_active: boolean;
  };
  onExFormChange: React.Dispatch<
    React.SetStateAction<{
      exception_date: string;
      start_time: string;
      end_time: string;
      exception_type: "block" | "add";
      is_group: boolean;
      max_students: string;
      note: string;
      reason: string;
      is_active: boolean;
    }>
  >;
  onCreateException: () => void | Promise<void>;
  onToggleActive: (ex: ScheduleExceptionRow) => void | Promise<void>;
  onDelete: (ex: ScheduleExceptionRow) => void | Promise<void>;
};

export default function TeacherExceptionsPanel({
  lang,
  exceptions,
  exForm,
  onExFormChange,
  onCreateException,
  onToggleActive,
  onDelete,
}: TeacherExceptionsPanelProps) {
  const ar = lang === "ar";

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 p-4">
        <div className="text-sm font-semibold text-slate-900">{ar ? "الاستثناءات" : "Exceptions"}</div>
        <div className="mt-0.5 text-xs text-slate-600">{ar ? "حظر/إضافة فترات استثنائية" : "Block or add special availability"}</div>
      </div>

      {/* Form */}
      <div className="p-4">
        <div className="grid gap-3 lg:grid-cols-12">
          <label className="lg:col-span-3">
            <div className="mb-1 text-xs font-semibold text-slate-700">{ar ? "التاريخ" : "Date"}</div>
            <input
              type="date"
              value={exForm.exception_date}
              onChange={(e) => onExFormChange((p) => ({ ...p, exception_date: e.target.value }))}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
            />
          </label>

          <label className="lg:col-span-2">
            <div className="mb-1 text-xs font-semibold text-slate-700">{ar ? "من" : "From"}</div>
            <input
              type="time"
              value={exForm.start_time}
              onChange={(e) => onExFormChange((p) => ({ ...p, start_time: e.target.value }))}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
            />
          </label>

          <label className="lg:col-span-2">
            <div className="mb-1 text-xs font-semibold text-slate-700">{ar ? "إلى" : "To"}</div>
            <input
              type="time"
              value={exForm.end_time}
              onChange={(e) => onExFormChange((p) => ({ ...p, end_time: e.target.value }))}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
            />
          </label>

          <label className="lg:col-span-2">
            <div className="mb-1 text-xs font-semibold text-slate-700">{ar ? "النوع" : "Type"}</div>
            <select
              value={exForm.exception_type}
              onChange={(e) => onExFormChange((p) => ({ ...p, exception_type: e.target.value as "block" | "add" }))}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
            >
              <option value="block">{ar ? "حظر" : "Block"}</option>
              <option value="add">{ar ? "إضافة" : "Add"}</option>
            </select>
          </label>

          <label className="lg:col-span-1">
            <div className="mb-1 text-xs font-semibold text-slate-700">{ar ? "جماعي" : "Group"}</div>
            <input
              type="checkbox"
              checked={exForm.is_group}
              onChange={(e) => onExFormChange((p) => ({ ...p, is_group: e.target.checked }))}
              className="h-4 w-4"
            />
          </label>

          <label className="lg:col-span-2">
            <div className="mb-1 text-xs font-semibold text-slate-700">{ar ? "الحد" : "Max"}</div>
            <input
              value={exForm.max_students}
              onChange={(e) => onExFormChange((p) => ({ ...p, max_students: e.target.value }))}
              disabled={!exForm.is_group}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm disabled:opacity-60"
            />
          </label>

          <label className="lg:col-span-6">
            <div className="mb-1 text-xs font-semibold text-slate-700">{ar ? "ملاحظة" : "Note"}</div>
            <input
              value={exForm.note}
              onChange={(e) => onExFormChange((p) => ({ ...p, note: e.target.value }))}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
            />
          </label>

          <label className="lg:col-span-6">
            <div className="mb-1 text-xs font-semibold text-slate-700">{ar ? "سبب" : "Reason"}</div>
            <input
              value={exForm.reason}
              onChange={(e) => onExFormChange((p) => ({ ...p, reason: e.target.value }))}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
            />
          </label>

          <button
            type="button"
            onClick={() => void onCreateException()}
            className="lg:col-span-12 inline-flex items-center justify-center gap-2 rounded-xl bg-sky-500 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-800"
          >
            <Plus className="h-4 w-4" />
            {ar ? "إضافة استثناء" : "Add Exception"}
          </button>
        </div>
      </div>

      {/* List */}
      <div className="p-4 pt-0">
        {exceptions.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-600">
            {ar ? "لا توجد استثناءات." : "No exceptions."}
          </div>
        ) : (
          <div className="space-y-2">
            {exceptions.map((e) => (
              <div key={e.id} className="flex flex-col gap-2 rounded-2xl border border-slate-200 bg-white p-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-sm text-slate-800">
                  <span className="font-semibold">{e.exception_date}</span>
                  {" • "}
                  {e.start_time} → {e.end_time}
                  {" • "}
                  <span className="font-semibold">{e.exception_type}</span>
                  {" • "}
                  {ar ? "نشط:" : "Active:"} <span className="font-semibold">{Number(e.is_active) === 1 ? (ar ? "نعم" : "Yes") : (ar ? "لا" : "No")}</span>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => void onToggleActive(e)}
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    {Number(e.is_active) === 1 ? <ToggleRight className="h-4 w-4" /> : <ToggleLeft className="h-4 w-4" />}
                    {Number(e.is_active) === 1 ? (ar ? "تعطيل" : "Disable") : (ar ? "تفعيل" : "Enable")}
                  </button>

                  <button
                    type="button"
                    onClick={() => void onDelete(e)}
                    className="inline-flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-800 hover:bg-rose-100"
                  >
                    <Trash2 className="h-4 w-4" />
                    {ar ? "حذف" : "Delete"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
