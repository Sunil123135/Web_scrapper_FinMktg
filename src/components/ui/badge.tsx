import * as React from "react";
import { cn } from "@/lib/utils";

export function Badge({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border border-transparent px-2.5 py-1 text-xs font-semibold",
        className,
      )}
      {...props}
    />
  );
}

export function ScoreBadge({ score }: { score: number }) {
  const className =
    score >= 8
      ? "bg-green-100 text-green-700"
      : score >= 5
        ? "bg-amber-100 text-amber-700"
        : "bg-slate-100 text-slate-600";

  return <Badge className={className}>{score}/10</Badge>;
}
