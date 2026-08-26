import React from "react";
import { AlertCircle, ArrowRight, Check, Link2, ShieldCheck, Sparkles, Target } from "lucide-react";

export type RecoveryGraphTone = "coral" | "blue" | "amber" | "mint";

export type RecoveryGraphNode = {
  id: string;
  eyebrow: string;
  title: string;
  detail: string;
  tone: RecoveryGraphTone;
  icon: React.ReactNode;
  navigateTo: string;
};

export type RecoveryGraphEdge = {
  id: string;
  from: string;
  to: string;
  label?: string;
};

export type RecoveryGraphOpportunity = {
  id: string;
  customer: string;
  method: string;
  amount: string;
  failure: string;
  prob: number;
  expected: string;
};

export function buildRecoveryGraphModel(opportunity: RecoveryGraphOpportunity) {
  const nodes: RecoveryGraphNode[] = [
    {
      id: "failure",
      eyebrow: "01 / Signal",
      title: "Payment failed",
      detail: `${opportunity.failure} · ${opportunity.method}`,
      tone: "coral",
      icon: <AlertCircle size={16} aria-hidden="true" />,
      navigateTo: "/recovery",
    },
    {
      id: "diagnosis",
      eyebrow: "02 / Diagnosis",
      title: "Pattern detected",
      detail: `${opportunity.customer} · returning customer`,
      tone: "blue",
      icon: <Sparkles size={16} aria-hidden="true" />,
      navigateTo: "/agent",
    },
    {
      id: "probability",
      eyebrow: "03 / Forecast",
      title: `${opportunity.prob}% likely`,
      detail: `${opportunity.expected} expected`,
      tone: "blue",
      icon: <Target size={16} aria-hidden="true" />,
      navigateTo: "/agent",
    },
    {
      id: "policy",
      eyebrow: "04 / Guardrail",
      title: "Policy allows",
      detail: "No approval required",
      tone: "amber",
      icon: <ShieldCheck size={16} aria-hidden="true" />,
      navigateTo: "/settings",
    },
    {
      id: "strategy",
      eyebrow: "05 / Action",
      title: "Payment link",
      detail: "Lowest friction path",
      tone: "blue",
      icon: <Link2 size={16} aria-hidden="true" />,
      navigateTo: "/recovery",
    },
    {
      id: "outcome",
      eyebrow: "06 / Outcome",
      title: "Revenue recovered",
      detail: `${opportunity.amount} captured`,
      tone: "mint",
      icon: <Check size={16} aria-hidden="true" />,
      navigateTo: "/recovery",
    },
  ];

  const edges: RecoveryGraphEdge[] = nodes.slice(0, -1).map((node, index) => ({
    id: `${node.id}-${nodes[index + 1].id}`,
    from: node.id,
    to: nodes[index + 1].id,
  }));

  return { nodes, edges };
}

const toneClass: Record<RecoveryGraphTone, string> = {
  coral: "recovery-graph-node-coral",
  blue: "recovery-graph-node-blue",
  amber: "recovery-graph-node-amber",
  mint: "recovery-graph-node-mint",
};

export function RecoveryGraph({
  nodes,
  edges,
  onNavigate,
}: {
  nodes: RecoveryGraphNode[];
  edges: RecoveryGraphEdge[];
  onNavigate?: (path: string) => void;
}) {
  const edgeByFrom = new Map(edges.map(edge => [edge.from, edge]));

  return (
    <section className="surface recovery-graph" aria-labelledby="recovery-graph-title">
      <div className="recovery-graph-header">
        <div>
          <div className="eyebrow text-cobalt">Decision path / Live case</div>
          <h2 id="recovery-graph-title" className="section-title mt-2">Recovery Graph</h2>
          <p className="recovery-graph-subtitle">
            See how REVIVE moves from a failed payment to a policy-safe recovery action.
          </p>
        </div>
        <div className="recovery-graph-status" aria-label="Graph status">
          <span className="status-dot bg-mint-strong" />
          Agent decision trace
        </div>
      </div>

      <div className="recovery-graph-canvas" role="list" aria-label="Recovery decision path">
        {nodes.map((node, index) => {
          const edge = edgeByFrom.get(node.id);
          const nextNode = edge && nodes.find(candidate => candidate.id === edge.to);
          return (
            <div className="recovery-graph-step" key={node.id} role="listitem">
              <button
                type="button"
                className={`recovery-graph-node ${toneClass[node.tone]}`}
                data-navigate-to={node.navigateTo}
                aria-label={`${node.eyebrow}: ${node.title}. ${node.detail}`}
                onClick={() => onNavigate?.(node.navigateTo)}
              >
                <span className="recovery-graph-node-icon">{node.icon}</span>
                <span className="recovery-graph-node-copy">
                  <span className="recovery-graph-eyebrow">{node.eyebrow}</span>
                  <strong>{node.title}</strong>
                  <small>{node.detail}</small>
                </span>
              </button>
              {edge && nextNode && index < nodes.length - 1 && (
                <span className="recovery-graph-connector" aria-hidden="true" title={edge.label ?? `${node.title} to ${nextNode.title}`}>
                  <ArrowRight size={14} />
                </span>
              )}
            </div>
          );
        })}
      </div>

      <div className="recovery-graph-footer">
        <span><i className="legend bg-coral" />Observed signal</span>
        <span><i className="legend bg-cobalt" />Agent inference</span>
        <span><i className="legend bg-amber" />Merchant policy</span>
        <span><i className="legend bg-mint-strong" />Verified outcome</span>
      </div>
    </section>
  );
}
