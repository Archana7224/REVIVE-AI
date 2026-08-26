import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { buildRecoveryGraphModel, RecoveryGraph } from "./RecoveryGraph";

describe("Recovery Graph", () => {
  const opportunity = {
    id: "RZP_TEST",
    customer: "Nisha Rao",
    method: "CARD",
    amount: "₹12,400",
    failure: "Authentication",
    prob: 74,
    expected: "₹9,176",
  };

  it("maps an existing recovery opportunity into ordered nodes and explicit edges", () => {
    const model = buildRecoveryGraphModel(opportunity);

    expect(model.nodes.map(node => node.title)).toEqual([
      "Payment failed",
      "Pattern detected",
      "74% likely",
      "Policy allows",
      "Payment link",
      "Revenue recovered",
    ]);
    expect(model.nodes[0].detail).toBe("Authentication · CARD");
    expect(model.nodes[1].detail).toContain("Nisha Rao");
    expect(model.nodes[2].detail).toBe("₹9,176 expected");
    expect(model.nodes[5].detail).toBe("₹12,400 captured");
    expect(model.edges).toEqual([
      { id: "failure-diagnosis", from: "failure", to: "diagnosis" },
      { id: "diagnosis-probability", from: "diagnosis", to: "probability" },
      { id: "probability-policy", from: "probability", to: "policy" },
      { id: "policy-strategy", from: "policy", to: "strategy" },
      { id: "strategy-outcome", from: "strategy", to: "outcome" },
    ]);
  });

  it("renders the supplied graph model as an accessible component", () => {
    const model = buildRecoveryGraphModel(opportunity);
    const markup = renderToStaticMarkup(<RecoveryGraph nodes={model.nodes} edges={model.edges} />);

    expect(markup).toContain('aria-label="Recovery decision path"');
    expect(markup).toContain('role="listitem"');
    expect(markup).toContain("Nisha Rao");
    expect(markup).toContain("74% likely");
    expect(markup).toContain("₹9,176 expected");
    expect(markup.match(/recovery-graph-connector/g)?.length).toBe(5);
  });

  it("renders each node's explicit navigation target for the interaction contract", () => {
    const model = buildRecoveryGraphModel(opportunity);
    const markup = renderToStaticMarkup(<RecoveryGraph nodes={model.nodes} edges={model.edges} onNavigate={() => undefined} />);

    expect(markup).toContain('data-navigate-to="/recovery"');
    expect(markup).toContain('data-navigate-to="/agent"');
    expect(markup).toContain('data-navigate-to="/settings"');
    expect(markup).toContain('aria-label="01 / Signal: Payment failed. Authentication · CARD"');
  });
});
