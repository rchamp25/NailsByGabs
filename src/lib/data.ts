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
    title: "Acrylics",
    items: [
      { name: "Full Set — Short", price: "$45" },
      { name: "Full Set — Medium", price: "$55" },
      { name: "Full Set — Long", price: "$65" },
      { name: "Overlay", price: "$50" },
    ],
  },
  {
    title: "Gel-X",
    items: [
      { name: "Soft Gel Extensions", price: "$60" },
      { name: "Gel-X with Simple Art", price: "$70" },
      { name: "Gel-X Premium Design", price: "$85+", note: "Price varies by design" },
    ],
  },
  {
    title: "Fills",
    items: [
      { name: "Acrylic Fill — 2 weeks", price: "$40" },
      { name: "Acrylic Fill — 3 weeks", price: "$45" },
      { name: "Gel Fill", price: "$45" },
    ],
  },
  {
    title: "Add-ons / Nail Art",
    items: [
      { name: "Simple Art (per nail)", price: "$3+" },
      { name: "Charms / 3D Elements", price: "$5+" },
      { name: "Chrome / Cat Eye", price: "$10" },
      { name: "Removal (non-client)", price: "$15" },
    ],
  },
];

export const aboutContent = {
  bio: `Welcome to NailsByGabs — where every set is crafted with care, precision, and a touch of luxury. Gabs specializes in long-lasting acrylics, flawless Gel-X extensions, and custom nail art that turns your vision into wearable art.

Whether you want a clean everyday nude or a bold statement set, you'll leave feeling polished, confident, and photo-ready.`,
  hours: [
    { day: "Tuesday – Friday", time: "10:00 AM – 7:00 PM" },
    { day: "Saturday", time: "9:00 AM – 5:00 PM" },
    { day: "Sunday – Monday", time: "Closed" },
  ],
  location: {
    address: "123 Blossom Lane, Suite 4",
    city: "Your City, ST 00000",
    phone: "(555) 123-4567",
    email: "hello@nailsbygabs.com",
  },
  social: {
    instagram: "https://instagram.com/nailsbygabs",
    tiktok: "https://tiktok.com/@nailsbygabs",
  },
};
