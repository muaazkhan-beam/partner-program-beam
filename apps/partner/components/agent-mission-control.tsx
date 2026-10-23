"use client";

import {
  useState,
  type CSSProperties,
  type PointerEvent,
} from "react";
import Link from "next/link";
import {
  RiAiAgentLine,
  RiArrowRightLine,
  RiCloseLine,
  RiPulseLine,
  RiSidebarUnfoldLine,
  RiTimeLine,
} from "@remixicon/react";

import { useWorkspace } from "@/components/workspace-context";
import {
  AGENT_STATUS_LABEL,
  agentRequest,
  partnerAgents,
} from "@/lib/partner-agents";
import { journeyPhases } from "@/lib/partner-journey";
import { requestHref } from "@/lib/request-links";
import { workspacePath } from "@/lib/workspace-resolver";

const phaseNames = new Map(
  journeyPhases.map((phase) => [phase.slug, phase.name]),
);

/** Order in the inspector's cascade; see the `rise-in` utility. */
function stagger(index: number) {
  return { "--i": index } as CSSProperties;
}

export function AgentMissionControl() {
  const workspace = useWorkspace();
  const [selectedId, setSelectedId] = useState("qualifier");
  const [inspectorOpen, setInspectorOpen] = useState(true);
  const selected =
    partnerAgents.find((agent) => agent.id === selectedId) ?? partnerAgents[0]!;
  const selectedRuns = selected.status === "active";

  function moveLiquid(event: PointerEvent<HTMLButtonElement>) {
    const bounds = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - bounds.left) / bounds.width) * 100;
    const y = ((event.clientY - bounds.top) / bounds.height) * 100;
    const tiltY = ((x - 50) / 50) * 2.5;
    const tiltX = ((50 - y) / 50) * 2.5;
    event.currentTarget.style.setProperty("--pointer-x", `${x}%`);
    event.currentTarget.style.setProperty("--pointer-y", `${y}%`);
    event.currentTarget.style.setProperty(
      "--liquid-x",
      `${(x - 50) * 0.035}px`,
    );
    event.currentTarget.style.setProperty(
      "--liquid-y",
      `${(y - 50) * 0.035}px`,
    );
    event.currentTarget.style.setProperty("--tilt-x", `${tiltX}deg`);
    event.currentTarget.style.setProperty("--tilt-y", `${tiltY}deg`);
  }

  function resetLiquid(event: PointerEvent<HTMLButtonElement>) {
    for (const property of [
      "--pointer-x",
      "--pointer-y",
      "--liquid-x",
      "--liquid-y",
      "--tilt-x",
      "--tilt-y",
    ]) {
      event.currentTarget.style.removeProperty(property);
    }
  }

  return (
    <section className="amcl-shell" aria-label="Agent relationship network">
      <div className="amcl-stage" data-inspector-open={inspectorOpen}>
        <div className="amcl-map">
          {!inspectorOpen ? (
            <button
              className="amcl-open-inspector pressable"
              onClick={() => setInspectorOpen(true)}
              type="button"
              aria-label="Open agent details"
            >
              <RiSidebarUnfoldLine />
            </button>
          ) : null}
          <svg
            className="amcl-edges"
            viewBox="0 0 900 680"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <defs>
              <marker
                id="agent-arrow"
                viewBox="0 0 10 10"
                refX="9"
                refY="5"
                markerWidth="5"
                markerHeight="5"
                orient="auto-start-reverse"
              >
                <path d="M 0 0 L 10 5 L 0 10 z" />
              </marker>
            </defs>
            <path d="M450 130 C300 145 245 195 190 265" />
            <path d="M450 130 C450 175 450 220 450 285" />
            <path d="M545 320 C655 305 680 280 735 250" />
            <path d="M390 365 C300 415 245 455 190 505" />
            <path d="M450 370 C450 430 450 470 450 535" />
            <path d="M525 375 C625 430 680 470 735 520" />
          </svg>
          <div className="amcl-agent-field">
            {partnerAgents.map((agent) => (
              <div
                className={`amcl-agent-wrap amcl-node-${agent.position}`}
                data-effect={agent.effect}
                data-state={agent.status === "active" ? "working" : "idle"}
                data-tone={agent.tone}
                key={agent.id}
              >
                <button
                  aria-pressed={selected.id === agent.id}
                  className="amcl-agent pressable"
                  onClick={() => {
                    setSelectedId(agent.id);
                    setInspectorOpen(true);
                  }}
                  onPointerDown={() => {
                    setSelectedId(agent.id);
                    setInspectorOpen(true);
                  }}
                  onPointerLeave={resetLiquid}
                  onPointerMove={moveLiquid}
                  style={
                    {
                      "--amcl-delay": `${partnerAgents.indexOf(agent) * -1.35}s`,
                    } as CSSProperties
                  }
                  type="button"
                >
                  <span className="amcl-liquid" aria-hidden="true">
                    <span className="amcl-liquid-shape amcl-liquid-shape-a" />
                    <span className="amcl-liquid-shape amcl-liquid-shape-b" />
                    <span className="amcl-caustic" />
                  </span>
                  <span className="amcl-shade" aria-hidden="true" />
                  <span className="amcl-avatar">
                    <RiAiAgentLine />
                  </span>
                  <span
                    className="amcl-agent-status"
                    aria-label={AGENT_STATUS_LABEL[agent.status]}
                  >
                    {agent.status === "active" ? (
                      <RiPulseLine />
                    ) : (
                      <RiTimeLine />
                    )}
                  </span>
                  <span className="amcl-node-copy">
                    <strong>{agent.name}</strong>
                    <small>{agent.role}</small>
                    <em data-status={agent.status}>
                      {AGENT_STATUS_LABEL[agent.status]}
                    </em>
                  </span>
                </button>
              </div>
            ))}
          </div>
        </div>

        {inspectorOpen ? (
          <aside
            className="amcl-inspector"
            aria-label="Agent details"
            aria-live="polite"
          >
            <div className="amcl-inspector-bar">
              <span>Agent details</span>
              <button
                aria-label="Close agent details"
                className="pressable"
                onClick={() => setInspectorOpen(false)}
                type="button"
              >
                <RiCloseLine />
              </button>
            </div>
            {/* Keyed by agent so a new selection cascades in; the live
                region above stays put so the change is announced. */}
            <div className="amcl-inspector-body" key={selected.id}>
              <div className="amcl-inspector-title rise-in" style={stagger(0)}>
                <span className="amcl-avatar-inline">
                  <RiAiAgentLine />
                </span>
                <div>
                  <h3>{selected.name}</h3>
                  <p>{selected.role}</p>
                </div>
              </div>
              <p
                className="amcl-inspector-status rise-in"
                data-status={selected.status}
                style={stagger(1)}
              >
                {selectedRuns ? <RiPulseLine /> : <RiTimeLine />}
                {AGENT_STATUS_LABEL[selected.status]}
              </p>
              <section
                className="amcl-inspector-section rise-in"
                style={stagger(2)}
              >
                <span>Purpose</span>
                <p>{selected.summary}</p>
              </section>
              <section
                className="amcl-inspector-section rise-in"
                style={stagger(3)}
              >
                <span>What it needs from you</span>
                <ul className="amcl-detail-list">
                  {selected.inputs.map((input) => (
                    <li key={input}>{input}</li>
                  ))}
                </ul>
              </section>
              <section
                className="amcl-inspector-section rise-in"
                style={stagger(4)}
              >
                <span>What you get back</span>
                <ul className="amcl-detail-list">
                  {selected.outputs.map((output) => (
                    <li key={output}>{output}</li>
                  ))}
                </ul>
              </section>
              <p className="amcl-inspector-phase rise-in" style={stagger(5)}>
                Used in:{" "}
                <Link
                  href={workspacePath(
                    workspace.slug,
                    `/journey?phase=${selected.phase}`,
                  )}
                >
                  {phaseNames.get(selected.phase) ?? selected.phase}
                </Link>
              </p>
              <div className="amcl-inspector-actions rise-in" style={stagger(6)}>
                <Link
                  className="amcl-inspector-action pressable"
                  href={requestHref(workspace.slug, agentRequest(selected))}
                >
                  {selectedRuns
                    ? "Ask Beam to run it for a client"
                    : "Ask Beam about this agent"}
                </Link>
                {selected.tool ? (
                  <Link
                    className="amcl-inspector-link pressable"
                    href={workspacePath(workspace.slug, selected.tool.href)}
                  >
                    {selected.tool.label}
                    <RiArrowRightLine />
                  </Link>
                ) : null}
              </div>
            </div>
          </aside>
        ) : null}
      </div>
    </section>
  );
}
