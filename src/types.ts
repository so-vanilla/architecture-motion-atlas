export type ArchitectureCategory = "system" | "software";

export type QualityAttribute =
  | "changeability"
  | "independent-deployability"
  | "independent-scalability"
  | "performance"
  | "availability"
  | "fault-isolation"
  | "data-consistency"
  | "observability"
  | "testability"
  | "security-boundary"
  | "operational-simplicity"
  | "learning-cost"
  | "team-scalability"
  | "cost-predictability";

export type Anchor = "top" | "right" | "bottom" | "left" | "center";

export type DiagramNodeKind =
  | "client"
  | "service"
  | "database"
  | "queue"
  | "gateway"
  | "module"
  | "layer"
  | "boundary"
  | "external"
  | "actor"
  | "view";

export type EdgeKind =
  | "sync"
  | "async"
  | "dependency"
  | "data"
  | "event"
  | "fallback"
  | "cache"
  | "batch"
  | "deployment";

export type RuntimeUnit =
  | "process"
  | "service"
  | "function"
  | "database"
  | "queue"
  | "browser"
  | "edge"
  | "none";

export type CodeBoundary =
  | "module"
  | "layer"
  | "adapter"
  | "domain"
  | "use-case"
  | "plugin"
  | "none";

export type Ownership = "single-team" | "team-owned" | "shared" | "external";

export type DiagramNode = {
  id: string;
  label: string;
  kind: DiagramNodeKind;
  runtimeUnit?: RuntimeUnit;
  codeBoundary?: CodeBoundary;
  ownership?: Ownership;
  x: number;
  y: number;
  width: number;
  height: number;
};

export type DiagramEdge = {
  id: string;
  from: string;
  to: string;
  fromAnchor?: Anchor;
  toAnchor?: Anchor;
  label?: string;
  kind: EdgeKind;
  waitsForResponse?: boolean;
  consistency?: "strong" | "eventual" | "none";
  failurePropagation?: "local" | "upstream" | "downstream" | "fanout";
};

export type Highlight = {
  targetId: string;
  tone: "good" | "risk" | "warning" | "neutral";
  label: string;
};

export type AnimationSpec = {
  id: string;
  edgeId: string;
  label: string;
  tone: "request" | "event" | "data" | "risk" | "success";
  speed: "slow" | "normal" | "fast";
};

export type ScenarioKind =
  | "normal"
  | "strong-case"
  | "weak-case"
  | "traffic-spike"
  | "change-impact"
  | "failure"
  | "consistency-delay";

export type Scenario = {
  id: string;
  title: string;
  kind: ScenarioKind;
  description: string;
  trigger: string;
  expectedLearning: string;
  visibleForces: QualityAttribute[];
  highlights: Highlight[];
  animations: AnimationSpec[];
};

export type DiagramLegendItem = {
  kind: EdgeKind | DiagramNodeKind;
  label: string;
};

export type DiagramSpec = {
  nodes: DiagramNode[];
  edges: DiagramEdge[];
  scenarios: Scenario[];
  legend: DiagramLegendItem[];
};

export type QualityFocus = {
  attribute: QualityAttribute;
  level: "low" | "medium" | "high";
  reason: string;
};

export type DecisionForce = {
  force: string;
  pressure: "low" | "medium" | "high";
  appearsWhen: string;
  diagramScenarioId?: string;
};

export type RelatedArchitecture = {
  architectureId: string;
  relationship: "fits-well" | "fits-with-caution" | "often-confused" | "alternative";
  reason: string;
  condition: string;
  risk: string;
};

export type ArchitectureQuestion = {
  question: string;
  answer: string;
  scenarioId?: string;
};

export type Architecture = {
  id: string;
  category: ArchitectureCategory;
  title: string;
  summary: string;
  essence: string;
  primaryQuestion: string;
  notThis: string[];
  qualityFocus: QualityFocus[];
  decisionForces: DecisionForce[];
  diagram: DiagramSpec;
  benefits: string[];
  tradeoffs: string[];
  appliesWhen: string[];
  weakWhen: string[];
  relatedArchitectures: RelatedArchitecture[];
  questions: ArchitectureQuestion[];
};
