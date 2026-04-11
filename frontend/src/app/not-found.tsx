import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6">
      <h1 className="text-6xl font-bold tracking-tight" style={{ fontFamily: "var(--font-instrument), var(--font-serif)", letterSpacing: "-0.03em" }}>
        404
      </h1>
      <p className="text-muted-foreground text-lg max-w-sm">
        This page does not exist.
      </p>
      <Button asChild>
        <Link href="/">Return to Home</Link>
      </Button>
    </div>
  );
}
