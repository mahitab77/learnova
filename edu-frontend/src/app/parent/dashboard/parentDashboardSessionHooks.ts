import { useCallback, useMemo, useState } from "react";
import parentService from "@/src/services/parentService";
import { requireData } from "./parentDashboardMappers";
import {
  resetPostSwitchSessionCaches,
  type SwitchBackData,
  type SwitchToStudentData,
} from "./parentDashboardSessionUtils";

export function useParentSwitchToStudent() {
  const [switching, setSwitching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastSwitched, setLastSwitched] = useState<SwitchToStudentData | null>(
    null
  );

  const switchToStudent = useCallback(async (studentUserId: number) => {
    setSwitching(true);
    setError(null);
    try {
      const normalized = requireData(
        await parentService.switchToStudent(studentUserId)
      );
      if (!normalized.ok) {
        setError(normalized.error);
        return { ok: false as const, error: normalized.error };
      }
      resetPostSwitchSessionCaches();
      setLastSwitched(normalized.data);
      return { ok: true as const, data: normalized.data };
    } finally {
      setSwitching(false);
    }
  }, []);

  return useMemo(
    () => ({ switchToStudent, switching, error, lastSwitched }),
    [switchToStudent, switching, error, lastSwitched]
  );
}

export function useParentSwitchBack() {
  const [switchingBack, setSwitchingBack] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const switchBack = useCallback(async () => {
    setSwitchingBack(true);
    setError(null);
    try {
      const normalized = requireData(await parentService.switchBackToParent());
      if (!normalized.ok) {
        setError(normalized.error);
        return { ok: false as const, error: normalized.error };
      }
      resetPostSwitchSessionCaches();
      return { ok: true as const, data: normalized.data as SwitchBackData };
    } finally {
      setSwitchingBack(false);
    }
  }, []);

  return useMemo(
    () => ({ switchBack, switchingBack, error }),
    [switchBack, switchingBack, error]
  );
}
