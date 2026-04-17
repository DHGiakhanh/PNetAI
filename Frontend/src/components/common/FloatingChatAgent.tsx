import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { Bot, MessageCircle, Send, Sparkles, X } from "lucide-react";

type ChatRole = "user" | "agent";

type ChatMessage = {
  id: string;
  role: ChatRole;
  content: string;
};

const DEFAULT_WELCOME_MESSAGE: ChatMessage = {
  id: "welcome",
  role: "agent",
  content:
    "Xin chào! Tôi là trợ lý AI của PNetAI. Bạn cần tư vấn sản phẩm, đặt lịch dịch vụ hay giải đáp vấn đề về thú cưng?",
};

const quickReplies = [
  "Bạn có thể tìm món ăn cho chó bị dị ứng không?",
  "Hướng dẫn đặt lịch khám trong hệ thống",
  "Tôi muốn gợi ý đồ chơi cho mèo 6 tháng tuổi",
];

function createMockResponse(userMessage: string): string {
  const normalizedText = userMessage.toLowerCase();

  if (normalizedText.includes("dat lich") || normalizedText.includes("booking")) {
    return "Bạn vào mục Dịch vụ, chọn dịch vụ và khung giờ phù hợp, sau đó bấm Đặt lịch. Nếu cần, tôi có thể hướng dẫn chi tiết từng bước.";
  }

  if (normalizedText.includes("thuc an") || normalizedText.includes("an")) {
    return "Với trường hợp liên quan đến đồng dưỡng, bạn nên cung cấp tuổi, cân nặng và tiền sử dị ứng của thú cưng để tôi gợi ý chính xác hơn.";
  }

  return "Tôi đã ghi nhận yêu cầu của bạn. Bạn có thể chia sẻ thêm thông tin (loại thú cưng, tuổi, triệu chứng, mục tiêu) để tôi phân tích chi tiết hơn.";
}

export default function FloatingChatAgent() {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([DEFAULT_WELCOME_MESSAGE]);
  const messageListRef = useRef<HTMLDivElement>(null);

  const canSend = useMemo(() => inputValue.trim().length > 0, [inputValue]);

  useEffect(() => {
    if (!messageListRef.current) return;
    messageListRef.current.scrollTop = messageListRef.current.scrollHeight;
  }, [messages, isOpen]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedMessage = inputValue.trim();
    if (!trimmedMessage) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: trimmedMessage,
    };

    const agentMessage: ChatMessage = {
      id: `agent-${Date.now()}`,
      role: "agent",
      content: createMockResponse(trimmedMessage),
    };

    setMessages((prev) => [...prev, userMessage, agentMessage]);
    setInputValue("");
  };

  const handleQuickReply = (text: string) => {
    setInputValue(text);
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
                <p className="text-xs text-white/90">Dang online • Ho tro 24/7</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="absolute right-3 top-3 rounded-full p-2 text-white/85 transition hover:bg-white/20 hover:text-white"
              aria-label="Thu gon chat agent"
            >
              <X size={18} />
            </button>
          </div>

          <div ref={messageListRef} className="max-h-[360px] space-y-3 overflow-y-auto bg-white/35 px-4 py-4">
            {messages.map((message) => (
              <div key={message.id} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[82%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                    message.role === "user"
                      ? "rounded-br-sm bg-gradient-to-r from-forest to-[#4d6e4f] text-white shadow-md"
                      : "rounded-bl-sm border border-sand/80 bg-white text-ink shadow-sm"
                  }`}
                >
                  {message.content}
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-sand/80 bg-white/55 px-4 pb-4 pt-3">
            <div className="mb-3 flex flex-wrap gap-2">
              {quickReplies.map((reply) => (
                <button
                  key={reply}
                  type="button"
                  onClick={() => handleQuickReply(reply)}
                  className="rounded-full border border-sand/80 bg-white/85 px-3 py-1 text-xs text-muted transition hover:-translate-y-0.5 hover:border-caramel hover:text-ink"
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
                className="h-9 flex-1 bg-transparent pr-1 text-sm text-ink outline-none placeholder:text-muted/85"
              />
              <button
                type="submit"
                disabled={!canSend}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-caramel text-white shadow-md transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60"
                aria-label="Gửi tin nhắn"
              >
                <Send size={16} />
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
