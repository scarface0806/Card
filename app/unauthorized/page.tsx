"use client";

import Link from "next/link";

export default function UnauthorizedPage() {
  return (
    <div className="frontend-dark tv-hero min-h-screen flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="mb-7">
          <svg
            className="mx-auto h-14 w-14 text-[#C9A961]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
        <h1 className="tv-h2 mb-4">Access denied</h1>
        <p className="tv-lead mb-9">
          You don&apos;t have permission to access this page. This area is
          restricted to administrators only.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/"
            className="tv-btn tv-btn-lg tv-btn-primary"
          >
            Go to Home
          </Link>
          <Link
            href="/dashboard"
            className="tv-btn tv-btn-lg tv-btn-secondary"
          >
            Go to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
