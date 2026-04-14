// src/app/admin/dashboard/components/SettingsPanel.tsx
"use client";

import { useState, useEffect } from "react";
import type { Lang } from "../adminTypes";
import type { LangTexts } from "../adminTexts";


// Rename to avoid conflict with service type
type SettingsPanelAdminSettings = {
  gradeLevels: string[];
  termStartDate: string | null;
  termEndDate: string | null;
  defaultLanguage: string;
  autoEmailTeachersOnParentChange: boolean;
};

export type SettingsPanelProps = {
  lang: Lang;
  t: LangTexts;
  settings: SettingsPanelAdminSettings | null;
  settingsLoading: boolean;
  settingsError: string | null;
  onUpdateSettings: (settings: Partial<SettingsPanelAdminSettings>) => Promise<void>;
};

// Default settings for when data is null
const DEFAULT_SETTINGS: SettingsPanelAdminSettings = {
  gradeLevels: [],
  termStartDate: null,
  termEndDate: null,
  defaultLanguage: "ar",
  autoEmailTeachersOnParentChange: false,
};

// Helper function to format date for input[type="date"]
const formatDateForInput = (dateString: string | null | undefined): string => {
  if (!dateString) return "";
  try {
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
  } catch {
    return "";
  }
};

export function SettingsPanel({
  lang,
  t,
  settings: propSettings,
  settingsLoading,
  settingsError,
  onUpdateSettings,
}: SettingsPanelProps) {
  const dir = lang === "ar" ? "rtl" : "ltr";
  const [isEditing, setIsEditing] = useState(false);
  
  // Convert prop settings to component format if needed
  const componentSettings = propSettings || DEFAULT_SETTINGS;
  
  // Initialize local state with prop settings
  const [localSettings, setLocalSettings] = useState<SettingsPanelAdminSettings>(componentSettings);
  const [newGradeLevel, setNewGradeLevel] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Update localSettings when propSettings changes
  useEffect(() => {
    if (propSettings) {
      setLocalSettings(propSettings);
    }
  }, [propSettings]);

  const handleSave = async () => {
    setIsSaving(true);
    setSaveError(null);
    
    try {
      await onUpdateSettings(localSettings);
      setIsEditing(false);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to save settings";
      setSaveError(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    // Reset to original settings
    setLocalSettings(componentSettings);
    setNewGradeLevel("");
    setSaveError(null);
    setIsEditing(false);
  };

  const addGradeLevel = () => {
    const trimmedLevel = newGradeLevel.trim();
    if (trimmedLevel && !localSettings.gradeLevels.includes(trimmedLevel)) {
      setLocalSettings(prev => ({
        ...prev,
        gradeLevels: [...prev.gradeLevels, trimmedLevel]
      }));
      setNewGradeLevel("");
    }
  };

  const removeGradeLevel = (level: string) => {
    setLocalSettings(prev => ({
      ...prev,
      gradeLevels: prev.gradeLevels.filter(l => l !== level)
    }));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      addGradeLevel();
    }
  };

  if (settingsLoading) {
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
    <section 
      className="rounded-2xl bg-white border border-slate-100 shadow-sm p-6 space-y-6" 
      dir={dir}
    >
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">{t.settingsTitle}</h2>
          <p className="text-sm text-slate-500 mt-1">{t.settingsDesc}</p>
        </div>
        {!isEditing ? (
          <button
            onClick={() => setIsEditing(true)}
            className="bg-emerald-500 text-white px-4 py-2 rounded-md text-sm hover:bg-emerald-600"
          >
            {t.settingsEdit}
          </button>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className={`bg-emerald-500 text-white px-4 py-2 rounded-md text-sm hover:bg-emerald-600 disabled:bg-emerald-300 disabled:cursor-not-allowed ${
                isSaving ? "opacity-75" : ""
              }`}
            >
              {isSaving ? t.loading : t.settingsSave}
            </button>
            <button
              onClick={handleCancel}
              className="bg-slate-500 text-white px-4 py-2 rounded-md text-sm hover:bg-slate-600"
            >
              {t.cancel}
            </button>
          </div>
        )}
      </header>

      {/* Error messages */}
      {settingsError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700 text-sm">{settingsError}</p>
        </div>
      )}
      
      {saveError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700 text-sm">{saveError}</p>
        </div>
      )}

      {/* Grade Levels */}
      <div className="border border-slate-200 rounded-lg p-4">
        <h3 className="font-semibold text-slate-900 mb-4">{t.settingsGradeLevels}</h3>
        <div className="space-y-3">
          {isEditing ? (
            <>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newGradeLevel}
                  onChange={(e) => setNewGradeLevel(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="flex-1 border border-slate-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder={t.settingsAddGradeLevel}
                  disabled={isSaving}
                />
                <button
                  onClick={addGradeLevel}
                  disabled={!newGradeLevel.trim() || isSaving}
                  className="bg-blue-500 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-600 disabled:bg-slate-300 disabled:cursor-not-allowed"
                >
                  {t.add}
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {localSettings.gradeLevels.map(level => (
                  <span
                    key={level}
                    className="bg-slate-100 text-slate-700 px-3 py-1 rounded-full text-sm flex items-center gap-1"
                  >
                    {level}
                    <button
                      onClick={() => removeGradeLevel(level)}
                      className="text-red-500 hover:text-red-700 text-lg leading-none"
                      aria-label={`Remove ${level}`}
                      disabled={isSaving}
                    >
                      ×
                    </button>
                  </span>
                ))}
                {localSettings.gradeLevels.length === 0 && (
                  <p className="text-slate-500 text-sm italic">{t.settingsNoGradeLevels}</p>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-2">
                {lang === "ar" 
                  ? "أضف مستويات دراسية واضغط Enter أو زر الإضافة"
                  : "Add grade levels and press Enter or the Add button"}
              </p>
            </>
          ) : (
            <div className="flex flex-wrap gap-2">
              {localSettings.gradeLevels.map(level => (
                <span
                  key={level}
                  className="bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full text-sm"
                >
                  {level}
                </span>
              ))}
              {localSettings.gradeLevels.length === 0 && (
                <p className="text-slate-500 text-sm italic">{t.settingsNoGradeLevels}</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Term Dates */}
      <div className="border border-slate-200 rounded-lg p-4">
        <h3 className="font-semibold text-slate-900 mb-4">{t.settingsTermDates}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              {t.settingsTermStart}
            </label>
            <input
              type="date"
              value={formatDateForInput(localSettings.termStartDate)}
              onChange={(e) => setLocalSettings(prev => ({ 
                ...prev, 
                termStartDate: e.target.value || null 
              }))}
              className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm disabled:bg-slate-50 disabled:text-slate-500"
              disabled={!isEditing || isSaving}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              {t.settingsTermEnd}
            </label>
            <input
              type="date"
              value={formatDateForInput(localSettings.termEndDate)}
              onChange={(e) => setLocalSettings(prev => ({ 
                ...prev, 
                termEndDate: e.target.value || null 
              }))}
              className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm disabled:bg-slate-50 disabled:text-slate-500"
              disabled={!isEditing || isSaving}
            />
          </div>
        </div>
        <p className="text-xs text-slate-500 mt-2">
          {lang === "ar" 
            ? "حدد تاريخ بداية ونهاية الفصل الدراسي"
            : "Set the start and end dates for the term"}
        </p>
      </div>

      {/* System Settings */}
      <div className="border border-slate-200 rounded-lg p-4">
        <h3 className="font-semibold text-slate-900 mb-4">{t.settingsSystem}</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              {t.settingsDefaultLanguage}
            </label>
            <select
              value={localSettings.defaultLanguage}
              onChange={(e) => setLocalSettings(prev => ({ 
                ...prev, 
                defaultLanguage: e.target.value 
              }))}
              className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm disabled:bg-slate-50 disabled:text-slate-500"
              disabled={!isEditing || isSaving}
            >
              <option value="ar">العربية</option>
              <option value="en">English</option>
            </select>
            <p className="text-xs text-slate-500 mt-1">
              {lang === "ar" 
                ? "اللغة الافتراضية التي ستظهر للنظام"
                : "Default language for the system interface"}
            </p>
          </div>
          <div className="flex items-start gap-3">
            <div className="flex items-center h-5 mt-0.5">
              <input
                type="checkbox"
                id="autoEmail"
                checked={localSettings.autoEmailTeachersOnParentChange}
                onChange={(e) => setLocalSettings(prev => ({ 
                  ...prev, 
                  autoEmailTeachersOnParentChange: e.target.checked 
                }))}
                className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                disabled={!isEditing || isSaving}
              />
            </div>
            <div>
              <label 
                htmlFor="autoEmail" 
                className="text-sm text-slate-700 cursor-pointer"
              >
                {t.settingsAutoEmailTeachers}
              </label>
              <p className="text-xs text-slate-500 mt-1">
                {lang === "ar" 
                  ? "إرسال بريد إلكتروني تلقائي للمعلمين عند تغيير ولي أمر الطالب"
                  : "Automatically email teachers when a parent changes their child's teacher"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Edit mode hint */}
      {isEditing && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-700 flex items-start gap-2">
            <span className="text-blue-500">💡</span>
            {lang === "ar" 
              ? "أنت الآن في وضع التعديل. احفظ التغييرات أو ألغها."
              : "You are in edit mode. Save your changes or cancel."}
          </p>
        </div>
      )}
    </section>
  );
}