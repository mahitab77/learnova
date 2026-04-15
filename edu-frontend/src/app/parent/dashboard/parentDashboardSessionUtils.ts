import { clearCsrfToken } from "@/src/lib/api";
import { clearParentCsrfToken } from "@/src/services/parentService";

export function resetPostSwitchSessionCaches(): void {
  clearCsrfToken();
  clearParentCsrfToken();
  window.dispatchEvent(new Event("auth:changed"));
}

export type SwitchToStudentData = {
  as: "student";
  student_user_id: number;
  student_id: number;
};

export type SwitchBackData = { as: "parent" };
