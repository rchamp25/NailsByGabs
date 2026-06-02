export const portfolioItems = [
  { id: 1, title: "Chrome French Tips", aspect: "tall" as const },
  { id: 2, title: "Soft Pink Ombre", aspect: "wide" as const },
  { id: 3, title: "3D Floral Set", aspect: "square" as const },
  { id: 4, title: "Red Velvet Almond", aspect: "tall" as const },
  { id: 5, title: "Gold Foil Accents", aspect: "square" as const },
  { id: 6, title: "Milky White Builder Gel", aspect: "wide" as const },
  { id: 7, title: "Butterfly Nail Art", aspect: "tall" as const },
  { id: 8, title: "Cat Eye Magnetic", aspect: "square" as const },
  { id: 9, title: "Nude Coffin Classic", aspect: "wide" as const },
];

export type ServiceItem = { name: string; price: string; note?: string };

export const serviceCategories: {
  title: string;
  items: ServiceItem[];
}[] = [
  {
    title: "GELX",
    items: [
      { name: "Extra Short Almond", price: "$28" },
      { name: "Short Almond", price: "$28" },
      { name: "Medium Almond", price: "$28" },
      { name: "Short Square", price: "$28" },
      { name: "Full French", price: "$33" },
      { name: "Gel Manicure", price: "$20" },
    ],
  },
  {
    title: "Extras",
    items: [
      { name: "Cat eye Full Set", price: "$32" },
      { name: "Full Chrome", price: "+$3" },
      { name: "Isolated Chrome", price: "+$3" },
      {
        name: "Extra Shaping and Sizing (applies to square sets only)",
        price: "+$3",
      },
      { name: "Blooming Gel", price: "+$3" },
      { name: "Gems", price: "+$0.50 per Gem" },
      { name: "Aura Full Set", price: "$36" },
      { name: "Glitter Top Coat", price: "+$2" },
    ],
  },
];

export const aboutContent = {
  bio: `Hi my name is Gabrielle, but most people know me as gabs! I work with and apply Gel X nails in the Rochester, NY area, specifically Webster, NY and also SUNY Binghamton during the school year.

While I love doing all kinds of nails, my favorite sets are ones with lots of color, that allow me to express my creativity.

Doing nails is way for me to be creative, have fun, and most of all make all of my clients feel loved and happy with their nails!`,
  location: {
    address: "Rochester, NY area",
    city: "Webster, NY + SUNY Binghamton (school year)",
    phone: "",
    email: "",
  },
  social: {
    instagram:
      "https://www.instagram.com/_nails.bygabs?igsh=bHB1Y3I1bzVyZThw&utm_source=qr",
    tiktok: "https://www.tiktok.com/@_nails.bygabs?_r=1&_t=ZP-96sKyUFOHct",
  },
};
