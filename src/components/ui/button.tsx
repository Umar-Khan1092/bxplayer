import * as React from "react"
import { cn } from "@/lib/utils"

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "secondary" | "danger" | "ghost"
  size?: "default" | "sm" | "lg"
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:pointer-events-none disabled:opacity-50 hover-scale hover:scale-105",
          {
            "bg-[#3b82f6] text-white hover:bg-[#2563eb]": variant === "default",
            "bg-[#141414] text-white hover:bg-[#1e1e1e] border border-[rgba(255,255,255,0.1)]": variant === "secondary",
            "bg-[#ef4444] text-white hover:bg-[#dc2626]": variant === "danger",
            "hover:bg-[rgba(255,255,255,0.1)] text-white": variant === "ghost",
            "h-10 px-4 py-2": size === "default",
            "h-9 px-3 text-xs": size === "sm",
            "h-11 px-8 text-base": size === "lg",
          },
          className
        )}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button }
