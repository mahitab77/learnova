// src/app/teacher/dashboard/panels/TeacherSchedulePanel.tsx
"use client";

import type {
  Lang,
  ScheduleOfferingsMap,
  ScheduleSlotRow,
} from "../teacherDashboardTypes";
import { Plus, Settings2, Trash2, ToggleLeft, ToggleRight } from "lucide-react";
import { teacherDashboardTexts } from "../teacherDashboardTexts";

const WEEKDAY_OPTIONS = [
  { value: 1, en: "Mon", ar: "الاثنين" },
  { value: 2, en: "Tue", ar: "الثلاثاء" },
  { value: 3, en: "Wed", ar: "الأربعاء" },
  { value: 4, en: "Thu", ar: "الخميس" },
  { value: 5, en: "Fri", ar: "الجمعة" },
  { value: 6, en: "Sat", ar: "السبت" },
  { value: 7, en: "Sun", ar: "الأحد" },
] as const;

export type TeacherSchedulePanelProps = {
  lang: Lang;
  slots: ScheduleSlotRow[];
  slotOfferingsMap?: ScheduleOfferingsMap;
  slotForm: {
    weekday: number;
    start_time: string;
    end_time: string;
    is_group: boolean;
    max_students: string;
    is_active: boolean;
  };
  onSlotFormChange: React.Dispatch<
    React.SetStateAction<{
      weekday: number;
      start_time: string;
      end_time: string;
      is_group: boolean;
      max_students: string;
      is_active: boolean;
    }>
  >;
  onCreateSlot: () => void | Promise<void>;
  onToggleActive: (slot: ScheduleSlotRow) => void | Promise<void>;
  onDelete: (slot: ScheduleSlotRow) => void | Promise<void>;
  onOpenOfferings?: (slot: ScheduleSlotRow) => void | Promise<void>;
  buildOfferingSummary?: (scheduleId: number) => string;
};

export default function TeacherSchedulePanel({
  lang,
  slots,
  slotOfferingsMap,
  slotForm,
  onSlotFormChange,
  onCreateSlot,
  onToggleActive,
  onDelete,
  onOpenOfferings,
  buildOfferingSummary,
}: TeacherSchedulePanelProps) {
  const ar = lang === "ar";
  const t = teacherDashboardTexts[lang];
  const scheduleText = t.schedule;
  const commonText = t.common;
  const statusText = t.status;
  const offeringsText = scheduleText.offerings;

  const weekdayLabel = (weekday: number) => {
    const day = WEEKDAY_OPTIONS.find((option) => option.value === weekday);
    if (!day) return String(weekday);
    return ar ? day.ar : day.en;
  };

  const timeLabel = (value: string) =>
    typeof value === "string" && value.length >= 5 ? value.slice(0, 5) : value;

  const fallbackOfferingSummary = (scheduleId: number) => {
    const count = slotOfferingsMap?.[scheduleId]?.length ?? 0;
    if (count <= 0) return offeringsText.empty;
    if (count === 1) return offeringsText.oneOffering;
    return `${count} ${offeringsText.manyOfferingsSuffix}`;
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 p-4">
        <div className="text-sm font-semibold text-slate-900">
          {scheduleText.title}
        </div>
        <div className="mt-0.5 text-xs text-slate-600">
          {scheduleText.subtitle}
        </div>
      </div>

      <div className="p-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
          <label className="lg:col-span-1">
            <div className="mb-1 text-xs font-semibold text-slate-700">
              {scheduleText.form.day}
            </div>
            <select
              value={slotForm.weekday}
              onChange={(e) =>
                onSlotFormChange((p) => ({
                  ...p,
                  weekday: Number(e.target.value),
                }))
              }
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
            >
              {WEEKDAY_OPTIONS.map((day) => (
                <option key={day.value} value={day.value}>
                  {ar ? day.ar : day.en}
                </option>
              ))}
            </select>
          </label>

          <label className="lg:col-span-1">
            <div className="mb-1 text-xs font-semibold text-slate-700">
              {scheduleText.form.from}
            </div>
            <input
              type="time"
              value={slotForm.start_time}
              onChange={(e) =>
                onSlotFormChange((p) => ({ ...p, start_time: e.target.value }))
              }
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
            />
          </label>

          <label className="lg:col-span-1">
            <div className="mb-1 text-xs font-semibold text-slate-700">
              {scheduleText.form.to}
            </div>
            <input
              type="time"
              value={slotForm.end_time}
              onChange={(e) =>
                onSlotFormChange((p) => ({ ...p, end_time: e.target.value }))
              }
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
            />
          </label>

          <label className="lg:col-span-1">
            <div className="mb-1 text-xs font-semibold text-slate-700">
              {scheduleText.form.group}
            </div>
            <input
              type="checkbox"
              checked={slotForm.is_group}
              onChange={(e) =>
                onSlotFormChange((p) => ({ ...p, is_group: e.target.checked }))
              }
              className="h-4 w-4"
            />
          </label>

          <label className="lg:col-span-1">
            <div className="mb-1 text-xs font-semibold text-slate-700">
              {scheduleText.form.max}
            </div>
            <input
              value={slotForm.max_students}
              onChange={(e) =>
                onSlotFormChange((p) => ({
                  ...p,
                  max_students: e.target.value,
                }))
              }
              disabled={!slotForm.is_group}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm disabled:opacity-60"
            />
          </label>

          <button
            type="button"
            onClick={() => void onCreateSlot()}
            className="lg:col-span-1 inline-flex items-center justify-center gap-2 rounded-xl bg-sky-500 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-800"
          >
            <Plus className="h-4 w-4" />
            {commonText.add}
          </button>
        </div>
      </div>

      <div className="p-4 pt-0">
        {slots.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-600">
            {scheduleText.emptyTitle}
          </div>
        ) : (
          <div className="space-y-2">
            {slots.map((slot) => {
              const offeringsCount = slotOfferingsMap?.[slot.id]?.length ?? 0;
              const slotStatus =
                offeringsCount > 0
                  ? offeringsText.liveSlot
                  : offeringsText.draftSlot;
              const offeringSummary = buildOfferingSummary
                ? buildOfferingSummary(slot.id)
                : fallbackOfferingSummary(slot.id);

              return (
                <div
                  key={slot.id}
                  className="rounded-2xl border border-slate-200 bg-white p-3"
                >
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2 text-sm text-slate-800">
                        <span className="font-semibold">
                          {weekdayLabel(slot.weekday)}
                        </span>
                        <span>
                          {timeLabel(slot.start_time)} → {timeLabel(slot.end_time)}
                        </span>
                        <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700">
                          {Number(slot.is_group) === 1
                            ? scheduleText.modes.group
                            : scheduleText.modes.oneToOne}
                        </span>
                        {Number(slot.is_group) === 1 ? (
                          <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700">
                            {scheduleText.form.max}: {slot.max_students ?? "-"}
                          </span>
                        ) : null}
                        <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700">
                          {Number(slot.is_active) === 1
                            ? statusText.active
                            : statusText.inactive}
                        </span>
                      </div>

                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <span
                          className={
                            offeringsCount > 0
                              ? "rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700"
                              : "rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700"
                          }
                        >
                          {slotStatus}
                        </span>
                        <div className="min-w-0 flex-1 text-xs text-slate-600">
                          {offeringSummary}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => void onOpenOfferings?.(slot)}
                        disabled={!onOpenOfferings}
                        className="inline-flex items-center gap-2 rounded-xl border border-sky-200 bg-sky-50 px-3 py-2 text-xs font-semibold text-sky-800 hover:bg-sky-100 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <Settings2 className="h-4 w-4" />
                        {offeringsText.manage}
                      </button>

                      <button
                        type="button"
                        onClick={() => void onToggleActive(slot)}
                        className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                      >
                        {Number(slot.is_active) === 1 ? (
                          <ToggleRight className="h-4 w-4" />
                        ) : (
                          <ToggleLeft className="h-4 w-4" />
                        )}
                        {Number(slot.is_active) === 1
                          ? commonText.disable
                          : commonText.enable}
                      </button>

                      <button
                        type="button"
                        onClick={() => void onDelete(slot)}
                        className="inline-flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-800 hover:bg-rose-100"
                      >
                        <Trash2 className="h-4 w-4" />
                        {commonText.delete}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
