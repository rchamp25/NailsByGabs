/**
 * Gallery photos live in public/portfolio as WebP made by
 * `npm run images:optimize` (originals are kept in the git-ignored
 * image-originals/ folder). This file is the list of photos and their
 * *default* metadata; the owner's edits on /photos (tags, title, carousel,
 * order, review status) live in the portfolio_photos table and override these
 * defaults (see src/lib/portfolio-photos.ts). Two kinds of entries:
 *
 * - LABELED_SETS: tags and title written here, so camera filenames
 *   (IMG_1234) never need renaming. Newest work, shown first. These start as
 *   "needs review" for the owner.
 * - PORTFOLIO_FILE_NAMES: older photos whose tags and titles are parsed from
 *   the filename (see titleFromFileName), e.g. "3DWFun" -> "3D & Design".
 */

export type PortfolioTag =
  | "All"
  | "Seasonal"
  | "Aura"
  | "Blooming"
  | "Design"
  | "Fruit"
  | "Ombre"
  | "French"
  | "Chrome"
  | "Cat Eye"
  | "3D";

export type StyleTag = Exclude<PortfolioTag, "All">;

export type PortfolioImage = {
  src: string;
  title: string;
  fileName: string;
  focal: string;
  tags: StyleTag[];
};

export const PORTFOLIO_TAGS: PortfolioTag[] = [
  "All",
  "Seasonal",
  "Aura",
  "Blooming",
  "Design",
  "Fruit",
  "Ombre",
  "French",
  "Chrome",
  "Cat Eye",
  "3D",
];

/** Tags a photo can have. Keep in sync with the check constraint in migration 015. */
export const STYLE_TAGS = PORTFOLIO_TAGS.filter((tag): tag is StyleTag => tag !== "All");

export function isStyleTag(value: string): value is StyleTag {
  return (STYLE_TAGS as string[]).includes(value);
}

type LabeledSet = {
  file: string;
  tags: StyleTag[];
  /** Defaults to the tags joined ("French & Design"). */
  title?: string;
  /** CSS object-position; see DEFAULT_FOCAL. */
  focal?: string;
};

/**
 * Tags drafted from the photos on 2026-10-27 and pending review by Gabs.
 * Sets marked "check" were the least certain guesses.
 */
const LABELED_SETS: LabeledSet[] = [
  { file: "IMG_8049.webp", tags: ["Design"], focal: "50% 52%" }, // check: fall stripes/dots
  { file: "IMG_8047.webp", tags: ["Seasonal"], title: "Halloween", focal: "50% 62%" },
  { file: "IMG_7968.webp", tags: ["Seasonal"], title: "Halloween", focal: "50% 55%" },
  { file: "IMG_7939.webp", tags: ["Design"], focal: "50% 52%" },
  { file: "IMG_7895.webp", tags: ["Seasonal"], title: "Halloween", focal: "50% 58%" }, // check: purple lace
  { file: "IMG_7856.webp", tags: ["Seasonal"], title: "Halloween", focal: "50% 42%" },
  { file: "IMG_7829.webp", tags: ["Seasonal"], title: "Halloween", focal: "50% 50%" },
  { file: "IMG_7808.webp", tags: ["French"], focal: "50% 60%" },
  { file: "IMG_7796.webp", tags: ["Cat Eye"], focal: "50% 56%" }, // check: brown chrome?
  { file: "IMG_7794.webp", tags: ["Blooming"], focal: "50% 62%" },
  { file: "IMG_7789.webp", tags: ["French"], focal: "50% 62%" },
  { file: "IMG_7784.webp", tags: ["Cat Eye"], focal: "50% 62%" },
  { file: "IMG_7582.webp", tags: ["Seasonal"], title: "Halloween", focal: "50% 62%" },
  { file: "IMG_7462.webp", tags: ["Blooming"], focal: "50% 62%" },
  { file: "IMG_7401.webp", tags: ["Design"], focal: "50% 58%" },
  { file: "IMG_7196.webp", tags: ["French"], focal: "50% 58%" },
  { file: "IMG_7155.webp", tags: ["Design"], focal: "50% 62%" },
  { file: "IMG_7125.webp", tags: ["French"], focal: "50% 64%" }, // check: gold accents (Chrome?)
  { file: "IMG_7122.webp", tags: ["Design"], focal: "50% 60%" },
  { file: "IMG_7112.webp", tags: ["French"], focal: "50% 62%" },
  { file: "IMG_7092.webp", tags: ["Design"], focal: "50% 60%" }, // beach/starfish
  { file: "IMG_7091.webp", tags: ["Design"], focal: "50% 60%" }, // beach/shells
  { file: "IMG_7087.webp", tags: ["French"], focal: "50% 62%" },
  { file: "IMG_7061.webp", tags: ["Design"], focal: "50% 62%" }, // beach
  { file: "IMG_7044.webp", tags: ["French"], focal: "50% 64%" },
  { file: "IMG_7027.webp", tags: ["Design"], focal: "50% 62%" },
  { file: "IMG_7024.webp", tags: ["Design"], focal: "50% 60%" },
  { file: "IMG_6985.webp", tags: ["Blooming"], focal: "50% 55%" },
  { file: "IMG_6908.webp", tags: ["Design"], focal: "50% 60%" },
  { file: "IMG_6888.webp", tags: ["French", "Design"], focal: "50% 64%" },
  { file: "IMG_6882.webp", tags: ["French"], focal: "50% 62%" },
  { file: "IMG_6772.webp", tags: ["French"], focal: "50% 60%" },
  { file: "IMG_6720.webp", tags: ["French"], focal: "50% 65%" },
  { file: "IMG_6606.webp", tags: ["Design"], focal: "50% 62%" },
  { file: "IMG_6198.webp", tags: ["Seasonal", "Design"], title: "4th of July", focal: "50% 62%" },
  { file: "IMG_6105.webp", tags: ["French"], focal: "50% 64%" },
  { file: "IMG_6074.webp", tags: ["Cat Eye", "Ombre"], focal: "50% 64%" }, // check
  { file: "IMG_5949.webp", tags: ["Fruit"], focal: "50% 60%" },
  { file: "IMG_5944.webp", tags: ["Design"], focal: "50% 55%" }, // check: strawberries? (Fruit)
  { file: "IMG_5937.webp", tags: ["Design"], focal: "50% 60%" },
];

export const PORTFOLIO_FILE_NAMES = [
  "3DGelNails.webp",
  "3DWFun.webp",
  "AuraNails1.webp",
  "Aura2.webp",
  "Aura3.webp",
  "BloomingGel.webp",
  "BloomWAura.webp",
  "CatEye1.webp",
  "FrenchWChrome.webp",
  "French2.webp",
  "FruitNails1.webp",
  "Fruit2.webp",
  "Fruit3.webp",
  "Fruit4.webp",
  "FunNails1.webp",
  "FunNails2.webp",
  "FunNails3.webp",
  "FunNails4.webp",
  "FunNails5.webp",
  "Fun6.webp",
  "Fun7.webp",
  "Fun8.webp",
  "Fun9.webp",
  "Fun10.webp",
  "Fun11W3D.webp",
  "FunW3D.webp",
  "IsolatedChromeNails1.webp",
  "Ombre1.webp",
  "Square1.webp",
  "3DBlooming.webp",
  "3DFun.webp",
  "3DFun1.webp",
  "3DFun2.webp",
  "3DFunNails1.webp",
  "FrenchFun.webp",
  "Fruit5.webp",
  "Fun11.webp",
  "Fun12.webp",
  "Fun13.webp",
  "Fun14.webp",
  "FunNails6.webp",
] as const;

/**
 * CSS object-position per photo: the center of the nail art, as a percentage
 * of the (EXIF-rotated) image. With object-position, the image point at Y%
 * lands at Y% of the frame, so the nails stay in view for every crop the site
 * uses (square tiles, 4:5 carousel, 16:10 lightbox). All current photos are
 * 3:4 portrait, so only Y matters.
 */
const DEFAULT_FOCAL = "50% 58%";

const focalByFileName: Record<string, string> = {
  "3DGelNails.webp": "50% 64%",
  "3DWFun.webp": "50% 45%",
  "AuraNails1.webp": "50% 48%",
  "Aura2.webp": "50% 60%",
  "Aura3.webp": "50% 58%",
  "BloomingGel.webp": "50% 57%",
  "BloomWAura.webp": "50% 60%",
  "CatEye1.webp": "50% 58%",
  "FrenchWChrome.webp": "50% 58%",
  "French2.webp": "50% 53%",
  "FruitNails1.webp": "50% 60%",
  "Fruit2.webp": "50% 55%",
  "Fruit3.webp": "50% 60%",
  "Fruit4.webp": "50% 47%",
  "FunNails1.webp": "50% 64%",
  "FunNails2.webp": "50% 62%",
  "FunNails3.webp": "50% 57%",
  "FunNails4.webp": "50% 57%",
  "FunNails5.webp": "50% 52%",
  "Fun6.webp": "50% 56%",
  "Fun7.webp": "50% 55%",
  "Fun8.webp": "50% 63%",
  "Fun9.webp": "50% 62%",
  "Fun10.webp": "50% 45%",
  "Fun11W3D.webp": "50% 60%",
  "FunW3D.webp": "50% 56%",
  "IsolatedChromeNails1.webp": "50% 57%",
  "Ombre1.webp": "50% 66%",
  "Square1.webp": "50% 60%",
  "3DBlooming.webp": "50% 60%",
  "3DFun.webp": "50% 60%",
  "3DFun1.webp": "50% 58%",
  "3DFun2.webp": "50% 60%",
  "3DFunNails1.webp": "50% 58%",
  "FrenchFun.webp": "50% 60%",
  "Fruit5.webp": "50% 60%",
  "Fun11.webp": "50% 62%",
  "Fun12.webp": "50% 62%",
  "Fun13.webp": "50% 62%",
  "Fun14.webp": "50% 62%",
  "FunNails6.webp": "50% 64%",
};

const fileNameMatchers: Record<StyleTag, string[]> = {
  Seasonal: ["halloween", "holiday", "christmas", "valentine"],
  Aura: ["aura"],
  Blooming: ["blooming", "bloom"],
  // "Fun" was renamed "Design" on 2026-10-27; older filenames still say "Fun".
  Design: ["design", "fun"],
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

function imageMatchesTag(fileName: string, tag: StyleTag): boolean {
  const normalized = normalizeFileName(fileName);
  return fileNameMatchers[tag].some((term) =>
    normalized.includes(normalizeFileName(term))
  );
}

function detectTags(fileName: string): StyleTag[] {
  return (Object.keys(fileNameMatchers) as StyleTag[]).filter((tag) =>
    imageMatchesTag(fileName, tag)
  );
}

function prettifyType(raw: string): string {
  const cleaned = raw.replace(/\d+(?![dD])/g, "");
  if (!cleaned) return "";
  const normalized = normalizeFileName(cleaned);
  const matchedTag = (Object.keys(fileNameMatchers) as StyleTag[]).find((tag) =>
    fileNameMatchers[tag].some((term) =>
      normalized.includes(normalizeFileName(term))
    )
  );
  if (matchedTag) return matchedTag;
  return cleaned.replace(/([a-z])([A-Z])/g, "$1 $2").trim();
}

function joinLabels(parts: string[]): string {
  if (parts.length === 1) return parts[0];
  if (parts.length === 2) return `${parts[0]} & ${parts[1]}`;
  return parts.join(", ");
}

function titleFromFileName(fileName: string): string {
  const base = fileName.replace(/\.[^.]+$/, "");
  const parts = base.split("W").map(prettifyType).filter(Boolean);
  if (parts.length === 0) return base.replace(/\d+(?![dD])/g, "");
  return joinLabels(parts);
}

/** Title shown when a photo has no custom title: its tags joined ("French & Design"). */
export function autoTitle(tags: StyleTag[]): string {
  return tags.length > 0 ? joinLabels(tags) : "NailsByGabs set";
}

/** A photo's default metadata before any edits made on /photos. */
export type PortfolioPhotoDefaults = {
  fileName: string;
  src: string;
  focal: string;
  tags: StyleTag[];
  /** Null when the title is just the tags joined (it then follows tag edits). */
  customTitle: string | null;
  needsReview: boolean;
};

function customTitleOrNull(title: string, tags: StyleTag[]): string | null {
  return title === autoTitle(tags) ? null : title;
}

/** Every gallery photo in default order (newest labeled sets first). */
export const PORTFOLIO_PHOTO_DEFAULTS: PortfolioPhotoDefaults[] = [
  ...LABELED_SETS.map(({ file, tags, title, focal }) => ({
    fileName: file,
    src: `/portfolio/${file}`,
    focal: focal ?? DEFAULT_FOCAL,
    tags,
    customTitle: title ?? null,
    needsReview: true,
  })),
  ...PORTFOLIO_FILE_NAMES.map((fileName) => {
    const tags = detectTags(fileName);
    return {
      fileName,
      src: `/portfolio/${fileName}`,
      focal: focalByFileName[fileName] ?? DEFAULT_FOCAL,
      tags,
      customTitle: customTitleOrNull(titleFromFileName(fileName), tags),
      needsReview: false,
    };
  }),
];
