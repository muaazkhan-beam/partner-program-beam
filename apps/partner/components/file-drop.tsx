"use client"

import { RiUploadCloud2Line } from "@remixicon/react"
import { useId, useRef, useState, type ReactNode } from "react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export type DroppedFile = { name: string; text: string }

/**
 * A drop target with a visible "Choose file" button, so a failed drag never
 * leaves the partner stuck, and optional sample files for the demo. Files are
 * read in the browser as text; nothing is uploaded.
 */
export function FileDrop({
  onFile,
  samples = [],
  hint = "Drop a forwarded email (.eml) or a questionnaire (.csv)",
  compact = false,
  children,
}: {
  onFile: (file: DroppedFile) => void
  samples?: Array<{ label: string; name: string }>
  hint?: string
  compact?: boolean
  children?: ReactNode
}) {
  const inputId = useId()
  const input = useRef<HTMLInputElement>(null)
  const [over, setOver] = useState(false)

  async function read(file: File | undefined) {
    if (!file) return
    onFile({ name: file.name, text: file.name.toLowerCase().endsWith(".msg") ? "" : await file.text() })
  }

  async function loadSample(name: string) {
    const response = await fetch(`/demo/${name}`)
    if (response.ok) onFile({ name, text: await response.text() })
  }

  return (
    <div
      onDragOver={(event) => {
        event.preventDefault()
        setOver(true)
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(event) => {
        event.preventDefault()
        setOver(false)
        void read(event.dataTransfer.files[0])
      }}
      className={cn(
        "flex flex-wrap items-center gap-x-3 gap-y-2 rounded-lg border border-dashed px-3 text-sm text-muted-foreground transition-colors",
        compact ? "py-2" : "py-3",
        over ? "border-primary bg-primary-10 text-foreground" : "border-border"
      )}
    >
      <RiUploadCloud2Line className="size-4 shrink-0" aria-hidden="true" />
      <span className="min-w-0 basis-full sm:flex-1 sm:basis-auto">{hint}</span>
      <input
        ref={input}
        id={inputId}
        type="file"
        aria-label="Choose a file"
        accept=".eml,.csv,.txt,message/rfc822,text/csv,text/plain"
        className="sr-only"
        onChange={(event) => {
          void read(event.target.files?.[0])
          event.target.value = ""
        }}
      />
      <Button type="button" size="sm" variant="outline" onClick={() => input.current?.click()}>
        Choose file
      </Button>
      {samples.map((sample) => (
        <Button key={sample.name} type="button" size="sm" variant="ghost" onClick={() => void loadSample(sample.name)}>
          {sample.label}
        </Button>
      ))}
      {children}
    </div>
  )
}
