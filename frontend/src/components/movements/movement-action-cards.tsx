"use client";

import Link from "next/link";
import { PhosphorIcon, IconName } from "@/components/icons";
import { cn } from "@/lib/utils";

interface MovementAction {
  id: "sale" | "add" | "return" | "adjust";
  label: string;
  description: string;
  icon: IconName;
  href: string;
  accent: string;
  iconBg: string;
}

const ACTIONS: MovementAction[] = [
  {
    id: "sale",
    label: "Record Sale",
    description: "Remove stock — multiple items",
    icon: "Minus",
    href: "/movements/sale",
    accent: "border-pale-red-text/25 hover:bg-pale-red-bg/50",
    iconBg: "bg-pale-red-bg text-pale-red-text",
  },
  {
    id: "add",
    label: "Add Stock",
    description: "Receive units — multiple items",
    icon: "Plus",
    href: "/movements/add-stock",
    accent: "border-pale-green-text/25 hover:bg-pale-green-bg/50",
    iconBg: "bg-pale-green-bg text-pale-green-text",
  },
  {
    id: "return",
    label: "Return",
    description: "Stock coming back in",
    icon: "ArrowCounterClockwise",
    href: "/movements/return",
    accent: "border-pale-yellow-text/30 hover:bg-pale-yellow-bg/50",
    iconBg: "bg-pale-yellow-bg text-pale-yellow-text",
  },
  {
    id: "adjust",
    label: "Adjust",
    description: "Fix count or damage",
    icon: "SlidersHorizontal",
    href: "/movements/adjust",
    accent: "border-pale-blue-text/25 hover:bg-pale-blue-bg/50",
    iconBg: "bg-pale-blue-bg text-pale-blue-text",
  },
];

export function MovementActionCards() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {ACTIONS.map((action) => (
        <Link
          key={action.id}
          href={action.href}
          className={cn(
            "flex items-start gap-3 rounded-xl border bg-card p-4 text-left transition-colors",
            action.accent
          )}
        >
          <span
            className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
              action.iconBg
            )}
          >
            <PhosphorIcon name={action.icon} size={20} />
          </span>
          <span className="min-w-0">
            <span className="block font-medium text-sm">{action.label}</span>
            <span className="block text-xs text-muted-foreground mt-0.5">
              {action.description}
            </span>
          </span>
        </Link>
      ))}
    </div>
  );
}
