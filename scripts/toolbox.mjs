// Static, self-hosted toolbox chips (no third-party icon service).
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const tools = [
  ["PowerShell", "#5391FE"],
  ["JavaScript", "#F7DF1E"],
  ["HTML", "#E34F26"],
  ["Kotlin", "#7F52FF"],
  ["Windows", "#0078D4"],
  ["Git", "#F05032"],
  ["GitHub", null],
];

const themes = {
  dark: { fill: "#ffffff", op: "0.035", border: "#2c161b", text: "#e8e8ee", mono: "#ededf2" },
  light: { fill: "#000000", op: "0.025", border: "#e6dcdd", text: "#2a2a33", mono: "#111114" },
};

const FONT = "'Segoe UI','Helvetica Neue',Arial,sans-serif";
const H = 38;
const GAP = 10;

function build(t) {
  let x = 1;
  const parts = tools.map(([name, color]) => {
    const w = Math.round(name.length * 7.6 + 46);
    const out = `  <rect x="${x}" y="1" width="${w}" height="${H}" rx="19" fill="${t.fill}" fill-opacity="${t.op}" stroke="${t.border}"/>
  <circle cx="${x + 20}" cy="${1 + H / 2}" r="5" fill="${color ?? t.mono}"/>
  <text x="${x + 34}" y="${1 + H / 2 + 5}" font-family="${FONT}" font-size="14" font-weight="500" fill="${t.text}">${name}</text>`;
    x += w + GAP;
    return out;
  });
  const width = x - GAP + 1;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${H + 2}" width="${width}" height="${H + 2}" role="img" aria-label="${tools.map((a) => a[0]).join(", ")}">
  <title>${tools.map((a) => a[0]).join(", ")}</title>
${parts.join("\n")}
</svg>
`;
}

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
for (const [name, t] of Object.entries(themes)) {
  writeFileSync(join(root, "assets", `toolbox-${name}.svg`), build(t), "utf8");
}
console.log("toolbox written");
