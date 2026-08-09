import { cn } from "@/lib/utils"

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn(
        "relative overflow-hidden rounded-md",
        "bg-muted animate-pulse",
        "after:absolute after:inset-0 after:translate-x-[-100%]",
        "after:bg-gradient-to-r after:from-transparent after:via-white/5 dark:after:via-white/[0.08] after:to-transparent",
        "after:animate-shimmer",
        className
      )}
      {...props}
    />
  )
}

export { Skeleton }
