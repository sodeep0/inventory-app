"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

interface MovementFormFooterProps {
  summary?: string;
  cancelHref?: string;
  submitLabel: string;
  submittingLabel: string;
  onSubmit: () => void;
  isSubmitting: boolean;
  disabled?: boolean;
}

export function MovementFormFooter({
  summary,
  cancelHref = "/movements",
  submitLabel,
  submittingLabel,
  onSubmit,
  isSubmitting,
  disabled,
}: MovementFormFooterProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      {summary ? (
        <p className="text-sm text-muted-foreground">{summary}</p>
      ) : (
        <span className="hidden sm:block" />
      )}
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:shrink-0">
        <Button variant="outline" asChild className="w-full sm:w-auto">
          <Link href={cancelHref}>Cancel</Link>
        </Button>
        <Button
          type="button"
          onClick={onSubmit}
          disabled={disabled || isSubmitting}
          className="w-full sm:w-auto"
        >
          {isSubmitting ? submittingLabel : submitLabel}
        </Button>
      </div>
    </div>
  );
}
