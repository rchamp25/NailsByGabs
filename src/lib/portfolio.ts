export const PORTFOLIO_FILE_NAMES = [
  "3DGelNails.jpeg",
  "3DWFun.jpeg",
  "AuraNails1.jpeg",
  "Aura2.jpeg",
  "Aura3.jpeg",
  "BloomingGel.jpeg",
  "BloomWAura.jpeg",
  "CatEye1.jpeg",
  "FrenchWChrome.jpeg",
  "French2.jpeg",
  "FruitNails1.jpeg",
  "Fruit2.jpeg",
  "Fruit3.jpeg",
  "Fruit4.jpeg",
  "FunNails1.jpeg",
  "FunNails2.jpeg",
  "FunNails3.jpeg",
  "FunNails4.jpeg",
  "FunNails5.jpeg",
  "Fun6.jpeg",
  "Fun7.jpeg",
  "Fun8.jpeg",
  "Fun9.jpeg",
  "Fun10.jpeg",
  "Fun11W3D.jpeg",
  "FunW3D.jpeg",
  "IsolatedChromeNails1.jpeg",
  "Ombre1.jpeg",
  "Square1.jpeg",
] as const;

export type PortfolioTag =
  | "All"
  | "Aura"
  | "Blooming"
  | "Fun"
  | "Fruit"
  | "Ombre"
  | "French"
  | "Chrome"
  | "Cat Eye"
  | "3D";

export type PortfolioImage = {
  src: string;
  title: string;
  fileName: string;
  focal: string;
  tags: Exclude<PortfolioTag, "All">[];
};

export const PORTFOLIO_TAGS: PortfolioTag[] = [
  "All",
  "Aura",
  "Blooming",
  "Fun",
  "Fruit",
  "Ombre",
  "French",
  "Chrome",
  "Cat Eye",
  "3D",
];

const focalByFileName: Record<string, string> = {
  "3DGelNails.jpeg": "50% 40%",
  "AuraNails1.jpeg": "50% 45%",
  "BloomingGel.jpeg": "52% 42%",
  "FrenchWChrome.jpeg": "50% 42%",
  "FruitNails1.jpeg": "50% 38%",
  "FunNails1.jpeg": "50% 45%",
  "FunNails2.jpeg": "50% 46%",
  "FunNails3.jpeg": "50% 44%",
  "FunNails4.jpeg": "50% 40%",
  "FunNails5.jpeg": "50% 45%",
  "IsolatedChromeNails1.jpeg": "50% 42%",
  "Ombre1.jpeg": "50% 43%",
};

const fileNameMatchers: Record<Exclude<PortfolioTag, "All">, string[]> = {
  Aura: ["aura"],
  Blooming: ["blooming", "bloom"],
  Fun: ["fun"],
  Fruit: ["fruit"],
  Ombre: ["ombre"],
  French: ["french"],
  Chrome: ["chrome"],
  "Cat Eye": ["cateye", "cat_eye", "cat-eye", "cat eye"],
  "3D": ["3d"],
};

function normalizeFileName(fileName: string): string {
  return fileName.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function imageMatchesTag(
  fileName: string,
  tag: Exclude<PortfolioTag, "All">
): boolean {
  const normalized = normalizeFileName(fileName);
  return fileNameMatchers[tag].some((term) =>
    normalized.includes(normalizeFileName(term))
  );
}

function detectTags(fileName: string): Exclude<PortfolioTag, "All">[] {
  return (Object.keys(fileNameMatchers) as Exclude<PortfolioTag, "All">[]).filter(
    (tag) => imageMatchesTag(fileName, tag)
  );
}

function prettifyType(raw: string): string {
  const cleaned = raw.replace(/\d+(?![dD])/g, "");
  if (!cleaned) return "";
  const normalized = normalizeFileName(cleaned);
  const matchedTag = (
    Object.keys(fileNameMatchers) as Exclude<PortfolioTag, "All">[]
  ).find((tag) =>
    fileNameMatchers[tag].some((term) =>
      normalized.includes(normalizeFileName(term))
    )
  );
  if (matchedTag) return matchedTag;
  return cleaned.replace(/([a-z])([A-Z])/g, "$1 $2").trim();
}

function titleFromFileName(fileName: string): string {
  const base = fileName.replace(/\.[^.]+$/, "");
  const parts = base.split("W").map(prettifyType).filter(Boolean);
  if (parts.length === 0) return base.replace(/\d+(?![dD])/g, "");
  if (parts.length === 1) return parts[0];
  if (parts.length === 2) return `${parts[0]} & ${parts[1]}`;
  return parts.join(", ");
}

export const portfolioImages: PortfolioImage[] = PORTFOLIO_FILE_NAMES.map(
  (fileName) => ({
    src: `/portfolio/${fileName}`,
    title: titleFromFileName(fileName),
    fileName,
    focal: focalByFileName[fileName] ?? "50% 45%",
    tags: detectTags(fileName),
  })
);

export function getFeaturedPortfolioImages(count = 5): PortfolioImage[] {
  return portfolioImages.slice(0, count);
}
