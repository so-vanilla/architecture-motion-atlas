import { architectures } from "../src/data/architectures";
import { almostEqualPoint, getAnchorPoint, makeEdgePath, nodeMap, pathEndpoints, VIEWBOX } from "../src/lib/diagram";
import type { DiagramEdge } from "../src/types";

const failures: string[] = [];

function fail(message: string): void {
  failures.push(message);
}

for (const architecture of architectures) {
  const nodes = nodeMap(architecture.diagram.nodes);
  const nodeIds = new Set<string>();
  const edgeIds = new Set<string>();
  const scenarioEdgeSets = new Set<string>();

  if (architecture.diagram.nodes.length < 7) fail(`${architecture.id}: expected architecture-specific topology with at least 7 nodes`);
  if (architecture.diagram.edges.length < 6) fail(`${architecture.id}: expected architecture-specific topology with at least 6 edges`);

  for (const node of architecture.diagram.nodes) {
    if (nodeIds.has(node.id)) fail(`${architecture.id}: duplicate node ${node.id}`);
    nodeIds.add(node.id);
    if (node.width <= 0 || node.height <= 0) fail(`${architecture.id}/${node.id}: non-positive size`);
    if (node.x < 0 || node.y < 0 || node.x + node.width > VIEWBOX.width || node.y + node.height > VIEWBOX.height) {
      fail(`${architecture.id}/${node.id}: node outside viewBox`);
    }
  }

  for (const edge of architecture.diagram.edges) {
    if (edgeIds.has(edge.id)) fail(`${architecture.id}: duplicate edge ${edge.id}`);
    edgeIds.add(edge.id);
    if (!nodes.has(edge.from)) fail(`${architecture.id}/${edge.id}: missing from node ${edge.from}`);
    if (!nodes.has(edge.to)) fail(`${architecture.id}/${edge.id}: missing to node ${edge.to}`);
    if (!nodes.has(edge.from) || !nodes.has(edge.to)) continue;

    const endpoints = pathEndpoints(makeEdgePath(edge, nodes));
    const expectedStart = getAnchorPoint(nodes.get(edge.from)!, edge.fromAnchor ?? "right");
    const expectedEnd = getAnchorPoint(nodes.get(edge.to)!, edge.toAnchor ?? "left");
    if (!almostEqualPoint(endpoints.start, expectedStart)) fail(`${architecture.id}/${edge.id}: path start does not match from anchor`);
    if (!almostEqualPoint(endpoints.end, expectedEnd)) fail(`${architecture.id}/${edge.id}: path end does not match to anchor`);
  }

  for (const scenario of architecture.diagram.scenarios) {
    const scenarioIds = architecture.diagram.scenarios.filter((item) => item.id === scenario.id);
    if (scenarioIds.length !== 1) fail(`${architecture.id}: duplicate scenario ${scenario.id}`);
    const animatedEdges = [...new Set(scenario.animations.map((animation) => animation.edgeId))].sort();
    scenarioEdgeSets.add(animatedEdges.join(","));
    if (animatedEdges.length < 2) fail(`${architecture.id}/${scenario.id}: expected at least two animated edges for an independent scenario`);
    for (const animation of scenario.animations) {
      if (!edgeIds.has(animation.edgeId)) fail(`${architecture.id}/${scenario.id}: animation references missing edge ${animation.edgeId}`);
    }
    for (const highlight of scenario.highlights) {
      if (!nodeIds.has(highlight.targetId)) fail(`${architecture.id}/${scenario.id}: highlight references missing node ${highlight.targetId}`);
    }
  }

  if (scenarioEdgeSets.size < architecture.diagram.scenarios.length) {
    fail(`${architecture.id}: scenario diagrams must use distinct animated edge sets`);
  }

  const scenarioEdgeLists = architecture.diagram.scenarios.map((scenario) => ({
    id: scenario.id,
    edgeIds: new Set(scenario.animations.map((animation) => animation.edgeId)),
  }));
  for (const left of scenarioEdgeLists) {
    for (const right of scenarioEdgeLists) {
      if (left.id >= right.id) continue;
      const overlap = [...left.edgeIds].filter((edgeId) => right.edgeIds.has(edgeId));
      if (overlap.length > 0) fail(`${architecture.id}: scenarios ${left.id} and ${right.id} share animated edges: ${overlap.join(", ")}`);
    }
  }

  const edgeById = new Map(architecture.diagram.edges.map((edge) => [edge.id, edge]));
  const strongEdges = scenarioEdges(architecture.diagram.scenarios.find((scenario) => scenario.id === "strong")?.animations.map((animation) => edgeById.get(animation.edgeId)).filter(Boolean) as DiagramEdge[]);
  const weakEdges = scenarioEdges(architecture.diagram.scenarios.find((scenario) => scenario.id === "weak")?.animations.map((animation) => edgeById.get(animation.edgeId)).filter(Boolean) as DiagramEdge[]);
  if (!strongEdges.has("support")) fail(`${architecture.id}: strong scenario must animate support path`);
  if (!weakEdges.has("risk")) fail(`${architecture.id}: weak scenario must animate risk path`);
}

const topologySignatures = new Set(
  architectures.map((architecture) =>
    architecture.diagram.edges.map((edge) => `${edge.from}->${edge.to}:${edge.kind}`).sort().join("|"),
  ),
);

if (topologySignatures.size < architectures.length) {
  fail(`expected architecture-specific diagram topology for every style, got ${topologySignatures.size}/${architectures.length}`);
}

if (failures.length > 0) {
  console.error(failures.join("\n"));
  process.exit(1);
}

console.log("diagram geometry ok");

function scenarioEdges(edges: DiagramEdge[]): Set<string> {
  return new Set(edges.flatMap((edge) => [edge.from, edge.to]));
}
