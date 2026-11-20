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
      followers {
        totalCount
      }
      contributionsCollection {
        contributionCalendar {
          totalContributions
          weeks {
            contributionDays {
              date
              contributionCount
            }
          }
        }
        totalCommitContributions
        totalPullRequestContributions
        totalRepositoriesWithContributedCommits
      }
      repositories(first: 100, ownerAffiliations: OWNER, isFork: false, privacy: PUBLIC) {
        totalCount
        nodes {
          stargazerCount
          languages(first: 12, orderBy: { field: SIZE, direction: DESC }) {
            edges {
              size
              node {
                name
                color
              }
            }
          }
        }
      }
    }
    repository(owner: $login, name: "session-recovery") {
      stargazerCount
      forkCount
      description
      primaryLanguage {
        name
        color
      }
    }
  }
`;

const res = await fetch("https://api.github.com/graphql", {
  method: "POST",
  headers: {
    Authorization: `bearer ${token}`,
    "Content-Type": "application/json",
    "User-Agent": "bilalmesk-profile-cards",
  },
  body: JSON.stringify({ query, variables: { login } }),
});

if (!res.ok) {
  console.error(`GitHub API ${res.status}: ${await res.text()}`);
  process.exit(1);
}

const payload = await res.json();
if (payload.errors) {
  console.error(JSON.stringify(payload.errors, null, 2));
  process.exit(1);
}

const user = payload.data.user;
const repo = payload.data.repository;
const cc = user.contributionsCollection;

const stars = user.repositories.nodes.reduce((sum, r) => sum + r.stargazerCount, 0);

const langBytes = new Map();
for (const node of user.repositories.nodes) {
  for (const edge of node.languages.edges) {
    langBytes.set(edge.node.name, (langBytes.get(edge.node.name) || 0) + edge.size);
  }
}
const langTotal = [...langBytes.values()].reduce((a, b) => a + b, 0) || 1;
const languages = [...langBytes.entries()]
  .map(([name, bytes]) => ({ name, percent: (bytes / langTotal) * 100 }))
  .sort((a, b) => b.percent - a.percent)
  .slice(0, 5);

const days = cc.contributionCalendar.weeks
  .flatMap((w) => w.contributionDays)
  .map((d) => ({ date: d.date, count: d.contributionCount }));

function streaks(list) {
  let longest = 0;
  let run = 0;
  for (const day of list) {
    if (day.count > 0) {
      run += 1;
      longest = Math.max(longest, run);
    } else {
      run = 0;
    }
  }

  let current = 0;
  let i = list.length - 1;
  if (i >= 0 && list[i].count === 0) i -= 1; // today can still be empty
  while (i >= 0 && list[i].count > 0) {
    current += 1;
    i -= 1;
  }

  return { current, longest };
}

const { current, longest } = streaks(days);
const totalContributions = cc.contributionCalendar.totalContributions;

const weeks = cc.contributionCalendar.weeks.slice(-52).map((w) => ({
  total: w.contributionDays.reduce((sum, d) => sum + d.contributionCount, 0),
  start: w.contributionDays[0].date,
}));

const nf = new Intl.NumberFormat("en-US");
const fmt = (n) => nf.format(n);
const esc = (s) =>
  String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const themes = {
  dark: {
    bg: "#0a0a0c",
    border: "#2a151b",
    divider: "#241318",
    text: "#ededf2",
    muted: "#8b8b95",
    faint: "#6a6a74",
    accent: "#e11d48",
    accentSoft: "#ff3b5c",
    track: "#1c1c22",
    dot: "#ff2d2d",
    title: "#ff3b3b",
    grain: "0.5",
  },
  light: {
    bg: "#ffffff",
    border: "#e6dcdd",
    divider: "#efe8e9",
    text: "#111114",
    muted: "#5b5b66",
    faint: "#6e6e78",
    accent: "#cf222e",
    accentSoft: "#e5484d",
    track: "#f2edee",
    dot: "#cf222e",
    title: "#cf222e",
    grain: "0.2",
  },
};

function shell(t, width, height, title, body) {
  const rx = Math.round(height / 12);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" role="img" aria-label="${esc(title)}">
  <title>${esc(title)}</title>
  <defs>
    <linearGradient id="edge" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="${t.accent}" stop-opacity="0.9"/>
      <stop offset="1" stop-color="${t.accent}" stop-opacity="0"/>
    </linearGradient>
    <linearGradient id="bar" x1="0" y1="1" x2="0" y2="0">
      <stop offset="0" stop-color="${t.accent}" stop-opacity="0.35"/>
      <stop offset="1" stop-color="${t.accentSoft}"/>
    </linearGradient>
    <filter id="grain" x="0" y="0" width="100%" height="100%">
      <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="3" stitchTiles="stitch"/>
      <feColorMatrix type="saturate" values="0"/>
      <feComponentTransfer><feFuncA type="linear" slope="0.04"/></feComponentTransfer>
    </filter>
  </defs>
  <rect x="0.5" y="0.5" width="${width - 1}" height="${height - 1}" rx="${rx}" fill="${t.bg}" stroke="${t.border}" stroke-width="1"/>
  <path d="M ${Math.round(width * 0.056)} 0.75 H ${Math.round(width * 0.25)}" stroke="url(#edge)" stroke-width="1.5"/>
${body}
  <rect x="0.5" y="0.5" width="${width - 1}" height="${height - 1}" rx="${rx}" filter="url(#grain)" opacity="${t.grain}"/>
</svg>
`;
}

function header(t, title, tag, width) {
  const right = width - 28;
  return `  <text x="28" y="40" font-family="'Segoe UI','Helvetica Neue',Arial,sans-serif" font-size="15" font-weight="600" fill="${t.text}">${esc(title)}</text>
  <text x="${right}" y="40" text-anchor="end" font-family="'Segoe UI','Helvetica Neue',Arial,sans-serif" font-size="9" font-weight="600" letter-spacing="1.8" fill="${t.faint}">${esc(tag)}</text>
  <line x1="28" y1="56" x2="${right}" y2="56" stroke="${t.divider}" stroke-width="1"/>`;
}

function statsCard(t) {
  const metrics = [
    [fmt(stars), "STARS EARNED"],
    [fmt(cc.totalCommitContributions), "COMMITS · 12 MO"],
    [fmt(cc.totalPullRequestContributions), "PULL REQUESTS · 12 MO"],
    [fmt(cc.totalRepositoriesWithContributedCommits), "REPOS CONTRIBUTED"],
  ];
  const cells = metrics
    .map(([value, label], i) => {
      const x = i % 2 === 0 ? 28 : 258;
      const y = i < 2 ? 98 : 162;
      return `  <text x="${x}" y="${y}" font-family="'Segoe UI','Helvetica Neue',Arial,sans-serif" font-size="29" font-weight="600" letter-spacing="-0.8" fill="${t.text}">${value}</text>
  <text x="${x}" y="${y + 18}" font-family="'Segoe UI','Helvetica Neue',Arial,sans-serif" font-size="9" font-weight="600" letter-spacing="1.5" fill="${t.faint}">${label}</text>`;
    })
    .join("\n");

  return shell(
    t,
    495,
    195,
    `GitHub stats: ${stars} stars, ${cc.totalCommitContributions} commits, ${cc.totalPullRequestContributions} pull requests`,
    `${header(t, "GitHub stats", "LAST 12 MONTHS", 495)}
  <line x1="243" y1="74" x2="243" y2="178" stroke="${t.divider}" stroke-width="1"/>
  <line x1="28" y1="128" x2="467" y2="128" stroke="${t.divider}" stroke-width="1"/>
${cells}`
  );
}

function streakCard(t) {
  const cells = [
    ["TOTAL · 12 MO", fmt(totalContributions), t.text],
    ["CURRENT", fmt(current), t.accentSoft],
    ["LONGEST", fmt(longest), t.text],
  ];
  const body = cells
    .map(([label, value, color], i) => {
      const x = [28, 178, 328][i];
      return `  <text x="${x}" y="128" font-family="'Segoe UI','Helvetica Neue',Arial,sans-serif" font-size="34" font-weight="600" letter-spacing="-1" fill="${color}">${value}</text>
  <text x="${x}" y="150" font-family="'Segoe UI','Helvetica Neue',Arial,sans-serif" font-size="9" font-weight="600" letter-spacing="1.6" fill="${t.faint}">${label}</text>`;
    })
    .join("\n");

  return shell(
    t,
    495,
    195,
    `Contribution streak: ${current} days current, ${longest} days longest`,
    `${header(t, "Contribution streak", "CONSECUTIVE DAYS", 495)}
  <line x1="163" y1="82" x2="163" y2="172" stroke="${t.divider}" stroke-width="1"/>
  <line x1="313" y1="82" x2="313" y2="172" stroke="${t.divider}" stroke-width="1"/>
${body}`
  );
}

function languagesCard(t) {
  const rows = languages
    .map((lang, i) => {
      const y = 84 + i * 22;
      const width = Math.max(2, Math.round((lang.percent / 100) * 415));
      return `  <circle cx="34" cy="${y - 4}" r="3.5" fill="${t.accent}"/>
  <text x="46" y="${y}" font-family="'Segoe UI','Helvetica Neue',Arial,sans-serif" font-size="12" fill="${t.text}">${esc(lang.name)}</text>
  <text x="467" y="${y}" text-anchor="end" font-family="'Segoe UI','Helvetica Neue',Arial,sans-serif" font-size="10.5" fill="${t.muted}">${lang.percent.toFixed(2)}%</text>
  <rect x="46" y="${y + 3}" width="421" height="4" rx="2" fill="${t.track}"/>
  <rect x="46" y="${y + 3}" width="${width}" height="4" rx="2" fill="${t.accentSoft}" opacity="${1 - i * 0.14}"/>`;
    })
    .join("\n");

  return shell(
    t,
    495,
    195,
    `Most used languages: ${languages.map((l) => l.name).join(", ")}`,
    `${header(t, "Most used languages", "BY BYTES", 495)}
${rows}`
  );
}

function wrap(text, max) {
  const words = String(text).split(/\s+/);
  const lines = [];
  let line = "";
  for (const word of words) {
    if ((line + " " + word).trim().length > max) {
      lines.push(line.trim());
      line = word;
    } else {
      line = (line + " " + word).trim();
    }
  }
  if (line) lines.push(line);
  return lines;
}

function pinnedCard(t) {
  const name = "session-recovery";
  const desc = wrap(repo.description || "Windows session recovery.", 58).slice(0, 2);
  const lang = repo.primaryLanguage?.name || "PowerShell";
  return shell(
    t,
    495,
    195,
    `${name}: ${repo.description}`,
    `  <g transform="translate(28,26)" fill="${t.accentSoft}">
    <path d="M2 2.5A2.5 2.5 0 0 1 4.5 0h8.75a.75.75 0 0 1 .75.75v12.5a.75.75 0 0 1-.75.75h-2.5a.75.75 0 0 1 0-1.5h1.75v-2h-8a1 1 0 0 0-.714 1.7.75.75 0 1 1-1.072 1.05A2.495 2.495 0 0 1 2 11.5Zm10.5-1h-8a1 1 0 0 0-1 1v6.708A2.486 2.486 0 0 1 4.5 9h8ZM5 12.25a.25.25 0 0 1 .25-.25h3.5a.25.25 0 0 1 .25.25v3.25a.25.25 0 0 1-.4.2l-1.45-1.087a.249.249 0 0 0-.3 0L5.4 15.7a.25.25 0 0 1-.4-.2Z"/>
  </g>
  <text x="52" y="42" font-family="'Segoe UI','Helvetica Neue',Arial,sans-serif" font-size="18" font-weight="700" fill="${t.title}">${name}</text>
  <rect x="398" y="27" width="68" height="18" rx="9" fill="none" stroke="${t.border}" stroke-width="1"/>
  <text x="432" y="40" text-anchor="middle" font-family="'Segoe UI','Helvetica Neue',Arial,sans-serif" font-size="9" font-weight="600" letter-spacing="1.2" fill="${t.faint}">PUBLIC</text>
${desc
  .map(
    (line, i) =>
      `  <text x="28" y="${80 + i * 22}" font-family="'Segoe UI','Helvetica Neue',Arial,sans-serif" font-size="13" fill="${t.muted}">${esc(line)}</text>`
  )
  .join("\n")}
  <line x1="28" y1="126" x2="467" y2="126" stroke="${t.divider}" stroke-width="1"/>
  <circle cx="33" cy="152" r="4.5" fill="${t.dot}"/>
  <text x="45" y="156" font-family="'Segoe UI','Helvetica Neue',Arial,sans-serif" font-size="12.5" fill="${t.text}">${esc(lang)}</text>
  <text x="467" y="156" text-anchor="end" font-family="'Segoe UI','Helvetica Neue',Arial,sans-serif" font-size="12.5" fill="${t.accentSoft}">★ ${repo.stargazerCount}</text>
  <text x="412" y="156" text-anchor="end" font-family="'Segoe UI','Helvetica Neue',Arial,sans-serif" font-size="12.5" fill="${t.muted}">${repo.forkCount} fork</text>`
  );
}

function activityCard(t) {
  const width = 1000;
  const height = 240;
  const chartLeft = 44;
  const chartRight = 956;
  const baseline = 198;
  const window = days.slice(-30);
  const windowTotal = window.reduce((sum, d) => sum + d.count, 0);
  const max = Math.max(1, ...window.map((d) => d.count));
  const scale = 108 / max;
  const step = (chartRight - chartLeft) / window.length;
  const barWidth = Math.max(8, step - 9);

  const grid = [0.25, 0.5, 0.75]
    .map(
      (p) =>
        `  <line x1="${chartLeft}" y1="${baseline - 108 * p}" x2="${chartRight}" y2="${baseline - 108 * p}" stroke="${t.divider}" stroke-width="1"/>`
    )
    .join("\n");

  const bars = [];
  window.forEach((d, i) => {
    const x = chartLeft + i * step;
    const h = Math.max(2, Math.round(d.count * scale));
    bars.push(
      `  <rect x="${(x + (step - barWidth) / 2).toFixed(1)}" y="${baseline - h}" width="${barWidth.toFixed(1)}" height="${h}" rx="4" fill="url(#bar)" opacity="${d.count === 0 ? 0.22 : 1}"/>`
    );
    if (i % 5 === 0) {
      const day = new Date(d.date).getUTCDate();
      bars.push(
        `  <text x="${(x + step / 2).toFixed(1)}" y="220" text-anchor="middle" font-family="'Segoe UI','Helvetica Neue',Arial,sans-serif" font-size="9.5" fill="${t.faint}">${day}</text>`
      );
    }
  });

  return shell(
    t,
    width,
    height,
    `Contribution activity over the last 30 days: ${fmt(windowTotal)} contributions`,
    `  <text x="40" y="40" font-family="'Segoe UI','Helvetica Neue',Arial,sans-serif" font-size="15" font-weight="600" fill="${t.text}">Contribution activity</text>
  <text x="960" y="40" text-anchor="end" font-family="'Segoe UI','Helvetica Neue',Arial,sans-serif" font-size="9" font-weight="600" letter-spacing="1.8" fill="${t.faint}">LAST 30 DAYS · ${fmt(windowTotal)} CONTRIBUTIONS</text>
  <line x1="40" y1="56" x2="960" y2="56" stroke="${t.divider}" stroke-width="1"/>
${grid}
${bars.join("\n")}
  <line x1="${chartLeft}" y1="${baseline + 0.5}" x2="${chartRight}" y2="${baseline + 0.5}" stroke="${t.border}" stroke-width="1"/>`
  );
}

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

for (const [name, t] of Object.entries(themes)) {
  writeFileSync(join(root, "assets", `stats-${name}.svg`), statsCard(t), "utf8");
  writeFileSync(join(root, "assets", `streak-${name}.svg`), streakCard(t), "utf8");
  writeFileSync(join(root, "assets", `languages-${name}.svg`), languagesCard(t), "utf8");
  writeFileSync(join(root, "assets", `pinned-${name}.svg`), pinnedCard(t), "utf8");
  writeFileSync(join(root, "assets", `activity-${name}.svg`), activityCard(t), "utf8");
}

console.log(`cards written: ${languages.length} languages, ${weeks.length} weeks, streak ${current}/${longest}`);
