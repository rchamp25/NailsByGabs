export type ServiceItem = {
  id: string;
  category_id: string;
  name: string;
  price: string;
  note: string | null;
  sort_order: number;
};

export type ServiceCategory = {
  id: string;
  title: string;
  sort_order: number;
  items: ServiceItem[];
};

export type ServiceCategoryRow = {
  id: string;
  title: string;
  sort_order: number;
};
