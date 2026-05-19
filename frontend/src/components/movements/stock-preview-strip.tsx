"use client";

interface StockPreviewStripProps {
  itemName: string;
  sku: string;
  currentStock: number;
  delta: number;
}

export function StockPreviewStrip({
  itemName,
  sku,
  currentStock,
  delta,
}: StockPreviewStripProps) {
  const after = currentStock + delta;
  const isDecrease = delta < 0;

  return (
    <div className="rounded-lg border border-border/60 bg-muted/30 px-4 py-3 text-sm">
      <p className="font-medium truncate">{itemName}</p>
      <p className="text-xs text-muted-foreground mt-0.5">{sku}</p>
      <div className="mt-2 flex flex-wrap items-center gap-2 text-muted-foreground">
        <span>
          In stock: <span className="font-medium text-foreground">{currentStock}</span>
        </span>
        <span aria-hidden>→</span>
        <span>
          After:{" "}
          <span
            className={`font-medium ${
              isDecrease ? "text-pale-red-text" : "text-pale-green-text"
            }`}
          >
            {after}
          </span>
        </span>
      </div>
    </div>
  );
}
