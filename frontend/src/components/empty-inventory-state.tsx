"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PhosphorIcon } from "@/components/icons";

interface EmptyInventoryStateProps {
  onImportCsv: () => void;
}

export function EmptyInventoryState({ onImportCsv }: EmptyInventoryStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border/60 bg-muted/30 px-6 py-16 text-center">
      <PhosphorIcon name="Package" size={48} className="text-muted-foreground mb-4" />
      <h2 className="text-lg font-medium mb-2">No items yet</h2>
      <p className="text-sm text-muted-foreground max-w-sm mb-6">
        Add your first product or import a CSV to start tracking stock levels and movements.
      </p>
      <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xs">
        <Button asChild className="w-full">
          <Link href="/inventory/new">
            <PhosphorIcon name="Plus" size={16} /> Add item
          </Link>
        </Button>
        <Button variant="outline" onClick={onImportCsv} className="w-full">
          <PhosphorIcon name="DownloadSimple" size={16} /> Import CSV
        </Button>
      </div>
    </div>
  );
}
