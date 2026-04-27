import apiClient from "../utils/api.service";

export type MedicalHistoryRecord = {
  _id?: string;
  note: string;
  provider?: string;
  providerName?: string;
  sourceBooking?: string;
  createdAt?: string;
};

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
  medicalHistoryRecords?: MedicalHistoryRecord[];
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
  medicalHistoryRecords?: MedicalHistoryRecord[];
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

  uploadPetAvatar: async (file: File): Promise<{ url: string; publicId?: string }> => {
    const formData = new FormData();
    formData.append("image", file);

    const response = await apiClient.post("/pets/upload-avatar", formData);

    return {
      url: response.data?.url,
      publicId: response.data?.publicId,
    };
  },

  updatePet: async (id: string, payload: Partial<PetPayload>): Promise<Pet> => {
    const response = await apiClient.put(`/pets/${id}`, payload);
    return response.data?.pet;
  },

  deletePet: async (id: string): Promise<void> => {
    await apiClient.delete(`/pets/${id}`);
  },

  getUserPets: async (userId: string): Promise<Pet[]> => {
    const response = await apiClient.get(`/pets/user/${userId}`);
    return response.data?.pets ?? [];
  },

  addMedicalHistoryNote: async (
    petId: string,
    payload: { note: string; bookingId?: string }
  ): Promise<Pet> => {
    const response = await apiClient.post(`/pets/${petId}/medical-history-note`, payload);
    return response.data?.pet;
  },
};
