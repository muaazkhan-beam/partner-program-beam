"use client";

import {
  useState,
  type CSSProperties,
  type PointerEvent,
} from "react";
import Link from "next/link";
import {
  RiAiAgentLine,
  RiArrowRightUpLine,
  RiCloseLine,
  RiPulseLine,
  RiSidebarUnfoldLine,
  RiTimeLine,
} from "@remixicon/react";

import { useWorkspace } from "@/components/workspace-context";
import { partnerAgents } from "@/lib/partner-agents";
import { workspacePath } from "@/lib/workspace-resolver";

export function AgentMissionControl() {
  const workspace = useWorkspace();
  const [selectedId, setSelectedId] = useState("qualifier");
  const [inspectorOpen, setInspectorOpen] = useState(true);
  const selected =
    partnerAgents.find((agent) => agent.id === selectedId) ?? partnerAgents[0]!;

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
              className="amcl-open-inspector"
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
                  className="amcl-agent"
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
                    aria-label={
                      agent.status === "active" ? "Active" : "Coming soon"
                    }
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
                      {agent.status === "active" ? "Active" : "Coming soon"}
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
                onClick={() => setInspectorOpen(false)}
                type="button"
              >
                <RiCloseLine />
              </button>
            </div>
            <div className="amcl-inspector-title">
              <span className="amcl-avatar-inline">
                <RiAiAgentLine />
              </span>
              <div>
                <h3>{selected.name}</h3>
                <p>{selected.role}</p>
              </div>
            </div>
            <section className="amcl-inspector-section">
              <span>Current work</span>
              <strong>{selected.now}</strong>
              <div className="amcl-detail-list">
                <div className="amcl-detail-row">
                  <span>Status</span>
                  <span>
                    {selected.status === "active" ? "Active" : "Coming soon"}
                  </span>
                </div>
                <div className="amcl-detail-row">
                  <span>Stage</span>
                  <span>{selected.stage}</span>
                </div>
                <div className="amcl-detail-row">
                  <span>Type</span>
                  <span>
                    {selected.status === "active"
                      ? "Portal workflow"
                      : "Planned agent"}
                  </span>
                </div>
              </div>
            </section>
            <section className="amcl-inspector-section">
              <span>Purpose</span>
              <p>{selected.summary}</p>
            </section>
            <section className="amcl-inspector-section">
              <span>Inputs and outputs</span>
              <div className="amcl-detail-list">
                <div className="amcl-detail-row">
                  <span>Inputs</span>
                  <span>{selected.inputs.join(", ")}</span>
                </div>
                <div className="amcl-detail-row">
                  <span>Outputs</span>
                  <span>{selected.outputs.join(", ")}</span>
                </div>
              </div>
            </section>
            <Link
              className="amcl-inspector-action"
              href={workspacePath(workspace.slug, selected.href)}
            >
              {selected.action}
              <RiArrowRightUpLine />
            </Link>
          </aside>
        ) : null}
      </div>
    </section>
  );
}
