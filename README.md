# solostack-mcp

MCP server that pulls **live data** from Reddit, GitHub Trending & Hacker News — then helps you discover the best tools for solo developers and indie hackers, right inside your AI assistant.

Two modes: **generic** (works for everyone) and **role-based** (personalized to your job).

---

## Generic Server

Works out of the box. No config needed.

### Tools

| Tool | Description |
|------|-------------|
| `get_latest_tool_stack` | Live data → trending tools across all categories. Optional `focus` param. |
| `get_tools_by_category` | Deep-dive into a category (e.g. `"Auth & Payments"`). |
| `compare_tools` | Side-by-side comparison of two tools. |

### Install

```bash
# Claude Code
claude mcp add solostack -- npx -y github:hailneed/solostacks

# claude_desktop_config.json / ~/.claude.json
{
  "mcpServers": {
    "solostack": {
      "command": "npx",
      "args": ["-y", "github:hailneed/solostacks"]
    }
  }
}
```

---

## Role-Based / Custom Server

Personalized data filtered for your role. Subreddits, categories, and AI prompts are all tuned to what matters to **you**.

### Built-in Roles

| Role | Best for |
|------|----------|
| `designer` | UI/UX, design systems, Figma ecosystem, CSS |
| `developer` | Full-stack, open-source, DX-focused tooling |
| `marketer` | SEO, growth, email, analytics, distribution |
| `founder` | Indie hacker / SaaS — auth, payments, launch |
| `ml-engineer` | LLMs, local inference, vector DBs, agents |

### Tools

| Tool | Description |
|------|-------------|
| `get_stack_for_role` | Live data filtered and framed for your role. Optional `role` + `focus` params. |
| `get_tools_by_category` | Category deep-dive from your role's perspective. |
| `compare_tools` | Tool comparison tailored to your use case. |
| `list_roles` | Lists all available built-in roles. |

### Install

```bash
# Claude Code
claude mcp add solostack-custom -- npx -y github:hailneed/solostacks/custom

# claude_desktop_config.json / ~/.claude.json
{
  "mcpServers": {
    "solostack-custom": {
      "command": "npx",
      "args": ["-y", "github:hailneed/solostacks", "--", "--custom"],
      "env": {
        "SOLOSTACK_ROLE": "designer"
      }
    }
  }
}
```

Or clone and run locally (recommended for custom config):

```bash
git clone https://github.com/hailneed/solostacks.git
cd solostacks
npm install && npm run build
```

```json
{
  "mcpServers": {
    "solostack-custom": {
      "command": "node",
      "args": ["/path/to/solostacks/dist/custom.js"],
      "env": {
        "SOLOSTACK_ROLE": "designer"
      }
    }
  }
}
```

### Customize with a config file

Copy the example config to your project root:

```bash
cp solostack.config.example.json solostack.config.json
```

Then edit `solostack.config.json`:

```json
{
  "role": "designer",
  "customProfile": {
    "subreddits": ["web_design", "UI_Design", "Figma", "webdev"],
    "focusCategories": ["UI / Design", "AI Coding & Dev Tools"],
    "keywords": ["figma", "framer", "tailwind", "animation"],
    "promptTone": "I am a product designer who codes. Focus on design-engineering tools."
  }
}
```

Config is loaded from the **current working directory** when the server starts. You can also use the `SOLOSTACK_ROLE` environment variable for a quick role switch.

### Override role per-call

You can override the role at call time without changing config:

> *"Get the stack for role: ml-engineer"*  
> *"Compare Supabase vs PlanetScale for a founder"*  
> *"Show me AI tools from a designer's perspective"*

---

## Data Sources

- **Reddit** — role-specific subreddits, hot posts scored > 50 this week
- **GitHub Trending** — GitHub Search API, sorted by stars (last 7 days)
- **Hacker News** — Firebase API, top stories score > 100

No API keys required. All public endpoints.

---

## Development

```bash
npm run dev          # generic server (tsx, no build)
npm run dev:custom   # custom server (tsx, no build)
npm run build        # compile both to dist/
```

---

## License

MIT
