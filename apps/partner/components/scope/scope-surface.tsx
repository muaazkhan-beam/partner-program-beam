"use client";

import Link from "next/link";
import { useMemo, useRef, useState, useSyncExternalStore } from "react";
import {
  RiArrowLeftLine,
  RiArrowRightLine,
  RiCheckLine,
  RiClipboardLine,
} from "@remixicon/react";

import { journeyStorageKey } from "@/components/partner-journey";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useWorkspace } from "@/components/workspace-context";
import type { CatalogUseCase } from "@/convex/catalogTypes";
import {
  parseStore,
  readStore,
  subscribeToStore,
  writeStore,
} from "@/lib/browser-store";
import { listWorkspaceItems } from "@/lib/catalog/static";
import { requestHref } from "@/lib/request-links";
import {
  briefText,
  clientFacts,
  deltaDimensions,
  departmentsOf,
  newScopedProcess,
  processStatuses,
  readProcess,
  statusLabel,
  type ScopedProcess,
} from "@/lib/scope";
import {
  parseScopeState,
  readScopeRaw,
  removeProcess,
  subscribeToScope,
  upsertProcess,
  writeScopeState,
} from "@/lib/scope-store";
import { workspacePath } from "@/lib/workspace-resolver";

function subscribeToLocation(listener: () => void) {
  window.addEventListener("popstate", listener);
  return () => window.removeEventListener("popstate", listener);
}

function useUseCases(workspaceSlug: string): CatalogUseCase[] {
  return listWorkspaceItems(workspaceSlug, "use-case").filter(
    (item): item is CatalogUseCase =>
      "useCase" in item && Boolean(item.useCase),
  ) as unknown as CatalogUseCase[];
}

function useScope(workspaceSlug: string) {
  const raw = useSyncExternalStore(
    subscribeToScope,
    () => readScopeRaw(workspaceSlug),
    () => '{"version":2,"processes":[]}',
  );
  const state = useMemo(() => parseScopeState(raw), [raw]);
  return {
    state,
    save: (process: ScopedProcess) =>
      writeScopeState(workspaceSlug, upsertProcess(state, process)),
    remove: (id: string) =>
      writeScopeState(workspaceSlug, removeProcess(state, id)),
  };
}

export function ScopeSurface() {
  const workspace = useWorkspace();
  const useCases = useUseCases(workspace.slug);
  const { state, save, remove } = useScope(workspace.slug);
  const seed = useSyncExternalStore(
    subscribeToLocation,
    () => new URLSearchParams(window.location.search).get("seed"),
    () => null,
  );
  const [openId, setOpenId] = useState<string | null>(null);

  const seeded = seed
    ? state.processes.find((process) => process.useCaseSlug === seed)
    : undefined;
  // Landing on Scope always shows the match step with the saved processes above
  // it; only an explicit choice or a ?seed= link opens one.
  const open =
    state.processes.find((process) => process.id === openId) ?? seeded;

  if (open) {
    const useCase = useCases.find((entry) => entry.slug === open.useCaseSlug);
    if (useCase) {
      return (
        <DifferenceStep
          process={open}
          useCase={useCase}
          others={state.processes.filter((entry) => entry.id !== open.id)}
          onChange={save}
          onOpen={setOpenId}
          onClose={() => setOpenId(null)}
          onRemove={() => {
            remove(open.id);
            setOpenId(null);
          }}
        />
      );
    }
  }

  return (
    <MatchStep
      useCases={useCases}
      processes={state.processes}
      seed={seed}
      onStart={(slug) => {
        const process = newScopedProcess(slug);
        save(process);
        setOpenId(process.id);
      }}
      onOpen={setOpenId}
    />
  );
}

function MatchStep({
  useCases,
  processes,
  seed,
  onStart,
  onOpen,
}: {
  useCases: CatalogUseCase[];
  processes: ScopedProcess[];
  seed: string | null;
  onStart: (slug: string) => void;
  onOpen: (id: string) => void;
}) {
  const workspace = useWorkspace();
  const departments = departmentsOf(useCases);
  const [heard, setHeard] = useState("");

  return (
    <div className="space-y-8">
      {processes.length ? (
        <section className="rounded-2xl border bg-card p-5">
          <p className="text-xs font-medium text-muted-foreground">
            In progress
          </p>
          <ul className="mt-3 divide-y">
            {processes.map((process) => {
              const useCase = useCases.find(
                (entry) => entry.slug === process.useCaseSlug,
              );
              return (
                <li key={process.id}>
                  <button
                    type="button"
                    className="flex w-full items-center justify-between gap-3 py-3 text-left transition-colors hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
                    onClick={() => onOpen(process.id)}
                  >
                    <span className="min-w-0">
                      <span className="block text-sm font-medium">
                        {useCase?.title ?? process.useCaseSlug}
                        {process.client ? ` at ${process.client}` : ""}
                      </span>
                      <span className="block text-xs text-muted-foreground">
                        {statusLabel[process.status]}
                      </span>
                    </span>
                    <RiArrowRightLine
                      className="size-4 shrink-0 text-muted-foreground"
                      aria-hidden="true"
                    />
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}

      <section aria-labelledby="match-heading">
        <p className="text-xs font-medium text-muted-foreground">Match it</p>
        <h2
          id="match-heading"
          className="mt-2 text-2xl font-medium tracking-tight"
        >
          What did the client describe?
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
          Start from a process Beam already runs in production. Each record
          states the trigger, the systems touched and the step that keeps a
          human approver.
          {seed ? " The use case you came from is below." : ""}
        </p>

        <div className="mt-6 space-y-8">
          {departments.map((department) => (
            <div key={department}>
              <div className="flex items-center gap-3">
                <h3 className="text-sm font-medium">{department}</h3>
                <span className="text-xs text-muted-foreground">
                  {
                    useCases.filter(
                      (useCase) => (useCase.group ?? "Other") === department,
                    ).length
                  }{" "}
                  live
                </span>
              </div>
              <ul className="mt-3 grid gap-4 lg:grid-cols-2">
                {useCases
                  .filter(
                    (useCase) => (useCase.group ?? "Other") === department,
                  )
                  .map((useCase) => {
                    return (
                      <li key={useCase.slug}>
                        <button
                          type="button"
                          className="flex h-full w-full flex-col gap-3 rounded-2xl border bg-card p-5 text-left transition-colors hover:bg-muted/40 focus-visible:ring-3 focus-visible:ring-ring/50"
                          onClick={() => onStart(useCase.slug)}
                        >
                          <span className="flex flex-wrap items-center gap-2">
                            <span className="text-sm font-medium">
                              {useCase.title}
                            </span>
                            {useCase.timeToProduction ? (
                              <Badge variant="outline">
                                {useCase.timeToProduction} to production
                              </Badge>
                            ) : null}
                          </span>
                          <span className="block text-sm leading-6 text-muted-foreground">
                            {useCase.trigger}
                          </span>
                          <span className="mt-auto block text-xs text-muted-foreground">
                            {useCase.systems.join(" · ")}
                          </span>
                          <span className="inline-flex items-center gap-1.5 text-sm font-medium text-primary">
                            This is the one
                            <RiArrowRightLine
                              className="size-4"
                              aria-hidden="true"
                            />
                          </span>
                        </button>
                      </li>
                    );
                  })}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-6 rounded-2xl border border-dashed p-5">
          <p className="text-sm font-medium">
            None of these is what they described
          </p>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            Tell Beam what you heard. Unmatched processes are how the catalog
            grows.
          </p>
          <div className="mt-3 flex flex-wrap items-end gap-3">
            <div className="min-w-64 flex-1 space-y-2">
              <Label htmlFor="scope-heard">What the client described</Label>
              <Input
                id="scope-heard"
                value={heard}
                placeholder="Reconciling statements across two ledgers…"
                onChange={(event) => setHeard(event.target.value)}
              />
            </div>
            <Link
              className="inline-flex h-8 items-center gap-1.5 rounded-lg border px-3 text-sm font-medium transition-colors hover:bg-muted/40"
              href={requestHref(workspace.slug, {
                about: "scope:no-match",
                support: "other",
              })}
              onClick={() =>
                window.sessionStorage.setItem("beam-scope-heard", heard)
              }
            >
              Ask the Beam team if it is covered
              <RiArrowRightLine className="size-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

function DifferenceStep({
  process,
  useCase,
  others,
  onChange,
  onOpen,
  onClose,
  onRemove,
}: {
  process: ScopedProcess;
  useCase: CatalogUseCase;
  others: ScopedProcess[];
  onChange: (process: ScopedProcess) => void;
  onOpen: (id: string) => void;
  onClose: () => void;
  onRemove: () => void;
}) {
  const workspace = useWorkspace();
  const reading = readProcess(process, useCase);
  const client = process.client.trim();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="ghost" size="sm" onClick={onClose}>
          <RiArrowLeftLine aria-hidden="true" /> All processes
        </Button>
        {others.length ? (
          <span className="flex flex-wrap gap-2">
            {others.map((entry) => (
              <button
                key={entry.id}
                type="button"
                className="rounded-full border bg-background px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
                onClick={() => onOpen(entry.id)}
              >
                {entry.client || "Unnamed client"}
              </button>
            ))}
          </span>
        ) : null}
        <Button
          variant="ghost"
          size="sm"
          className="ml-auto text-muted-foreground"
          onClick={onRemove}
        >
          Remove
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
        <div className="space-y-6">
          <section className="rounded-2xl border bg-card p-5 sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs font-medium text-muted-foreground">
                  {useCase.group} · Beam runs this in production
                </p>
                <h2 className="mt-2 text-2xl font-medium tracking-tight">
                  {useCase.title}
                </h2>
                <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
                  {useCase.summary}
                </p>
              </div>
              <Link
                className="text-sm font-medium text-primary hover:underline"
                href={workspacePath(
                  workspace.slug,
                  `/use-cases/${useCase.slug}`,
                )}
              >
                Open the record
              </Link>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="scope-client">Client</Label>
                <Input
                  id="scope-client"
                  autoComplete="organization"
                  value={process.client}
                  placeholder="Client company name…"
                  onChange={(event) =>
                    onChange({ ...process, client: event.target.value })
                  }
                />
              </div>
              <fieldset>
                <legend className="text-xs font-medium text-muted-foreground">
                  Where this stands
                </legend>
                <div
                  className="mt-2 flex flex-wrap gap-2"
                  role="radiogroup"
                  aria-label="Where this stands"
                >
                  {processStatuses.map((status) => (
                    <label
                      key={status}
                      className="cursor-pointer rounded-full border bg-background px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground has-checked:border-foreground has-checked:bg-foreground has-checked:text-background has-focus-visible:ring-3 has-focus-visible:ring-ring/50"
                    >
                      <input
                        type="radio"
                        className="sr-only"
                        name="scope-status"
                        value={status}
                        checked={process.status === status}
                        onChange={() => onChange({ ...process, status })}
                      />
                      {statusLabel[status]}
                    </label>
                  ))}
                </div>
              </fieldset>
            </div>
          </section>

          <section
            aria-labelledby="difference-heading"
            className="rounded-2xl border bg-card p-5 sm:p-6"
          >
            <div className="flex flex-wrap items-baseline justify-between gap-3">
              <div>
                <p className="text-xs font-medium text-muted-foreground">
                  Compare
                </p>
                <h3
                  id="difference-heading"
                  className="mt-2 text-lg font-medium"
                >
                  What is different at {client || "this client"}?
                </h3>
              </div>
              <p
                className="text-xs text-muted-foreground tabular-nums"
                aria-live="polite"
              >
                {reading.differenceCount} of {reading.totalDimensions} differ
              </p>
            </div>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              Leave a row empty when the client matches the standard shape. Only
              the differences travel to Beam.
            </p>

            <div className="mt-5 hidden grid-cols-[150px_1fr_1fr] gap-6 border-b pb-2 sm:grid">
              <span className="text-xs font-medium text-muted-foreground" />
              <span className="text-xs font-medium text-muted-foreground">
                How Beam runs it
              </span>
              <span className="text-xs font-medium text-muted-foreground">
                At {client || "your client"}
              </span>
            </div>

            <div>
              {deltaDimensions.map((dimension) => {
                const value = process.differences[dimension.id] ?? "";
                const differs = value.trim().length > 0;
                const fieldId = `scope-delta-${dimension.id}`;
                return (
                  <div
                    key={dimension.id}
                    className="grid gap-2 border-b py-4 last:border-b-0 sm:grid-cols-[150px_1fr_1fr] sm:gap-6"
                  >
                    <div className="flex items-start gap-2">
                      <Label
                        htmlFor={fieldId}
                        className="text-xs font-medium text-muted-foreground"
                      >
                        {dimension.label}
                      </Label>
                      {differs ? (
                        <span
                          className="mt-0.5 size-1.5 shrink-0 rounded-full bg-primary"
                          aria-label="Differs from the standard"
                        />
                      ) : null}
                    </div>
                    <p className="text-sm leading-6 text-foreground/85">
                      {dimension.standardOf(useCase)}
                    </p>
                    <textarea
                      id={fieldId}
                      rows={2}
                      className="min-h-16 w-full rounded-lg border bg-background p-2 text-sm leading-6 outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                      placeholder={dimension.ask}
                      value={value}
                      onChange={(event) =>
                        onChange({
                          ...process,
                          differences: {
                            ...process.differences,
                            [dimension.id]: event.target.value,
                          },
                        })
                      }
                    />
                  </div>
                );
              })}
            </div>
          </section>

          <section className="rounded-2xl border bg-card p-5 sm:p-6">
            <p className="text-xs font-medium text-muted-foreground">
              Only the client knows
            </p>
            <h3 className="mt-2 text-lg font-medium">Two things to ask them</h3>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              Beam publishes no standard for these. Record them in the
              client&apos;s own words; never convert them into a promise.
            </p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {clientFacts.map((fact) => {
                const fieldId = `scope-fact-${fact.id}`;
                return (
                  <div key={fact.id} className="space-y-2">
                    <Label htmlFor={fieldId}>{fact.ask}</Label>
                    <Input
                      id={fieldId}
                      value={process.facts[fact.id] ?? ""}
                      onChange={(event) =>
                        onChange({
                          ...process,
                          facts: {
                            ...process.facts,
                            [fact.id]: event.target.value,
                          },
                        })
                      }
                    />
                  </div>
                );
              })}
            </div>
          </section>
        </div>

        <BriefAside process={process} useCase={useCase} />
      </div>
    </div>
  );
}

function BriefAside({
  process,
  useCase,
}: {
  process: ScopedProcess;
  useCase: CatalogUseCase;
}) {
  const workspace = useWorkspace();
  const reading = readProcess(process, useCase);
  const text = briefText(process, useCase);
  const named = process.client.trim().length > 0;
  const [copied, setCopied] = useState(false);
  const timer = useRef<number | null>(null);
  const journeyKey = journeyStorageKey(workspace.slug);
  const progressRaw = useSyncExternalStore(
    subscribeToStore,
    () => readStore(journeyKey, "{}"),
    () => "{}",
  );
  const progress = useMemo(
    () => parseStore<Record<string, boolean>>(progressRaw, {}),
    [progressRaw],
  );

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      if (timer.current) window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => setCopied(false), 1800);
    } catch {
      // The brief is on screen; the partner can select it.
    }
  }

  return (
    <aside className="rounded-2xl border bg-card p-5 sm:p-6 lg:sticky lg:top-[calc(var(--header-height)+1rem)]">
      <p className="text-xs font-medium text-muted-foreground">
        Brief for Beam
      </p>
      <h3 className="mt-2 text-lg font-medium" aria-live="polite">
        {reading.differenceCount === 0
          ? "Matches the standard shape"
          : `${reading.differenceCount} ${reading.differenceCount === 1 ? "difference" : "differences"} recorded`}
      </h3>
      <pre className="mt-3 max-h-72 overflow-auto rounded-lg border bg-muted/30 p-3 font-sans text-xs leading-5 whitespace-pre-wrap text-foreground/85">
        {text}
      </pre>
      <div className="mt-4 flex flex-col gap-2">
        <Link
          className="flex items-center justify-between gap-3 rounded-lg bg-primary px-3 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/80"
          href={requestHref(workspace.slug, {
            about: `scope:${process.id}`,
            support: "shadow-demo",
          })}
        >
          <span>Send this to Beam</span>
          <RiArrowRightLine className="size-4 shrink-0" aria-hidden="true" />
        </Link>
        <Button variant="outline" onClick={copy}>
          {copied ? (
            <RiCheckLine aria-hidden="true" />
          ) : (
            <RiClipboardLine aria-hidden="true" />
          )}
          <span aria-live="polite">
            {copied ? "Brief copied" : "Copy the brief"}
          </span>
        </Button>
      </div>
      {!named ? (
        <p className="mt-3 text-xs leading-5 text-muted-foreground">
          Name the client so Beam knows who it is for.
        </p>
      ) : null}
      <div className="mt-5 border-t pt-4">
        <p className="text-xs font-medium text-muted-foreground">Journey</p>
        <label className="mt-2 flex cursor-pointer items-center gap-3 text-sm">
          <Checkbox
            checked={Boolean(progress["scope:use-case"])}
            onCheckedChange={(checked) =>
              writeStore(journeyKey, {
                ...progress,
                "scope:use-case": checked === true,
              })
            }
            aria-label="Pick a live use case"
          />
          Pick a live use case
        </label>
        <Link
          className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
          href={workspacePath(workspace.slug, "/journey?phase=scope")}
        >
          See all Scope steps
          <RiArrowRightLine className="size-4" aria-hidden="true" />
        </Link>
      </div>
    </aside>
  );
}
