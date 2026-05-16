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
  user?: {
    _id: string;
    name: string;
    email: string;
    phone?: string;
    avatarUrl?: string;
  };
  name: string;
  species: "Dog" | "Cat" | "Bird" | "Rabbit" | "Hamster" | "Other";
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
  moderationStatus?: "active" | "flagged" | "disabled";
  moderationReason?: string;
  moderationNote?: string;
  moderatedBy?: {
    _id: string;
    name: string;
    email?: string;
  };
  moderatedAt?: string;
  correctionRequestedAt?: string;
  correctionRequestMessage?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type PetPayload = {
  name: string;
  species: "Dog" | "Cat" | "Bird" | "Rabbit" | "Hamster" | "Other";
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

export type AdminPetFilters = {
  page?: number;
  limit?: number;
  search?: string;
  species?: string;
  healthStatus?: string;
  moderationStatus?: string;
};

export type AdminPetsResponse = {
  pets: Pet[];
  pagination: {
    total: number;
    page: number;
    pages: number;
  };
  moderationSummary: {
    active: number;
    flagged: number;
    disabled: number;
  };
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
    payload: { recordNote?: string; historySummary?: string; bookingId?: string }
  ): Promise<Pet> => {
    const response = await apiClient.post(`/pets/${petId}/medical-history-note`, payload);
    return response.data?.pet;
  },

  getAdminPets: async (params: AdminPetFilters): Promise<AdminPetsResponse> => {
    const response = await apiClient.get("/admin/pets", { params });
    return {
      pets: response.data?.pets ?? [],
      pagination: response.data?.pagination ?? { total: 0, page: 1, pages: 1 },
      moderationSummary: response.data?.moderationSummary ?? { active: 0, flagged: 0, disabled: 0 },
    };
  },

  updatePetModeration: async (
    id: string,
    payload: { moderationStatus: "active" | "flagged" | "disabled"; moderationReason?: string; moderationNote?: string }
  ): Promise<Pet> => {
    const response = await apiClient.patch(`/admin/pets/${id}/moderation`, payload);
    return response.data?.pet;
  },

  requestPetCorrection: async (id: string, message: string): Promise<Pet> => {
    const response = await apiClient.post(`/admin/pets/${id}/request-correction`, { message });
    return response.data?.pet;
  },
};
