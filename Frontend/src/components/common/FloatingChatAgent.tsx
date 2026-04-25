import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { Bot, MessageCircle, Send, Sparkles, X, Loader2 } from "lucide-react";
import { buildApiUrl } from "../../utils/api.service";

type ChatRole = "user" | "agent";

type ChatMessage = {
  id: string;
  role: ChatRole;
  content: string;
};

const DEFAULT_WELCOME_MESSAGE: ChatMessage = {
  id: "welcome",
  role: "agent",
  content: "Xin chào! Tôi là trợ lý AI của PNetAI. Bạn cần tư vấn sản phẩm, đặt lịch dịch vụ hay giải đáp vấn đề về thú cưng?",
};

const quickReplies = [
  "Bạn có thể tìm món ăn cho chó bị dị ứng không?",
  "Hướng dẫn đặt lịch khám trong hệ thống",
  "Tôi muốn gợi ý đồ chơi cho mèo 6 tháng tuổi",
];

export default function FloatingChatAgent() {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([DEFAULT_WELCOME_MESSAGE]);
  const [isTyping, setIsTyping] = useState(false);
  
  // Create a unique session_id for the current chat session
  const [sessionId] = useState(() => crypto.randomUUID()); 
  
  const messageListRef = useRef<HTMLDivElement>(null);

  const canSend = useMemo(() => inputValue.trim().length > 0 && !isTyping, [inputValue, isTyping]);

  useEffect(() => {
    if (!messageListRef.current) return;
    messageListRef.current.scrollTop = messageListRef.current.scrollHeight;
  }, [messages, isOpen]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || isTyping) return;

    // 1. Add User Message
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: text,
    };

    // 2. Add an empty Agent Message to prepare for Streaming data
    const agentId = `agent-${Date.now()}`;
    const agentMessage: ChatMessage = {
      id: agentId,
      role: "agent",
      content: "", 
    };

    setMessages((prev) => [...prev, userMessage, agentMessage]);
    setInputValue("");
    setIsTyping(true);

    try {
      const response = await fetch(buildApiUrl("/chat"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          session_id: sessionId,
          message: text,
          top_k: 3,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Chat request failed.");
      }

      if (!response.body) throw new Error("Could not receive data from server.");

      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let done = false;
      let buffer = ""; 

      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        
        if (value) {
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          
          // Keep the last line in case it's incomplete
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const dataStr = line.substring(6).trim();
              
              if (dataStr === "[DONE]") {
                continue;
              }

              try {
                const dataJson = JSON.parse(dataStr);
                if (dataJson.content) {
                  setMessages((prev) =>
                    prev.map((msg) =>
                      msg.id === agentId
                        ? { ...msg, content: msg.content + dataJson.content }
                        : msg
                    )
                  );
                }
              } catch (e) {
                console.error("JSON parse error:", e);
              }
            }
          }
        }
      }
    } catch (error) {
      console.error("API call error:", error);
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === agentId
            ? { ...msg, content: "❌ Error: Could not connect to the Backend. Please ensure the Server is running." }
            : msg
        )
      );
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

  return (
    <div className="fixed bottom-5 right-5 z-[60] sm:bottom-6 sm:right-6">
      {isOpen ? (
        <div className="mb-3 w-[92vw] max-w-[390px] overflow-hidden rounded-[28px] border border-white/60 bg-gradient-to-br from-[#fff9ef] via-[#fffdf8] to-[#f7f2e6] shadow-[0_24px_60px_-20px_rgba(44,36,24,0.35)] backdrop-blur-md animate-in fade-in zoom-in-95 duration-200">
          <div className="relative overflow-hidden border-b border-sand/80 bg-gradient-to-r from-caramel/90 via-[#cf9c47] to-[#c9872a] px-4 py-3.5 text-white">
            <div className="pointer-events-none absolute -right-6 -top-8 h-24 w-24 rounded-full bg-white/15" />
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 ring-1 ring-white/40">
                <Bot size={18} />
              </div>
              <div>
                <p className="text-sm font-bold tracking-wide">PNetAI Assistant</p>
                <p className="text-xs text-white/90">Đang online • Hỗ trợ 24/7</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="absolute right-3 top-3 rounded-full p-2 text-white/85 transition hover:bg-white/20 hover:text-white"
              aria-label="Thu gọn chat agent"
            >
              <X size={18} />
            </button>
          </div>

          <div ref={messageListRef} className="max-h-[360px] space-y-3 overflow-y-auto bg-white/35 px-4 py-4">
            {messages.map((message) => (
              <div key={message.id} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[82%] rounded-2xl px-3 py-2 text-sm leading-relaxed whitespace-pre-wrap ${
                    message.role === "user"
                      ? "rounded-br-sm bg-gradient-to-r from-forest to-[#4d6e4f] text-white shadow-md"
                      : "rounded-bl-sm border border-sand/80 bg-white text-ink shadow-sm"
                  }`}
                >
                  {message.content === "" && message.role === "agent" ? (
                    <div className="flex items-center gap-1 py-1">
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-caramel/40" />
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-caramel/60 [animation-delay:0.2s]" />
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-caramel/80 [animation-delay:0.4s]" />
                    </div>
                  ) : (
                    message.content
                  )}
                </div>
              </div>
            ))}
            {isTyping && messages[messages.length - 1]?.role === "user" && (
                <div className="flex justify-start">
                  <div className="rounded-2xl rounded-bl-sm border border-sand/80 bg-white px-3 py-2 text-sm text-ink shadow-sm">
                    <Loader2 size={16} className="animate-spin text-caramel" />
                  </div>
                </div>
            )}
          </div>

          <div className="border-t border-sand/80 bg-white/55 px-4 pb-4 pt-3">
            <div className="mb-3 flex flex-wrap gap-2">
              {quickReplies.map((reply) => (
                <button
                  key={reply}
                  type="button"
                  onClick={() => handleQuickReply(reply)}
                  disabled={isTyping}
                  className="rounded-full border border-sand/80 bg-white/85 px-3 py-1 text-xs text-muted transition hover:-translate-y-0.5 hover:border-caramel hover:text-ink disabled:opacity-50 disabled:hover:translate-y-0"
                >
                  {reply}
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit} className="flex items-center gap-2 rounded-2xl border border-sand/80 bg-white p-2 shadow-inner">
              <Sparkles size={16} className="ml-1 text-caramel" />
              <input
                value={inputValue}
                onChange={(event) => setInputValue(event.target.value)}
                placeholder="Nhập câu hỏi của bạn..."
                disabled={isTyping}
                className="h-9 flex-1 bg-transparent pr-1 text-sm text-ink outline-none placeholder:text-muted/85 disabled:opacity-70"
              />
              <button
                type="submit"
                disabled={!canSend}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-caramel text-white shadow-md transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60"
                aria-label="Gửi tin nhắn"
              >
                {isTyping ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              </button>
            </form>
          </div>
        </div>
      ) : null}

      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="group ml-auto mt-2 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-caramel to-[#bb7f1d] text-white shadow-[0_14px_30px_-10px_rgba(122,79,45,0.6)] transition hover:scale-105 hover:brightness-95"
        aria-label="Mở chat agent"
      >
        <MessageCircle size={22} />
        {!isOpen ? (
          <span className="pointer-events-none absolute -top-1 -right-1 h-3 w-3 rounded-full border-2 border-cream bg-forest" />
        ) : null}
      </button>
    </div>
  );
}
