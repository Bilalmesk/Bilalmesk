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
        totalCommitContributions
        totalPullRequestContributions
        totalRepositoriesWithContributedCommits
      }
      repositories(first: 100, ownerAffiliations: OWNER, isFork: false, privacy: PUBLIC) {
        totalCount
        nodes {
          stargazerCount
        }
      }
    }
  }
`;

const res = await fetch("https://api.github.com/graphql", {
  method: "POST",
  headers: {
    Authorization: `bearer ${token}`,
    "Content-Type": "application/json",
    "User-Agent": "bilalmesk-profile-dashboard",
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
const cc = user.contributionsCollection;
const stars = user.repositories.nodes.reduce((sum, repo) => sum + repo.stargazerCount, 0);

const nf = new Intl.NumberFormat("en-US");
const metrics = [
  {
    label: "CONTRIBUTIONS",
    value: nf.format(cc.contributionCalendar.totalContributions),
    sub: `across ${cc.totalRepositoriesWithContributedCommits} repositories`,
  },
  {
    label: "COMMITS",
    value: nf.format(cc.totalCommitContributions),
    sub: "last 12 months",
  },
  {
    label: "PULL REQUESTS",
    value: nf.format(cc.totalPullRequestContributions),
    sub: "opened, last 12 months",
  },
  {
    label: "STARS",
    value: nf.format(stars),
    sub: `across ${user.repositories.totalCount} public repositories`,
  },
];

const columns = metrics
  .map((m, i) => {
    const x = [40, 272, 504, 736][i];
    return `  <g>
    <rect x="${x}" y="42" width="18" height="2" rx="1" fill="#e11d48" opacity="0.9"/>
    <text x="${x}" y="80" font-family="'Segoe UI','Helvetica Neue',Arial,sans-serif" font-size="11" font-weight="600" letter-spacing="2.6" fill="#71717a">${m.label}</text>
    <text x="${x}" y="138" font-family="'Segoe UI','Helvetica Neue',Arial,sans-serif" font-size="46" font-weight="600" letter-spacing="-1" fill="#f7f7f9">${m.value}</text>
    <text x="${x}" y="164" font-family="'Segoe UI','Helvetica Neue',Arial,sans-serif" font-size="12" fill="#5f5f66">${m.sub}</text>
  </g>`;
  })
  .join("\n");

const separators = [252, 484, 716]
  .map((x) => `  <line x1="${x}" y1="38" x2="${x}" y2="166" stroke="#1e1e24" stroke-width="1"/>`)
  .join("\n");

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 196" width="1000" height="196" role="img" aria-labelledby="dashboardTitle dashboardDesc">
  <title id="dashboardTitle">Contribution dashboard for ${login}</title>
  <desc id="dashboardDesc">${metrics.map((m) => `${m.label.toLowerCase()}: ${m.value} (${m.sub})`).join(", ")}</desc>

  <defs>
    <linearGradient id="dashBg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#0a0a0c"/>
      <stop offset="1" stop-color="#0c0809"/>
    </linearGradient>
    <linearGradient id="dashEdge" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#e11d48" stop-opacity="0.85"/>
      <stop offset="1" stop-color="#e11d48" stop-opacity="0"/>
    </linearGradient>
    <radialGradient id="dashGlow" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0" stop-color="#e11d48" stop-opacity="0.12"/>
      <stop offset="1" stop-color="#e11d48" stop-opacity="0"/>
    </radialGradient>
  </defs>

  <rect x="1" y="1" width="998" height="194" rx="18" fill="url(#dashBg)" stroke="#1f1f25" stroke-width="1"/>
  <ellipse cx="930" cy="16" rx="230" ry="130" fill="url(#dashGlow)"/>
  <path d="M 24 1 H 210" stroke="url(#dashEdge)" stroke-width="1.5"/>

${separators}

  <text x="960" y="182" text-anchor="end" font-family="'Segoe UI','Helvetica Neue',Arial,sans-serif" font-size="9" font-weight="600" letter-spacing="1.6" fill="#4a4a52">UPDATED DAILY</text>

${columns}
</svg>
`;

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
writeFileSync(join(root, "assets", "dashboard.svg"), svg, "utf8");
console.log("dashboard.svg written");
