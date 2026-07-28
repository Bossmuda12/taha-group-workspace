import { cn } from "@/lib/utils";
import { HTMLAttributes } from "react";

export function GlassCard({
    className,
    strong,
    dark,
    ...props
}: HTMLAttributes<HTMLDivElement> & { strong?: boolean; dark?: boolean }) {
    return (
          <div
                  className={cn(
                            strong ? "glass-strong" : dark ? "glass-dark" : "glass",
                            "rounded-4xl shadow-glass",
                            className
                          )}
            {...props}
                />
        );
}
