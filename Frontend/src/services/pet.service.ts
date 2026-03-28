import apiClient from "../utils/api.service";

export type Pet = {
  _id: string;
  name: string;
  species: "Dog" | "Cat" | "Other";
  breed?: string;
  gender?: "Male" | "Female" | "Unknown";
  age?: number;
  birthday?: string;
  weightKg?: number;
  isSpayed?: boolean;
  healthStatus?: string;
  allergies?: string;
  medicalHistory?: string;
  lastVisitDate?: string;
  avatarUrl?: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type PetPayload = {
  name: string;
  species: "Dog" | "Cat" | "Other";
  breed?: string;
  gender?: "Male" | "Female" | "Unknown";
  age?: number;
  birthday?: string;
  weightKg?: number;
  isSpayed?: boolean;
  healthStatus?: string;
  allergies?: string;
  medicalHistory?: string;
  lastVisitDate?: string;
  avatarUrl?: string;
  notes?: string;
};

export const petService = {
  getMyPets: async (): Promise<Pet[]> => {
    const response = await apiClient.get("/pets");
    return response.data?.pets ?? [];
  },

  createPet: async (payload: PetPayload): Promise<Pet> => {
    const response = await apiClient.post("/pets", payload);
    return response.data?.pet;
  },

  updatePet: async (id: string, payload: Partial<PetPayload>): Promise<Pet> => {
    const response = await apiClient.put(`/pets/${id}`, payload);
    return response.data?.pet;
  },

  deletePet: async (id: string): Promise<void> => {
    await apiClient.delete(`/pets/${id}`);
  },
};
