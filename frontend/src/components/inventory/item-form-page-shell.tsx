"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PhosphorIcon } from "@/components/icons";

const titleStyle = {
  fontFamily: "var(--font-instrument), var(--font-serif)",
  letterSpacing: "-0.02em",
} as const;

interface ItemFormPageShellProps {
  title: string;
  description: string;
  backHref?: string;
  backLabel?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export function ItemFormPageShell({
  title,
  description,
  backHref = "/inventory",
  backLabel = "Back to inventory",
  children,
  footer,
}: ItemFormPageShellProps) {
  return (
    <div className="space-y-8 max-w-lg">
      <div>
        <Button variant="outline" size="sm" asChild className="mb-4">
          <Link href={backHref}>
            <PhosphorIcon name="CaretRight" size={14} className="rotate-180" />
            {backLabel}
          </Link>
        </Button>
        <h1 className="text-3xl tracking-tight" style={titleStyle}>
          {title}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>

      <div className="space-y-6">{children}</div>

      {footer ? (
        <div className="pt-4 border-t border-border/60">{footer}</div>
      ) : null}
    </div>
  );
}
