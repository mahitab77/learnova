import { useEffect, useState } from "react";
import parentService from "@/src/services/parentService";
import type {
  ParentAssignment,
  ParentRequest,
  ParentSelection,
  ParentStudent,
} from "./parentDashboardTypes";
import {
  mapAssignmentRow,
  mapRequestRow,
  mapSelectionRow,
  mapStudentRow,
  requireData,
} from "./parentDashboardMappers";

export function useParentStudents() {
  const [students, setStudents] = useState<ParentStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void (async () => {
        setLoading(true);
        setError(null);
        const normalized = requireData(await parentService.getMyStudents());
        if (!normalized.ok) {
          setError(normalized.error);
          setLoading(false);
          return;
        }
        setStudents(normalized.data.map(mapStudentRow));
        setLoading(false);
      })();
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  return { students, loading, error };
}

export function useStudentSelections(studentId: number | null) {
  const [rows, setRows] = useState<ParentSelection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void (async () => {
        if (studentId == null) {
          setRows([]);
          setError("Missing student ID");
          setLoading(false);
          return;
        }
        setLoading(true);
        setError(null);
        const normalized = requireData(
          await parentService.getStudentSelectionsAsParent(studentId)
        );
        if (!normalized.ok) {
          setError(normalized.error);
          setLoading(false);
          return;
        }
        setRows(normalized.data.map(mapSelectionRow));
        setLoading(false);
      })();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [studentId]);

  return { rows, loading, error };
}

export function useParentSelectionsMap(studentIds: number[]) {
  const [rowsByStudentId, setRowsByStudentId] = useState<
    Record<number, ParentSelection[]>
  >({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void (async () => {
        const uniqueIds = [
          ...new Set(studentIds.filter((id) => Number.isFinite(id) && id > 0)),
        ];
        if (!uniqueIds.length) {
          setRowsByStudentId({});
          setError(null);
          setLoading(false);
          return;
        }
        setLoading(true);
        setError(null);
        const normalized = requireData(
          await parentService.getParentStudentsSelectionsMap(uniqueIds)
        );
        if (!normalized.ok) {
          setError(normalized.error);
          setLoading(false);
          return;
        }
        const grouped: Record<number, ParentSelection[]> = {};
        for (const [studentIdKey, selections] of Object.entries(normalized.data)) {
          const sid = Number(studentIdKey);
          if (!Number.isFinite(sid)) continue;
          grouped[sid] = Array.isArray(selections)
            ? selections.map(mapSelectionRow)
            : [];
        }
        setRowsByStudentId(grouped);
        setLoading(false);
      })();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [studentIds]);

  return { rowsByStudentId, loading, error };
}

export function useParentAssignments() {
  const [assignments, setAssignments] = useState<ParentAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void (async () => {
        setLoading(true);
        setError(null);
        const normalized = requireData(await parentService.getParentAssignments());
        if (!normalized.ok) {
          setError(normalized.error);
          setLoading(false);
          return;
        }
        setAssignments(normalized.data.map(mapAssignmentRow));
        setLoading(false);
      })();
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  return { assignments, loading, error };
}

export function useParentRequests() {
  const [requests, setRequests] = useState<ParentRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void (async () => {
        setLoading(true);
        setError(null);
        const normalized = requireData(await parentService.getParentRequests());
        if (!normalized.ok) {
          setError(normalized.error);
          setLoading(false);
          return;
        }
        setRequests(normalized.data.map(mapRequestRow));
        setLoading(false);
      })();
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  return { requests, loading, error };
}
