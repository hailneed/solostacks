#!/usr/bin/env node
/**
 * solostack-mcp — Customizable / Role-based server
 *
 * Configure via:
 *   1. solostack.config.json in your project root
 *   2. SOLOSTACK_ROLE env var  (e.g. SOLOSTACK_ROLE=designer)
 *   3. tool parameter `role` at call time
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { readFileSync, existsSync } from "fs";
import { join } from "path";
import {
  resolveProfile,
  listPresets,
  PRESETS,
  type UserConfig,
  type SolostackProfile,
} from "./profiles.js";

// ─── Config loader ────────────────────────────────────────────────────────────

function loadConfig(): UserConfig {
  const configPath = join(process.cwd(), "solostack.config.json");
  if (existsSync(configPath)) {
    try {
      const raw = readFileSync(configPath, "utf-8");
      return JSON.parse(raw) as UserConfig;
    } catch (e) {
      console.error("[solostack-mcp] Could not parse solostack.config.json, using defaults.");
    }
  }
  // Fallback: env var
  const envRole = process.env.SOLOSTACK_ROLE;
  if (envRole) return { role: envRole };
  return {};
}

const baseConfig = loadConfig();

// ─── Data fetchers ────────────────────────────────────────────────────────────

async function fetchRedditPosts(subreddits: string[]): Promise<string> {
  const results: string[] = [];
  for (const sub of subreddits) {
    try {
      const url = `https://www.reddit.com/r/${sub}/hot.json?limit=15&t=week`;
      const res = await fetch(url, {
        headers: { "User-Agent": "solostack-mcp/1.0 (tool discovery)" },
      });
      if (!res.ok) continue;
      const data = (await res.json()) as any;
      const posts = data?.data?.children ?? [];
      for (const p of posts) {
        const d = p.data;
        if (d.score > 50) {
          results.push(`[r/${sub}] "${d.title}" (↑${d.score})`);
        }
      }
    } catch {
      // skip failed subreddit
    }
  }
  return results.slice(0, 40).join("\n");
}

async function fetchGitHubTrending(): Promise<string> {
  try {
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0];
    const url = `https://api.github.com/search/repositories?q=created:>${since}&sort=stars&order=desc&per_page=15`;
    const res = await fetch(url, {
      headers: {
        "User-Agent": "solostack-mcp/1.0",
        "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
    });
    if (!res.ok) return "";
    const data = (await res.json()) as any;
    return (data?.items ?? [])
      .map((r: any) => `${r.full_name} | ${(r.description ?? "").trim()} | ⭐ ${r.stargazers_count} | ${r.language ?? "—"}`)
      .join("\n");
  } catch {
    return "";
  }
}

async function fetchHackerNews(): Promise<string> {
  try {
    const res = await fetch("https://hacker-news.firebaseio.com/v0/topstories.json");
    const ids: number[] = await res.json();
    const stories = await Promise.all(
      ids.slice(0, 20).map(async (id) => {
        try {
          const r = await fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`);
          const item: any = await r.json();
          if (item?.score > 100) return `[HN] "${item.title}" (↑${item.score})`;
        } catch {}
        return null;
      })
    );
    return stories.filter(Boolean).join("\n");
  } catch {
    return "";
  }
}

// ─── Tool implementations ─────────────────────────────────────────────────────

async function getRoleStack(
  profile: SolostackProfile,
  focus?: string
): Promise<string> {
  console.error(`[solostack-mcp] Fetching for role: ${profile.role}`);

  const [redditData, githubData, hnData] = await Promise.all([
    fetchRedditPosts(profile.subreddits),
    fetchGitHubTrending(),
    fetchHackerNews(),
  ]);

  const focusNote = focus ? `\nExtra focus: "${focus}"` : "";
  const keywordHint = profile.keywords.length
    ? `\nPay special attention to topics around: ${profile.keywords.join(", ")}`
    : "";

  return `# Solostack — ${profile.label} Stack (${new Date().toLocaleDateString("tr-TR")})

**Role:** ${profile.label}
**Focus categories:** ${profile.focusCategories.join(", ")}
${focusNote}

## Instructions for AI

${profile.promptTone}
${keywordHint}

Analyze the raw data below and produce:

### 1. Top Tools for ${profile.label}

List 5-8 tools most relevant to this role from the data:
| Tool | What it does | Why relevant now | Price | Difficulty |
|------|-------------|-----------------|-------|------------|

### 2. Trending GitHub Repos This Week

Filter from the data — highlight repos relevant to **${profile.label}** work:
| Repo | Description | Category | ⭐ Stars |
|------|-------------|----------|---------|

### 3. Community Signals

What is the **${profile.label}** community talking about this week? Pull 3-5 key themes from Reddit/HN.

### 4. This Week's Must-Know

1 paragraph: the single most important development for a ${profile.label} this week.

---

## RAW DATA

### REDDIT (subreddits: ${profile.subreddits.join(", ")})
${redditData || "(no data)"}

### GITHUB TRENDING
${githubData || "(no data)"}

### HACKER NEWS
${hnData || "(no data)"}
`;
}

async function getToolsByCategory(category: string, profile: SolostackProfile): Promise<string> {
  return `# ${category} — Best Tools for ${profile.label}

List the best 5-7 tools in this category specifically for a **${profile.label}**:

**Category:** ${category}
**Perspective:** ${profile.promptTone}

For each tool include:
- Name + URL
- One-line description
- Pros (2-3 bullets)
- Cons (1-2 bullets)
- Monthly cost (free tier or starting price)
- Best for: (specific ${profile.label} use case)

Be honest — include rising tools, not just the obvious names.`;
}

async function compareTools(toolA: string, toolB: string, profile: SolostackProfile): Promise<string> {
  return `# ${toolA} vs ${toolB} — for ${profile.label}

Compare these two tools from the perspective of a **${profile.label}**:

${profile.promptTone}

Cover:
- Features
- Pricing
- Developer/user experience
- Scalability
- Community & ecosystem
- Clear winner recommendation for different ${profile.label} scenarios

**Tool A:** ${toolA}
**Tool B:** ${toolB}`;
}

// ─── MCP Server ───────────────────────────────────────────────────────────────

const server = new Server(
  { name: "solostack-custom", version: "1.0.0" },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "get_stack_for_role",
      description:
        "Fetches live data from Reddit, GitHub Trending & HN and surfaces the most relevant tools for your role. Uses config file or SOLOSTACK_ROLE env var by default.",
      inputSchema: {
        type: "object",
        properties: {
          role: {
            type: "string",
            description: `Override role for this call. Available: ${Object.keys(PRESETS).join(", ")}`,
          },
          focus: {
            type: "string",
            description: "Optional extra focus area (e.g. 'AI agents', 'animations', 'payments')",
          },
        },
      },
    },
    {
      name: "get_tools_by_category",
      description: "Lists best tools in a category, filtered by your role perspective.",
      inputSchema: {
        type: "object",
        properties: {
          category: {
            type: "string",
            description:
              "Category: AI Coding & Dev Tools, Deployment & Hosting, Database & Backend, Auth & Payments, UI / Design, Marketing & Distribution, Productivity & Automation, Analytics & Monitoring",
          },
          role: {
            type: "string",
            description: `Optional role override. Available: ${Object.keys(PRESETS).join(", ")}`,
          },
        },
        required: ["category"],
      },
    },
    {
      name: "compare_tools",
      description: "Compares two tools from your role's perspective.",
      inputSchema: {
        type: "object",
        properties: {
          tool_a: { type: "string", description: "First tool name" },
          tool_b: { type: "string", description: "Second tool name" },
          role: {
            type: "string",
            description: `Optional role override. Available: ${Object.keys(PRESETS).join(", ")}`,
          },
        },
        required: ["tool_a", "tool_b"],
      },
    },
    {
      name: "list_roles",
      description: "Lists all available built-in roles/presets.",
      inputSchema: { type: "object", properties: {} },
    },
  ],
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    if (name === "list_roles") {
      return {
        content: [
          {
            type: "text",
            text: `# Available Roles\n\n${listPresets()}\n\nConfigure via \`solostack.config.json\` or \`SOLOSTACK_ROLE\` env var.`,
          },
        ],
      };
    }

    // Resolve profile: call-time role > config file > env var > default
    const callRole = (args as any)?.role;
    const config: UserConfig = callRole
      ? { ...baseConfig, role: callRole }
      : baseConfig;
    const profile = resolveProfile(config);

    if (name === "get_stack_for_role") {
      const result = await getRoleStack(profile, (args as any)?.focus);
      return { content: [{ type: "text", text: result }] };
    }

    if (name === "get_tools_by_category") {
      const result = await getToolsByCategory((args as any).category, profile);
      return { content: [{ type: "text", text: result }] };
    }

    if (name === "compare_tools") {
      const result = await compareTools((args as any).tool_a, (args as any).tool_b, profile);
      return { content: [{ type: "text", text: result }] };
    }

    return { content: [{ type: "text", text: `Unknown tool: ${name}` }], isError: true };
  } catch (err: any) {
    return { content: [{ type: "text", text: `Error: ${err.message}` }], isError: true };
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  const profile = resolveProfile(baseConfig);
  console.error(`[solostack-mcp] Custom server running — role: ${profile.role}`);
}

main().catch(console.error);
