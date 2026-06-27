import type { Anchor, DiagramEdge, DiagramNode } from "../types";

export type Point = {
  x: number;
  y: number;
};

export const VIEWBOX = {
  width: 860,
  height: 460,
};

export function getAnchorPoint(node: DiagramNode, anchor: Anchor = "center"): Point {
  const center = {
    x: node.x + node.width / 2,
    y: node.y + node.height / 2,
  };

  if (anchor === "top") return { x: center.x, y: node.y };
  if (anchor === "right") return { x: node.x + node.width, y: center.y };
  if (anchor === "bottom") return { x: center.x, y: node.y + node.height };
  if (anchor === "left") return { x: node.x, y: center.y };
  return center;
}

export function makeEdgePath(edge: DiagramEdge, nodes: Map<string, DiagramNode>): string {
  const from = nodes.get(edge.from);
  const to = nodes.get(edge.to);
  if (!from || !to) {
    throw new Error(`Edge ${edge.id} references missing node`);
  }

  const start = getAnchorPoint(from, edge.fromAnchor ?? "right");
  const end = getAnchorPoint(to, edge.toAnchor ?? "left");
  const dx = Math.max(64, Math.abs(end.x - start.x) * 0.48);
  const direction = end.x >= start.x ? 1 : -1;
  const c1 = { x: start.x + dx * direction, y: start.y };
  const c2 = { x: end.x - dx * direction, y: end.y };

  return `M ${start.x} ${start.y} C ${c1.x} ${c1.y}, ${c2.x} ${c2.y}, ${end.x} ${end.y}`;
}

export function pathEndpoints(path: string): { start: Point; end: Point } {
  const numbers = path.match(/-?\d+(?:\.\d+)?/g)?.map(Number) ?? [];
  if (numbers.length < 8) throw new Error(`Invalid path: ${path}`);
  return {
    start: { x: numbers[0], y: numbers[1] },
    end: { x: numbers[numbers.length - 2], y: numbers[numbers.length - 1] },
  };
}

export function almostEqualPoint(a: Point, b: Point, tolerance = 0.001): boolean {
  return Math.abs(a.x - b.x) <= tolerance && Math.abs(a.y - b.y) <= tolerance;
}

export function nodeMap(nodes: DiagramNode[]): Map<string, DiagramNode> {
  return new Map(nodes.map((node) => [node.id, node]));
}
