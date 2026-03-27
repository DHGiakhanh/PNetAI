export type Product = {
  id: string;
  name: string;
  category: string;
  price: number;
  currency: "USD";
  rating: number;
  reviewCount: number;
  description: string;
  highlights: string[];
  images: string[];
};

export const mockProducts: Product[] = [
  {
    id: "treats",
    name: "Organic Salmon Bites",
    category: "Food",
    price: 12.99,
    currency: "USD",
    rating: 4.8,
    reviewCount: 126,
    description:
      "Clean, protein-rich salmon treats made for sensitive tummies. Crunchy outside, soft inside—perfect for training or daily rewards.",
    highlights: ["Grain-free", "No artificial flavors", "Great for training"],
    images: [
      "https://images.unsplash.com/photo-1589927986089-35812388d1f4?q=80&w=1600&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1619983081563-430f6360270a?q=80&w=1600&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1514996937319-344454492b37?q=80&w=1600&auto=format&fit=crop",
    ],
  },
  {
    id: "toy",
    name: "Interactive Laser Bot",
    category: "Toys",
    price: 24.5,
    currency: "USD",
    rating: 4.6,
    reviewCount: 88,
    description:
      "A smart laser toy that keeps cats and small dogs engaged with randomized patterns and gentle speed changes.",
    highlights: ["Auto timer", "USB rechargeable", "Quiet motor"],
    images: [
      "https://images.unsplash.com/photo-1534361960057-19889db9621e?q=80&w=1600&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1543852786-1cf6624b9987?q=80&w=1600&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1558944351-cf6a7bb7b3fd?q=80&w=1600&auto=format&fit=crop",
    ],
  },
  {
    id: "bed",
    name: "Cloud Plush Bed (M)",
    category: "Comfort",
    price: 45,
    currency: "USD",
    rating: 4.9,
    reviewCount: 312,
    description:
      "A plush, supportive bed with a washable cover and a soft raised rim—made for curlers and sprawlers alike.",
    highlights: ["Machine-washable cover", "Anti-slip base", "Orthopedic foam"],
    images: [
      "https://images.unsplash.com/photo-1525253086316-d0c936c814f8?q=80&w=1600&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?q=80&w=1600&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1544568100-847a948585b9?q=80&w=1600&auto=format&fit=crop",
    ],
  },
  {
    id: "wash",
    name: "Gentle Oatmeal Wash",
    category: "Grooming",
    price: 18,
    currency: "USD",
    rating: 4.7,
    reviewCount: 54,
    description:
      "Soothing oatmeal wash that helps calm itchy skin and leaves a soft, clean coat without harsh fragrances.",
    highlights: ["pH balanced", "Sensitive-skin friendly", "Soft coat finish"],
    images: [
      "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?q=80&w=1600&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1615486364427-1c0b21f0a1b4?q=80&w=1600&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1520975958225-ffda1c0c4bbf?q=80&w=1600&auto=format&fit=crop",
    ],
  },
];

export function getMockProduct(productId: string) {
  return mockProducts.find((p) => p.id === productId);
}

