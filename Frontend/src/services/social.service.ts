import apiClient from "../utils/api.service";

export interface Friend {
  _id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  phone?: string;
  role: string;
  description?: string;
  friendshipId: string;
  onlineStatus: "online" | "offline";
}

export interface FriendRequest {
  _id: string;
  requester: {
    _id: string;
    name: string;
    email: string;
    avatarUrl?: string;
    role: string;
    description?: string;
  };
  recipient: string;
  status: "pending";
  createdAt: string;
}

export interface SentRequest {
  _id: string;
  requester: string;
  recipient: {
    _id: string;
    name: string;
    email: string;
    avatarUrl?: string;
    role: string;
    description?: string;
  };
  status: "pending";
  createdAt: string;
}

export interface SearchedUser {
  _id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  role: string;
  description?: string;
  friendshipStatus: "none" | "pending_sent" | "pending_received" | "friends";
}

export interface MessageSender {
  _id: string;
  name: string;
  avatarUrl?: string;
}

export interface ChatMessage {
  _id: string;
  conversation: string;
  sender: MessageSender;
  text?: string;
  attachments?: string[];
  readBy: string[];
  createdAt: string;
}

export interface ConversationParticipant {
  _id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  role: string;
  description?: string;
  onlineStatus: "online" | "offline";
}

export interface Conversation {
  _id: string;
  participants: ConversationParticipant[];
  lastMessage?: ChatMessage;
  isGroup: boolean;
  groupName?: string;
  groupAvatar?: string;
  createdAt: string;
  updatedAt: string;
  otherParticipant: ConversationParticipant | null;
  unreadCount: number;
}

export const socialService = {
  // Friendships
  sendFriendRequest: async (recipientId: string) => {
    const response = await apiClient.post("/social/friends/request", { recipientId });
    return response.data;
  },

  acceptFriendRequest: async (requesterId: string) => {
    const response = await apiClient.post("/social/friends/accept", { requesterId });
    return response.data;
  },

  rejectFriendRequest: async (requesterId: string) => {
    const response = await apiClient.post("/social/friends/reject", { requesterId });
    return response.data;
  },

  cancelFriendRequest: async (recipientId: string) => {
    const response = await apiClient.post("/social/friends/cancel", { recipientId });
    return response.data;
  },

  unfriend: async (friendId: string) => {
    const response = await apiClient.delete(`/social/friends/${friendId}`);
    return response.data;
  },

  getFriends: async (): Promise<Friend[]> => {
    const response = await apiClient.get("/social/friends");
    return response.data?.friends || [];
  },

  getPendingRequests: async (): Promise<FriendRequest[]> => {
    const response = await apiClient.get("/social/friends/requests/pending");
    return response.data?.requests || [];
  },

  getSentRequests: async (): Promise<SentRequest[]> => {
    const response = await apiClient.get("/social/friends/requests/sent");
    return response.data?.requests || [];
  },

  searchUsers: async (q: string): Promise<SearchedUser[]> => {
    const response = await apiClient.get("/social/users/search", { params: { q } });
    return response.data?.users || [];
  },

  // Conversations & Messages
  getConversations: async (): Promise<Conversation[]> => {
    const response = await apiClient.get("/social/conversations");
    return response.data?.conversations || [];
  },

  startConversation: async (participantId: string): Promise<Conversation> => {
    const response = await apiClient.post("/social/conversations", { participantId });
    return response.data?.conversation;
  },

  getMessages: async (
    conversationId: string,
    before?: string
  ): Promise<ChatMessage[]> => {
    const response = await apiClient.get(
      `/social/conversations/${conversationId}/messages`,
      { params: { before } }
    );
    return response.data?.messages || [];
  },

  sendMessage: async (
    conversationId: string,
    text?: string,
    attachments?: string[]
  ): Promise<ChatMessage> => {
    const response = await apiClient.post(
      `/social/conversations/${conversationId}/messages`,
      { text, attachments }
    );
    return response.data?.message;
  },

  markAsRead: async (conversationId: string) => {
    const response = await apiClient.patch(`/social/conversations/${conversationId}/read`);
    return response.data;
  },
};
