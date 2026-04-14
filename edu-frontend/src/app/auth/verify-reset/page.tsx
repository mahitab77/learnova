// src/app/auth/verify-reset/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { API_BASE } from "@/src/lib/api";

// backend: POST /auth/verify-reset
// body: { email, otp, newPassword }
// response: { success, message }

type VerifySuccess = {
  success: true;
  message?: string;
};

type VerifyError = {
  success: false;
  message?: string;
};

type VerifyResponse = VerifySuccess | VerifyError | unknown;

export default function VerifyResetPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  useEffect(() => {
    try {
      const storedEmail = sessionStorage.getItem("passwordResetEmail");
      if (storedEmail) setEmail(storedEmail);
    } catch {
      // Ignore storage access failures and allow manual entry.
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);

    if (!email.trim() || !otp.trim() || !newPassword.trim()) {
      setError("Email, OTP, and new password are required.");
      return;
    }

    try {
      setLoading(true);

      const res = await fetch(`${API_BASE}/auth/verify-reset`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim(),
          otp: otp.trim(),
          newPassword: newPassword.trim(),
        }),
      });

      const data: VerifyResponse = await res.json().catch(() => {
        return { success: false, message: "Invalid server response." };
      });

      if (!res.ok) {
        const msg =
          typeof data === "object" &&
          data !== null &&
          "message" in data &&
          typeof (data as { message?: string }).message === "string"
            ? (data as { message: string }).message
            : "Password reset failed.";
        throw new Error(msg);
      }

      if (
        typeof data === "object" &&
        data !== null &&
        "success" in data &&
        (data as { success: unknown }).success === true
      ) {
        const msg =
          (data as VerifySuccess).message ?? "Password updated successfully.";
        setInfo(msg);

        // After success, send user to login
        setTimeout(() => {
          try {
            sessionStorage.removeItem("passwordResetEmail");
          } catch {
            // Ignore storage failures.
          }
          router.push("/auth/login");
        }, 1200);

        return;
      }

      throw new Error("Unable to verify OTP.");
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Unexpected error while verifying OTP.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4" dir="auto">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-sm border border-slate-100 p-6">
        <h1 className="text-2xl font-semibold text-slate-900 mb-1">
          Verify reset
        </h1>
        <p className="text-slate-500 text-sm mb-5">
          Enter the OTP you received and choose a new password.
        </p>

        {error ? (
          <div className="mb-4 rounded-md bg-red-50 border border-red-200 text-red-700 px-3 py-2 text-sm">
            {error}
          </div>
        ) : null}

        {info ? (
          <div className="mb-4 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-700 px-3 py-2 text-sm">
            {info}
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email */}
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-slate-700 mb-1"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="block w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              placeholder="you@example.com"
            />
          </div>

          {/* OTP */}
          <div>
            <label
              htmlFor="otp"
              className="block text-sm font-medium text-slate-700 mb-1"
            >
              OTP
            </label>
            <input
              id="otp"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              className="block w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              placeholder="6-digit code"
            />
          </div>

          {/* New password */}
          <div>
            <label
              htmlFor="newPassword"
              className="block text-sm font-medium text-slate-700 mb-1"
            >
              New password
            </label>
            <input
              id="newPassword"
              type="password"
              autoComplete="new-password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="block w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full inline-flex items-center justify-center rounded-md px-3 py-2 text-sm font-medium text-white transition ${
              loading
                ? "bg-emerald-300 cursor-not-allowed"
                : "bg-emerald-500 hover:bg-emerald-600"
            }`}
          >
            {loading ? "Verifying..." : "Confirm reset"}
          </button>
        </form>
      </div>
    </div>
  );
}
