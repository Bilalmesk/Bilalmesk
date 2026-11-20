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

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 420" width="1280" height="420" role="img" aria-labelledby="heroTitle heroDesc">
  <title id="heroTitle">Meskine Morty — Bilalmesk</title>
  <desc id="heroDesc">Profile cover: Meskine Morty, automation, reverse engineering and streaming tooling, ${contributions} contributions in the last twelve months.</desc>

  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#050506"/>
      <stop offset="0.55" stop-color="#090609"/>
      <stop offset="1" stop-color="#0e0508"/>
    </linearGradient>

    <radialGradient id="aurora" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0" stop-color="#e11d48" stop-opacity="0.34"/>
      <stop offset="0.45" stop-color="#e11d48" stop-opacity="0.12"/>
      <stop offset="1" stop-color="#e11d48" stop-opacity="0"/>
    </radialGradient>

    <radialGradient id="ember" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0" stop-color="#7f1d1d" stop-opacity="0.6"/>
      <stop offset="0.55" stop-color="#7f1d1d" stop-opacity="0.16"/>
      <stop offset="1" stop-color="#7f1d1d" stop-opacity="0"/>
    </radialGradient>

    <radialGradient id="faceGlow" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0" stop-color="#ff2d2d" stop-opacity="0.35"/>
      <stop offset="1" stop-color="#ff2d2d" stop-opacity="0"/>
    </radialGradient>

    <linearGradient id="cardFill" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#0d090b" stop-opacity="0.94"/>
      <stop offset="1" stop-color="#080507" stop-opacity="0.9"/>
    </linearGradient>

    <linearGradient id="rule" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#ff2d2d" stop-opacity="0.9"/>
      <stop offset="0.55" stop-color="#ff2d2d" stop-opacity="0.15"/>
      <stop offset="1" stop-color="#ff2d2d" stop-opacity="0"/>
    </linearGradient>

    <linearGradient id="ring" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#ff6b6b"/>
      <stop offset="0.55" stop-color="#e11d48" stop-opacity="0.65"/>
      <stop offset="1" stop-color="#7f1d1d" stop-opacity="0.2"/>
    </linearGradient>

    <pattern id="grid" width="48" height="48" patternUnits="userSpaceOnUse">
      <path d="M 48 0 H 0 V 48" fill="none" stroke="#ffffff" stroke-opacity="0.035" stroke-width="1"/>
    </pattern>

    <filter id="grain" x="0" y="0" width="100%" height="100%">
      <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="3" stitchTiles="stitch"/>
      <feColorMatrix type="saturate" values="0"/>
      <feComponentTransfer><feFuncA type="linear" slope="0.05"/></feComponentTransfer>
    </filter>

    <clipPath id="avatarClip">
      <circle cx="1070" cy="162" r="78"/>
    </clipPath>

    <style>
      .pulse { animation: pulse 3.6s ease-in-out infinite; }
      .drift { animation: drift 26s ease-in-out infinite alternate; }
      @keyframes pulse {
        0%, 100% { opacity: 0.35; }
        50%      { opacity: 1; }
      }
      @keyframes drift {
        from { transform: translate3d(-16px, 6px, 0); }
        to   { transform: translate3d(22px, -8px, 0); }
      }
      @media (prefers-reduced-motion: reduce) {
        .pulse, .drift { animation: none; }
      }
    </style>
  </defs>

  <rect width="1280" height="420" rx="26" fill="url(#bg)"/>
  <rect width="1280" height="420" rx="26" fill="url(#grid)" opacity="0.65"/>
  <ellipse class="drift" cx="980" cy="-40" rx="640" ry="380" fill="url(#aurora)"/>
  <ellipse cx="90" cy="470" rx="560" ry="340" fill="url(#ember)"/>

  <!-- cover card -->
  <rect x="40" y="28" width="1200" height="364" rx="28" fill="url(#cardFill)" stroke="#2a1519" stroke-width="1"/>
  <rect x="40.75" y="28.75" width="1198.5" height="362.5" rx="27.5" fill="none" stroke="#ffffff" stroke-opacity="0.04" stroke-width="1"/>
  <path d="M 68 28 H 330" stroke="url(#rule)" stroke-width="2"/>

  <!-- masthead -->
  <text x="88" y="80" font-family="'Segoe UI','Helvetica Neue',Arial,sans-serif" font-size="12.5" font-weight="600" letter-spacing="3.2" fill="#7a7a84">PROFILE · ISSUE 2026</text>
  <text x="1152" y="80" text-anchor="end" font-family="'JetBrains Mono','Cascadia Code',Consolas,monospace" font-size="13.5" fill="#7a7a84">github.com/Bilalmesk</text>
  <line x1="88" y1="98" x2="1152" y2="98" stroke="#241318" stroke-width="1"/>

  <!-- name -->
  <text x="84" y="190" font-family="'Segoe UI','Helvetica Neue',Arial,sans-serif" font-size="82" font-weight="600" letter-spacing="-2.8" fill="#f7f7f9">Meskine Morty<tspan fill="#ff2d2d">.</tspan></text>
  <text x="88" y="232" font-family="'Segoe UI','Helvetica Neue',Arial,sans-serif" font-size="21" fill="#9c9ca6">Automation, reverse engineering and streaming tooling</text>

  <!-- chips -->
  <g>
    <rect x="88" y="258" width="132" height="34" rx="17" fill="#ffffff" fill-opacity="0.03" stroke="#2a1519" stroke-width="1"/>
    <g fill="#ff4d6d">
      <rect x="105" y="268" width="5.5" height="5.5" rx="1"/>
      <rect x="112.5" y="268" width="5.5" height="5.5" rx="1"/>
      <rect x="105" y="275.5" width="5.5" height="5.5" rx="1"/>
      <rect x="112.5" y="275.5" width="5.5" height="5.5" rx="1"/>
    </g>
    <text x="129" y="280" font-family="'Segoe UI','Helvetica Neue',Arial,sans-serif" font-size="13.5" fill="#c4c4ca">Windows</text>

    <rect x="230" y="258" width="128" height="34" rx="17" fill="#ffffff" fill-opacity="0.03" stroke="#2a1519" stroke-width="1"/>
    <rect x="247" y="267" width="9.5" height="17" rx="2" fill="none" stroke="#ff4d6d" stroke-width="1.5"/>
    <circle cx="251.75" cy="280" r="1" fill="#ff4d6d"/>
    <text x="268" y="280" font-family="'Segoe UI','Helvetica Neue',Arial,sans-serif" font-size="13.5" fill="#c4c4ca">Android</text>

    <rect x="368" y="258" width="100" height="34" rx="17" fill="#ffffff" fill-opacity="0.03" stroke="#2a1519" stroke-width="1"/>
    <text x="385" y="280" font-family="'JetBrains Mono','Cascadia Code',Consolas,monospace" font-size="13.5" fill="#ff4d6d">&gt;_</text>
    <text x="406" y="280" font-family="'Segoe UI','Helvetica Neue',Arial,sans-serif" font-size="13.5" fill="#c4c4ca">CLI</text>
  </g>

  <!-- status -->
  <circle class="pulse" cx="94" cy="338" r="4.5" fill="#ff2d2d"/>
  <text x="112" y="343" font-family="'Segoe UI','Helvetica Neue',Arial,sans-serif" font-size="15" fill="#8a8a94">Building <tspan fill="#e8e8ec">opencode-usage-tracker</tspan> — local-first, read-only</text>

  <!-- portrait -->
  <ellipse cx="1070" cy="162" rx="118" ry="118" fill="url(#faceGlow)" opacity="0.55"/>
  <image href="data:${avatarType};base64,${avatarB64}" x="992" y="84" width="156" height="156" preserveAspectRatio="xMidYMid slice" clip-path="url(#avatarClip)"/>
  <circle cx="1070" cy="162" r="78" fill="none" stroke="url(#ring)" stroke-width="2"/>
  <circle cx="1070" cy="162" r="86" fill="none" stroke="#ff2d2d" stroke-opacity="0.12" stroke-width="5"/>

  <!-- headline stat -->
  <text x="1070" y="308" text-anchor="middle" font-family="'Segoe UI','Helvetica Neue',Arial,sans-serif" font-size="54" font-weight="600" letter-spacing="-1.2" fill="#f7f7f9">${contributions}</text>
  <text x="1070" y="334" text-anchor="middle" font-family="'Segoe UI','Helvetica Neue',Arial,sans-serif" font-size="12" font-weight="600" letter-spacing="2.4" fill="#7a7a84">CONTRIBUTIONS · 12 MO</text>

  <rect width="1280" height="420" rx="26" filter="url(#grain)" opacity="0.5" style="mix-blend-mode:overlay"/>
</svg>
`;

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
writeFileSync(join(root, "assets", "banner.svg"), svg, "utf8");
console.log(`banner.svg written (${contributions} contributions)`);
