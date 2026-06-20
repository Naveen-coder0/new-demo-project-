export type Product = {
  id: string;
  name: string;
  store: string;
  storeId: string;
  price: string;
  priceNum: number;
  deliveryEta: string;
  badge?: string | null;
  image: string;
  tryAndBuy?: boolean;
  category: string;
  tags: string[];
  sizes: string[];
};

export type Store = {
  id: string;
  name: string;
  category: string;
  rating: number;
  distance: string;
  deliveryTime: string;
  tags: string[];
  badge?: string | null;
  image: string;
  banner: string;
};

export const stores: Store[] = [
  {
    id: "snitch",
    name: "Snitch",
    category: "Premium Streetwear",
    rating: 4.8,
    distance: "1.2 km",
    deliveryTime: "38 min",
    tags: ["Streetwear", "Oversized"],
    badge: "Popular near you",
    image:
      "https://images.unsplash.com/photo-1767810560372-d50b71f3f9d5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
    banner:
      "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&q=80&w=1600",
  },
  {
    id: "hm",
    name: "H&M",
    category: "Trendy Fashion",
    rating: 4.5,
    distance: "2.1 km",
    deliveryTime: "50 min",
    tags: ["College Fits", "Minimal"],
    badge: null,
    image:
      "https://images.unsplash.com/photo-1774175765918-9166150183fb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
    banner:
      "https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?auto=format&fit=crop&q=80&w=1600",
  },
  {
    id: "ethnic-aura",
    name: "Ethnic Aura",
    category: "Indian Fashion",
    rating: 4.7,
    distance: "0.8 km",
    deliveryTime: "35 min",
    tags: ["Ethnic", "Kurtas"],
    badge: "Students are loving this",
    image:
      "https://images.unsplash.com/photo-1756641964889-5a04b6e0f4f6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
    banner:
      "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&q=80&w=1600",
  },
  {
    id: "seoul-style",
    name: "Seoul Style",
    category: "Korean Fashion",
    rating: 4.9,
    distance: "1.5 km",
    deliveryTime: "42 min",
    tags: ["Korean", "Aesthetic"],
    badge: "New drop today",
    image:
      "https://images.unsplash.com/photo-1765009432921-af54a0c5e387?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
    banner:
      "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&q=80&w=1600",
  },
  {
    id: "urban-thread",
    name: "Urban Thread",
    category: "Street Culture",
    rating: 4.6,
    distance: "1.8 km",
    deliveryTime: "48 min",
    tags: ["Streetwear", "Cargos"],
    badge: null,
    image:
      "https://images.unsplash.com/photo-1769257911527-bdfd73b545cf?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
    banner:
      "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&q=80&w=1600",
  },
];

export const products: Product[] = [
  {
    id: "p1",
    name: "Black Oversized Hoodie",
    store: "Snitch",
    storeId: "snitch",
    price: "₹1,499",
    priceNum: 1499,
    deliveryEta: "38 min",
    badge: "Students are loving this",
    image:
      "https://images.unsplash.com/photo-1535395567430-827184ae2eda?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
    tryAndBuy: true,
    category: "Streetwear",
    tags: ["hoodie", "oversized", "black", "tee"],
    sizes: ["S", "M", "L", "XL"],
  },
  {
    id: "p2",
    name: "White Oversized Tee",
    store: "Snitch",
    storeId: "snitch",
    price: "₹899",
    priceNum: 899,
    deliveryEta: "38 min",
    badge: "Hot seller",
    image:
      "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&q=80&w=1080",
    tryAndBuy: true,
    category: "Streetwear",
    tags: ["tee", "white", "oversized"],
    sizes: ["S", "M", "L", "XL"],
  },
  {
    id: "p3",
    name: "Cargo Pants - Olive",
    store: "H&M",
    storeId: "hm",
    price: "₹2,299",
    priceNum: 2299,
    deliveryEta: "50 min",
    badge: null,
    image:
      "https://images.unsplash.com/photo-1576573303723-36d0a91aab3f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
    tryAndBuy: true,
    category: "Streetwear",
    tags: ["cargo", "pants", "olive"],
    sizes: ["28", "30", "32", "34"],
  },
  {
    id: "p4",
    name: "Cargo Pants - Black",
    store: "Snitch",
    storeId: "snitch",
    price: "₹1,899",
    priceNum: 1899,
    deliveryEta: "38 min",
    badge: "Recently viewed",
    image:
      "https://images.unsplash.com/photo-1584865288642-42078afe6942?auto=format&fit=crop&q=80&w=1080",
    tryAndBuy: true,
    category: "Streetwear",
    tags: ["cargo", "pants", "black"],
    sizes: ["28", "30", "32", "34"],
  },
  {
    id: "p5",
    name: "White Sneakers",
    store: "Snitch",
    storeId: "snitch",
    price: "₹2,499",
    priceNum: 2499,
    deliveryEta: "38 min",
    badge: "Only 4 left",
    image:
      "https://images.unsplash.com/photo-1544441893-675973e31985?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
    tryAndBuy: false,
    category: "Streetwear",
    tags: ["shoes", "sneakers", "white"],
    sizes: ["7", "8", "9", "10", "11"],
  },
  {
    id: "p6",
    name: "Floral Kurta Set",
    store: "Ethnic Aura",
    storeId: "ethnic-aura",
    price: "₹1,899",
    priceNum: 1899,
    deliveryEta: "35 min",
    badge: "Recently viewed",
    image:
      "https://images.unsplash.com/photo-1763971922552-fa9cbe06db7a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
    tryAndBuy: true,
    category: "Ethnic",
    tags: ["kurta", "ethnic", "floral"],
    sizes: ["S", "M", "L", "XL"],
  },
  {
    id: "p7",
    name: "Embroidered Kurta",
    store: "Ethnic Aura",
    storeId: "ethnic-aura",
    price: "₹2,499",
    priceNum: 2499,
    deliveryEta: "35 min",
    badge: null,
    image:
      "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&q=80&w=1080",
    tryAndBuy: true,
    category: "Ethnic",
    tags: ["kurta", "ethnic"],
    sizes: ["S", "M", "L", "XL"],
  },
  {
    id: "p8",
    name: "Minimal Coord Set",
    store: "Seoul Style",
    storeId: "seoul-style",
    price: "₹3,299",
    priceNum: 3299,
    deliveryEta: "42 min",
    badge: null,
    image:
      "https://images.unsplash.com/photo-1603306008742-521e80bfabe6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
    tryAndBuy: true,
    category: "Minimal",
    tags: ["coord", "minimal", "korean"],
    sizes: ["S", "M", "L"],
  },
  {
    id: "p9",
    name: "Denim Jacket",
    store: "H&M",
    storeId: "hm",
    price: "₹2,999",
    priceNum: 2999,
    deliveryEta: "50 min",
    badge: "Popular near you",
    image:
      "https://images.unsplash.com/photo-1660486044177-45cd45bb5e99?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
    tryAndBuy: true,
    category: "Streetwear",
    tags: ["jacket", "denim"],
    sizes: ["S", "M", "L", "XL"],
  },
  {
    id: "p10",
    name: "Graphic Tee",
    store: "Urban Thread",
    storeId: "urban-thread",
    price: "₹799",
    priceNum: 799,
    deliveryEta: "48 min",
    badge: null,
    image:
      "https://images.unsplash.com/photo-1654076698795-a9f6c4c691f2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
    tryAndBuy: true,
    category: "Streetwear",
    tags: ["tee", "graphic"],
    sizes: ["S", "M", "L", "XL"],
  },
];

export const cities = [
  { name: "Chandigarh", available: true },
  { name: "Panchkula", available: true },
  { name: "Mumbai", available: false },
  { name: "Bangalore", available: false },
  { name: "Delhi", available: false },
] as const;

export const navCategories = ["For You", "Men", "Women", "Ethnic", "Streetwear"] as const;
export type NavCategory = (typeof navCategories)[number];

const categoryTagMap: Record<string, string[]> = {
  "For You": [],
  Men: ["cargo", "tee", "hoodie", "jacket", "shoes", "sneakers"],
  Women: ["kurta", "coord", "floral"],
  Ethnic: ["kurta", "ethnic", "floral"],
  Streetwear: ["streetwear", "oversized", "cargo", "hoodie", "graphic", "sneakers"],
};

export const occasions = [
  { slug: "party", title: "Party", count: "140+ items", image: "https://images.unsplash.com/photo-1622079400125-5b6679552976?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080", tags: ["denim", "jacket", "graphic", "tee"] },
  { slug: "date-night", title: "Date Night", count: "89+ items", image: "https://images.unsplash.com/photo-1765229287667-3dac70bd2711?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080", tags: ["coord", "minimal", "denim"] },
  { slug: "streetwear", title: "Streetwear", count: "210+ items", image: "https://images.unsplash.com/photo-1660486044177-45cd45bb5e99?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080", tags: ["streetwear", "oversized", "cargo", "hoodie", "graphic"] },
  { slug: "college", title: "College", count: "185+ items", image: "https://images.unsplash.com/photo-1511474274885-186ea2ca6b24?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080", tags: ["tee", "hoodie", "cargo"] },
  { slug: "ethnic", title: "Ethnic", count: "156+ items", image: "https://images.unsplash.com/photo-1756483492198-8ca91227489b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080", tags: ["kurta", "ethnic", "floral"] },
  { slug: "minimal", title: "Minimal Fits", count: "94+ items", image: "https://images.unsplash.com/photo-1603306008742-521e80bfabe6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080", tags: ["minimal", "coord"] },
  { slug: "airport", title: "Airport Looks", count: "72+ items", image: "https://images.unsplash.com/photo-1698600875207-bbaacd0e55ee?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080", tags: ["minimal", "denim", "jacket"] },
  { slug: "oversized", title: "Oversized Fits", count: "165+ items", image: "https://images.unsplash.com/photo-1764698192271-d6888c24e071?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080", tags: ["oversized", "tee", "hoodie"] },
] as const;

export function getOccasion(slug: string) {
  return occasions.find((o) => o.slug === slug);
}

export function searchProducts(query: string): Product[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const tokens = q.split(/\s+/);
  return products.filter((p) => {
    const hay = [p.name, p.store, p.category, ...p.tags].join(" ").toLowerCase();
    return tokens.every((t) => hay.includes(t));
  });
}

export function suggestProducts(query: string, limit = 6): Product[] {
  const r = searchProducts(query);
  return r.slice(0, limit);
}

export function suggestStores(query: string, limit = 3): Store[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return stores
    .filter((s) =>
      [s.name, s.category, ...s.tags].join(" ").toLowerCase().includes(q),
    )
    .slice(0, limit);
}

export type FilterArgs = {
  q?: string;
  category?: string;
  occasion?: string;
  trending?: boolean;
};

export function filterProducts({ q, category, occasion, trending }: FilterArgs): Product[] {
  let list = q && q.trim() ? searchProducts(q) : products.slice();
  if (category && category !== "For You") {
    const tags = categoryTagMap[category] ?? [];
    if (tags.length) {
      list = list.filter((p) => {
        const hay = [p.name, p.category, ...p.tags].join(" ").toLowerCase();
        return tags.some((t) => hay.includes(t));
      });
    }
  }
  if (occasion) {
    const o = getOccasion(occasion);
    if (o) {
      list = list.filter((p) => {
        const hay = [p.name, p.category, ...p.tags].join(" ").toLowerCase();
        return o.tags.some((t) => hay.includes(t));
      });
    }
  }
  if (trending) {
    list = list.filter((p) => !!p.badge);
  }
  return list;
}

export function getStore(id: string) {
  return stores.find((s) => s.id === id);
}
export function getProduct(id: string) {
  return products.find((p) => p.id === id);
}
export function getStoreProducts(storeId: string) {
  return products.filter((p) => p.storeId === storeId);
}
export function getRelated(productId: string) {
  const p = getProduct(productId);
  if (!p) return [];
  return products
    .filter((x) => x.id !== productId && x.storeId === p.storeId)
    .slice(0, 4);
}