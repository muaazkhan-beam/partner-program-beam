export function PageHeading({
  title,
  description,
}: {
  title: string
  description: string
}) {
  return (
    <div className="max-w-3xl space-y-3">
      <h2 className="text-3xl font-medium tracking-tight text-balance sm:text-4xl">
        {title}
      </h2>
      <p className="max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
        {description}
      </p>
    </div>
  )
}
