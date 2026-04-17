import apiClient from '../utils/api.service';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  name: string;
  role?: "user" | "service_provider";
  saleCode?: string;
}

export interface VerifyEmailOtpData {
  email: string;
  otp: string;
}

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  phone?: string;
  address?: string;
  avatarUrl?: string;
  saleCode?: string;
  role?: string;
  providerOnboardingStatus?:
    | "pending_sale_approval"
    | "pending_legal_submission"
    | "pending_legal_approval"
    | "approved";
  canPublishServices?: boolean;
  legalDocuments?: {
    clinicName?: string;
    clinicLicenseNumber?: string;
    clinicLicenseUrl?: string;
    businessLicenseUrl?: string;
    doctorLicenseUrl?: string;
    submissionNote?: string;
    submittedAt?: string;
    reviewedAt?: string;
    reviewNote?: string;
  };
  subscriptionPlan?: "free" | "silver" | "gold";
  subscriptionExpiresAt?: string;
  articleCredits?: number;
  description?: string;
  clinicImages?: string[];
  operatingHours?: { start: string; end: string };
  doctors?: string[];
  createdAt: string;
}

export interface ProviderLegalDocumentsPayload {
  clinicName: string;
  clinicLicenseNumber: string;
  clinicLicenseUrl: string;
  businessLicenseUrl?: string;
  note?: string;
}

export type LegalFileType = "clinic_license" | "business_license";

export interface ProviderLegalUploadResponse {
  message: string;
  fileType: LegalFileType;
  url: string;
  publicId: string;
  originalName: string;
}

export const authService = {
  login: async (credentials: LoginCredentials) => {
    const response = await apiClient.post('/auth/login', credentials);
    return response.data;
  },
  
  googleLogin: async (accessToken: string) => {
    const response = await apiClient.post('/auth/google-login', { accessToken });
    return response.data;
  },

  register: async (data: RegisterData) => {
    const response = await apiClient.post('/auth/register', data);
    return response.data;
  },

  verifyEmail: async (token: string) => {
    const response = await apiClient.get(`/auth/verify/${token}`);
    return response.data;
  },

  verifyEmailOtp: async (data: VerifyEmailOtpData) => {
    const response = await apiClient.post('/auth/verify-email-otp', data);
    return response.data;
  },

  resendVerificationOtp: async (email: string) => {
    const response = await apiClient.post('/auth/resend-verification-otp', { email });
    return response.data;
  },

  logout: () => {
    localStorage.removeItem('token');
  },

  getCurrentUser: async (): Promise<UserProfile> => {
    const response = await apiClient.get('/user/profile');
    const user = response.data?.user ?? {};
    return {
      id: user.id ?? user._id ?? "",
      email: user.email ?? "",
      name: user.name ?? "",
      phone: user.phone ?? "",
      address: user.address ?? "",
      avatarUrl: user.avatarUrl ?? "",
      saleCode: user.saleCode ?? "",
      role: user.role ?? "",
      providerOnboardingStatus: user.providerOnboardingStatus,
      canPublishServices: user.canPublishServices,
      legalDocuments: user.legalDocuments ?? undefined,
      subscriptionPlan: user.subscriptionPlan,
      subscriptionExpiresAt: user.subscriptionExpiresAt,
      articleCredits: user.articleCredits,
      description: user.description,
      clinicImages: user.clinicImages,
      operatingHours: user.operatingHours,
      doctors: user.doctors,
      createdAt: user.createdAt ?? "",
    };
  },

  updateProfile: async (data: Partial<UserProfile>) => {
    const response = await apiClient.put('/user/profile', data);
    return response.data?.user;
  },

  uploadAvatar: async (file: File): Promise<{ url: string; publicId?: string }> => {
    const formData = new FormData();
    formData.append("image", file);
    const response = await apiClient.post('/user/upload-avatar', formData);
    return response.data;
  },

  uploadImage: async (file: File): Promise<{ url: string; publicId?: string }> => {
    const formData = new FormData();
    formData.append("image", file);
    const response = await apiClient.post('/user/upload', formData);
    return response.data;
  },

  changePassword: async (data: { currentPassword: string; newPassword: string }) => {
    const response = await apiClient.post('/user/change-password', data);
    return response.data;
  },

  submitProviderLegalDocuments: async (data: ProviderLegalDocumentsPayload) => {
    const response = await apiClient.post('/user/provider/legal-documents', data);
    return response.data;
  },

  uploadProviderLegalFile: async (
    file: File,
    fileType: LegalFileType
  ): Promise<ProviderLegalUploadResponse> => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("fileType", fileType);

    const response = await apiClient.post("/user/provider/upload-legal-file", formData);
    return response.data;
  },
};
