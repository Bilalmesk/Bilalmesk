import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const login = "Bilalmesk";
const token = process.env.GH_TOKEN || process.env.GITHUB_TOKEN;
if (!token) {
  console.error("Missing GH_TOKEN / GITHUB_TOKEN");
  process.exit(1);
}

const query = /* GraphQL */ `
  query ($login: String!) {
    user(login: $login) {
      contributionsCollection {
        contributionCalendar {
          totalContributions
        }
      }
    }
  }
`;

const gql = await fetch("https://api.github.com/graphql", {
  method: "POST",
  headers: {
    Authorization: `bearer ${token}`,
    "Content-Type": "application/json",
    "User-Agent": "bilalmesk-profile-hero",
  },
  body: JSON.stringify({ query, variables: { login } }),
});

if (!gql.ok) {
  console.error(`GitHub API ${gql.status}: ${await gql.text()}`);
  process.exit(1);
}

const payload = await gql.json();
if (payload.errors) {
  console.error(JSON.stringify(payload.errors, null, 2));
  process.exit(1);
}

const contributions = payload.data.user.contributionsCollection.contributionCalendar.totalContributions;

const avatarRes = await fetch(`https://github.com/${login}.png?size=240`, {
  headers: { "User-Agent": "bilalmesk-profile-hero" },
});
if (!avatarRes.ok) {
  console.error(`Avatar fetch failed: ${avatarRes.status}`);
  process.exit(1);
}
const avatarB64 = Buffer.from(await avatarRes.arrayBuffer()).toString("base64");
const avatarType = avatarRes.headers.get("content-type") || "image/png";


const themes = {
  dark: {
    bg1: "#060607",
    bg2: "#0a0709",
    bg3: "#12060a",
    win: "#0c0a0c",
    winBar: "#120d10",
    border: "#2c161b",
    text: "#f7f7f9",
    muted: "#a3a3ad",
    faint: "#767680",
    chipFill: "#ffffff",
    chipOp: "0.035",
    accent: "#ff2d2d",
    accentSoft: "#ff4d6d",
    glow: "#e11d48",
    grid: "#ffffff",
    gridOp: "0.04",
    dotA: "#ff5f57",
    dotB: "#febc2e",
    dotC: "#28c840",
    grain: "0.45",
  },
  light: {
    bg1: "#ffffff",
    bg2: "#fcf7f8",
    bg3: "#fff0f2",
    win: "#ffffff",
    winBar: "#f7f1f2",
    border: "#e6dcdd",
    text: "#111114",
    muted: "#55555f",
    faint: "#6e6e78",
    chipFill: "#000000",
    chipOp: "0.025",
    accent: "#cf222e",
    accentSoft: "#e5484d",
    glow: "#ffb3bf",
    grid: "#000000",
    gridOp: "0.04",
    dotA: "#ff5f57",
    dotB: "#febc2e",
    dotC: "#28c840",
    grain: "0.2",
  },
};

const SANS = "'Segoe UI','Helvetica Neue',Arial,sans-serif";
const MONO = "'JetBrains Mono','Cascadia Code',Consolas,'DejaVu Sans Mono',monospace";
const projects = ["session-recovery", "opencode-usage-tracker", "mihon-extensions", "netflix-speed-keys"];

function build(t) {
  let cx = 88;
  const chips = projects
    .map((name) => {
      const w = Math.round(name.length * 7.9 + 36);
      const out = `    <rect x="${cx}" y="300" width="${w}" height="32" rx="16" fill="${t.chipFill}" fill-opacity="${t.chipOp}" stroke="${t.border}"/>
    <circle cx="${cx + 16}" cy="316" r="3" fill="${t.accentSoft}"/>
    <text x="${cx + 28}" y="320.5" font-family="${MONO}" font-size="13" fill="${t.muted}">${name}</text>`;
      cx += w + 10;
      return out;
    })
    .join("\n");

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 420" width="1280" height="420" role="img" aria-labelledby="heroTitle heroDesc">
  <title id="heroTitle">Meskine Morty — Bilalmesk</title>
  <desc id="heroDesc">Profile cover styled as a terminal: Meskine Morty, automation, reverse engineering and streaming tooling, ${contributions} contributions in the last twelve months.</desc>

  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${t.bg1}"/>
      <stop offset="0.6" stop-color="${t.bg2}"/>
      <stop offset="1" stop-color="${t.bg3}"/>
    </linearGradient>
    <radialGradient id="glowA" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0" stop-color="${t.glow}" stop-opacity="0.38"/>
      <stop offset="1" stop-color="${t.glow}" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="winEdge" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${t.accent}" stop-opacity="0.55"/>
      <stop offset="0.5" stop-color="${t.border}" stop-opacity="1"/>
      <stop offset="1" stop-color="${t.accent}" stop-opacity="0.25"/>
    </linearGradient>
    <linearGradient id="nameFill" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="${t.text}"/>
      <stop offset="1" stop-color="${t.text}"/>
    </linearGradient>
    <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
      <path d="M 40 0 H 0 V 40" fill="none" stroke="${t.grid}" stroke-opacity="${t.gridOp}"/>
    </pattern>
    <filter id="grain" x="0" y="0" width="100%" height="100%">
      <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="3" stitchTiles="stitch"/>
      <feColorMatrix type="saturate" values="0"/>
      <feComponentTransfer><feFuncA type="linear" slope="0.05"/></feComponentTransfer>
    </filter>
    <clipPath id="winClip"><rect x="40" y="28" width="1200" height="364" rx="20"/></clipPath>
    <clipPath id="avatarClip"><rect x="1001" y="116" width="170" height="170" rx="30"/></clipPath>
    <style>
      .blink { animation: blink 1.1s steps(1) infinite; }
      @keyframes blink { 0%, 50% { opacity: 1; } 51%, 100% { opacity: 0; } }
      .pulse { animation: pulse 3.2s ease-in-out infinite; }
      @keyframes pulse { 0%, 100% { opacity: 0.4; } 50% { opacity: 1; } }
      @media (prefers-reduced-motion: reduce) { .blink, .pulse { animation: none; } }
    </style>
  </defs>

  <rect width="1280" height="420" rx="26" fill="url(#bg)"/>
  <rect width="1280" height="420" rx="26" fill="url(#grid)"/>
  <ellipse cx="1090" cy="40" rx="520" ry="300" fill="url(#glowA)"/>
  <ellipse cx="120" cy="450" rx="480" ry="260" fill="url(#glowA)" opacity="0.55"/>

  <!-- terminal window -->
  <rect x="40" y="28" width="1200" height="364" rx="20" fill="${t.win}" fill-opacity="0.96" stroke="url(#winEdge)" stroke-width="1.2"/>
  <g clip-path="url(#winClip)">
    <rect x="40" y="28" width="1200" height="44" fill="${t.winBar}"/>
    <line x1="40" y1="72" x2="1240" y2="72" stroke="${t.border}"/>
  </g>
  <circle cx="68" cy="50" r="6" fill="${t.dotA}"/>
  <circle cx="90" cy="50" r="6" fill="${t.dotB}"/>
  <circle cx="112" cy="50" r="6" fill="${t.dotC}"/>
  <text x="640" y="55" text-anchor="middle" font-family="${MONO}" font-size="12.5" fill="${t.faint}">bilal@morty — ~/profile — zsh</text>
  <text x="1212" y="55" text-anchor="end" font-family="${MONO}" font-size="12" fill="${t.faint}">github.com/Bilalmesk</text>

  <!-- whoami -->
  <text x="88" y="112" font-family="${MONO}" font-size="15" fill="${t.faint}"><tspan fill="${t.accent}">❯</tspan> whoami</text>
  <text x="84" y="196" font-family="${SANS}" font-size="78" font-weight="700" letter-spacing="-2.6" fill="url(#nameFill)">Meskine Morty<tspan class="blink" fill="${t.accent}" font-family="${MONO}" font-weight="400" dx="6">_</tspan></text>
  <text x="88" y="238" font-family="${SANS}" font-size="21" fill="${t.muted}">Automation, reverse engineering and streaming tooling.</text>

  <!-- tools -->
  <text x="88" y="280" font-family="${MONO}" font-size="15" fill="${t.faint}"><tspan fill="${t.accent}">❯</tspan> ls ~/tools</text>
  <g>
${chips}
  </g>

  <!-- status -->
  <text x="88" y="366" font-family="${MONO}" font-size="14" fill="${t.faint}"><tspan fill="${t.accent}">❯</tspan> status <tspan class="pulse" fill="${t.accent}">●</tspan> <tspan fill="${t.muted}">building local-first, read-only analytics</tspan></text>

  <!-- divider -->
  <line x1="950" y1="104" x2="950" y2="372" stroke="${t.border}"/>

  <!-- portrait -->
  <ellipse cx="1086" cy="201" rx="130" ry="130" fill="url(#glowA)" opacity="0.7"/>
  <image href="data:${avatarType};base64,${avatarB64}" x="1001" y="116" width="170" height="170" preserveAspectRatio="xMidYMid slice" clip-path="url(#avatarClip)"/>
  <rect x="1001" y="116" width="170" height="170" rx="30" fill="none" stroke="${t.accent}" stroke-opacity="0.55" stroke-width="1.5"/>
  <g fill="none" stroke="${t.accent}" stroke-width="2.5" stroke-linecap="round">
    <path d="M 987 140 V 110 a 14 14 0 0 1 14 -14 H 1031"/>
    <path d="M 1141 96 H 1171 a 14 14 0 0 1 14 14 V 140"/>
    <path d="M 987 262 V 292 a 14 14 0 0 0 14 14 H 1031"/>
    <path d="M 1141 306 H 1171 a 14 14 0 0 0 14 -14 V 262"/>
  </g>

  <!-- headline stat -->
  <text x="1086" y="352" text-anchor="middle" font-family="${SANS}" font-size="42" font-weight="700" letter-spacing="-1" fill="${t.text}">${contributions}</text>
  <text x="1086" y="374" text-anchor="middle" font-family="${SANS}" font-size="11" font-weight="600" letter-spacing="2.4" fill="${t.faint}">CONTRIBUTIONS · 12 MO</text>

  <rect width="1280" height="420" rx="26" filter="url(#grain)" opacity="${t.grain}" style="mix-blend-mode:overlay"/>
</svg>
`;
}

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
writeFileSync(join(root, "assets", "banner-dark.svg"), build(themes.dark), "utf8");
writeFileSync(join(root, "assets", "banner-light.svg"), build(themes.light), "utf8");
console.log(`hero written (${contributions} contributions)`);
