"use client"

import * as React from "react"
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog"
import { RiCloseLine } from "@remixicon/react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

function Dialog(props: DialogPrimitive.Root.Props) {
  return <DialogPrimitive.Root data-slot="dialog" {...props} />
}

function DialogTrigger(props: DialogPrimitive.Trigger.Props) {
  return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />
}

function DialogClose(props: DialogPrimitive.Close.Props) {
  return <DialogPrimitive.Close data-slot="dialog-close" {...props} />
}

function DialogContent({
  className,
  children,
  ...props
}: DialogPrimitive.Popup.Props) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Backdrop className="fixed inset-0 z-50 bg-black/55 backdrop-blur-sm transition-opacity data-ending-style:opacity-0 data-starting-style:opacity-0" />
      <DialogPrimitive.Popup
        data-slot="dialog-content"
        className={cn(
          "fixed inset-x-3 bottom-3 z-50 max-h-[calc(100svh-1.5rem)] overflow-hidden rounded-2xl border bg-popover text-popover-foreground shadow-2xl transition duration-200 data-ending-style:translate-y-4 data-ending-style:opacity-0 data-starting-style:translate-y-4 data-starting-style:opacity-0 sm:top-1/2 sm:right-auto sm:bottom-auto sm:left-1/2 sm:w-[min(42rem,calc(100vw-3rem))] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:data-ending-style:translate-y-[calc(-50%+1rem)] sm:data-starting-style:translate-y-[calc(-50%+1rem)]",
          className
        )}
        {...props}
      >
        {children}
        <DialogPrimitive.Close
          render={
            <Button
              variant="ghost"
              size="icon-sm"
              className="absolute top-4 right-4"
            />
          }
        >
          <RiCloseLine />
          <span className="sr-only">Close</span>
        </DialogPrimitive.Close>
      </DialogPrimitive.Popup>
    </DialogPrimitive.Portal>
  )
}

function DialogHeader({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("space-y-1 border-b px-5 py-5 pr-14 sm:px-6", className)}
      {...props}
    />
  )
}

function DialogTitle({
  className,
  ...props
}: DialogPrimitive.Title.Props) {
  return (
    <DialogPrimitive.Title
      className={cn("font-heading text-lg font-medium", className)}
      {...props}
    />
  )
}

function DialogDescription({
  className,
  ...props
}: DialogPrimitive.Description.Props) {
  return (
    <DialogPrimitive.Description
      className={cn("text-sm leading-6 text-muted-foreground", className)}
      {...props}
    />
  )
}

export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
}
