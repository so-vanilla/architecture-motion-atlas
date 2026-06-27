import { readFileSync } from "node:fs";

const failures: string[] = [];
const css = readFileSync("src/styles.css", "utf8");
const app = readFileSync("src/App.tsx", "utf8");

function expectContains(source: string, needle: string, label: string): void {
  if (!source.includes(needle)) failures.push(`missing ${label}: ${needle}`);
}

expectContains(css, "@media (max-width: 920px)", "tablet breakpoint");
expectContains(css, "@media (max-width: 560px)", "mobile breakpoint");
expectContains(css, "aspect-ratio: 860 / 460", "stable SVG aspect ratio");
expectContains(css, "overflow-x: auto", "navigation overflow handling");
expectContains(css, "grid-template-columns: repeat(2, minmax(0, 1fr))", "mobile nav grid");
expectContains(css, "letter-spacing: 0", "non-negative letter spacing rule");
expectContains(app, "architecture.diagram.scenarios.map", "per-scenario diagram rendering");
expectContains(app, "relatedArchitectures", "compatible architecture rendering");
expectContains(app, "architecture.appliesWhen.map", "appliesWhen rendering");
expectContains(app, "architecture.weakWhen.map", "weakWhen rendering");

if (/font-size:\s*[^;]*vw/.test(css)) failures.push("font-size must not be scaled directly with viewport width");
if (/letter-spacing:\s*-/.test(css)) failures.push("negative letter-spacing is disallowed");

if (failures.length > 0) {
  console.error(failures.join("\n"));
  process.exit(1);
}

console.log("responsive/static UI checks ok");
