import * as React from "react"
import { cn } from "@/lib/utils"

const GlassCard = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-2xl border border-white/10 bg-gradient-to-br from-slate-900/60 to-slate-900/20 backdrop-blur shadow-[0_10px_40px_-15px_rgba(0,0,0,0.5)] p-6",
      "dark:from-slate-900/60 dark:to-slate-900/20",
      className
    )}
    {...props}
  />
))
GlassCard.displayName = "GlassCard"

const GlassCardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 mb-4", className)}
    {...props}
  />
))
GlassCardHeader.displayName = "GlassCardHeader"

const GlassCardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "text-lg font-semibold leading-none tracking-tight text-white",
      className
    )}
    {...props}
  />
))
GlassCardTitle.displayName = "GlassCardTitle"

const GlassCardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-slate-300", className)}
    {...props}
  />
))
GlassCardDescription.displayName = "GlassCardDescription"

const GlassCardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("", className)} {...props} />
))
GlassCardContent.displayName = "GlassCardContent"

export { GlassCard, GlassCardHeader, GlassCardTitle, GlassCardDescription, GlassCardContent }

