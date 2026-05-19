"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PhosphorIcon } from "@/components/icons";

const STORAGE_KEY = "stockKeeperOnboardingComplete";

interface OnboardingChecklistProps {
  totalItems: number;
  onAddItem?: () => void;
  onImportCsv?: () => void;
}

export function OnboardingChecklist({
  totalItems,
  onAddItem,
  onImportCsv,
}: OnboardingChecklistProps) {
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    try {
      setDismissed(localStorage.getItem(STORAGE_KEY) === "true");
    } catch {
      setDismissed(false);
    }
  }, []);

  if (dismissed || totalItems > 0) return null;

  const steps = [
    { id: "account", label: "Create your account", done: true },
    { id: "item", label: "Add your first item", done: false },
    { id: "movement", label: "Record a sale or stock change", done: false },
  ];

  const handleDismiss = () => {
    try {
      localStorage.setItem(STORAGE_KEY, "true");
    } catch {
      /* ignore */
    }
    setDismissed(true);
  };

  return (
    <div className="rounded-lg border border-primary/20 bg-primary/5 p-6 space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-medium">Get started with Stock Keeper</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Complete these steps to set up your inventory.
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={handleDismiss} className="shrink-0 text-muted-foreground">
          Dismiss
        </Button>
      </div>
      <ul className="space-y-2">
        {steps.map((step) => (
          <li key={step.id} className="flex items-center gap-3 text-sm">
            <span
              className={`flex h-6 w-6 items-center justify-center rounded-full text-xs ${
                step.done
                  ? "bg-pale-green-bg text-pale-green-text"
                  : "border border-border bg-background text-muted-foreground"
              }`}
            >
              {step.done ? "✓" : steps.indexOf(step) + 1}
            </span>
            <span className={step.done ? "text-muted-foreground line-through" : ""}>
              {step.label}
            </span>
          </li>
        ))}
      </ul>
      <div className="flex flex-col sm:flex-row gap-2 pt-2">
        {onAddItem ? (
          <Button size="sm" onClick={onAddItem}>
            <PhosphorIcon name="Plus" size={14} /> Add Item
          </Button>
        ) : (
          <Button size="sm" asChild>
            <Link href="/inventory">
              <PhosphorIcon name="Plus" size={14} /> Add Item
            </Link>
          </Button>
        )}
        {onImportCsv ? (
          <Button size="sm" variant="outline" onClick={onImportCsv}>
            Import CSV
          </Button>
        ) : (
          <Button size="sm" variant="outline" asChild>
            <Link href="/inventory">Import CSV</Link>
          </Button>
        )}
      </div>
    </div>
  );
}

export function markOnboardingComplete(): void {
  try {
    localStorage.setItem(STORAGE_KEY, "true");
  } catch {
    /* ignore */
  }
}
