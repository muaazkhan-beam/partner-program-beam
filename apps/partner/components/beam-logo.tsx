import Image from "next/image"

import { cn } from "@/lib/utils"

type BeamLogoProps = {
  className?: string
  priority?: boolean
}

export function BeamLogo({ className, priority = false }: BeamLogoProps) {
  return (
    <Image
      src="/beam-logo.png"
      alt=""
      aria-hidden="true"
      width={40}
      height={40}
      className={cn("shrink-0", className)}
      priority={priority}
    />
  )
}
