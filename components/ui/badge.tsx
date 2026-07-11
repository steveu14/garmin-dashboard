import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 font-mono-data text-[11px] font-medium tracking-wide uppercase transition-colors",
  {
    variants: {
      variant: {
        default: "border-transparent bg-[var(--color-ink)] text-white",
        secondary: "border-transparent bg-[var(--color-paper-dim)] text-[var(--color-ink)]",
        outline: "border-[var(--color-paper-line)] text-[var(--color-ink)]",
        success: "border-transparent bg-[var(--color-flag-green-tint)] text-[var(--color-flag-green)]",
      },
    },
    defaultVariants: { variant: "default" },
  }
)

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
