"use client";

interface MovementErrorBannerProps {
  message: string;
}

export function MovementErrorBanner({ message }: MovementErrorBannerProps) {
  if (!message) return null;
  return (
    <div className="rounded-lg border border-pale-red-text/20 bg-pale-red-bg px-4 py-2.5 text-sm text-pale-red-text">
      {message}
    </div>
  );
}
