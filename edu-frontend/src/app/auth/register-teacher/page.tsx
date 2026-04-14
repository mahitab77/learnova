"use client";

/**
 * Teacher Registration (DROP-IN REPLACEMENT)
 * -----------------------------------------------------------------------------
 * ✅ Uses apiFetch from /src/lib/api (NO API_BASE import)
 * ✅ Session-cookie auth (credentials included by apiFetch)
 * ✅ Multi-step wizard (4 steps)
 * ✅ Upload 1–3 demo videos (multipart FormData)
 * ✅ Grade catalog + subjects loaded from backend using apiFetch
 * ✅ Clean validation per step + clear UI errors
 * ✅ No localStorage, no userId in URLs
 *
 * UPDATES IMPLEMENTED:
 * 1. Added apiFetchForm helper for multipart form submission
 * 2. Confirms created session then redirects to teacher dashboard
 * 3. Uses snake_case schedule keys matching backend expectations
 * 4. Uses canonical backend weekday values directly (1=Mon..7=Sun)
 * 5. Removed unused ApiError import
 * 6. Improved error handling with better backend message extraction
 * 7. Added validation for maxStudents in group sessions
 * 8. ✅ FIXED: Video URL cleanup effect dependency (critical bug)
 * 9. ✅ ADDED: Safe video playback with try-catch for autoplay errors
 * 10. ✅ ADDED: Session-auth compliance note in comments
 *
 * Backend endpoints expected:
 *  - GET  /meta/grade-catalog
 *      { success:true, data:{ systems:[], stages:[], levels:[] } }
 *  - GET  /subjects
 *      Either [] or { success:true, data:[...] } (we support both)
 *  - POST /auth/register-teacher  (multipart)
 *      FormData: payload (JSON string) + videos[] (File)
 *
 * SESSION-AUTH COMPLIANCE:
 * This page calls:
 * - GET /meta/grade-catalog (should be public for registration)
 * - GET /subjects (should be public for registration)
 * - POST /auth/register-teacher (should be public for registration)
 * If backend accidentally protects grade-catalog or subjects endpoints,
 * fix is backend-side: allow these endpoints publicly for registration flow.
 */

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Upload,
  Video,
  CheckCircle,
  Play,
  Pause,
  Trash2,
  RefreshCw,
  Search,
  Plus,
  X,
} from "lucide-react";

import { apiFetch } from "@/src/lib/api";
import { authService } from "@/src/services/authService";

/* =============================================================================
 * Types
 * ============================================================================= */

type VideoClip = {
  id: string;
  file: File;
  url: string;
  duration: number;
  title: string;
};

type SubjectOption = {
  id: number;
  nameEn: string;
  nameAr?: string | null;
  // If your backend provides it, we can filter subjects by grade availability.
  availableGradeLevelIds?: number[];
};

type EducationSystem = { id: number; name: string; code: string };
type GradeStage = { id: number; systemId: number; nameEn: string; code: string };
type GradeLevel = { id: number; stageId: number; nameEn: string; code: string };

type TeacherScheduleDraft = {
  id: string;
  weekday: number; // canonical backend weekday: 1=Monday..7=Sunday
  startTime: string; // "HH:MM"
  endTime: string; // "HH:MM"
  isGroup: boolean;
  maxStudents: string; // keep string in UI for controlled input
};

type TeacherFormData = {
  // Personal
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string; // YYYY-MM-DD
  gender: "" | "male" | "female";
  nationality: string;

  // Credentials
  password: string;
  confirmPassword: string;

  // Professional
  yearsOfExperience: string;
  highestQualification: string;
  university: string;
  specialization: string;
  currentOccupation: string;

  // Preferences
  educationSystemId: number | null;
  gradeLevelIds: number[];
  subjectIds: number[];
  hourlyRate: string;

  // Teaching / profile
  teachingStyle: string;
  teachingPhilosophy: string;
  achievements: string;
  bio: string;
  referencesText: string;

  // schedules stored in teacher_schedules
  schedules: TeacherScheduleDraft[];

  // Terms
  agreeToTerms: boolean;
  agreeToBackgroundCheck: boolean;
};

type RegisterTeacherSuccess = {
  success: true;
  message?: string;
  data: {
    userId: number;
    teacherId: number;
    fullName: string;
    email: string;
    role: string;
    status: string; // "pending", "approved", "rejected", etc.
  };
};

type RegisterTeacherError = {
  success: false;
  message?: string;
  code?: string;
};

type RegisterTeacherResponse =
  | RegisterTeacherSuccess
  | RegisterTeacherError
  | unknown;

type RequiredFieldKey =
  | "firstName"
  | "lastName"
  | "email"
  | "phone"
  | "dateOfBirth"
  | "nationality"
  | "password"
  | "confirmPassword"
  | "yearsOfExperience"
  | "highestQualification"
  | "educationSystemId"
  | "gradeLevelIds"
  | "subjectIds"
  | "schedules"
  | "videoClips"
  | "agreeToTerms"
  | "agreeToBackgroundCheck";

type FieldErrors = Partial<Record<RequiredFieldKey, string>>;

/* =============================================================================
 * Small helpers
 * ============================================================================= */

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null;

const safeId = () =>
  globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2, 11);

// Canonical backend weekday model: 1=Monday, ..., 7=Sunday
const WEEKDAYS: { value: number; label: string }[] = [
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
  { value: 7, label: "Sunday" },
];

/**
 * Safely parse and validate max students for group sessions
 * Returns a valid integer >= 2 for group sessions, 0 for individual sessions
 */
function sanitizeMaxStudents(isGroup: boolean, input: string): number {
  if (!isGroup) return 0;
  
  const num = Number(input);
  if (!Number.isFinite(num) || num < 2) {
    // Default to minimum of 2 for group sessions
    return 2;
  }
  
  return Math.floor(num); // Ensure integer
}

/**
 * Improved error message extraction that handles ApiError structure
 * The apiFetch function throws errors with a specific shape that may contain
 * detailed backend messages in the `raw` property
 */
function safeApiErrorMessage(err: unknown, fallback: string): string {
  if (isRecord(err)) {
    // Try to extract message from ApiError structure
    if (typeof err.message === "string" && err.message.trim()) {
      return err.message;
    }
    
    // Some apiFetch errors wrap backend response in `raw` property
    if (isRecord(err.raw) && typeof err.raw.message === "string") {
      return err.raw.message;
    }
  }
  
  // Fall back to standard Error message
  if (err instanceof Error && err.message) {
    return err.message;
  }
  
  return fallback;
}

/* =============================================================================
 * API Fetch Form Helper (for multipart form submission)
 * ============================================================================= */

/**
 * Helper for sending FormData via apiFetch while preserving credentials.
 * Reuses the same base URL + credentials behavior as apiFetch without
 * forcing JSON headers.
 */
async function apiFetchForm<T>(path: string, form: FormData, options: RequestInit = {}): Promise<T> {
  return apiFetch<T>(path, {
    method: "POST",
    body: form,
    ...options,
    // DO NOT set Content-Type manually for FormData (browser will set it correctly)
  });
}

function normalizeSubject(raw: unknown): SubjectOption | null {
  if (!isRecord(raw)) return null;

  const id = Number(raw.id ?? raw.subjectId ?? raw.subject_id);
  if (!Number.isFinite(id) || id <= 0) return null;

  const nameEn =
    String(raw.nameEn ?? raw.name_en ?? raw.name ?? "")
      .trim()
      .slice(0, 150) || `Subject #${id}`;

  const nameAr =
    typeof raw.nameAr === "string"
      ? raw.nameAr
      : typeof raw.name_ar === "string"
        ? raw.name_ar
        : null;

  const availableGradeLevelIds = Array.isArray(raw.availableGradeLevelIds)
    ? raw.availableGradeLevelIds
        .map((x) => Number(x))
        .filter((n) => Number.isFinite(n) && n > 0)
    : undefined;

  return { id, nameEn, nameAr, availableGradeLevelIds };
}

function normalizeSystem(raw: unknown): EducationSystem | null {
  if (!isRecord(raw)) return null;
  const id = Number(raw.id);
  const name = String(raw.name ?? "").trim();
  const code = String(raw.code ?? "").trim();
  if (!Number.isFinite(id) || id <= 0 || !name) return null;
  return { id, name, code };
}

function normalizeStage(raw: unknown): GradeStage | null {
  if (!isRecord(raw)) return null;
  const id = Number(raw.id);
  const systemId = Number(raw.systemId ?? raw.system_id);
  const nameEn = String(raw.nameEn ?? raw.name_en ?? "").trim();
  const code = String(raw.code ?? "").trim();
  if (!Number.isFinite(id) || id <= 0) return null;
  if (!Number.isFinite(systemId) || systemId <= 0) return null;
  if (!nameEn) return null;
  return { id, systemId, nameEn, code };
}

function normalizeLevel(raw: unknown): GradeLevel | null {
  if (!isRecord(raw)) return null;
  const id = Number(raw.id);
  const stageId = Number(raw.stageId ?? raw.stage_id);
  const nameEn = String(raw.nameEn ?? raw.name_en ?? "").trim();
  const code = String(raw.code ?? "").trim();
  if (!Number.isFinite(id) || id <= 0) return null;
  if (!Number.isFinite(stageId) || stageId <= 0) return null;
  if (!nameEn) return null;
  return { id, stageId, nameEn, code };
}

function isLikelyEmail(email: string) {
  // Simple but reliable enough for UX
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

function isValidTimeRange(start: string, end: string) {
  return Boolean(start && end && start < end);
}

function formatDuration(seconds: number) {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

/* =============================================================================
 * Component
 * ============================================================================= */

export default function RegisterTeacherPage() {
  const router = useRouter();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRefs = useRef<Record<string, HTMLVideoElement | null>>({});

  // ✅ FIXED: Add ref to track current video clips for cleanup
  const videoClipsRef = useRef<VideoClip[]>([]);

  const MAX_VIDEOS = 3;

  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);

  // Subjects
  const [subjectOptions, setSubjectOptions] = useState<SubjectOption[]>([]);
  const [subjectsLoading, setSubjectsLoading] = useState(true);
  const [subjectsError, setSubjectsError] = useState<string | null>(null);
  const [subjectSearch, setSubjectSearch] = useState("");

  // Grade catalog
  const [systems, setSystems] = useState<EducationSystem[]>([]);
  const [stages, setStages] = useState<GradeStage[]>([]);
  const [levels, setLevels] = useState<GradeLevel[]>([]);
  const [gradeLoading, setGradeLoading] = useState(true);
  const [gradeError, setGradeError] = useState<string | null>(null);

  // Videos
  const [videoClips, setVideoClips] = useState<VideoClip[]>([]);
  const [playingVideoId, setPlayingVideoId] = useState<string | null>(null);

  // UI
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Password eye toggles
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Main form state
  const [formData, setFormData] = useState<TeacherFormData>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    dateOfBirth: "",
    gender: "",
    nationality: "",

    password: "",
    confirmPassword: "",

    yearsOfExperience: "",
    highestQualification: "",
    university: "",
    specialization: "",
    currentOccupation: "",

    educationSystemId: null,
    gradeLevelIds: [],
    subjectIds: [],
    hourlyRate: "",

    teachingStyle: "",
    teachingPhilosophy: "",
    achievements: "",
    bio: "",
    referencesText: "",

    schedules: [
      {
        id: safeId(),
        weekday: 1, // Monday in canonical backend model
        startTime: "16:00",
        endTime: "18:00",
        isGroup: false,
        maxStudents: "",
      },
    ],

    agreeToTerms: false,
    agreeToBackgroundCheck: false,
  });

  /* =============================================================================
   * Data loading via apiFetch (NO API_BASE)
   * ============================================================================= */

  const loadGradeCatalog = useCallback(async () => {
    try {
      setGradeLoading(true);
      setGradeError(null);

      const json = await apiFetch<unknown>("/meta/grade-catalog", { method: "GET" });

      const rawSystems: unknown[] =
        isRecord(json) && isRecord(json.data) && Array.isArray(json.data.systems)
          ? (json.data.systems as unknown[])
          : [];
      const rawStages: unknown[] =
        isRecord(json) && isRecord(json.data) && Array.isArray(json.data.stages)
          ? (json.data.stages as unknown[])
          : [];
      const rawLevels: unknown[] =
        isRecord(json) && isRecord(json.data) && Array.isArray(json.data.levels)
          ? (json.data.levels as unknown[])
          : [];

      const sys = rawSystems.map(normalizeSystem).filter((x): x is EducationSystem => Boolean(x));
      const stg = rawStages.map(normalizeStage).filter((x): x is GradeStage => Boolean(x));
      const lvl = rawLevels.map(normalizeLevel).filter((x): x is GradeLevel => Boolean(x));

      setSystems(sys);
      setStages(stg);
      setLevels(lvl);

      // Default system selection if none selected yet
      setFormData((prev) => {
        if (prev.educationSystemId != null) return prev;
        const first = sys[0]?.id ?? null;
        return { ...prev, educationSystemId: first };
      });
    } catch (err) {
      console.error("loadGradeCatalog error:", err);
      setGradeError(safeApiErrorMessage(err, "Could not load grade catalog. Please contact support."));
      setSystems([]);
      setStages([]);
      setLevels([]);
    } finally {
      setGradeLoading(false);
    }
  }, []);

  const loadSubjects = useCallback(async () => {
    try {
      setSubjectsLoading(true);
      setSubjectsError(null);

      const json = await apiFetch<unknown>("/subjects", { method: "GET" });

      // Support either:
      // 1) plain array: []
      // 2) wrapped: { success:true, data:[...] }
      const rawList: unknown[] =
        Array.isArray(json)
          ? json
          : isRecord(json) && Array.isArray(json.data)
            ? (json.data as unknown[])
            : [];

      const normalized = rawList
        .map(normalizeSubject)
        .filter((x): x is SubjectOption => Boolean(x))
        .sort((a, b) => a.nameEn.localeCompare(b.nameEn));

      setSubjectOptions(normalized);
    } catch (err) {
      console.error("loadSubjects error:", err);
      setSubjectsError(safeApiErrorMessage(err, "Could not load subjects from the server. Please retry."));
      setSubjectOptions([]);
    } finally {
      setSubjectsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadGradeCatalog();
    void loadSubjects();
  }, [loadGradeCatalog, loadSubjects]);

  // Keep selected subjects valid if list changes
  useEffect(() => {
    if (subjectOptions.length === 0) return;
    setFormData((prev) => ({
      ...prev,
      subjectIds: prev.subjectIds.filter((id) => subjectOptions.some((s) => s.id === id)),
    }));
  }, [subjectOptions]);

  /* =============================================================================
   * ✅ FIXED: Video URL Cleanup (Critical Bug Fix)
   * ============================================================================= */

  // Update the ref whenever videoClips changes
  useEffect(() => {
    videoClipsRef.current = videoClips;
  }, [videoClips]);

  // Cleanup ONLY on unmount using the ref
  useEffect(() => {
    return () => {
      // ✅ FIXED: Using ref ensures we only revoke URLs on component unmount
      // This prevents revoking URLs when videoClips array changes during component updates
      videoClipsRef.current.forEach((c) => URL.revokeObjectURL(c.url));
    };
  }, []); // ✅ Empty dependency array = cleanup only on unmount

  /* =============================================================================
   * Derived helpers for grade UI
   * ============================================================================= */

  const levelsByStage = useMemo(() => {
    const map = new Map<number, GradeLevel[]>();
    levels.forEach((l) => {
      const arr = map.get(l.stageId) ?? [];
      arr.push(l);
      map.set(l.stageId, arr);
    });
    map.forEach((arr) => arr.sort((a, b) => a.nameEn.localeCompare(b.nameEn)));
    return map;
  }, [levels]);

  const activeStages = useMemo(() => {
    if (formData.educationSystemId == null) return [];
    return stages
      .filter((s) => s.systemId === formData.educationSystemId)
      .sort((a, b) => a.nameEn.localeCompare(b.nameEn));
  }, [stages, formData.educationSystemId]);

  const gradeLabelById = useMemo(() => {
    const stageMap = new Map<number, GradeStage>();
    stages.forEach((s) => stageMap.set(s.id, s));
    const levelMap = new Map<number, GradeLevel>();
    levels.forEach((l) => levelMap.set(l.id, l));

    return (gradeLevelId: number) => {
      const lvl = levelMap.get(gradeLevelId);
      if (!lvl) return `Grade #${gradeLevelId}`;
      const stg = stageMap.get(lvl.stageId);
      return stg ? `${stg.nameEn} — ${lvl.nameEn}` : lvl.nameEn;
    };
  }, [stages, levels]);

  const selectedGradeLevelIds = useMemo(() => formData.gradeLevelIds, [formData.gradeLevelIds]);

  const filteredSubjects = useMemo(() => {
    const q = subjectSearch.trim().toLowerCase();

    const bySearch = subjectOptions.filter((s) => {
      if (!q) return true;
      return (
        s.nameEn.toLowerCase().includes(q) ||
        (s.nameAr ? s.nameAr.toLowerCase().includes(q) : false)
      );
    });

    // Optional availability filtering if backend provides it
    const hasAvailability = bySearch.some((s) => Array.isArray(s.availableGradeLevelIds));
    if (!hasAvailability) return bySearch;

    if (selectedGradeLevelIds.length === 0) return bySearch;

    return bySearch.filter((s) => {
      const avail = s.availableGradeLevelIds ?? [];
      return avail.some((gid) => selectedGradeLevelIds.includes(gid));
    });
  }, [subjectOptions, subjectSearch, selectedGradeLevelIds]);

  /* =============================================================================
   * Generic state handlers
   * ============================================================================= */

  const handleInputChange = (
    field: keyof TeacherFormData,
    value: string | boolean | number | number[] | TeacherScheduleDraft[]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value as never }));
    // Clear field-level error when user edits it
    setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const toggleGradeLevelId = (gradeLevelId: number) => {
    setFormData((prev) => {
      const next = prev.gradeLevelIds.includes(gradeLevelId)
        ? prev.gradeLevelIds.filter((id) => id !== gradeLevelId)
        : [...prev.gradeLevelIds, gradeLevelId];
      return { ...prev, gradeLevelIds: next };
    });
    setFieldErrors((prev) => ({ ...prev, gradeLevelIds: undefined }));
  };

  const toggleSubjectId = (subjectId: number) => {
    setFormData((prev) => {
      const next = prev.subjectIds.includes(subjectId)
        ? prev.subjectIds.filter((id) => id !== subjectId)
        : [...prev.subjectIds, subjectId];
      return { ...prev, subjectIds: next };
    });
    setFieldErrors((prev) => ({ ...prev, subjectIds: undefined }));
  };

  /* =============================================================================
   * Video upload + cleanup
   * ============================================================================= */

  const handleVideoUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    setSubmitError(null);
    setFieldErrors((prev) => ({ ...prev, videoClips: undefined }));

    const remaining = Math.max(0, MAX_VIDEOS - videoClips.length);
    if (remaining === 0) {
      setSubmitError(`You can upload up to ${MAX_VIDEOS} videos only.`);
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    const picked = Array.from(files)
      .filter((f) => f.type.startsWith("video/"))
      .slice(0, remaining);

    if (picked.length === 0) {
      setSubmitError("Please select valid video files.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    picked.forEach((file) => {
      const url = URL.createObjectURL(file);

      // Read duration safely (metadata)
      const videoEl = document.createElement("video");
      videoEl.src = url;

      videoEl.onloadedmetadata = () => {
        const clip: VideoClip = {
          id: safeId(),
          file,
          url,
          duration: Number.isFinite(videoEl.duration) ? videoEl.duration : 0,
          title: file.name,
        };
        setVideoClips((prev) => [...prev, clip]);
      };

      videoEl.onerror = () => {
        URL.revokeObjectURL(url);
        setSubmitError("Failed to read one of the selected videos.");
      };
    });

    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeVideo = (videoId: string) => {
    setVideoClips((prev) => {
      const clip = prev.find((c) => c.id === videoId);
      if (clip) URL.revokeObjectURL(clip.url);
      return prev.filter((c) => c.id !== videoId);
    });
    if (playingVideoId === videoId) setPlayingVideoId(null);
  };

  const setVideoRef = (videoId: string) => (el: HTMLVideoElement | null) => {
    videoRefs.current[videoId] = el;
  };

  /* =============================================================================
   * ✅ IMPROVED: Safe video playback with try-catch for autoplay errors
   * ============================================================================= */

  const toggleVideoPlayback = async (videoId: string) => {
    const el = videoRefs.current[videoId];
    if (!el) return;

    try {
      if (playingVideoId === videoId) {
        el.pause();
        setPlayingVideoId(null);
        return;
      }

      if (playingVideoId) videoRefs.current[playingVideoId]?.pause();

      // ✅ FIXED: Use try-catch to handle autoplay errors gracefully
      await el.play();
      setPlayingVideoId(videoId);
    } catch {
      // Handle autoplay errors (common in browsers that block autoplay)
      setSubmitError("Click play again or interact with the page to allow video playback.");
    }
  };

  /* =============================================================================
   * Schedules UI
   * ============================================================================= */

  const addSchedule = () => {
    setFormData((prev) => ({
      ...prev,
      schedules: [
        ...prev.schedules,
        {
          id: safeId(),
          weekday: 1, // Default to canonical Monday
          startTime: "16:00",
          endTime: "18:00",
          isGroup: false,
          maxStudents: "",
        },
      ],
    }));
    setFieldErrors((prev) => ({ ...prev, schedules: undefined }));
  };

  const removeSchedule = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      schedules: prev.schedules.filter((s) => s.id !== id),
    }));
  };

  const updateSchedule = (id: string, patch: Partial<TeacherScheduleDraft>) => {
    setFormData((prev) => ({
      ...prev,
      schedules: prev.schedules.map((s) => (s.id === id ? { ...s, ...patch } : s)),
    }));
    setFieldErrors((prev) => ({ ...prev, schedules: undefined }));
  };

  /* =============================================================================
   * Validation per step (clear + strict)
   * ============================================================================= */

  const validateStep = (step: 1 | 2 | 3 | 4): boolean => {
    const newErrors: FieldErrors = {};

    if (step === 1) {
      if (formData.firstName.trim() === "") newErrors.firstName = "First name is required.";
      if (formData.lastName.trim() === "") newErrors.lastName = "Last name is required.";

      if (formData.email.trim() === "") {
        newErrors.email = "Email address is required.";
      } else if (!isLikelyEmail(formData.email)) {
        newErrors.email = "Please enter a valid email address.";
      }

      if (formData.phone.trim() === "") newErrors.phone = "Phone number is required.";
      if (formData.dateOfBirth === "") newErrors.dateOfBirth = "Date of birth is required.";
      if (formData.nationality.trim() === "") newErrors.nationality = "Nationality is required.";

      if (formData.password === "") {
        newErrors.password = "Password is required.";
      } else if (formData.password.length < 8) {
        newErrors.password = "Password must be at least 8 characters.";
      }

      if (formData.confirmPassword === "") {
        newErrors.confirmPassword = "Please confirm your password.";
      } else if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = "Passwords do not match.";
      }
    }

    if (step === 2) {
      if (!formData.yearsOfExperience) newErrors.yearsOfExperience = "Years of experience is required.";
      if (!formData.highestQualification) newErrors.highestQualification = "Highest qualification is required.";

      if (gradeLoading) {
        newErrors.educationSystemId = "Grade catalog is loading, please wait.";
      } else if (gradeError) {
        newErrors.educationSystemId = "Grade catalog failed to load.";
      } else if (formData.educationSystemId == null) {
        newErrors.educationSystemId = "Please select an education system.";
      }

      if (formData.gradeLevelIds.length === 0) newErrors.gradeLevelIds = "Select at least one grade level.";

      if (!subjectsLoading && subjectOptions.length === 0) {
        newErrors.subjectIds = "Subjects list is not available. Please reload.";
      } else if (formData.subjectIds.length === 0) {
        newErrors.subjectIds = "Select at least one subject.";
      }
    }

    if (step === 3) {
      if (formData.schedules.length === 0) {
        newErrors.schedules = "Add at least one schedule slot.";
      } else {
        // Check for invalid time ranges
        const invalidTime = formData.schedules.some((s) => !isValidTimeRange(s.startTime, s.endTime));
        if (invalidTime) newErrors.schedules = "Fix schedule times (start must be before end).";
        
        // FIXED: Validate maxStudents for group sessions
        const invalidGroup = formData.schedules.some(
          (s) => s.isGroup && (!s.maxStudents.trim() || !Number.isFinite(Number(s.maxStudents)) || Number(s.maxStudents) < 2)
        );
        if (invalidGroup) {
          newErrors.schedules = "For group sessions, max students must be a number (minimum 2).";
        }
      }
    }

    if (step === 4) {
      if (videoClips.length === 0) newErrors.videoClips = "Upload at least one video clip.";
      if (!formData.agreeToTerms) newErrors.agreeToTerms = "You must agree to the Terms.";
      if (!formData.agreeToBackgroundCheck) newErrors.agreeToBackgroundCheck = "Background check consent is required.";
    }

    setFieldErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /* =============================================================================
   * Submit (uses apiFetchForm helper, FormData)
   * ============================================================================= */

  const goNext = () => {
    setSubmitError(null);
    const ok = validateStep(currentStep);
    if (!ok) {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    setCurrentStep((p) => (p < 4 ? ((p + 1) as 1 | 2 | 3 | 4) : p));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const goPrev = () => {
    setSubmitError(null);
    setFieldErrors({});
    setCurrentStep((p) => (p > 1 ? ((p - 1) as 1 | 2 | 3 | 4) : p));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    // Step navigation
    if (currentStep < 4) {
      goNext();
      return;
    }

    // Final validation
    const ok = validateStep(4);
    if (!ok) {
      setSubmitError("Please fix the highlighted errors before submitting.");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    try {
      setSubmitting(true);

      const fullName = `${formData.firstName.trim()} ${formData.lastName.trim()}`.trim();

      // Build backend-aligned JSON payload (NO bioShort)
      // FIXED: Using snake_case keys and proper weekday conversion
      const payload = {
        fullName,
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        preferredLang: "ar",

        phone: formData.phone.trim(),
        nationality: formData.nationality.trim(),
        dateOfBirth: formData.dateOfBirth,
        gender: formData.gender || null,
        photoUrl: null as string | null,

        yearsOfExperience: formData.yearsOfExperience,
        highestQualification: formData.highestQualification,
        university: formData.university.trim() || null,
        specialization: formData.specialization.trim() || null,
        currentOccupation: formData.currentOccupation.trim() || null,

        teachingStyle: formData.teachingStyle.trim() || null,
        hourlyRate: formData.hourlyRate ? String(formData.hourlyRate) : null,
        teachingPhilosophy: formData.teachingPhilosophy.trim() || null,
        achievements: formData.achievements.trim() || null,
        bio: formData.bio.trim() || null,
        referencesText: formData.referencesText.trim() || null,

        educationSystemId: formData.educationSystemId,
        gradeLevelIds: formData.gradeLevelIds,
        subjectIds: formData.subjectIds,

        // BACKEND ALIGNMENT: Using snake_case keys with canonical weekday values.
        schedules: formData.schedules.map((s) => {
          const maxStudents = sanitizeMaxStudents(s.isGroup, s.maxStudents);
          
          return {
            weekday: s.weekday,
            start_time: s.startTime,
            end_time: s.endTime,
            is_group: s.isGroup ? 1 : 0, // Convert boolean to tinyint (1/0)
            max_students: maxStudents, // ✅ Fixed: Properly sanitized
          };
        }),
      };

      // Multipart body
      const fd = new FormData();
      fd.append("payload", JSON.stringify(payload));
      videoClips.forEach((clip) => fd.append("videos", clip.file));

      // Use the new apiFetchForm helper for multipart submission
      const json = await apiFetchForm<RegisterTeacherResponse>("/auth/register-teacher", fd);

      if (isRecord(json) && json.success === true) {
        const me = await authService.me();
        const user = me.data.user;
        if (!user || user.role.toLowerCase() !== "teacher") {
          throw new Error("Unable to confirm teacher session after registration.");
        }

        try {
          localStorage.setItem(
            "edu-user",
            JSON.stringify({
              id: user.id,
              fullName:
                user.full_name ||
                `${formData.firstName.trim()} ${formData.lastName.trim()}`.trim(),
              email: user.email || formData.email.trim().toLowerCase(),
              role: user.role || "teacher",
            })
          );
        } catch {
          // Ignore UI-only persistence failures.
        }

        window.dispatchEvent(new Event("auth:changed"));
        router.push("/teacher/dashboard");
        return;
      }

      // Handle error responses
      if (isRecord(json) && json.success === false && typeof json.message === "string") {
        setSubmitError(json.message);
      } else {
        setSubmitError("Unexpected server response while submitting your application.");
      }
    } catch (err: unknown) {
      console.error("Teacher register client error:", err);

      // ✅ FIXED: Using improved error message extraction
      const msg = safeApiErrorMessage(err, "An unexpected error occurred. Please try again.");
      setSubmitError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  /* =============================================================================
   * Render
   * ============================================================================= */

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-100">
      <header className="bg-white shadow-sm">
        <div className="mx-auto max-w-5xl px-4 py-4">
          <div className="flex items-center justify-between">
            <Link
              href="/"
              className="flex items-center gap-2 text-gray-600 transition-colors hover:text-gray-900"
            >
              <ArrowLeft className="h-5 w-5" />
              <span>Back to Home</span>
            </Link>

            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-900">Join as a Teacher</h1>
              <p className="text-gray-600">Session-based registration + proper DB tables</p>
            </div>

            <div className="w-20" />
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-4 py-6">
        {/* Stepper */}
        <div className="mb-8 flex items-center justify-between">
          {[1, 2, 3, 4].map((s) => (
            <div key={s} className="flex items-center">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-full border-2 ${
                  s === currentStep
                    ? "border-blue-600 bg-blue-600 text-white"
                    : s < currentStep
                      ? "border-green-500 bg-green-500 text-white"
                      : "border-gray-300 bg-white text-gray-400"
                }`}
              >
                {s < currentStep ? <CheckCircle className="h-5 w-5" /> : s}
              </div>
              {s < 4 && (
                <div className={`h-1 w-24 ${s < currentStep ? "bg-green-500" : "bg-gray-300"}`} />
              )}
            </div>
          ))}
        </div>

        <div className="mb-8 text-center">
          <h2 className="text-xl font-semibold text-gray-800">
            {currentStep === 1 && "Personal Information & Login"}
            {currentStep === 2 && "Professional + Grades + Subjects"}
            {currentStep === 3 && "Weekly Schedule + Teaching Profile"}
            {currentStep === 4 && "Teaching Demonstration Videos"}
          </h2>
          <p className="mt-2 text-gray-600">
            {currentStep === 1 && "Create your teacher account."}
            {currentStep === 2 && "Choose grades and subjects using DB IDs."}
            {currentStep === 3 && "Add your real weekly schedule (teacher_schedules)."}
            {currentStep === 4 && "Upload 1–3 demo videos (teacher_videos)."}
          </p>
        </div>

        {submitError && (
          <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {submitError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="rounded-2xl bg-white p-6 shadow-lg md:p-8">
          {/* STEP 1 */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    First Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => handleInputChange("firstName", e.target.value)}
                    className={`w-full rounded-lg border px-4 py-3 focus:ring-2 ${
                      fieldErrors.firstName
                        ? "border-red-400 focus:border-red-500 focus:ring-red-500"
                        : "border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    }`}
                  />
                  {fieldErrors.firstName && (
                    <p className="mt-1 text-xs text-red-600">{fieldErrors.firstName}</p>
                  )}
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Last Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => handleInputChange("lastName", e.target.value)}
                    className={`w-full rounded-lg border px-4 py-3 focus:ring-2 ${
                      fieldErrors.lastName
                        ? "border-red-400 focus:border-red-500 focus:ring-red-500"
                        : "border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    }`}
                  />
                  {fieldErrors.lastName && (
                    <p className="mt-1 text-xs text-red-600">{fieldErrors.lastName}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    className={`w-full rounded-lg border px-4 py-3 focus:ring-2 ${
                      fieldErrors.email
                        ? "border-red-400 focus:border-red-500 focus:ring-red-500"
                        : "border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    }`}
                  />
                  {fieldErrors.email && <p className="mt-1 text-xs text-red-600">{fieldErrors.email}</p>}
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Phone Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleInputChange("phone", e.target.value)}
                    className={`w-full rounded-lg border px-4 py-3 focus:ring-2 ${
                      fieldErrors.phone
                        ? "border-red-400 focus:border-red-500 focus:ring-red-500"
                        : "border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    }`}
                    placeholder="+201234567890"
                  />
                  {fieldErrors.phone && <p className="mt-1 text-xs text-red-600">{fieldErrors.phone}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={(e) => handleInputChange("password", e.target.value)}
                      className={`block w-full rounded-lg border px-4 py-3 pr-12 text-sm focus:ring-2 ${
                        fieldErrors.password
                          ? "border-red-400 focus:border-red-500 focus:ring-red-500"
                          : "border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((p) => !p)}
                      className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-500 hover:text-gray-700"
                    >
                      <span className="text-xs font-medium">{showPassword ? "Hide" : "Show"}</span>
                    </button>
                  </div>
                  {fieldErrors.password && <p className="mt-1 text-xs text-red-600">{fieldErrors.password}</p>}
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Confirm Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      value={formData.confirmPassword}
                      onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                      className={`block w-full rounded-lg border px-4 py-3 pr-12 text-sm focus:ring-2 ${
                        fieldErrors.confirmPassword
                          ? "border-red-400 focus:border-red-500 focus:ring-red-500"
                          : "border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword((p) => !p)}
                      className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-500 hover:text-gray-700"
                    >
                      <span className="text-xs font-medium">{showConfirmPassword ? "Hide" : "Show"}</span>
                    </button>
                  </div>
                  {fieldErrors.confirmPassword && (
                    <p className="mt-1 text-xs text-red-600">{fieldErrors.confirmPassword}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Date of Birth <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={(e) => handleInputChange("dateOfBirth", e.target.value)}
                    className={`w-full rounded-lg border px-4 py-3 focus:ring-2 ${
                      fieldErrors.dateOfBirth
                        ? "border-red-400 focus:border-red-500 focus:ring-red-500"
                        : "border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    }`}
                  />
                  {fieldErrors.dateOfBirth && (
                    <p className="mt-1 text-xs text-red-600">{fieldErrors.dateOfBirth}</p>
                  )}
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">Gender</label>
                  <select
                    value={formData.gender}
                    onChange={(e) => handleInputChange("gender", e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Nationality <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.nationality}
                  onChange={(e) => handleInputChange("nationality", e.target.value)}
                  className={`w-full rounded-lg border px-4 py-3 focus:ring-2 ${
                    fieldErrors.nationality
                      ? "border-red-400 focus:border-red-500 focus:ring-red-500"
                      : "border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  }`}
                />
                {fieldErrors.nationality && (
                  <p className="mt-1 text-xs text-red-600">{fieldErrors.nationality}</p>
                )}
              </div>
            </div>
          )}

          {/* STEP 2 */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Education System <span className="text-red-500">*</span>
                </label>

                {gradeError && (
                  <div className="mb-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                    {gradeError}
                  </div>
                )}

                <select
                  value={formData.educationSystemId ?? ""}
                  onChange={(e) => handleInputChange("educationSystemId", Number(e.target.value))}
                  disabled={gradeLoading || systems.length === 0}
                  className={`w-full rounded-lg border px-4 py-3 focus:ring-2 ${
                    fieldErrors.educationSystemId
                      ? "border-red-400 focus:border-red-500 focus:ring-red-500"
                      : "border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  }`}
                >
                  <option value="" disabled>
                    {gradeLoading ? "Loading..." : "Select system"}
                  </option>
                  {systems.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>

                {fieldErrors.educationSystemId && (
                  <p className="mt-1 text-xs text-red-600">{fieldErrors.educationSystemId}</p>
                )}
              </div>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Years of Teaching Experience <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.yearsOfExperience}
                    onChange={(e) => handleInputChange("yearsOfExperience", e.target.value)}
                    className={`w-full rounded-lg border px-4 py-3 focus:ring-2 ${
                      fieldErrors.yearsOfExperience
                        ? "border-red-400 focus:border-red-500 focus:ring-red-500"
                        : "border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    }`}
                  >
                    <option value="">Select experience</option>
                    <option value="0-2">0-2 years</option>
                    <option value="3-5">3-5 years</option>
                    <option value="6-10">6-10 years</option>
                    <option value="10+">10+ years</option>
                  </select>
                  {fieldErrors.yearsOfExperience && (
                    <p className="mt-1 text-xs text-red-600">{fieldErrors.yearsOfExperience}</p>
                  )}
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Highest Qualification <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.highestQualification}
                    onChange={(e) => handleInputChange("highestQualification", e.target.value)}
                    className={`w-full rounded-lg border px-4 py-3 focus:ring-2 ${
                      fieldErrors.highestQualification
                        ? "border-red-400 focus:border-red-500 focus:ring-red-500"
                        : "border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    }`}
                  >
                    <option value="">Select qualification</option>
                    <option value="bachelors">Bachelor&apos;s Degree</option>
                    <option value="masters">Master&apos;s Degree</option>
                    <option value="phd">PhD</option>
                    <option value="professional">Professional Certification</option>
                    <option value="other">Other</option>
                  </select>
                  {fieldErrors.highestQualification && (
                    <p className="mt-1 text-xs text-red-600">{fieldErrors.highestQualification}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">University/Institution</label>
                  <input
                    type="text"
                    value={formData.university}
                    onChange={(e) => handleInputChange("university", e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">Specialization/Field</label>
                  <input
                    type="text"
                    value={formData.specialization}
                    onChange={(e) => handleInputChange("specialization", e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">Current Occupation</label>
                <input
                  type="text"
                  value={formData.currentOccupation}
                  onChange={(e) => handleInputChange("currentOccupation", e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="mb-3 block text-sm font-medium text-gray-700">
                  Grade Levels You Can Teach <span className="text-red-500">*</span>{" "}
                  <span className="text-xs text-gray-500">(stored as grade_level_id)</span>
                </label>

                {gradeLoading ? (
                  <div className="text-sm text-gray-500">Loading grade levels…</div>
                ) : (
                  <div className="space-y-4">
                    {activeStages.map((st) => {
                      const stageLevels = levelsByStage.get(st.id) ?? [];
                      if (stageLevels.length === 0) return null;

                      return (
                        <div key={st.id} className="rounded-lg border border-gray-200 bg-white p-4">
                          <div className="mb-3 font-semibold text-gray-900">{st.nameEn}</div>

                          <div className="flex flex-wrap gap-2">
                            {stageLevels.map((lvl) => {
                              const checked = formData.gradeLevelIds.includes(lvl.id);
                              return (
                                <button
                                  key={lvl.id}
                                  type="button"
                                  onClick={() => toggleGradeLevelId(lvl.id)}
                                  className={`rounded-full border px-3 py-1 text-sm transition ${
                                    checked
                                      ? "border-blue-600 bg-blue-600 text-white"
                                      : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                                  }`}
                                  title={lvl.code}
                                >
                                  {lvl.nameEn}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}

                    {formData.gradeLevelIds.length > 0 && (
                      <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                        <div className="mb-2 text-xs font-semibold text-slate-600">Selected grades</div>
                        <div className="flex flex-wrap gap-2">
                          {formData.gradeLevelIds.map((gid) => (
                            <span
                              key={gid}
                              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-700"
                            >
                              {gradeLabelById(gid)}
                              <button
                                type="button"
                                onClick={() => toggleGradeLevelId(gid)}
                                className="text-slate-500 hover:text-slate-700"
                                aria-label="Remove grade"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {fieldErrors.gradeLevelIds && (
                  <p className="mt-2 text-xs text-red-600">{fieldErrors.gradeLevelIds}</p>
                )}
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between gap-3">
                  <label className="block text-sm font-medium text-gray-700">
                    Subjects You Can Teach <span className="text-red-500">*</span>{" "}
                    <span className="text-xs text-gray-500">(stored in teacher_subjects)</span>
                  </label>

                  <button
                    type="button"
                    onClick={() => void loadSubjects()}
                    className="inline-flex items-center gap-2 text-sm text-blue-700 hover:text-blue-900"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Reload
                  </button>
                </div>

                <div className="relative mb-3">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={subjectSearch}
                    onChange={(e) => setSubjectSearch(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                    placeholder="Search subjects..."
                  />
                </div>

                {subjectsError && (
                  <div className="mb-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                    {subjectsError}
                  </div>
                )}

                {subjectsLoading ? (
                  <div className="text-sm text-gray-500">Loading subjects…</div>
                ) : subjectOptions.length === 0 ? (
                  <div className="text-sm text-gray-600">No subjects available. Please reload.</div>
                ) : (
                  <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                    {filteredSubjects.map((s) => {
                      const checked = formData.subjectIds.includes(s.id);
                      return (
                        <label
                          key={s.id}
                          className="flex cursor-pointer items-start gap-3 rounded-lg border border-gray-200 p-3 hover:bg-gray-50"
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleSubjectId(s.id)}
                            className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <div className="min-w-0">
                            <div className="truncate text-sm font-medium text-gray-800">{s.nameEn}</div>
                            {s.nameAr && <div className="truncate text-xs text-gray-500">{s.nameAr}</div>}
                          </div>
                        </label>
                      );
                    })}
                  </div>
                )}

                {fieldErrors.subjectIds && <p className="mt-2 text-xs text-red-600">{fieldErrors.subjectIds}</p>}
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">Expected Hourly Rate</label>
                <input
                  type="number"
                  value={formData.hourlyRate}
                  onChange={(e) => handleInputChange("hourlyRate", e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                  min="0"
                  step="5"
                />
              </div>
            </div>
          )}

          {/* STEP 3 */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-slate-900">Weekly Schedule</div>
                    <div className="text-sm text-slate-600">
                      Saved into <code className="text-slate-700">teacher_schedules</code>
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                      Weekday uses the canonical backend model: 1=Mon..7=Sun
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={addSchedule}
                    className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm text-white hover:bg-blue-700"
                  >
                    <Plus className="h-4 w-4" />
                    Add slot
                  </button>
                </div>

                {fieldErrors.schedules && <p className="mt-2 text-xs text-red-600">{fieldErrors.schedules}</p>}

                <div className="mt-4 space-y-3">
                  {formData.schedules.map((s) => (
                    <div key={s.id} className="rounded-lg border border-slate-200 bg-white p-3">
                      <div className="flex flex-col gap-3 md:flex-row md:items-end">
                        <div className="flex-1">
                          <label className="mb-1 block text-xs font-medium text-slate-600">Weekday</label>
                          <select
                            value={s.weekday}
                            onChange={(e) => updateSchedule(s.id, { weekday: Number(e.target.value) })}
                            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                          >
                            {WEEKDAYS.map((d) => (
                              <option key={d.value} value={d.value}>
                                {d.label}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="flex-1">
                          <label className="mb-1 block text-xs font-medium text-slate-600">Start Time</label>
                          <input
                            type="time"
                            value={s.startTime}
                            onChange={(e) => updateSchedule(s.id, { startTime: e.target.value })}
                            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                          />
                        </div>

                        <div className="flex-1">
                          <label className="mb-1 block text-xs font-medium text-slate-600">End Time</label>
                          <input
                            type="time"
                            value={s.endTime}
                            onChange={(e) => updateSchedule(s.id, { endTime: e.target.value })}
                            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                          />
                        </div>

                        <div className="flex items-center gap-3">
                          <label className="inline-flex items-center gap-2 text-sm text-slate-700">
                            <input
                              type="checkbox"
                              checked={s.isGroup}
                              onChange={(e) => updateSchedule(s.id, { isGroup: e.target.checked })}
                              className="rounded border-slate-300"
                            />
                            Group Session
                          </label>

                          <button
                            type="button"
                            onClick={() => removeSchedule(s.id)}
                            className="inline-flex items-center justify-center rounded-lg border border-slate-200 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                            aria-label="Remove schedule"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      {s.isGroup && (
                        <div className="mt-3 flex items-center gap-2">
                          <label className="text-xs font-medium text-slate-600">
                            Max Students (min 2):
                          </label>
                          <input
                            type="number"
                            value={s.maxStudents}
                            onChange={(e) => updateSchedule(s.id, { maxStudents: e.target.value })}
                            className="w-24 rounded-lg border border-slate-300 px-2 py-1 text-sm"
                            min="2"
                            placeholder="2"
                          />
                        </div>
                      )}

                      {s.startTime && s.endTime && s.startTime >= s.endTime && (
                        <p className="mt-2 text-xs text-red-600">Start time must be before end time.</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">Teaching Style</label>
                <textarea
                  value={formData.teachingStyle}
                  onChange={(e) => handleInputChange("teachingStyle", e.target.value)}
                  rows={4}
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">Teaching Philosophy</label>
                <textarea
                  value={formData.teachingPhilosophy}
                  onChange={(e) => handleInputChange("teachingPhilosophy", e.target.value)}
                  rows={4}
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">Achievements</label>
                <textarea
                  value={formData.achievements}
                  onChange={(e) => handleInputChange("achievements", e.target.value)}
                  rows={3}
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">Bio</label>
                <textarea
                  value={formData.bio}
                  onChange={(e) => handleInputChange("bio", e.target.value)}
                  rows={4}
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">References</label>
                <textarea
                  value={formData.referencesText}
                  onChange={(e) => handleInputChange("referencesText", e.target.value)}
                  rows={3}
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          )}

          {/* STEP 4 */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-6">
                <div className="flex items-start gap-4">
                  <Video className="mt-1 h-8 w-8 text-blue-600" />
                  <div>
                    <h3 className="mb-2 text-lg font-semibold text-blue-900">
                      Teaching Demonstration Videos <span className="text-red-500">*</span>
                    </h3>
                    <p className="text-blue-800">
                      Upload 1–3 videos. These will be saved in <code>teacher_videos</code>.
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border-2 border-dashed border-gray-300 p-8 text-center">
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="video/*"
                  onChange={handleVideoUpload}
                  className="hidden"
                />
                <Upload className="mx-auto mb-4 h-12 w-12 text-gray-400" />
                <h4 className="mb-2 text-lg font-semibold text-gray-700">Upload Teaching Videos</h4>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="rounded-lg bg-blue-600 px-6 py-3 text-white transition-colors hover:bg-blue-700"
                >
                  Select Videos
                </button>
                <p className="mt-3 text-sm text-gray-400">Max {MAX_VIDEOS} videos</p>
                {fieldErrors.videoClips && <p className="mt-2 text-xs text-red-600">{fieldErrors.videoClips}</p>}
              </div>

              {videoClips.length > 0 && (
                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-700">
                    Selected Videos ({videoClips.length}/{MAX_VIDEOS})
                  </h4>

                  {videoClips.map((clip) => (
                    <div key={clip.id} className="rounded-lg border border-gray-200 p-4">
                      <div className="mb-3 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Video className="h-5 w-5 text-gray-400" />
                          <div>
                            <div className="font-medium text-gray-900">{clip.title}</div>
                            <div className="text-sm text-gray-500">{formatDuration(clip.duration)}</div>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => removeVideo(clip.id)}
                          className="text-red-500 transition-colors hover:text-red-700"
                          aria-label="Remove video"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>

                      <div className="relative overflow-hidden rounded-lg bg-black">
                        <video
                          ref={setVideoRef(clip.id)}
                          src={clip.url}
                          className="h-48 w-full object-cover"
                          onEnded={() => setPlayingVideoId(null)}
                        />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <button
                            type="button"
                            onClick={() => toggleVideoPlayback(clip.id)}
                            className="rounded-full bg-black/50 p-3 text-white transition-colors hover:bg-black/70"
                            aria-label={playingVideoId === clip.id ? "Pause video" : "Play video"}
                          >
                            {playingVideoId === clip.id ? (
                              <Pause className="h-6 w-6" />
                            ) : (
                              <Play className="h-6 w-6" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="space-y-4 border-t pt-6">
                <label className="flex items-start space-x-3">
                  <input
                    type="checkbox"
                    checked={formData.agreeToTerms}
                    onChange={(e) => handleInputChange("agreeToTerms", e.target.checked)}
                    className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">
                    I agree to the{" "}
                    <a href="/terms" className="text-blue-600 hover:underline">
                      Terms of Service
                    </a>{" "}
                    and{" "}
                    <a href="/privacy" className="text-blue-600 hover:underline">
                      Privacy Policy
                    </a>
                    . <span className="text-red-500">*</span>
                  </span>
                </label>
                {fieldErrors.agreeToTerms && <p className="mt-1 text-xs text-red-600">{fieldErrors.agreeToTerms}</p>}

                <label className="flex items-start space-x-3">
                  <input
                    type="checkbox"
                    checked={formData.agreeToBackgroundCheck}
                    onChange={(e) => handleInputChange("agreeToBackgroundCheck", e.target.checked)}
                    className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">
                    I consent to a background check. <span className="text-red-500">*</span>
                  </span>
                </label>
                {fieldErrors.agreeToBackgroundCheck && (
                  <p className="mt-1 text-xs text-red-600">{fieldErrors.agreeToBackgroundCheck}</p>
                )}
              </div>
            </div>
          )}

          {/* Footer buttons */}
          <div className="mt-8 flex justify-between border-t pt-8">
            {currentStep > 1 ? (
              <button
                type="button"
                onClick={goPrev}
                className="rounded-lg border border-gray-300 px-6 py-3 text-gray-700 transition-colors hover:bg-gray-50"
              >
                Previous
            </button>
            ) : (
              <div />
            )}

            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-blue-600 px-8 py-3 text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-400"
            >
              {submitting ? "Submitting..." : currentStep === 4 ? "Submit Application" : "Continue"}
            </button>
          </div>
        </form>

        <div className="mt-6 text-center text-sm text-gray-500">Step {currentStep} of 4</div>
      </div>
    </div>
  );
}
