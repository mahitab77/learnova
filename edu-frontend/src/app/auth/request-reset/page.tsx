// src/app/auth/request-reset/page.tsx
"use client";

import React, { useState } from "react";
import { authService } from "@/src/services/authService";

// backend POST /auth/request-reset
// body: { email }
// response: { success, message }

type RequestResetSuccess = {
  success: true;
  message?: string;
};

type RequestResetError = {
  success: false;
  message?: string;
};

type RequestResetResponse = RequestResetSuccess | RequestResetError | unknown;

export default function RequestResetPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);

    if (!email.trim()) {
      setError("Email is required.");
      return;
    }

    try {
      setLoading(true);

      const data: RequestResetResponse = await authService.requestPasswordReset(
        email.trim()
      );

      // Backend returns the same response shape for existing/non-existing emails.
      if (
        typeof data === "object" &&
        data !== null &&
        "success" in data &&
        (data as { success: unknown }).success === true
      ) {
        const msg =
          (data as RequestResetSuccess).message ??
          "If this email exists, an OTP has been sent.";
        setInfo(msg);
        try {
          sessionStorage.setItem("passwordResetEmail", email.trim());
        } catch {
          // Ignore storage failures and keep flow usable.
        }

        return;
      }

      throw new Error("Unable to request password reset.");
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Unexpected error while requesting OTP.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4" dir="auto">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-sm border border-slate-100 p-6">
        <h1 className="text-2xl font-semibold text-slate-900 mb-1">
          Request password reset
        </h1>
        <p className="text-slate-500 text-sm mb-5">
          Enter your email. If it exists, we will send you a 6-digit OTP.
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

          <button
            type="submit"
            disabled={loading}
            className={`w-full inline-flex items-center justify-center rounded-md px-3 py-2 text-sm font-medium text-white transition ${
              loading
                ? "bg-emerald-300 cursor-not-allowed"
                : "bg-emerald-500 hover:bg-emerald-600"
            }`}
          >
            {loading ? "Sending OTP..." : "Send OTP"}
          </button>
        </form>
      </div>
    </div>
  );
}
