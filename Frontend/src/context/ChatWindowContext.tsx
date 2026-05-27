import React, { createContext, useContext, useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Conversation, socialService } from "../services/social.service";
import { toast } from "react-hot-toast";

interface ChatWindowContextProps {
  openChats: Conversation[];
  minimizedChats: string[]; // List of conversationIds
  openChat: (convo: Conversation) => void;
  openChatWithUser: (userId: string) => Promise<void>;
  closeChat: (conversationId: string) => void;
  toggleMinimize: (conversationId: string) => void;
  maximizeChat: (conversationId: string) => void;
}

const ChatWindowContext = createContext<ChatWindowContextProps | undefined>(undefined);

export const ChatWindowProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { pathname } = useLocation();
  const hasActiveSession = Boolean(localStorage.getItem("token"));
  const [openChats, setOpenChats] = useState<Conversation[]>([]);
  const [minimizedChats, setMinimizedChats] = useState<string[]>([]);

  useEffect(() => {
    if (!hasActiveSession) {
      setOpenChats([]);
      setMinimizedChats([]);
    }
  }, [hasActiveSession, pathname]);

  // Listen to new message notifications - if a chat is closed and we get a message, we might not open it automatically (too intrusive), but if it's minimized, we can update its state.
  useEffect(() => {
    const handleNewMessage = (e: Event) => {
      const customEvent = e as CustomEvent<any>;
      const newMsg = customEvent.detail;
      
      // Update openChats array lastMessage so components show latest state
      setOpenChats((prev) =>
        prev.map((c) => {
          if (c._id === newMsg.conversation) {
            return {
              ...c,
              lastMessage: newMsg,
              updatedAt: new Date().toISOString(),
            };
          }
          return c;
        })
      );
    };

    window.addEventListener("socket:new_message", handleNewMessage);
    return () => {
      window.removeEventListener("socket:new_message", handleNewMessage);
    };
  }, []);

  const openChat = (convo: Conversation) => {
    if (!localStorage.getItem("token")) return;

    setOpenChats((prev) => {
      // If already open, do nothing (or move to end/focus)
      if (prev.some((c) => c._id === convo._id)) {
        // If it was minimized, maximize it
        setMinimizedChats((minPrev) => minPrev.filter((id) => id !== convo._id));
        // Move to the end of openChats to focus/display it last
        const filtered = prev.filter((c) => c._id !== convo._id);
        return [...filtered, convo];
      }
      
      // Limit to max 3 open chats on desktop (managed in container), but add to state
      return [...prev, convo];
    });

    // Remove from minimized list if it was minimized
    setMinimizedChats((prev) => prev.filter((id) => id !== convo._id));
  };

  const openChatWithUser = async (userId: string) => {
    try {
      const convo = await socialService.startConversation(userId);
      openChat(convo);
    } catch (error) {
      toast.error("Không thể bắt đầu trò chuyện với người dùng này.");
    }
  };

  const closeChat = (conversationId: string) => {
    setOpenChats((prev) => prev.filter((c) => c._id !== conversationId));
    setMinimizedChats((prev) => prev.filter((id) => id !== conversationId));
  };

  const toggleMinimize = (conversationId: string) => {
    setMinimizedChats((prev) =>
      prev.includes(conversationId)
        ? prev.filter((id) => id !== conversationId)
        : [...prev, conversationId]
    );
  };

  const maximizeChat = (conversationId: string) => {
    setMinimizedChats((prev) => prev.filter((id) => id !== conversationId));
  };

  return (
    <ChatWindowContext.Provider
      value={{
        openChats: hasActiveSession ? openChats : [],
        minimizedChats: hasActiveSession ? minimizedChats : [],
        openChat,
        openChatWithUser,
        closeChat,
        toggleMinimize,
        maximizeChat,
      }}
    >
      {children}
    </ChatWindowContext.Provider>
  );
};

export const useChatWindows = () => {
  const context = useContext(ChatWindowContext);
  if (context === undefined) {
    throw new Error("useChatWindows must be used within a ChatWindowProvider");
  }
  return context;
};
