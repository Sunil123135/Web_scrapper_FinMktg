import type { Domain, Source } from "./types";

type SeedSource = Pick<Source, "url" | "label" | "category">;

export const domainLabels: Record<Domain, string> = {
  finance: "Finance",
  supply_chain: "Supply Chain",
  marketing: "Marketing",
  content: "Content",
  other: "Other",
};

export const seedSources: SeedSource[] = [
  { label: "Supply Chain Dive", url: "https://www.supplychaindive.com/", category: "supply_chain" },
  { label: "The Loadstar", url: "https://theloadstar.com/", category: "supply_chain" },
  { label: "FreightWaves", url: "https://www.freightwaves.com/", category: "supply_chain" },
  { label: "MIT CTL News", url: "https://ctl.mit.edu/news", category: "supply_chain" },
  { label: "Bloomberg Markets", url: "https://www.bloomberg.com/markets", category: "finance" },
  { label: "Reuters Business", url: "https://www.reuters.com/business/", category: "finance" },
  { label: "Financial Times Markets", url: "https://www.ft.com/markets", category: "finance" },
  { label: "SEC EDGAR 8-K Search", url: "https://efts.sec.gov/LATEST/search-index?q=&forms=8-K", category: "finance" },
  { label: "Marketing Brew", url: "https://www.marketingbrew.com/", category: "marketing" },
  { label: "HubSpot Marketing", url: "https://blog.hubspot.com/marketing", category: "marketing" },
  { label: "Search Engine Land", url: "https://searchengineland.com/", category: "marketing" },
  { label: "Demand Curve Blog", url: "https://www.demandcurve.com/blog", category: "marketing" },
  { label: "The Verge", url: "https://www.theverge.com/", category: "content" },
  { label: "Nieman Lab", url: "https://www.niemanlab.org/", category: "content" },
  { label: "Digiday", url: "https://digiday.com/", category: "content" },
  { label: "Animalz Blog", url: "https://www.animalz.co/blog/", category: "content" },
  { label: "Anthropic News", url: "https://www.anthropic.com/news", category: "other" },
  { label: "Hugging Face Blog", url: "https://huggingface.co/blog", category: "other" },
  { label: "The Batch", url: "https://www.deeplearning.ai/the-batch/", category: "other" },
];
