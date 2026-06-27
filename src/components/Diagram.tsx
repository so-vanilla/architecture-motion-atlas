import type { Architecture, DiagramEdge, DiagramNode, Scenario } from "../types";
import type { ReactElement } from "react";
import { makeEdgePath, nodeMap, VIEWBOX } from "../lib/diagram";

type ArchitectureDiagramProps = {
  architecture: Architecture;
  scenario: Scenario;
};

const edgeClassByKind: Record<DiagramEdge["kind"], string> = {
  async: "edge-async",
  batch: "edge-batch",
  cache: "edge-cache",
  data: "edge-data",
  dependency: "edge-dependency",
  deployment: "edge-deployment",
  event: "edge-event",
  fallback: "edge-fallback",
  sync: "edge-sync",
};

const nodeClassByKind: Record<DiagramNode["kind"], string> = {
  actor: "node-actor",
  boundary: "node-boundary",
  client: "node-client",
  database: "node-database",
  external: "node-external",
  gateway: "node-gateway",
  layer: "node-layer",
  module: "node-module",
  queue: "node-queue",
  service: "node-service",
  view: "node-view",
};

const speedSeconds: Record<Scenario["animations"][number]["speed"], number> = {
  fast: 2.2,
  normal: 3.2,
  slow: 4.8,
};

function domId(...parts: string[]): string {
  return parts.join("-").replace(/[^a-zA-Z0-9_-]/g, "-");
}

function splitLabel(label: string): string[] {
  const normalized = label.replace(/\s+\/\s+/g, " / ").trim();
  const words = normalized.split(/\s+/);
  if (words.length > 1) {
    return words.reduce<string[]>((lines, word) => {
      const last = lines.at(-1);
      if (!last || `${last} ${word}`.length > 18) return [...lines, word];
      return [...lines.slice(0, -1), `${last} ${word}`];
    }, []);
  }

  return normalized.match(/.{1,12}/g) ?? [normalized];
}

function nodeLabel(node: DiagramNode): ReactElement {
  const lines = splitLabel(node.label);
  const lineHeight = 16;
  const firstY = node.y + node.height / 2 - ((lines.length - 1) * lineHeight) / 2;

  return (
    <text className="diagram-node-label" x={node.x + node.width / 2} y={firstY}>
      {lines.map((line, index) => (
        <tspan key={line + index} x={node.x + node.width / 2} dy={index === 0 ? 0 : lineHeight}>
          {line}
        </tspan>
      ))}
    </text>
  );
}

function edgeLabel(edge: DiagramEdge, path: string): ReactElement | null {
  if (!edge.label) return null;
  const numbers = path.match(/-?\d+(?:\.\d+)?/g)?.map(Number) ?? [];
  if (numbers.length < 8) return null;
  const midX = (numbers[0] + numbers[numbers.length - 2]) / 2;
  const midY = (numbers[1] + numbers[numbers.length - 1]) / 2;

  return (
    <text className="diagram-edge-label" x={midX} y={midY - 10}>
      {edge.label}
    </text>
  );
}

export function ArchitectureDiagram({ architecture, scenario }: ArchitectureDiagramProps): ReactElement {
  const nodes = nodeMap(architecture.diagram.nodes);
  const activeEdges = new Set(scenario.animations.map((animation) => animation.edgeId));
  const highlights = new Map(scenario.highlights.map((highlight) => [highlight.targetId, highlight]));
  const edgePaths = architecture.diagram.edges.map((edge) => ({
    edge,
    path: makeEdgePath(edge, nodes),
    pathId: domId("edge", architecture.id, scenario.id, edge.id),
  }));
  const boundaryNodes = architecture.diagram.nodes.filter((node) => node.kind === "boundary");
  const visibleNodes = architecture.diagram.nodes.filter((node) => node.kind !== "boundary");

  return (
    <figure className="diagram-frame" aria-labelledby={domId("caption", architecture.id, scenario.id)}>
      <svg viewBox={`0 0 ${VIEWBOX.width} ${VIEWBOX.height}`} role="img" aria-label={`${architecture.title}: ${scenario.title}`}>
        <defs>
          <marker id={domId("arrow", architecture.id, scenario.id)} viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" className="marker-arrow" />
          </marker>
          <filter id={domId("soft", architecture.id, scenario.id)} x="-20%" y="-30%" width="140%" height="160%">
            <feDropShadow dx="0" dy="7" stdDeviation="8" floodColor="#1b2a33" floodOpacity="0.16" />
          </filter>
        </defs>

        <rect className="diagram-canvas" x="0" y="0" width={VIEWBOX.width} height={VIEWBOX.height} />

        {boundaryNodes.map((node) => {
          const highlight = highlights.get(node.id);
          return (
            <g key={node.id} className={`diagram-node ${nodeClassByKind[node.kind]} ${highlight ? `highlight-${highlight.tone}` : ""}`}>
              <rect x={node.x} y={node.y} width={node.width} height={node.height} rx="8" />
              {nodeLabel(node)}
            </g>
          );
        })}

        {edgePaths.map(({ edge, path, pathId }) => (
          <g key={edge.id} className={`diagram-edge ${edgeClassByKind[edge.kind]} ${activeEdges.has(edge.id) ? "edge-active" : ""}`}>
            <path id={pathId} d={path} markerEnd={`url(#${domId("arrow", architecture.id, scenario.id)})`} />
            {edgeLabel(edge, path)}
          </g>
        ))}

        {visibleNodes.map((node) => {
          const highlight = highlights.get(node.id);
          return (
            <g key={node.id} className={`diagram-node ${nodeClassByKind[node.kind]} ${highlight ? `highlight-${highlight.tone}` : ""}`} filter={highlight ? `url(#${domId("soft", architecture.id, scenario.id)})` : undefined}>
              <rect x={node.x} y={node.y} width={node.width} height={node.height} rx="8" />
              {nodeLabel(node)}
              {highlight ? (
                <text className="diagram-highlight-label" x={node.x + node.width / 2} y={node.y + node.height + 22}>
                  {highlight.label}
                </text>
              ) : null}
            </g>
          );
        })}

        {scenario.animations.map((animation) => {
          const edgePath = edgePaths.find((item) => item.edge.id === animation.edgeId);
          if (!edgePath) return null;
          return (
            <g key={animation.id} className={`flow-token flow-${animation.tone}`}>
              <circle r="7">
                <animateMotion dur={`${speedSeconds[animation.speed]}s`} repeatCount="indefinite" rotate="auto">
                  <mpath href={`#${edgePath.pathId}`} />
                </animateMotion>
              </circle>
            </g>
          );
        })}
      </svg>

      <figcaption id={domId("caption", architecture.id, scenario.id)} className="diagram-caption">
        <span>{scenario.trigger}</span>
        <strong>{scenario.expectedLearning}</strong>
      </figcaption>
    </figure>
  );
}
