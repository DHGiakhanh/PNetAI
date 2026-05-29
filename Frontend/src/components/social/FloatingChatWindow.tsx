import React, { useEffect, useState, useRef } from "react";
import {
  Send,
  Image,
  X,
  Minus,
  Loader2,
  Trash2,
  MessageCircle,
} from "lucide-react";
import { Conversation, ChatMessage, socialService } from "../../services/social.service";
import { useSocket } from "../../context/SocketContext";
import { authService } from "../../services/auth.service";
import { toast } from "react-hot-toast";

interface FloatingChatWindowProps {
  conversation: Conversation;
  isMinimized: boolean;
  onClose: () => void;
  onMinimize: () => void;
}

export const FloatingChatWindow: React.FC<FloatingChatWindowProps> = ({
  conversation,
  isMinimized,
  onClose,
  onMinimize,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [messageText, setMessageText] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const { onlineUsers, typingUsers, joinConversation, leaveConversation, sendTyping, sendStopTyping } = useSocket();

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<any>(null);

  const otherParticipant = conversation.otherParticipant;
  if (!otherParticipant) return null;

  const otherUserId = otherParticipant._id;
  const isOnline = onlineUsers[otherUserId] === "online" || otherParticipant.onlineStatus === "online";

  const currentUserId = (() => {
    try {
      const rawUser = localStorage.getItem("user");
      if (!rawUser) return "";
      const user = JSON.parse(rawUser);
      return user?.id || user?._id || "";
    } catch {
      return "";
    }
  })();

  // Join Room & Load History
  useEffect(() => {
    if (isMinimized) return;

    setLoading(true);
    joinConversation(conversation._id);

    socialService
      .getMessages(conversation._id)
      .then((data) => {
        setMessages(data);
        setLoading(false);
        // Mark as read immediately on open
        return socialService.markAsRead(conversation._id);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });

    return () => {
      leaveConversation(conversation._id);
    };
  }, [conversation._id, isMinimized]);

  // Listen to Socket Events
  useEffect(() => {
    const handleNewMessage = (e: Event) => {
      const customEvent = e as CustomEvent<ChatMessage>;
      const msg = customEvent.detail;

      if (msg.conversation === conversation._id) {
        setMessages((prev) => {
          if (prev.some((m) => m._id === msg._id)) return prev;
          return [...prev, msg];
        });

        if (!isMinimized) {
          socialService.markAsRead(conversation._id).catch(console.error);
        }
      }
    };

    const handleMessageRead = (e: Event) => {
      const customEvent = e as CustomEvent<{ conversationId: string; userId: string }>;
      const data = customEvent.detail;

      if (data.conversationId === conversation._id) {
        setMessages((prev) =>
          prev.map((msg) => {
            if (msg.sender._id !== data.userId && !msg.readBy.includes(data.userId)) {
              return { ...msg, readBy: [...msg.readBy, data.userId] };
            }
            return msg;
          })
        );
      }
    };

    window.addEventListener("socket:new_message", handleNewMessage);
    window.addEventListener("socket:message_read", handleMessageRead);

    return () => {
      window.removeEventListener("socket:new_message", handleNewMessage);
      window.removeEventListener("socket:message_read", handleMessageRead);
    };
  }, [conversation._id, isMinimized]);

  // Register active chat window
  useEffect(() => {
    if (!isMinimized) {
      if (!(window as any).activeChats) {
        (window as any).activeChats = new Set<string>();
      }
      (window as any).activeChats.add(conversation._id);
    } else {
      if ((window as any).activeChats) {
        (window as any).activeChats.delete(conversation._id);
      }
    }

    return () => {
      if ((window as any).activeChats) {
        (window as any).activeChats.delete(conversation._id);
      }
    };
  }, [conversation._id, isMinimized]);

  // Scroll to bottom
  useEffect(() => {
    if (!isMinimized) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isMinimized]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() && !selectedImage) return;

    setSending(true);
    let attachments: string[] = [];

    try {
      if (selectedImage) {
        setUploading(true);
        const res = await authService.generalUpload(selectedImage);
        if (res.url) {
          attachments.push(res.url);
        }
        setUploading(false);
      }

      const newMsg = await socialService.sendMessage(
        conversation._id,
        messageText.trim() || undefined,
        attachments.length > 0 ? attachments : undefined
      );

      setMessages((prev) => {
        if (prev.some((m) => m._id === newMsg._id)) return prev;
        return [...prev, newMsg];
      });

      setMessageText("");
      setSelectedImage(null);
      setImagePreview(null);
      sendStopTyping(conversation._id);
    } catch (error) {
      toast.error("Lỗi gửi tin nhắn");
    } finally {
      setSending(false);
      setUploading(false);
    }
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessageText(e.target.value);
    sendTyping(conversation._id);

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      sendStopTyping(conversation._id);
    }, 2000);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Dung lượng tệp tin tối đa 5MB");
        return;
      }
      setSelectedImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const isTyping = typingUsers[conversation._id]?.[otherUserId] || false;

  const initials = otherParticipant.name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase())
    .join("");

  if (isMinimized) {
    return null; // Minimized bubbles will be handled by the parent container
  }

  return (
    <div className="flex h-[420px] w-[330px] flex-col rounded-t-2xl border border-sand bg-white shadow-2xl transition-all duration-300 dark:border-slate-800 dark:bg-slate-900 pointer-events-auto">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-sand/40 bg-warm/5 px-4 py-3 dark:border-slate-800 dark:bg-slate-950/40 rounded-t-2xl">
        <div className="flex items-center gap-2">
          <div className="relative shrink-0">
            {otherParticipant.avatarUrl ? (
              <img
                src={otherParticipant.avatarUrl}
                alt={otherParticipant.name}
                className="h-8 w-8 rounded-full object-cover border border-sand dark:border-slate-800"
              />
            ) : (
              <span className="grid h-8 w-8 place-items-center rounded-full bg-brown/10 text-brown dark:bg-brown/20 dark:text-brown-light text-xs font-bold border border-sand dark:border-slate-800">
                {initials}
              </span>
            )}
            <span
              className={`absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full ring-2 ring-white dark:ring-slate-900 ${
                isOnline ? "bg-emerald-500" : "bg-gray-400"
              }`}
            />
          </div>
          <div className="min-w-0">
            <h4 className="text-xs font-bold text-ink truncate max-w-[140px] dark:text-white">
              {otherParticipant.name}
            </h4>
            <span className="text-[9px] text-muted font-semibold tracking-wide dark:text-slate-400 block -mt-0.5">
              {isOnline ? "Đang hoạt động" : "Ngoại tuyến"}
            </span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={onMinimize}
            className="rounded-lg p-1 text-muted hover:bg-warm/50 hover:text-ink dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white transition"
            title="Thu nhỏ"
          >
            <Minus className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-muted hover:bg-warm/50 hover:text-rust dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-red-400 transition"
            title="Đóng"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 space-y-3 bg-[#FCFAF7] dark:bg-slate-950/20 scrollbar-thin">
        {loading ? (
          <div className="h-full flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-caramel" />
          </div>
        ) : messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-4">
            <MessageCircle className="h-7 w-7 text-caramel/30 dark:text-slate-700 mb-2" />
            <p className="text-xs text-muted dark:text-slate-500 italic">Vẫy tay chào bạn mới!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map((msg) => {
              const isMe = msg.sender._id === currentUserId;
              const isRead = msg.readBy.some(
                (id) => id !== currentUserId && id === otherUserId
              );

              return (
                <div key={msg._id} className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                  <div className="flex gap-1.5 items-end max-w-[85%]">
                    {!isMe && msg.sender.avatarUrl && (
                      <img
                        src={msg.sender.avatarUrl}
                        alt="Avatar"
                        className="h-5 w-5 rounded-full object-cover shrink-0 mb-0.5 border border-sand dark:border-slate-800"
                      />
                    )}
                    <div className="flex flex-col">
                      {msg.text && (
                        <div
                          className={`rounded-2xl px-3 py-1.5 text-xs leading-relaxed break-words break-all shadow-sm ${
                            isMe
                              ? "bg-brown text-white rounded-br-none dark:bg-amber-800"
                              : "bg-white text-ink border border-sand/50 rounded-bl-none dark:bg-slate-800 dark:text-white dark:border-slate-700"
                          }`}
                        >
                          {msg.text}
                        </div>
                      )}
                      {msg.attachments &&
                        msg.attachments.map((url, i) => (
                          <img
                            key={i}
                            src={url}
                            alt="Attachment"
                            className="mt-1 rounded-xl max-w-[160px] max-h-36 object-cover border border-sand dark:border-slate-800 shadow-sm cursor-pointer"
                            onClick={() => window.open(url, "_blank")}
                          />
                        ))}
                    </div>
                  </div>
                  <div className="mt-0.5 flex items-center gap-1 px-1">
                    <span className="text-[8px] text-muted/80 dark:text-slate-500">
                      {new Date(msg.createdAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                    {isMe && (
                      <span className="text-[8px] text-muted dark:text-slate-500 font-semibold">
                        · {isRead ? "Đã xem" : "Đã gửi"}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}

            {isTyping && (
              <div className="flex gap-1.5 items-end max-w-[85%]">
                {otherParticipant.avatarUrl && (
                  <img
                    src={otherParticipant.avatarUrl}
                    alt="Avatar"
                    className="h-5 w-5 rounded-full object-cover shrink-0 mb-0.5 border border-sand dark:border-slate-800"
                  />
                )}
                <div className="rounded-2xl rounded-bl-none border border-sand/50 bg-white px-3 py-1.5 shadow-sm dark:bg-slate-800 dark:border-slate-700">
                  <div className="flex items-center gap-1">
                    <span className="h-1 w-1 animate-bounce rounded-full bg-caramel/60" />
                    <span className="h-1 w-1 animate-bounce rounded-full bg-caramel/80 [animation-delay:120ms]" />
                    <span className="h-1 w-1 animate-bounce rounded-full bg-caramel [animation-delay:240ms]" />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Footer / Input */}
      <div className="p-3 border-t border-sand/30 bg-white dark:border-slate-800 dark:bg-slate-900 rounded-b-2xl">
        {/* Preview image selected */}
        {imagePreview && (
          <div className="mb-2 flex items-center justify-between p-1.5 bg-warm/20 dark:bg-slate-800/40 rounded-xl border border-sand dark:border-slate-800">
            <div className="flex items-center gap-2">
              <img
                src={imagePreview}
                alt="Preview"
                className="h-10 w-10 object-cover rounded-lg border border-sand dark:border-slate-800"
              />
              <span className="text-[10px] text-muted font-bold dark:text-slate-400">Ảnh đã chọn</span>
            </div>
            <button
              type="button"
              onClick={() => {
                setSelectedImage(null);
                setImagePreview(null);
              }}
              className="text-muted hover:text-rust p-1 rounded-lg dark:text-slate-400 dark:hover:text-red-400 transition"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        <form onSubmit={handleSend} className="flex items-center gap-1.5">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={sending || uploading}
            className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-sand bg-white text-muted hover:text-caramel hover:border-caramel disabled:opacity-50 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400 dark:hover:text-amber-500 transition"
            title="Đính kèm ảnh"
          >
            <Image className="h-4 w-4" />
          </button>

          <input
            type="text"
            value={messageText}
            onChange={handleTextChange}
            placeholder="Aa"
            disabled={sending}
            className="h-8 flex-1 rounded-full border border-sand/80 bg-warm/10 px-3.5 text-xs text-ink outline-none transition placeholder:text-muted focus:border-caramel focus:bg-white disabled:opacity-50 dark:border-slate-800 dark:bg-slate-950 dark:text-white dark:focus:border-amber-700 dark:focus:bg-slate-950"
          />

          <button
            type="submit"
            disabled={(!messageText.trim() && !selectedImage) || sending || uploading}
            className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-brown text-white shadow-md hover:bg-ink disabled:opacity-40 dark:bg-amber-800 dark:hover:bg-slate-950 transition"
          >
            {sending || uploading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Send className="h-3.5 w-3.5" />
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
