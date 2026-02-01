"use client"

import * as React from "react"
import * as TabsPrimitive from "@radix-ui/react-tabs"

import { cn } from "@/lib/utils"

function Tabs({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Root>) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      className={cn("flex flex-col gap-8", className)} // Generous whitespace (Design Principle)
      {...props}
    />
  )
}

function TabsList({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.List>) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      className={cn(
        "inline-flex w-full items-center justify-start gap-8 h-auto bg-transparent",
        className
      )}
      {...props}
    />
  )
}

function TabsTrigger({
  className,
  children,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      className={cn(
        "group relative flex items-center justify-center gap-2.5 px-6 py-2 text-sm font-medium whitespace-nowrap outline-none transition-all duration-300 rounded-full",
        "text-muted-foreground hover:text-foreground",
        "data-[state=active]:text-foreground data-[state=active]:bg-white/[0.05]",
        "disabled:pointer-events-none disabled:opacity-50",
        className
      )}
      {...props}
    >
      <span className="relative z-10 flex items-center gap-2.5">
        {children}
      </span>

      {/* Background Hover Highlight - Matches Active Shape */}
      <div
        className={cn(
          "absolute inset-0 rounded-full bg-white/[0.03]",
          "scale-95 opacity-0 transition-all duration-500",
          "group-hover:scale-100 group-hover:opacity-100",
          "group-data-[state=active]:hidden" // Hide hover when already active
        )}
      />
    </TabsPrimitive.Trigger>
  )
}

function TabsContent({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      data-slot="tabs-content"
      className={cn(
        "flex-1 outline-none pt-4",
        "animate-in fade-in slide-in-from-bottom-2 duration-500 ease-out", // Smooth "breathe" into focus
        className
      )}
      {...props}
    />
  )
}

export { Tabs, TabsList, TabsTrigger, TabsContent }

