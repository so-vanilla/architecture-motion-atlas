import { describe, expect, it } from "vitest";
import type { DiagramEdge, DiagramNode } from "../types";
import { almostEqualPoint, getAnchorPoint, makeEdgePath, nodeMap, pathEndpoints } from "./diagram";

const nodes: DiagramNode[] = [
  { id: "a", label: "A", kind: "service", x: 40, y: 50, width: 120, height: 70 },
  { id: "b", label: "B", kind: "database", x: 360, y: 190, width: 120, height: 70 },
];

describe("diagram path generation", () => {
  it("uses node anchors for start and end points", () => {
    const edge: DiagramEdge = {
      id: "edge",
      from: "a",
      to: "b",
      fromAnchor: "right",
      toAnchor: "left",
      kind: "sync",
    };
    const map = nodeMap(nodes);
    const path = makeEdgePath(edge, map);
    const endpoints = pathEndpoints(path);

    expect(almostEqualPoint(endpoints.start, getAnchorPoint(nodes[0], "right"))).toBe(true);
    expect(almostEqualPoint(endpoints.end, getAnchorPoint(nodes[1], "left"))).toBe(true);
  });

  it("throws when an edge references a missing node", () => {
    const edge: DiagramEdge = { id: "missing", from: "a", to: "z", kind: "async" };
    expect(() => makeEdgePath(edge, nodeMap(nodes))).toThrow(/missing node/);
  });
});
