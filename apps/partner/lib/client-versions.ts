/**
 * A client version is the same answer or use case rewritten in a client's
 * voice; it names the item it was written from in `sourceSlug`. A list shows
 * it under that item instead of as a second entry, so a page never lists the
 * same question twice. An item whose source is not in the list stays a row of
 * its own.
 */
export type WithSource = { slug: string; sourceSlug?: string }

export type VersionedRow<T> = { item: T; clientVersions: T[] }

export function foldClientVersions<T extends WithSource>(items: readonly T[]): VersionedRow<T>[] {
  const slugs = new Set(items.map((item) => item.slug))
  const rows = new Map<string, VersionedRow<T>>()
  for (const item of items) {
    if (!item.sourceSlug || !slugs.has(item.sourceSlug)) {
      rows.set(item.slug, { item, clientVersions: [] })
    }
  }
  for (const item of items) {
    if (item.sourceSlug && slugs.has(item.sourceSlug)) {
      rows.get(item.sourceSlug)?.clientVersions.push(item)
    }
  }
  return [...rows.values()]
}

/**
 * The rows for a ranked list of slugs, best first, each row once: a hit on a
 * client version counts as a hit on the row that carries it.
 */
export function rowsInOrder<T extends WithSource>(
  rows: readonly VersionedRow<T>[],
  slugs: readonly string[]
): VersionedRow<T>[] {
  const rowOf = new Map<string, VersionedRow<T>>()
  for (const row of rows) {
    rowOf.set(row.item.slug, row)
    for (const version of row.clientVersions) rowOf.set(version.slug, row)
  }
  const seen = new Set<VersionedRow<T>>()
  const ordered: VersionedRow<T>[] = []
  for (const slug of slugs) {
    const row = rowOf.get(slug)
    if (row && !seen.has(row)) {
      seen.add(row)
      ordered.push(row)
    }
  }
  return ordered
}
