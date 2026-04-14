// src/app/admin/dashboard/components/AssignmentsPanel.tsx
"use client";

import { useState } from "react";
import type { Lang } from "../adminTypes";
import type { LangTexts } from "../adminTexts";

export type TeacherAssignmentRow = {
  subject_id: number;
  subject_name_en: string;
  subject_name_ar: string;
  teacher_id: number;
  teacher_name: string;
  max_capacity: number | null;
  current_load: number;
};

export type AssignmentsPanelProps = {
  lang: Lang;
  t: LangTexts;
  assignments: TeacherAssignmentRow[];
  assignmentsLoading: boolean;
  assignmentsError: string | null;
  onReassignStudent: (data: {
    student_id: number;
    subject_id: number;
    to_teacher_id: number;
  }) => Promise<void>;
};

export function AssignmentsPanel({
  lang,
  t,
  assignments,
  assignmentsLoading,
  assignmentsError,
  onReassignStudent,
}: AssignmentsPanelProps) {
  const dir = lang === "ar" ? "rtl" : "ltr";
  const [selectedSubject, setSelectedSubject] = useState<number | "all">("all");
  const [reassigning, setReassigning] = useState<number | null>(null);
  const [showReassignModal, setShowReassignModal] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<TeacherAssignmentRow | null>(null);
  const [studentId, setStudentId] = useState("");
  const [toTeacherId, setToTeacherId] = useState("");

  // Group assignments by subject - NOW PROPERLY USED
  const assignmentsBySubject = assignments.reduce((acc, assignment) => {
    if (!acc[assignment.subject_id]) {
      acc[assignment.subject_id] = [];
    }
    acc[assignment.subject_id].push(assignment);
    return acc;
  }, {} as { [key: number]: TeacherAssignmentRow[] });

  const subjects = Array.from(new Set(assignments.map(a => ({
    id: a.subject_id,
    name_en: a.subject_name_en,
    name_ar: a.subject_name_ar
  }))));

  const filteredAssignments = selectedSubject === "all" 
    ? assignments 
    : assignments.filter(a => a.subject_id === selectedSubject);

  const getUtilizationColor = (load: number, capacity: number | null) => {
    if (!capacity) return "bg-slate-100";
    const utilization = (load / capacity) * 100;
    if (utilization >= 90) return "bg-red-100 text-red-800";
    if (utilization >= 75) return "bg-yellow-100 text-yellow-800";
    return "bg-green-100 text-green-800";
  };

  const openReassignModal = (assignment: TeacherAssignmentRow) => {
    setSelectedAssignment(assignment);
    setStudentId("");
    setToTeacherId("");
    setShowReassignModal(true);
  };

  const closeReassignModal = () => {
    setShowReassignModal(false);
    setSelectedAssignment(null);
    setStudentId("");
    setToTeacherId("");
    setReassigning(null);
  };

  const handleReassign = async () => {
    if (!selectedAssignment || !studentId || !toTeacherId) return;

    setReassigning(selectedAssignment.teacher_id);
    try {
      await onReassignStudent({
        student_id: parseInt(studentId),
        subject_id: selectedAssignment.subject_id,
        to_teacher_id: parseInt(toTeacherId),
      });
      closeReassignModal();
    } catch (error) {
      console.error("Failed to reassign student:", error);
    } finally {
      setReassigning(null);
    }
  };

  // Get available teachers for the same subject (excluding current teacher)
  const getAvailableTeachers = (assignment: TeacherAssignmentRow) => {
    if (!assignment) return [];
    const subjectAssignments = assignmentsBySubject[assignment.subject_id] || [];
    return subjectAssignments.filter(a => a.teacher_id !== assignment.teacher_id);
  };

  if (assignmentsLoading) {
    return (
      <section className="rounded-2xl bg-white border border-slate-100 shadow-sm p-6" dir={dir}>
        <div className="animate-pulse">
          <div className="h-6 bg-slate-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="bg-slate-200 h-20 rounded-lg"></div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-2xl bg-white border border-slate-100 shadow-sm p-6 space-y-6" dir={dir}>
      <header>
        <h2 className="text-lg font-semibold text-slate-900">{t.assignmentsTitle}</h2>
        <p className="text-sm text-slate-500 mt-1">{t.assignmentsDesc}</p>
      </header>

      {assignmentsError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700 text-sm">{assignmentsError}</p>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            {t.assignmentsFilterBySubject}
          </label>
          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value === "all" ? "all" : parseInt(e.target.value))}
            className="border border-slate-300 rounded-md px-3 py-2 text-sm"
          >
            <option value="all">{t.assignmentsAllSubjects}</option>
            {subjects.map(subject => (
              <option key={subject.id} value={subject.id}>
                {lang === "ar" ? subject.name_ar : subject.name_en}
              </option>
            ))}
          </select>
        </div>

        {/* Subject Overview using assignmentsBySubject */}
        <div className="flex-1">
          <label className="block text-sm font-medium text-slate-700 mb-1">
            {lang === "ar" ? "نظرة عامة على المواد" : "Subjects Overview"}
          </label>
          <div className="flex flex-wrap gap-2">
            {Object.entries(assignmentsBySubject).map(([subjectId, subjectAssignments]) => {
              const subject = subjects.find(s => s.id === parseInt(subjectId));
              if (!subject) return null;
              
              const totalTeachers = subjectAssignments.length;
              const overloadedTeachers = subjectAssignments.filter(a => 
                a.max_capacity && a.current_load >= a.max_capacity
              ).length;

              return (
                <div
                  key={subjectId}
                  className={`px-3 py-1 rounded-full text-xs border ${
                    overloadedTeachers > 0 
                      ? "bg-red-50 border-red-200 text-red-700" 
                      : "bg-slate-50 border-slate-200 text-slate-700"
                  }`}
                >
                  {lang === "ar" ? subject.name_ar : subject.name_en}
                  <span className="ml-1">
                    ({totalTeachers} {overloadedTeachers > 0 && `| ${overloadedTeachers} ${lang === "ar" ? "ممتلئ" : "full"}`})
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Assignments Grid */}
      <div className="grid gap-4">
        {filteredAssignments.map((assignment) => (
          <div
            key={`${assignment.subject_id}-${assignment.teacher_id}`}
            className="border border-slate-200 rounded-lg p-4 bg-white hover:shadow-md transition-shadow"
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex-1">
                <h3 className="font-semibold text-slate-900">
                  {lang === "ar" ? assignment.subject_name_ar : assignment.subject_name_en}
                </h3>
                <p className="text-sm text-slate-600 mt-1">{assignment.teacher_name}</p>
                
                <div className="flex flex-wrap gap-4 mt-2">
                  <div className="text-sm">
                    <span className="text-slate-500">{t.assignmentsCurrentLoad}: </span>
                    <span className="font-semibold">{assignment.current_load}</span>
                  </div>
                  <div className="text-sm">
                    <span className="text-slate-500">{t.assignmentsMaxCapacity}: </span>
                    <span className="font-semibold">
                      {assignment.max_capacity ?? t.assignmentsUnlimited}
                    </span>
                  </div>
                  {assignment.max_capacity && (
                    <div className="text-sm">
                      <span className="text-slate-500">{t.assignmentsUtilization}: </span>
                      <span className={`font-semibold px-2 py-1 rounded ${getUtilizationColor(
                        assignment.current_load,
                        assignment.max_capacity
                      )}`}>
                        {Math.round((assignment.current_load / assignment.max_capacity) * 100)}%
                      </span>
                    </div>
                  )}
                </div>

                {/* Show other teachers for this subject */}
                {assignmentsBySubject[assignment.subject_id]?.length > 1 && (
                  <div className="mt-3">
                    <p className="text-xs text-slate-500 mb-1">
                      {lang === "ar" ? "معلمون آخرون لهذه المادة:" : "Other teachers for this subject:"}
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {assignmentsBySubject[assignment.subject_id]
                        .filter(a => a.teacher_id !== assignment.teacher_id)
                        .map(otherTeacher => (
                          <span
                            key={otherTeacher.teacher_id}
                            className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs"
                          >
                            {otherTeacher.teacher_name} ({otherTeacher.current_load}/{otherTeacher.max_capacity ?? "∞"})
                          </span>
                        ))
                      }
                    </div>
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-2 min-w-[200px]">
                <button
                  onClick={() => openReassignModal(assignment)}
                  disabled={reassigning === assignment.teacher_id}
                  className="bg-blue-500 text-white px-4 py-2 rounded text-sm hover:bg-blue-600 disabled:bg-slate-300 disabled:cursor-not-allowed"
                >
                  {reassigning === assignment.teacher_id ? t.assignmentsReassigning : t.assignmentsReassign}
                </button>
                
                {assignment.current_load >= (assignment.max_capacity || Infinity) && (
                  <span className="text-xs text-red-600 text-center">
                    {t.assignmentsAtCapacity}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredAssignments.length === 0 && (
        <div className="text-center py-8">
          <p className="text-slate-500">{t.assignmentsNone}</p>
        </div>
      )}

      {/* Reassign Student Modal */}
      {showReassignModal && selectedAssignment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md" dir={dir}>
            <h3 className="text-lg font-semibold text-slate-900 mb-4">
              {t.assignmentsReassign}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  {lang === "ar" ? "رقم الطالب" : "Student ID"}
                </label>
                <input
                  type="number"
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm"
                  placeholder={lang === "ar" ? "أدخل رقم الطالب" : "Enter student ID"}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  {lang === "ar" ? "المعلم الجديد" : "New Teacher"}
                </label>
                <select
                  value={toTeacherId}
                  onChange={(e) => setToTeacherId(e.target.value)}
                  className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm"
                >
                  <option value="">{lang === "ar" ? "اختر المعلم" : "Select teacher"}</option>
                  {getAvailableTeachers(selectedAssignment).map(teacher => (
                    <option key={teacher.teacher_id} value={teacher.teacher_id}>
                      {teacher.teacher_name} ({teacher.current_load}/{teacher.max_capacity ?? "∞"})
                    </option>
                  ))}
                </select>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded p-3">
                <p className="text-sm text-blue-700">
                  {lang === "ar" 
                    ? `سيتم نقل الطالب من ${selectedAssignment.teacher_name} إلى المعلم الجديد`
                    : `Student will be moved from ${selectedAssignment.teacher_name} to the new teacher`
                  }
                </p>
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <button
                onClick={handleReassign}
                disabled={!studentId || !toTeacherId || reassigning !== null}
                className="bg-emerald-500 text-white px-4 py-2 rounded text-sm hover:bg-emerald-600 disabled:bg-slate-300 flex-1"
              >
                {reassigning ? t.assignmentsReassigning : t.assignmentsReassign}
              </button>
              <button
                onClick={closeReassignModal}
                className="bg-slate-500 text-white px-4 py-2 rounded text-sm hover:bg-slate-600 flex-1"
              >
                {t.cancel}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}