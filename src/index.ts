#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

const CATEGORIES = [
  "AI Coding & Dev Tools",
  "Deployment & Hosting",
  "Database & Backend",
  "Auth & Payments",
  "UI / Design",
  "Marketing & Distribution",
  "Productivity & Automation",
  "Analytics & Monitoring",
];

// Reddit scraping via public JSON API (no auth needed)
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

// GitHub trending via Search API (no auth needed)
async function fetchGitHubTrending(language?: string): Promise<string> {
  try {
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0];

    const langFilter = language ? `+language:${encodeURIComponent(language)}` : "";
    const url = `https://api.github.com/search/repositories?q=created:>${since}${langFilter}&sort=stars&order=desc&per_page=15`;

    const res = await fetch(url, {
      headers: {
        "User-Agent": "solostack-mcp/1.0",
        "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
    });

    if (!res.ok) {
      console.error(`[solostack-mcp] GitHub API error: ${res.status}`);
      return "";
    }

    const data = (await res.json()) as any;
    const items = data?.items ?? [];

    const repos: string[] = items.map((r: any) => {
      const name = r.full_name ?? "";
      const desc = (r.description ?? "").replace(/\s+/g, " ").trim();
      const stars = (r.stargazers_count ?? 0).toLocaleString("en");
      const lang = r.language ?? "—";
      return `${name} | ${desc} | ⭐ ${stars} | ${lang}`;
    });

    return repos.join("\n");
  } catch (err: any) {
    console.error(`[solostack-mcp] GitHub fetch failed: ${err.message}`);
    return "";
  }
}

// Hacker News top stories
async function fetchHackerNews(): Promise<string> {
  try {
    const res = await fetch("https://hacker-news.firebaseio.com/v0/topstories.json");
    const ids: number[] = await res.json();
    const top20 = ids.slice(0, 20);

    const stories = await Promise.all(
      top20.map(async (id) => {
        try {
          const r = await fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`);
          const item: any = await r.json();
          if (item?.score > 100) {
            return `[HN] "${item.title}" (↑${item.score})`;
          }
        } catch {}
        return null;
      })
    );

    return stories.filter(Boolean).join("\n");
  } catch {
    return "";
  }
}

async function getLatestToolStack(focus?: string): Promise<string> {
  const subreddits = [
    "SaaS",
    "webdev",
    "MachineLearning",
    "programming",
    "artificial",
    "LocalLLaMA",
    "entrepreneur",
    "startups",
  ];

  console.error("[solostack-mcp] Fetching data from Reddit, GitHub, HN...");

  const [redditData, githubData, hnData] = await Promise.all([
    fetchRedditPosts(subreddits),
    fetchGitHubTrending(),
    fetchHackerNews(),
  ]);

  const focusNote = focus
    ? `\n\nKullanıcı özellikle şunla ilgileniyor: "${focus}"`
    : "";

  return `# Solostack Canlı Veri — ${new Date().toLocaleDateString("tr-TR")}
${focusNote}

Aşağıdaki ham veriyi analiz ederek **3 ayrı bölüm** oluştur:

---

## BÖLÜM 1 — Kategorize Araç Listesi

Kategoriler: ${CATEGORIES.join(", ")}

Her kategori için 3-5 araç listele:
- Araç adı
- Ne işe yarar (1 satır)
- Neden şu an popüler (veriye dayanarak)
- Fiyat: Ücretsiz / Freemium / Ücretli
- Zorluk: Kolay / Orta / Zor

---

## BÖLÜM 2 — 📈 Bu Hafta GitHub'da Trend Olan Repolar

Aşağıdaki GitHub Trending verisinden yola çıkarak şu formatla bir tablo oluştur:

| # | Repo | Açıklama | Kategori | ⭐ Bu Hafta |
|---|------|----------|----------|------------|
| 1 | owner/repo | ... | AI / DevTool / DB / vb. | ⭐ N |

En az 10 repo listele. Kategoriyi tahmin et (AI Tool, Database, DevTool, Framework, Security, vb.).
Verisi olmayan alanlar için "—" kullan.

---

## BÖLÜM 3 — 🗄️ Database & Backend için Güncel Araçlar

Solo developer / indie hacker için en güncel ve popüler Database & Backend araçlarını listele.
Hem veritabanı hem backend/BaaS kategorilerini kapsa.
Şu formatla tablo oluştur:

| Araç | Tür | Açıklama | Ücretsiz Tier | Öne Çıkan Özellik |
|------|-----|----------|---------------|-------------------|
| Supabase | PostgreSQL BaaS | ... | Evet | Realtime, Auth built-in |
| ... | ... | ... | ... | ... |

En az 10 araç listele. Veriye dayanarak o hafta öne çıkanları üste koy.

---

## BÖLÜM 4 — 🔥 Bu Hafta Öne Çıkanlar

Tüm veriye dayanarak şu an en dikkat çeken 3 araç/repo/gelişmeyi özetle.

---

## HAM VERİ

### REDDIT HOT POSTS (bu hafta)
${redditData || "(veri alınamadı)"}

### GITHUB TRENDING (bu hafta)
${githubData || "(veri alınamadı)"}

### HACKER NEWS TOP STORIES
${hnData || "(veri alınamadı)"}
`;
}

async function getToolsByCategory(category: string): Promise<string> {
  return `# ${category} — En İyi Araçlar

Aşağıdaki kategori için solo developer / indie hacker'lara yönelik en iyi 5-7 aracı listele:

**Kategori:** ${category}

Her araç için şunları içer:
- İsim + URL
- Tek satır açıklama
- Artıları (2-3 madde)
- Eksileri (1-2 madde)
- Aylık maliyet (ücretsiz tier veya başlangıç fiyatı)
- En uygun kullanım: (proje türü / senaryo)

Dürüst ol — sadece ünlü araçları değil, ivme kazanan yenileri de dahil et.`;
}

async function compareTools(toolA: string, toolB: string): Promise<string> {
  return `# ${toolA} vs ${toolB}

Solo developer / indie hacker için bu iki aracı karşılaştır:

- Özellikler
- Fiyatlandırma
- Geliştirici deneyimi (DX)
- Ölçeklenebilirlik
- Topluluk & ekosistem
- Farklı kullanım senaryoları için net kazanan önerisi

**Araç A:** ${toolA}
**Araç B:** ${toolB}`;
}

// MCP Server setup
const server = new Server(
  { name: "solostack-mcp", version: "1.0.0" },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "get_latest_tool_stack",
      description:
        "Reddit, GitHub Trending ve Hacker News'ten canlı veri çeker. Solo developer ve indie hacker'lar için en güncel araçları analiz etmeni sağlar.",
      inputSchema: {
        type: "object",
        properties: {
          focus: {
            type: "string",
            description:
              "Opsiyonel odak alanı (örn. 'AI tools', 'deployment', 'payments', 'database'). Boş bırakılırsa tüm stack gösterilir.",
          },
        },
      },
    },
    {
      name: "get_tools_by_category",
      description:
        "Belirli bir kategori için en iyi araçları listeler (örn. 'Database & Backend', 'Auth & Payments', 'AI Coding & Dev Tools').",
      inputSchema: {
        type: "object",
        properties: {
          category: {
            type: "string",
            description: `Araç kategorisi. Mevcut kategoriler: ${CATEGORIES.join(", ")}`,
          },
        },
        required: ["category"],
      },
    },
    {
      name: "compare_tools",
      description: "İki aracı solo developer kullanım senaryolarında karşılaştırır.",
      inputSchema: {
        type: "object",
        properties: {
          tool_a: { type: "string", description: "Birinci araç adı" },
          tool_b: { type: "string", description: "İkinci araç adı" },
        },
        required: ["tool_a", "tool_b"],
      },
    },
  ],
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    if (name === "get_latest_tool_stack") {
      const result = await getLatestToolStack((args as any)?.focus);
      return { content: [{ type: "text", text: result }] };
    }

    if (name === "get_tools_by_category") {
      const result = await getToolsByCategory((args as any).category);
      return { content: [{ type: "text", text: result }] };
    }

    if (name === "compare_tools") {
      const result = await compareTools((args as any).tool_a, (args as any).tool_b);
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
  console.error("[solostack-mcp] MCP Server running on stdio");
}

main().catch(console.error);
