export interface SolostackProfile {
  role: string;
  label: string;
  description: string;
  subreddits: string[];
  focusCategories: string[];
  keywords: string[];
  promptTone: string;
}

export interface UserConfig {
  role?: string;
  customProfile?: Partial<SolostackProfile>;
  language?: "tr" | "en";
}

// Built-in role presets
export const PRESETS: Record<string, SolostackProfile> = {
  designer: {
    role: "designer",
    label: "Designer",
    description: "UI/UX, visual design, design systems, Figma ecosystem",
    subreddits: [
      "web_design",
      "UI_Design",
      "uxdesign",
      "graphic_design",
      "webdev",
      "Frontend",
      "SaaS",
    ],
    focusCategories: ["UI / Design", "AI Coding & Dev Tools", "Productivity & Automation"],
    keywords: ["figma", "design system", "css", "animation", "typography", "component", "tailwind", "framer"],
    promptTone:
      "Focus on design tools, UI libraries, CSS frameworks, Figma plugins, and AI tools that help designers ship faster. Highlight anything visual, component-based, or design-system related.",
  },

  developer: {
    role: "developer",
    label: "Solo Developer",
    description: "Full-stack solo dev, building and shipping products fast",
    subreddits: [
      "programming",
      "webdev",
      "javascript",
      "typescript",
      "golang",
      "SaaS",
      "selfhosted",
    ],
    focusCategories: [
      "AI Coding & Dev Tools",
      "Database & Backend",
      "Deployment & Hosting",
      "Productivity & Automation",
    ],
    keywords: ["dx", "open source", "self-hosted", "api", "framework", "cli", "boilerplate", "starter"],
    promptTone:
      "Focus on developer tools, frameworks, deployment options, and open-source projects. Prioritize tools with great DX, minimal ops overhead, and good free tiers for solo devs.",
  },

  marketer: {
    role: "marketer",
    label: "Growth / Marketer",
    description: "Growth hacking, SEO, content, distribution, analytics",
    subreddits: [
      "marketing",
      "SEO",
      "growthhacking",
      "SaaS",
      "entrepreneur",
      "startups",
      "content_marketing",
    ],
    focusCategories: [
      "Marketing & Distribution",
      "Analytics & Monitoring",
      "Productivity & Automation",
      "Auth & Payments",
    ],
    keywords: ["seo", "growth", "newsletter", "analytics", "conversion", "landing page", "email", "social"],
    promptTone:
      "Focus on marketing automation, SEO tools, analytics platforms, email marketing, social distribution, and conversion tools. Highlight what's gaining traction and what solo marketers are actually using.",
  },

  founder: {
    role: "founder",
    label: "Indie Founder",
    description: "Indie hacker / founder building and selling SaaS products",
    subreddits: [
      "SaaS",
      "entrepreneur",
      "startups",
      "indiehackers",
      "EntrepreneurRideAlong",
      "webdev",
      "MachineLearning",
    ],
    focusCategories: [
      "AI Coding & Dev Tools",
      "Auth & Payments",
      "Marketing & Distribution",
      "Deployment & Hosting",
      "Analytics & Monitoring",
    ],
    keywords: ["mrr", "churn", "monetize", "saas", "stripe", "auth", "payments", "launch", "waitlist"],
    promptTone:
      "Focus on tools that help a solo founder move fast: auth, payments, analytics, deployment, and AI coding. Highlight anything that reduces time-to-revenue. Flag pricing traps and hidden costs.",
  },

  "ml-engineer": {
    role: "ml-engineer",
    label: "ML / AI Engineer",
    description: "Machine learning, LLMs, local inference, AI tooling",
    subreddits: [
      "MachineLearning",
      "LocalLLaMA",
      "artificial",
      "datascience",
      "learnmachinelearning",
      "programming",
    ],
    focusCategories: [
      "AI Coding & Dev Tools",
      "Database & Backend",
      "Deployment & Hosting",
      "Analytics & Monitoring",
    ],
    keywords: ["llm", "inference", "fine-tune", "embedding", "vector", "rag", "agent", "gpu", "quantization"],
    promptTone:
      "Focus on LLM tooling, local inference, model serving, vector databases, RAG pipelines, and AI agent frameworks. Include benchmark comparisons and hardware considerations when relevant.",
  },
};

export function resolveProfile(config: UserConfig): SolostackProfile {
  const roleKey = config.role ?? "developer";
  const base: SolostackProfile = PRESETS[roleKey] ?? PRESETS["developer"];

  if (!config.customProfile) return base;

  // Merge user overrides onto the preset
  return {
    ...base,
    ...config.customProfile,
    subreddits: config.customProfile.subreddits ?? base.subreddits,
    focusCategories: config.customProfile.focusCategories ?? base.focusCategories,
    keywords: config.customProfile.keywords ?? base.keywords,
  };
}

export function listPresets(): string {
  return Object.values(PRESETS)
    .map((p) => `- **${p.role}** — ${p.description}`)
    .join("\n");
}
