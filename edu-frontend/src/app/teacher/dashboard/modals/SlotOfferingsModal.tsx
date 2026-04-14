"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, Trash2, X } from "lucide-react";
import type {
  GradeCatalogLevel,
  GradeCatalogStage,
  GradeCatalogSystem,
  Lang,
  ScheduleSlotRow,
  SlotOfferingRow,
} from "../teacherDashboardTypes";
import { teacherDashboardTexts } from "../teacherDashboardTexts";

type SubjectOptionRow = {
  subject_id: number;
  name_en: string | null;
  name_ar: string | null;
};

type EditableOfferingRow = {
  key: string;
  subject_id: number | null;
  system_id: number | null;
  stage_id: number | null;
  grade_level_id: number | null;
};

export type SlotOfferingsModalProps = {
  lang: Lang;
  open: boolean;
  slot: ScheduleSlotRow | null;
  subjects: SubjectOptionRow[];
  systems: GradeCatalogSystem[];
  stages: GradeCatalogStage[];
  levels: GradeCatalogLevel[];
  initialOfferings: SlotOfferingRow[];
  saving: boolean;
  error: string | null;
  onClose: () => void;
  onSave: (offerings: SlotOfferingRow[]) => void | Promise<void | boolean>;
};

type SlotOfferingsModalBodyProps = Omit<SlotOfferingsModalProps, "slot"> & {
  slot: ScheduleSlotRow;
};

const WEEKDAY_LABELS: Record<number, { en: string; ar: string }> = {
  1: { en: "Monday", ar: "الاثنين" },
  2: { en: "Tuesday", ar: "الثلاثاء" },
  3: { en: "Wednesday", ar: "الأربعاء" },
  4: { en: "Thursday", ar: "الخميس" },
  5: { en: "Friday", ar: "الجمعة" },
  6: { en: "Saturday", ar: "السبت" },
  7: { en: "Sunday", ar: "الأحد" },
};

let draftRowCounter = 0;

function createDraftRow(): EditableOfferingRow {
  draftRowCounter += 1;
  return {
    key: `offering-row-${draftRowCounter}`,
    subject_id: null,
    system_id: null,
    stage_id: null,
    grade_level_id: null,
  };
}

function toEditableRow(offering: SlotOfferingRow): EditableOfferingRow {
  draftRowCounter += 1;
  return {
    key: `offering-row-${draftRowCounter}`,
    subject_id: Number(offering.subject_id) || null,
    system_id: Number(offering.system_id) || null,
    stage_id: Number(offering.stage_id) || null,
    grade_level_id:
      offering.grade_level_id == null ? null : Number(offering.grade_level_id),
  };
}

function timeLabel(value: string): string {
  return typeof value === "string" && value.length >= 5
    ? value.slice(0, 5)
    : value;
}

function SlotOfferingsModalBody({
  lang,
  slot,
  subjects,
  systems,
  stages,
  levels,
  initialOfferings,
  saving,
  error,
  onClose,
  onSave,
}: SlotOfferingsModalBodyProps) {
  const ar = lang === "ar";
  const pack = teacherDashboardTexts[lang];
  const scheduleText = pack.schedule;
  const offeringsText = scheduleText.offerings;
  const statusText = pack.status;

  const [rows, setRows] = useState<EditableOfferingRow[]>(() =>
    initialOfferings.map(toEditableRow)
  );
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const displayError = localError || error;

  const subjectOptions = useMemo(
    () =>
      subjects.map((subject) => ({
        value: Number(subject.subject_id),
        label:
          ar
            ? subject.name_ar || subject.name_en || String(subject.subject_id)
            : subject.name_en || subject.name_ar || String(subject.subject_id),
      })),
    [ar, subjects]
  );

  const systemOptions = useMemo(
    () =>
      systems.map((system) => ({
        value: Number(system.id),
        label: system.name || system.code || String(system.id),
      })),
    [systems]
  );

  const addRow = () => {
    setRows((prev) => [...prev, createDraftRow()]);
    setLocalError(null);
  };

  const removeRow = (key: string) => {
    setRows((prev) => prev.filter((row) => row.key !== key));
    setLocalError(null);
  };

  const updateRow = (
    key: string,
    patch: Partial<Omit<EditableOfferingRow, "key">>
  ) => {
    setRows((prev) =>
      prev.map((row) => (row.key === key ? { ...row, ...patch } : row))
    );
    setLocalError(null);
  };

  const weekdayLabel = useMemo(() => {
    if (!slot) return "";
    const label = WEEKDAY_LABELS[Number(slot.weekday)];
    if (!label) return String(slot.weekday);
    return ar ? label.ar : label.en;
  }, [ar, slot]);

  const summaryBadges = useMemo(() => {
    if (!slot) return [];
    return [
      Number(slot.is_group) === 1
        ? scheduleText.modes.group
        : scheduleText.modes.oneToOne,
      Number(slot.is_active) === 1 ? statusText.active : statusText.inactive,
    ];
  }, [scheduleText.modes.group, scheduleText.modes.oneToOne, slot, statusText.active, statusText.inactive]);

  const submit = async () => {
    const normalizedRows = rows.map((row) => ({
      subject_id: row.subject_id == null ? null : Number(row.subject_id),
      system_id: row.system_id == null ? null : Number(row.system_id),
      stage_id: row.stage_id == null ? null : Number(row.stage_id),
      grade_level_id:
        row.grade_level_id == null ? null : Number(row.grade_level_id),
    }));

    const hasIncompleteRow = normalizedRows.some(
      (row) =>
        !Number.isFinite(Number(row.subject_id)) ||
        Number(row.subject_id) <= 0 ||
        !Number.isFinite(Number(row.system_id)) ||
        Number(row.system_id) <= 0 ||
        !Number.isFinite(Number(row.stage_id)) ||
        Number(row.stage_id) <= 0
    );

    if (hasIncompleteRow) {
      setLocalError(
        ar
          ? "أكمل المادة والنظام والمرحلة لكل تخصيص قبل الحفظ."
          : "Complete subject, system, and stage for every offering before saving."
      );
      return;
    }

    const dedupe = new Set<string>();
    for (const row of normalizedRows) {
      const signature = `${row.subject_id}|${row.system_id}|${row.stage_id}|${
        row.grade_level_id == null ? "all" : row.grade_level_id
      }`;
      if (dedupe.has(signature)) {
        setLocalError(
          ar
            ? "احذف التخصيصات المكررة قبل الحفظ."
            : "Remove duplicate offerings before saving."
        );
        return;
      }
      dedupe.add(signature);
    }

    setLocalError(null);
    await onSave(
      normalizedRows.map((row) => ({
        subject_id: Number(row.subject_id),
        system_id: Number(row.system_id),
        stage_id: Number(row.stage_id),
        grade_level_id: row.grade_level_id,
        is_active: 1,
      }))
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-3">
      <div
        className="w-full max-w-5xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl"
        dir={ar ? "rtl" : "ltr"}
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
          <div>
            <div className="text-sm font-semibold text-slate-900">
              {offeringsText.title}
            </div>
            <div className="mt-1 text-xs text-slate-500">
              {weekdayLabel} • {timeLabel(slot.start_time)} →{" "}
              {timeLabel(slot.end_time)}
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 bg-white p-2 text-slate-600 hover:bg-slate-50"
            aria-label={pack.common.close}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="max-h-[75vh] overflow-auto p-4">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex flex-wrap items-center gap-2 text-sm text-slate-800">
              <span className="font-semibold">{weekdayLabel}</span>
              <span>{timeLabel(slot.start_time)} → {timeLabel(slot.end_time)}</span>
              {summaryBadges.map((badge) => (
                <span
                  key={badge}
                  className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700"
                >
                  {badge}
                </span>
              ))}
              {Number(slot.is_group) === 1 ? (
                <span className="rounded-full border border-sky-200 bg-sky-50 px-2.5 py-1 text-xs font-semibold text-sky-700">
                  {scheduleText.form.max}: {slot.max_students ?? "-"}
                </span>
              ) : null}
            </div>
          </div>

          {displayError ? (
            <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
              {displayError}
            </div>
          ) : null}

          {rows.length === 0 ? (
            <div className="mt-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center">
              <div className="text-sm font-semibold text-slate-900">
                {offeringsText.empty}
              </div>
              <div className="mt-1 text-xs text-slate-500">
                {offeringsText.draftSlot}
              </div>
            </div>
          ) : (
            <div className="mt-4 space-y-3">
              {rows.map((row, index) => {
                const stageOptions = stages.filter(
                  (stage) => Number(stage.systemId) === Number(row.system_id)
                );
                const levelOptions = levels.filter(
                  (level) => Number(level.stageId) === Number(row.stage_id)
                );

                return (
                  <div
                    key={row.key}
                    className="rounded-2xl border border-slate-200 bg-white p-4"
                  >
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <div className="text-sm font-semibold text-slate-900">
                        {offeringsText.title} {index + 1}
                      </div>
                      <button
                        type="button"
                        onClick={() => removeRow(row.key)}
                        className="inline-flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-800 hover:bg-rose-100"
                      >
                        <Trash2 className="h-4 w-4" />
                        {offeringsText.remove}
                      </button>
                    </div>

                    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                      <label>
                        <div className="mb-1 text-xs font-semibold text-slate-700">
                          {offeringsText.subject}
                        </div>
                        <select
                          value={row.subject_id ?? ""}
                          onChange={(e) =>
                            updateRow(row.key, {
                              subject_id: e.target.value
                                ? Number(e.target.value)
                                : null,
                            })
                          }
                          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                        >
                          <option value="">{offeringsText.subject}</option>
                          {subjectOptions.map((subject) => (
                            <option key={subject.value} value={subject.value}>
                              {subject.label}
                            </option>
                          ))}
                        </select>
                      </label>

                      <label>
                        <div className="mb-1 text-xs font-semibold text-slate-700">
                          {offeringsText.system}
                        </div>
                        <select
                          value={row.system_id ?? ""}
                          onChange={(e) =>
                            updateRow(row.key, {
                              system_id: e.target.value
                                ? Number(e.target.value)
                                : null,
                              stage_id: null,
                              grade_level_id: null,
                            })
                          }
                          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                        >
                          <option value="">{offeringsText.system}</option>
                          {systemOptions.map((system) => (
                            <option key={system.value} value={system.value}>
                              {system.label}
                            </option>
                          ))}
                        </select>
                      </label>

                      <label>
                        <div className="mb-1 text-xs font-semibold text-slate-700">
                          {offeringsText.stage}
                        </div>
                        <select
                          value={row.stage_id ?? ""}
                          onChange={(e) =>
                            updateRow(row.key, {
                              stage_id: e.target.value
                                ? Number(e.target.value)
                                : null,
                              grade_level_id: null,
                            })
                          }
                          disabled={row.system_id == null}
                          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          <option value="">{offeringsText.stage}</option>
                          {stageOptions.map((stage) => (
                            <option key={stage.id} value={stage.id}>
                              {ar
                                ? stage.nameAr || stage.nameEn || stage.code
                                : stage.nameEn || stage.nameAr || stage.code}
                            </option>
                          ))}
                        </select>
                      </label>

                      <label>
                        <div className="mb-1 text-xs font-semibold text-slate-700">
                          {offeringsText.grade}
                        </div>
                        <select
                          value={row.grade_level_id == null ? "all" : row.grade_level_id}
                          onChange={(e) =>
                            updateRow(row.key, {
                              grade_level_id:
                                e.target.value === "all"
                                  ? null
                                  : Number(e.target.value),
                            })
                          }
                          disabled={row.stage_id == null}
                          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          <option value="all">
                            {offeringsText.allGradesInStage}
                          </option>
                          {levelOptions.map((level) => (
                            <option key={level.id} value={level.id}>
                              {ar
                                ? level.nameAr || level.nameEn || level.code
                                : level.nameEn || level.nameAr || level.code}
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-3 border-t border-slate-100 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            onClick={addRow}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            <Plus className="h-4 w-4" />
            {offeringsText.add}
          </button>

          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              {offeringsText.cancel}
            </button>
            <button
              type="button"
              onClick={() => void submit()}
              disabled={saving}
              className="rounded-xl bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? pack.common.loading : offeringsText.save}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SlotOfferingsModal(props: SlotOfferingsModalProps) {
  const { open, slot, initialOfferings } = props;
  if (!open || !slot) return null;

  const initialSignature = initialOfferings
    .map(
      (offering) =>
        `${offering.subject_id}:${offering.system_id}:${offering.stage_id}:${
          offering.grade_level_id == null ? "all" : offering.grade_level_id
        }`
    )
    .join("|");

  return (
    <SlotOfferingsModalBody
      key={`${slot.id}:${initialSignature}`}
      {...props}
      slot={slot}
    />
  );
}
