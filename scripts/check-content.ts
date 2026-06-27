import { architectures, architectureIds, findArchitecture } from "../src/data/architectures";
import type { ArchitectureCategory } from "../src/types";

const failures: string[] = [];
const categoryCounts = architectures.reduce<Record<ArchitectureCategory, number>>(
  (counts, architecture) => ({ ...counts, [architecture.category]: counts[architecture.category] + 1 }),
  { software: 0, system: 0 },
);

function fail(message: string): void {
  failures.push(message);
}

if (architectures.length < 20) fail(`expected at least 20 architectures, got ${architectures.length}`);
if (categoryCounts.system < 10) fail(`expected at least 10 system architectures, got ${categoryCounts.system}`);
if (categoryCounts.software < 10) fail(`expected at least 10 software architectures, got ${categoryCounts.software}`);

for (const category of ["system", "software"] as const) {
  const ids = new Set(architectureIds[category]);
  const actual = new Set(architectures.filter((architecture) => architecture.category === category).map((architecture) => architecture.id));
  for (const id of ids) {
    if (!actual.has(id)) fail(`listed ${category} id is missing architecture data: ${id}`);
  }
}

for (const architecture of architectures) {
  const opposite = architecture.category === "system" ? "software" : "system";
  const nodeLabels = architecture.diagram.nodes.map((node) => node.label);
  const specificTerms = nodeLabels.filter((label) => label !== "runtime boundary" && label !== "code boundary");
  if (architecture.diagram.scenarios.length < 3) fail(`${architecture.id}: expected at least 3 scenarios`);
  if (architecture.questions.length < 10) fail(`${architecture.id}: expected at least 10 review questions`);
  if (architecture.benefits.length < 2) fail(`${architecture.id}: expected at least 2 benefits`);
  if (architecture.tradeoffs.length < 2) fail(`${architecture.id}: expected at least 2 tradeoffs`);
  if (architecture.appliesWhen.length < 2) fail(`${architecture.id}: expected at least 2 appliesWhen entries`);
  if (architecture.weakWhen.length < 2) fail(`${architecture.id}: expected at least 2 weakWhen entries`);
  if (architecture.relatedArchitectures.length < 1) fail(`${architecture.id}: expected compatible opposite-category architectures`);
  if (specificTerms.length < 5) fail(`${architecture.id}: expected diagram-specific node terms in content model`);

  const explanatoryCollections = [
    ...architecture.benefits.map((entry) => `benefits:${entry}`),
    ...architecture.tradeoffs.map((entry) => `tradeoffs:${entry}`),
    ...architecture.appliesWhen.map((entry) => `appliesWhen:${entry}`),
    ...architecture.weakWhen.map((entry) => `weakWhen:${entry}`),
  ];
  const explanatoryTexts = explanatoryCollections.map((entry) => entry.replace(/^[^:]+:/, ""));
  if (new Set(explanatoryTexts).size !== explanatoryTexts.length) {
    fail(`${architecture.id}: benefits/tradeoffs/appliesWhen/weakWhen must not reuse exact same entries`);
  }

  for (const collectionName of ["benefits", "tradeoffs", "appliesWhen", "weakWhen"] as const) {
    const entries = architecture[collectionName];
    const genericEntries = entries.filter((entry) => !specificTerms.some((term) => entry.includes(term)) && !entry.includes(architecture.primaryQuestion));
    if (genericEntries.length === entries.length) fail(`${architecture.id}: ${collectionName} entries are not tied to diagram-specific terms`);
  }

  for (const scenario of architecture.diagram.scenarios) {
    if (!scenario.trigger) fail(`${architecture.id}/${scenario.id}: missing trigger`);
    if (!scenario.expectedLearning) fail(`${architecture.id}/${scenario.id}: missing expectedLearning`);
    if (scenario.highlights.length < 1) fail(`${architecture.id}/${scenario.id}: expected at least one highlight`);
    if (scenario.animations.length < 1) fail(`${architecture.id}/${scenario.id}: expected at least one animation`);
    if (scenario.visibleForces.length < 1) fail(`${architecture.id}/${scenario.id}: expected visible quality forces`);
  }

  for (const question of architecture.questions) {
    if (question.answer.length < 12) fail(`${architecture.id}: question answer too short: ${question.question}`);
  }

  const answersWithSpecificTerms = architecture.questions.filter((question) => specificTerms.some((term) => question.answer.includes(term))).length;
  if (answersWithSpecificTerms < 8) fail(`${architecture.id}: expected at least 8 question answers tied to diagram-specific terms`);

  for (const relation of architecture.relatedArchitectures) {
    const target = findArchitecture(relation.architectureId);
    if (!target) {
      fail(`${architecture.id}: relation target missing: ${relation.architectureId}`);
      continue;
    }
    if (target.category !== opposite) fail(`${architecture.id}: relation ${relation.architectureId} must be ${opposite}`);
    if (!relation.reason || !relation.condition || !relation.risk) fail(`${architecture.id}: relation ${relation.architectureId} needs reason, condition, and risk`);
  }
}

if (failures.length > 0) {
  console.error(failures.join("\n"));
  process.exit(1);
}

console.log(`content ok: ${architectures.length} architectures, ${architectures.length * 3} scenario diagrams`);
