# solostack-mcp

MCP server that pulls **live data** from Reddit, GitHub Trending & Hacker News — then helps you discover the best tools for solo developers and indie hackers, right inside your AI assistant.

## Tools

| Tool | Description |
|------|-------------|
| `get_latest_tool_stack` | Fetches live data and surfaces trending tools across all categories. Optional `focus` param (e.g. `"AI tools"`, `"database"`). |
| `get_tools_by_category` | Deep-dives into a specific category (e.g. `"Auth & Payments"`, `"Deployment & Hosting"`). |
| `compare_tools` | Side-by-side comparison of two tools for solo dev use cases. |

**Categories covered:** AI Coding & Dev Tools · Deployment & Hosting · Database & Backend · Auth & Payments · UI / Design · Marketing & Distribution · Productivity & Automation · Analytics & Monitoring

## Installation

### Option 1 — npx (no install)

Add to your `claude_desktop_config.json` or `~/.claude.json`:

```json
{
  "mcpServers": {
    "solostack": {
      "command": "npx",
      "args": ["-y", "github:hailneed/solostacks"]
    }
  }
}
```

### Option 2 — Clone & build

```bash
git clone https://github.com/hailneed/solostacks.git
cd solostacks
npm install
npm run build
```

Then add to your MCP config:

```json
{
  "mcpServers": {
    "solostack": {
      "command": "node",
      "args": ["/path/to/solostacks/dist/index.js"]
    }
  }
}
```

### Claude Code (CLI)

```bash
claude mcp add solostack -- npx -y github:hailneed/solostacks
```

## Usage

Once connected, ask your AI assistant:

- *"Show me this week's trending tools"*
- *"What are the best database tools for solo devs right now?"*
- *"Compare Supabase vs PlanetScale"*
- *"Get latest AI tools"*

## Data Sources

- **Reddit** — r/SaaS, r/webdev, r/MachineLearning, r/programming, r/artificial, r/LocalLLaMA, r/entrepreneur, r/startups
- **GitHub Trending** — GitHub Search API, sorted by stars (last 7 days)
- **Hacker News** — Firebase API, top stories with score > 100

No API keys required. All public endpoints.

## Development

```bash
npm run dev   # run with tsx (no build step)
npm run build # compile to dist/
```

## License

MIT
