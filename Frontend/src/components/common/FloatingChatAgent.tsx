import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import {
  Bot,
  ChevronDown,
  Loader2,
  LocateFixed,
  MessageCircle,
  Send,
  Sparkles,
  User,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/utils/cn";
import { AIMessageRenderer } from "./AIMessageRenderer";
import apiClient from "@/utils/api.service";

type ChatRole = "user" | "agent";

type ChatMessage = {
  id: string;
  role: ChatRole;
  content: string;
};

type ChatLocation = {
  lat: number;
  lng: number;
  address?: string;
  source: "profile" | "browser";
};

const DEFAULT_WELCOME_MESSAGE: ChatMessage = {
  id: "welcome",
  role: "agent",
  content:
    "Xin chào! Tôi là trợ lý AI của PNetAI. Bạn cần tư vấn sản phẩm, đặt lịch dịch vụ hay giải đáp vấn đề về thú cưng?",
};

const quickReplies = [
  "Tìm dịch vụ gần tôi",
  "Gợi ý đồ ăn cho thú cưng",
  "Hướng dẫn đặt lịch khám",
];

const getCurrentUserId = () => {
  try {
    const rawUser = localStorage.getItem("user");
    if (!rawUser) return "";

    const user = JSON.parse(rawUser);
    return user?.id || user?._id || "";
  } catch {
    return "";
  }
};

const getStoredUserLocation = (): ChatLocation | null => {
  try {
    const rawUser = localStorage.getItem("user");
    if (!rawUser) return null;

    const user = JSON.parse(rawUser);
    const coordinates = user?.location?.coordinates;
    if (!Array.isArray(coordinates) || coordinates.length < 2) return null;

    const [lng, lat] = coordinates;
    if (typeof lat !== "number" || typeof lng !== "number") return null;

    return {
      lat,
      lng,
      address: user?.location?.addressName || user?.address || "",
      source: "profile",
    };
  } catch {
    return null;
  }
};

const shouldAskBrowserLocation = (text: string) => {
  const normalized = text.toLowerCase();
  return [
    "gần tôi",
    "gan toi",
    "gần đây",
    "gan day",
    "quanh đây",
    "quanh day",
    "xung quanh",
    "near me",
    "nearby",
    "gần nhất",
    "gan nhat",
  ].some((keyword) => normalized.includes(keyword));
};

const getBrowserLocation = () =>
  new Promise<ChatLocation | null>((resolve) => {
    if (!navigator.geolocation) {
      resolve(null);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          source: "browser",
        });
      },
      () => resolve(null),
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 5 * 60 * 1000 }
    );
  });

const getChatLocation = async (text: string) => {
  const storedLocation = getStoredUserLocation();
  if (storedLocation) return storedLocation;
  if (!shouldAskBrowserLocation(text)) return null;
  return getBrowserLocation();
};

export default function FloatingChatAgent() {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([DEFAULT_WELCOME_MESSAGE]);
  const [isTyping, setIsTyping] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);

  const messageListRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const canSend = useMemo(
    () => inputValue.trim().length > 0 && !isTyping,
    [inputValue, isTyping]
  );

  useEffect(() => {
    if (!messageListRef.current) return;
    messageListRef.current.scrollTop = messageListRef.current.scrollHeight;
  }, [messages, isOpen, isTyping]);

  useEffect(() => {
    if (isOpen) {
      window.setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen]);

  // Monitor token changes to clear chat session on login/logout
  useEffect(() => {
    const checkTokenChange = () => {
      const currentToken = localStorage.getItem("token");
      const savedToken = (window as any).__pnetai_last_token || null;
      if (currentToken !== savedToken) {
        (window as any).__pnetai_last_token = currentToken;
        // Reset chat history and session ID
        setMessages([DEFAULT_WELCOME_MESSAGE]);
        setSessionId(null);
      }
    };

    // Check on mount and every time the chat widget is opened/closed
    checkTokenChange();

    // Listen for storage events (e.g. login/logout in other tabs)
    window.addEventListener("storage", checkTokenChange);

    // Check periodically as a fallback in single page application
    const interval = setInterval(checkTokenChange, 1000);

    return () => {
      window.removeEventListener("storage", checkTokenChange);
      clearInterval(interval);
    };
  }, [isOpen]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || isTyping) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: text,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsTyping(true);

    try {
      const location = await getChatLocation(text);
      const response = await apiClient.post("/chatbot/chat", {
        message: text,
        userId: getCurrentUserId(),
        location,
        sessionId,
      });

      const data = response.data;

      if (data.answer) {
        setMessages((prev) => [
          ...prev,
          {
            id: `agent-${Date.now()}`,
            role: "agent",
            content: data.answer,
          },
        ]);
      }

      if (data.sessionId) {
        setSessionId(data.sessionId);
      }
    } catch (error: any) {
      console.error("API call error:", error);

      let errorMsg = "Đã xảy ra lỗi khi kết nối với trợ lý AI.";

      if (error.code === "ERR_NETWORK") {
        errorMsg =
          "Không thể kết nối tới máy chủ. Vui lòng kiểm tra backend hoặc thử lại sau.";
      } else {
        const serverMsg = error.response?.data?.error || error.message;
        errorMsg = `Lỗi hệ thống: ${serverMsg || "Máy chủ AI không phản hồi."}`;
      }

      setMessages((prev) => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          role: "agent",
          content: errorMsg,
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    sendMessage(inputValue.trim());
  };

  const handleQuickReply = (text: string) => {
    sendMessage(text);
  };

  const handleAskDetails = (name: string, type: string) => {
    const typeLabel =
      type === "product" ? "sản phẩm" : type === "service" ? "dịch vụ" : "atelier/phòng khám";
    sendMessage(`Hãy cho tôi biết thêm thông tin chi tiết về ${typeLabel} "${name}" này.`);
  };

  return (
    <div className="fixed bottom-5 right-5 z-[80] flex items-end justify-end pointer-events-none sm:bottom-6 sm:right-6">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.97 }}
            transition={{ type: "spring", damping: 24, stiffness: 260 }}
            className="pointer-events-auto mb-20 flex h-[min(720px,calc(100vh-7rem))] w-[calc(100vw-2rem)] max-w-[430px] flex-col overflow-hidden rounded-2xl border border-sand/70 bg-white shadow-[0_28px_80px_rgba(44,36,24,0.22)]"
          >
            <header className="shrink-0 border-b border-sand/50 bg-white px-5 py-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-ink text-white shadow-lg shadow-ink/10">
                    <Bot className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h2 className="truncate text-sm font-black uppercase tracking-[0.16em] text-ink">
                        PNetAI Assistant
                      </h2>
                    </div>
                    <div className="mt-1 flex items-center gap-2 text-[11px] font-semibold text-muted">
                      <span className="h-2 w-2 rounded-full bg-emerald-500" />
                      Sẵn sàng hỗ trợ bằng tiếng Việt
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-sand/70 bg-white text-muted transition hover:border-ink hover:text-ink"
                  aria-label="Thu nhỏ trợ lý AI"
                  title="Thu nhỏ"
                >
                  <ChevronDown className="h-4 w-4" />
                </button>
              </div>
            </header>

            <div className="shrink-0 border-b border-sand/40 bg-warm/25 px-5 py-3">
              <div className="flex items-center gap-2 text-[11px] font-bold text-muted">
                <Sparkles className="h-3.5 w-3.5 text-caramel" />
                Hỏi về sản phẩm, dịch vụ, đặt lịch hoặc chăm sóc thú cưng.
              </div>
            </div>

            <div
              ref={messageListRef}
              className="min-h-0 flex-1 space-y-5 overflow-y-auto bg-[#FBFAF7] px-4 py-5"
            >
              {messages.map((message) => {
                const isUser = message.role === "user";

                return (
                  <div
                    key={message.id}
                    className={cn("flex gap-3", isUser ? "justify-end" : "justify-start")}
                  >
                    {!isUser && (
                      <div className="mt-1 grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-white text-caramel shadow-sm ring-1 ring-sand/60">
                        <Bot className="h-4 w-4" />
                      </div>
                    )}

                    <div className={cn("min-w-0 max-w-[82%]", !isUser && "max-w-[88%]")}>
                      <div
                        className={cn(
                          "break-words rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm",
                          isUser
                            ? "rounded-tr-md bg-ink text-white"
                            : "rounded-tl-md border border-sand/60 bg-white text-ink"
                        )}
                      >
                        {isUser ? (
                          <p className="whitespace-pre-wrap">{message.content}</p>
                        ) : (
                          <AIMessageRenderer
                            content={message.content}
                            onAskDetails={handleAskDetails}
                          />
                        )}
                      </div>
                    </div>

                    {isUser && (
                      <div className="mt-1 grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-caramel text-white shadow-sm">
                        <User className="h-4 w-4" />
                      </div>
                    )}
                  </div>
                );
              })}

              {isTyping && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex gap-3"
                >
                  <div className="mt-1 grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-white text-caramel shadow-sm ring-1 ring-sand/60">
                    <Bot className="h-4 w-4" />
                  </div>
                  <div className="rounded-2xl rounded-tl-md border border-sand/60 bg-white px-4 py-3 shadow-sm">
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 animate-bounce rounded-full bg-caramel/50" />
                      <span className="h-2 w-2 animate-bounce rounded-full bg-caramel/70 [animation-delay:120ms]" />
                      <span className="h-2 w-2 animate-bounce rounded-full bg-caramel [animation-delay:240ms]" />
                    </div>
                  </div>
                </motion.div>
              )}
            </div>

            <div className="shrink-0 border-t border-sand/50 bg-white p-4">
              <div className="mb-3 grid gap-2">
                {quickReplies.map((reply) => (
                  <button
                    key={reply}
                    type="button"
                    onClick={() => handleQuickReply(reply)}
                    disabled={isTyping}
                    className="flex w-full items-center rounded-xl border border-sand/70 bg-white px-3 py-2 text-left text-[11px] font-bold text-ink transition hover:border-caramel hover:bg-warm/40 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {reply === "Tìm dịch vụ gần tôi" && (
                      <LocateFixed className="mr-2 h-3.5 w-3.5 shrink-0 text-caramel" />
                    )}
                    {reply}
                  </button>
                ))}
              </div>

              <form onSubmit={handleSubmit} className="flex items-end gap-2">
                <textarea
                  ref={inputRef}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage(inputValue.trim());
                    }
                  }}
                  placeholder="Nhập câu hỏi của bạn..."
                  disabled={isTyping}
                  rows={1}
                  className="max-h-28 min-h-[48px] flex-1 resize-none rounded-2xl border border-sand/80 bg-warm/20 px-4 py-3 text-sm text-ink outline-none transition placeholder:text-muted/70 focus:border-caramel focus:bg-white disabled:cursor-not-allowed disabled:opacity-70"
                />
                <button
                  type="submit"
                  disabled={!canSend}
                  className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-caramel text-white shadow-lg shadow-caramel/20 transition hover:bg-ink disabled:cursor-not-allowed disabled:opacity-40"
                  aria-label="Gửi tin nhắn"
                  title="Gửi"
                >
                  {isTyping ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </button>
              </form>
              <p className="mt-2 text-center text-[10px] font-medium text-muted/60">
                AI có thể sai sót, hãy kiểm tra lại các thông tin quan trọng.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        whileHover={{ scale: 1.04 }}
        whileTap={{ scale: 0.96 }}
        className="pointer-events-auto group fixed bottom-5 right-5 grid h-14 w-14 place-items-center rounded-2xl bg-ink text-white shadow-[0_18px_45px_rgba(44,36,24,0.28)] transition hover:bg-caramel sm:bottom-6 sm:right-6"
        aria-label={isOpen ? "Đóng trợ lý AI" : "Mở trợ lý AI"}
        title={isOpen ? "Đóng trợ lý AI" : "Mở trợ lý AI"}
      >
        <AnimatePresence mode="wait" initial={false}>
          {isOpen ? (
            <motion.span
              key="close"
              initial={{ opacity: 0, rotate: -45, scale: 0.85 }}
              animate={{ opacity: 1, rotate: 0, scale: 1 }}
              exit={{ opacity: 0, rotate: 45, scale: 0.85 }}
              transition={{ duration: 0.16 }}
            >
              <X className="h-5 w-5" />
            </motion.span>
          ) : (
            <motion.span
              key="open"
              initial={{ opacity: 0, rotate: 45, scale: 0.85 }}
              animate={{ opacity: 1, rotate: 0, scale: 1 }}
              exit={{ opacity: 0, rotate: -45, scale: 0.85 }}
              transition={{ duration: 0.16 }}
            >
              <MessageCircle className="h-5 w-5" />
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>
    </div>
  );
}
