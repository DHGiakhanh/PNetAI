export type ServiceProvider = {
  id: string;
  name: string;
  distanceKm: number;
};

export type Service = {
  id: string;
  title: string;
  category: "Grooming" | "Vet" | "Training" | "Boarding";
  rating: number;
  reviewCount: number;
  imageUrl: string;
  provider: ServiceProvider;
  basePriceVnd: number;
  description: string;
  includes: string[];
  durationsMin: number[];
};

export const mockServices: Service[] = [
  {
    id: "gentle-oatmeal-wash",
    title: "Gentle Oatmeal Wash",
    category: "Grooming",
    rating: 4.8,
    reviewCount: 85,
    imageUrl:
      "https://images.unsplash.com/photo-1530281700549-e82e7bf110d6?q=80&w=1400&auto=format&fit=crop",
    provider: { id: "fluffy-spa", name: "Fluffy Spa", distanceKm: 2.4 },
    basePriceVnd: 200_000,
    description:
      "A soothing bath session designed for sensitive skin—gentle cleanse, warm rinse, and a soft coat finish.",
    includes: ["Warm bath", "Oatmeal shampoo", "Towel dry", "Quick brush"],
    durationsMin: [30, 45, 60],
  },
  {
    id: "full-grooming",
    title: "Full Grooming (Trim + Bath)",
    category: "Grooming",
    rating: 4.7,
    reviewCount: 124,
    imageUrl:
      "https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?q=80&w=1400&auto=format&fit=crop",
    provider: { id: "paws-studio", name: "Paws Studio", distanceKm: 3.1 },
    basePriceVnd: 350_000,
    description:
      "A full spa refresh with precision trimming—perfect for keeping your pet tidy and comfortable.",
    includes: ["Bath & blow dry", "Nail trim", "Ear cleaning", "Sanitary trim"],
    durationsMin: [60, 90],
  },
  {
    id: "vaccination",
    title: "Vaccination Appointment",
    category: "Vet",
    rating: 4.9,
    reviewCount: 210,
    imageUrl:
      "https://images.unsplash.com/photo-1551731409-43eb3e517a1a?q=80&w=1400&auto=format&fit=crop",
    provider: { id: "happy-vet", name: "Happy Vet Clinic", distanceKm: 1.8 },
    basePriceVnd: 250_000,
    description:
      "Quick and professional vaccination visit with pre-check, guidance, and post-care instructions.",
    includes: ["Pre-check", "Vaccine shot", "After-care guidance"],
    durationsMin: [20, 30],
  },
];

export function getMockService(serviceId: string) {
  return mockServices.find((s) => s.id === serviceId);
}

