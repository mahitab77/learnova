// src/app/admin/dashboard/components/TeacherApprovalsPanel.tsx
"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import type { Lang, TeacherAdminRow } from "../adminTypes";
import type { LangTexts } from "../adminTexts";

export type TeacherApprovalsPanelProps = {
  lang: Lang;
  t: LangTexts;
  pendingTeachers: TeacherAdminRow[];
  pendingTeachersLoading: boolean;
  pendingTeachersError: string | null;
  approvingTeacherId: number | null;
  rejectingTeacherId: number | null;
  updatingCapacityTeacherId: number | null;
  onApproveTeacher: (id: number, approval_notes?: string) => Promise<void>;
  onRejectTeacher: (id: number, approval_notes?: string) => Promise<void>;
  onUpdateTeacherCapacity: (id: number, max_capacity: number) => Promise<void>;
  loadPendingTeachers: () => Promise<void>;
};

export function TeacherApprovalsPanel({
  lang,
  t,
  pendingTeachers,
  pendingTeachersLoading,
  pendingTeachersError,
  approvingTeacherId,
  rejectingTeacherId,
  updatingCapacityTeacherId,
  onApproveTeacher,
  onRejectTeacher,
  onUpdateTeacherCapacity,
  loadPendingTeachers,
}: TeacherApprovalsPanelProps) {
  const dir = lang === "ar" ? "rtl" : "ltr";
  const [notes, setNotes] = useState<{ [key: number]: string }>({});
  const [capacity, setCapacity] = useState<{ [key: number]: string }>({});
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [imageErrors, setImageErrors] = useState<{ [key: number]: boolean }>({});

  // Clear messages after 5 seconds
  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError(null);
        setSuccess(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, success]);

  const handleApprove = async (teacherId: number) => {
    setError(null);
    setSuccess(null);
    try {
      await onApproveTeacher(teacherId, notes[teacherId]);
      setNotes(prev => ({ ...prev, [teacherId]: "" }));
      setSuccess(lang === "ar" ? "تمت الموافقة على المعلم بنجاح" : "Teacher approved successfully");
      await loadPendingTeachers();
    } catch (err) {
      setError(err instanceof Error ? err.message : lang === "ar" ? "فشل في الموافقة على المعلم" : "Failed to approve teacher");
    }
  };

  const handleReject = async (teacherId: number) => {
    setError(null);
    setSuccess(null);
    try {
      await onRejectTeacher(teacherId, notes[teacherId]);
      setNotes(prev => ({ ...prev, [teacherId]: "" }));
      setSuccess(lang === "ar" ? "تم رفض المعلم بنجاح" : "Teacher rejected successfully");
      await loadPendingTeachers();
    } catch (err) {
      setError(err instanceof Error ? err.message : lang === "ar" ? "فشل في رفض المعلم" : "Failed to reject teacher");
    }
  };

  const handleUpdateCapacity = async (teacherId: number) => {
    const capacityValue = parseInt(capacity[teacherId] || "0");
    if (capacityValue <= 0) {
      setError(lang === "ar" ? "يرجى إدخال سعة صحيحة (أكبر من 0)" : "Please enter a valid capacity (greater than 0)");
      return;
    }

    setError(null);
    setSuccess(null);
    try {
      await onUpdateTeacherCapacity(teacherId, capacityValue);
      setCapacity(prev => ({ ...prev, [teacherId]: "" }));
      setSuccess(lang === "ar" ? "تم تحديث السعة بنجاح" : "Capacity updated successfully");
    } catch (err) {
      setError(err instanceof Error ? err.message : lang === "ar" ? "فشل في تحديث السعة" : "Failed to update capacity");
    }
  };

  const handleImageError = (teacherId: number) => {
    setImageErrors(prev => ({ ...prev, [teacherId]: true }));
  };

  // Format date helper
  const formatDate = (dateString?: string | null) => {
    if (!dateString) return "—";
    const date = new Date(dateString);
    return date.toLocaleString(lang === "ar" ? "ar-EG" : "en-US", {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (pendingTeachersLoading) {
    return (
      <section className="rounded-2xl bg-white border border-slate-100 shadow-sm p-6" dir={dir}>
        <div className="animate-pulse">
          <div className="h-6 bg-slate-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-slate-200 h-32 rounded-lg"></div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-2xl bg-white border border-slate-100 shadow-sm p-6 space-y-6" dir={dir}>
      <header>
        <h2 className="text-lg font-semibold text-slate-900">{t.approvalsTitle}</h2>
        <p className="text-sm text-slate-500 mt-1">{t.approvalsDesc}</p>
        <div className="text-xs text-slate-400 mt-1">
          {lang === "ar" ? "المعلمون المنتظرون الموافقة:" : "Pending teacher approvals:"} {pendingTeachers.length}
        </div>
      </header>

      {/* Global error/success messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}
      
      {success && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
          <p className="text-emerald-700 text-sm">{success}</p>
        </div>
      )}

      {pendingTeachersError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700 text-sm">{pendingTeachersError}</p>
          <button
            onClick={loadPendingTeachers}
            className="mt-2 bg-red-100 text-red-700 px-3 py-1 rounded text-sm hover:bg-red-200"
          >
            {t.retry || "Retry"}
          </button>
        </div>
      )}

      {pendingTeachers.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-slate-400 mb-2">✅</div>
          <p className="text-slate-500">{t.approvalsNone}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {pendingTeachers.map((teacher) => {
            const hasPhoto = !!teacher.photo_url && !imageErrors[teacher.id];
            
            return (
              <div
                key={teacher.id}
                className="border border-slate-200 rounded-lg p-4 bg-white hover:shadow-sm transition-shadow"
              >
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  {/* Teacher Info */}
                  <div className="flex-1">
                    <div className="flex items-start gap-3 mb-2">
                      <div className="relative">
                        {hasPhoto ? (
                          <div className="h-12 w-12 rounded-full overflow-hidden bg-slate-100">
                            <Image
                              src={teacher.photo_url!}
                              alt={teacher.name}
                              width={48}
                              height={48}
                              className="h-full w-full object-cover"
                              onError={() => handleImageError(teacher.id)}
                            />
                          </div>
                        ) : (
                          <div className="h-12 w-12 rounded-full bg-slate-200 flex items-center justify-center text-slate-600">
                            {teacher.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-900 text-base">{teacher.name}</h3>
                        {teacher.gender && (
                          <span className="text-xs text-slate-500">
                            {teacher.gender === "male" ? (lang === "ar" ? "ذكر" : "Male") : 
                             teacher.gender === "female" ? (lang === "ar" ? "أنثى" : "Female") : teacher.gender}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    {teacher.bio_short && (
                      <p className="text-sm text-slate-600 mb-2 line-clamp-2">{teacher.bio_short}</p>
                    )}
                    
                    <div className="flex flex-wrap gap-2 mt-2">
                      <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs font-medium">
                        {t.approvalsPending}
                      </span>
                      {teacher.created_at && (
                        <span className="text-xs text-slate-500">
                          {lang === "ar" ? "تم الإنشاء:" : "Created:"} {formatDate(teacher.created_at)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions Panel */}
                  <div className="flex flex-col gap-3 min-w-[250px]">
                    {/* Approval Notes */}
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        {lang === "ar" ? "ملاحظات الموافقة" : "Approval Notes"}
                      </label>
                      <textarea
                        placeholder={t.approvalsNotesPlaceholder}
                        value={notes[teacher.id] || ""}
                        onChange={(e) => setNotes(prev => ({ ...prev, [teacher.id]: e.target.value }))}
                        className="w-full border border-slate-300 rounded p-2 text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        rows={2}
                      />
                    </div>

                    {/* Capacity Setting */}
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        {t.approvalsSetCapacity} (1-100)
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="number"
                          placeholder={t.approvalsCapacityPlaceholder}
                          value={capacity[teacher.id] || ""}
                          onChange={(e) => {
                            const value = e.target.value;
                            if (value === "" || (parseInt(value) >= 1 && parseInt(value) <= 100)) {
                              setCapacity(prev => ({ ...prev, [teacher.id]: value }));
                            }
                          }}
                          className="flex-1 border border-slate-300 rounded p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          min="1"
                          max="100"
                        />
                        <button
                          onClick={() => handleUpdateCapacity(teacher.id)}
                          disabled={!capacity[teacher.id] || updatingCapacityTeacherId === teacher.id}
                          className="bg-blue-500 text-white px-3 py-2 rounded text-sm hover:bg-blue-600 disabled:bg-slate-300 disabled:cursor-not-allowed"
                        >
                          {updatingCapacityTeacherId === teacher.id ? 
                            (lang === "ar" ? "جاري التحديث..." : "Updating...") : 
                            t.approvalsSetCapacity}
                        </button>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        {lang === "ar" 
                          ? "السعة القصوى للطلاب الذين يمكن للمعلم تعليمهم"
                          : "Maximum number of students the teacher can handle"}
                      </p>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleApprove(teacher.id)}
                        disabled={approvingTeacherId === teacher.id}
                        className="flex-1 bg-green-500 text-white px-3 py-2 rounded text-sm hover:bg-green-600 disabled:bg-slate-300 disabled:cursor-not-allowed flex items-center justify-center gap-1"
                      >
                        {approvingTeacherId === teacher.id && (
                          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8v4a4 4 0 0 0-4 4H4z" />
                          </svg>
                        )}
                        {approvingTeacherId === teacher.id ? t.approvalsApproving : t.approvalsApprove}
                      </button>
                      <button
                        onClick={() => handleReject(teacher.id)}
                        disabled={rejectingTeacherId === teacher.id}
                        className="flex-1 bg-red-500 text-white px-3 py-2 rounded text-sm hover:bg-red-600 disabled:bg-slate-300 disabled:cursor-not-allowed flex items-center justify-center gap-1"
                      >
                        {rejectingTeacherId === teacher.id && (
                          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8v4a4 4 0 0 0-4 4H4z" />
                          </svg>
                        )}
                        {rejectingTeacherId === teacher.id ? t.approvalsRejecting : t.approvalsReject}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}