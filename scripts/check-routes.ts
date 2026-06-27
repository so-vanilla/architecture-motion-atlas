import { architectures, architecturesByCategory } from "../src/data/architectures";

const failures: string[] = [];
const routes = new Set<string>(["#/", "#/system", "#/software"]);

for (const architecture of architectures) {
  const route = `#/${architecture.category}/${architecture.id}`;
  if (routes.has(route)) failures.push(`duplicate route: ${route}`);
  routes.add(route);
}

for (const category of ["system", "software"] as const) {
  const items = architecturesByCategory(category);
  if (items.length === 0) failures.push(`empty category route: ${category}`);
  for (const item of items) {
    const expected = `#/${category}/${item.id}`;
    if (!routes.has(expected)) failures.push(`missing route: ${expected}`);
  }
}

if (failures.length > 0) {
  console.error(failures.join("\n"));
  process.exit(1);
}

console.log(`routes ok: ${routes.size} hash routes`);
