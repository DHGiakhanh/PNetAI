import React, { createContext, useContext, useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";
import { toast } from "react-hot-toast";

interface SocketContextProps {
  socket: Socket | null;
  isConnected: boolean;
  onlineUsers: Record<string, "online" | "offline">;
  typingUsers: Record<string, Record<string, boolean>>; // conversationId -> { userId -> isTyping }
  joinConversation: (conversationId: string) => void;
  leaveConversation: (conversationId: string) => void;
  sendTyping: (conversationId: string) => void;
  sendStopTyping: (conversationId: string) => void;
  queryUsersStatus: (userIds: string[]) => void;
}

const SocketContext = createContext<SocketContextProps | undefined>(undefined);

const SOCKET_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:9999";

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<Record<string, "online" | "offline">>({});
  const [typingUsers, setTypingUsers] = useState<Record<string, Record<string, boolean>>>({});
  
  // Track current logged-in token to reconnect on token change
  const token = localStorage.getItem("token");

  useEffect(() => {
    if (!token) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
        setIsConnected(false);
      }
      return;
    }

    // Connect to Socket.io server
    const newSocket = io(SOCKET_URL, {
      auth: {
        token: `Bearer ${token}`,
      },
      transports: ["websocket"], // Optimize transports
      autoConnect: true,
    });

    setSocket(newSocket);

    newSocket.on("connect", () => {
      setIsConnected(true);
    });

    newSocket.on("disconnect", () => {
      setIsConnected(false);
    });

    // Listen for user online status changes
    newSocket.on("user_status_change", (data: { userId: string; status: "online" | "offline" }) => {
      setOnlineUsers((prev) => ({
        ...prev,
        [data.userId]: data.status,
      }));
      // Dispatch custom event to notify components that status has changed
      window.dispatchEvent(new CustomEvent("socket:user_status_change", { detail: data }));
    });

    // Listen for batch user status queries
    newSocket.on("users_status", (statuses: Record<string, "online" | "offline">) => {
      setOnlineUsers((prev) => ({
        ...prev,
        ...statuses,
      }));
    });

    // Listen for typing events
    newSocket.on("user_typing_status", (data: { conversationId: string; userId: string; isTyping: boolean }) => {
      setTypingUsers((prev) => {
        const convoTyping = prev[data.conversationId] || {};
        return {
          ...prev,
          [data.conversationId]: {
            ...convoTyping,
            [data.userId]: data.isTyping,
          },
        };
      });
    });

    // Listen for new messages
    newSocket.on("new_message", (message: any) => {
      // Dispatch custom event so the Chat window can append it in real time
      window.dispatchEvent(new CustomEvent("socket:new_message", { detail: message }));
    });

    // Listen for message read receipts
    newSocket.on("message_read", (data: { conversationId: string; userId: string }) => {
      window.dispatchEvent(new CustomEvent("socket:message_read", { detail: data }));
    });

    // Listen for global chat notifications
    newSocket.on("chat_message_notification", (data: { conversationId: string; message: any }) => {
      window.dispatchEvent(new CustomEvent("socket:chat_message_notification", { detail: data }));
      
      // Check if this conversation's chat window is currently active/maximized
      const isChatActive = (window as any).activeChats?.has(data.conversationId);
      if (!isChatActive) {
        toast(`Tin nhắn mới từ ${data.message.sender.name}: ${data.message.text || "📸 [Hình ảnh]"}`, {
          icon: "💬",
          duration: 4000,
        });
      }
    });

    // Listen for new notifications (like friend requests or request acceptances)
    newSocket.on("new_notification", (notification: any) => {
      window.dispatchEvent(new CustomEvent("socket:new_notification", { detail: notification }));
      
      toast.success(`${notification.title}\n${notification.message}`, {
        icon: "🔔",
        duration: 5000,
      });
    });

    return () => {
      newSocket.disconnect();
    };
  }, [token]);

  const joinConversation = (conversationId: string) => {
    if (socket && isConnected) {
      socket.emit("join_conversation", conversationId);
    }
  };

  const leaveConversation = (conversationId: string) => {
    if (socket && isConnected) {
      socket.emit("leave_conversation", conversationId);
    }
  };

  const sendTyping = (conversationId: string) => {
    if (socket && isConnected) {
      socket.emit("typing", conversationId);
    }
  };

  const sendStopTyping = (conversationId: string) => {
    if (socket && isConnected) {
      socket.emit("stop_typing", conversationId);
    }
  };

  const queryUsersStatus = (userIds: string[]) => {
    if (socket && isConnected && userIds.length > 0) {
      socket.emit("get_users_status", userIds);
    }
  };

  return (
    <SocketContext.Provider
      value={{
        socket,
        isConnected,
        onlineUsers,
        typingUsers,
        joinConversation,
        leaveConversation,
        sendTyping,
        sendStopTyping,
        queryUsersStatus,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error("useSocket must be used within a SocketProvider");
  }
  return context;
};
