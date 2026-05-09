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
  {
    label: "Lean Logistics by Lora Cecere",
    url: "https://www.linkedin.com/in/loracecere/recent-activity/posts/",
    category: "supply_chain",
  },
  {
    label: "Gartner Supply Chain Blog",
    url: "https://blogs.gartner.com/smarterwithgartner/category/supply-chain/",
    category: "supply_chain",
  },
  { label: "MIT CTL News", url: "https://ctl.mit.edu/news", category: "supply_chain" },
  { label: "Bloomberg Markets", url: "https://www.bloomberg.com/markets", category: "finance" },
  { label: "Reuters Business", url: "https://www.reuters.com/business/", category: "finance" },
  { label: "Financial Times Markets", url: "https://www.ft.com/markets", category: "finance" },
  { label: "Stratechery", url: "https://stratechery.com/", category: "finance" },
  {
    label: "Matt Levine - Money Stuff",
    url: "https://www.bloomberg.com/opinion/authors/ARbTQlRLRjE/matthew-s-levine",
    category: "finance",
  },
  { label: "a16z Future", url: "https://future.com/", category: "finance" },
  {
    label: "SEC EDGAR Full-Text Search",
    url: "https://efts.sec.gov/LATEST/search-index?q=&forms=8-K",
    category: "finance",
  },
  { label: "Marketing Brew", url: "https://www.marketingbrew.com/", category: "marketing" },
  { label: "HubSpot Blog - Marketing", url: "https://blog.hubspot.com/marketing", category: "marketing" },
  { label: "Search Engine Land", url: "https://searchengineland.com/", category: "marketing" },
  { label: "Marketing Land / MarTech", url: "https://martech.org/", category: "marketing" },
  { label: "Lenny's Newsletter", url: "https://www.lennysnewsletter.com/", category: "marketing" },
  { label: "First Round Review", url: "https://review.firstround.com/", category: "marketing" },
  { label: "Demand Curve Blog", url: "https://www.demandcurve.com/blog", category: "marketing" },
  { label: "The Verge", url: "https://www.theverge.com/", category: "content" },
  { label: "Nieman Lab", url: "https://www.niemanlab.org/", category: "content" },
  { label: "Digiday", url: "https://digiday.com/", category: "content" },
  { label: "Every", url: "https://every.to/", category: "content" },
  { label: "Platformer", url: "https://www.platformer.news/", category: "content" },
  { label: "The Hustle", url: "https://thehustle.co/", category: "content" },
  { label: "Animalz Blog", url: "https://www.animalz.co/blog/", category: "content" },
  { label: "Anthropic News", url: "https://www.anthropic.com/news", category: "other" },
  { label: "OpenAI Blog", url: "https://openai.com/blog", category: "other" },
  { label: "Hugging Face Blog", url: "https://huggingface.co/blog", category: "other" },
  { label: "The Batch", url: "https://www.deeplearning.ai/the-batch/", category: "other" },
  { label: "Import AI", url: "https://importai.substack.com/", category: "other" },
  { label: "AI Snake Oil", url: "https://www.aisnakeoil.com/", category: "other" },
];
