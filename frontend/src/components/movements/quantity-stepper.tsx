"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PhosphorIcon } from "@/components/icons";
import { cn } from "@/lib/utils";

interface QuantityStepperProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  className?: string;
}

export function QuantityStepper({
  value,
  onChange,
  min = 1,
  max,
  className,
}: QuantityStepperProps) {
  const clamp = (n: number) => {
    let v = Math.max(min, n);
    if (max !== undefined) v = Math.min(max, v);
    return v;
  };

  return (
    <div
      className={cn("inline-flex items-center rounded-lg border border-input", className)}
    >
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-9 w-9 shrink-0 rounded-r-none"
        disabled={value <= min}
        onClick={() => onChange(clamp(value - 1))}
        aria-label="Decrease quantity"
      >
        <PhosphorIcon name="Minus" size={14} />
      </Button>
      <Input
        type="number"
        min={min}
        max={max}
        value={value}
        onChange={(e) => {
          const parsed = parseInt(e.target.value, 10);
          if (!Number.isNaN(parsed)) onChange(clamp(parsed));
        }}
        className="h-9 w-14 border-0 border-x border-input rounded-none text-center px-1 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
      />
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-9 w-9 shrink-0 rounded-l-none"
        disabled={max !== undefined && value >= max}
        onClick={() => onChange(clamp(value + 1))}
        aria-label="Increase quantity"
      >
        <PhosphorIcon name="Plus" size={14} />
      </Button>
    </div>
  );
}
