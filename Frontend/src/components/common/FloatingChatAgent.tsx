import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { Bot, MessageCircle, Send, X, Loader2, User } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/utils/cn";
import { AIMessageRenderer } from "./AIMessageRenderer";

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
  
  const messageListRef = useRef<HTMLDivElement>(null);

  const canSend = useMemo(() => inputValue.trim().length > 0 && !isTyping, [inputValue, isTyping]);

  useEffect(() => {
    if (!messageListRef.current) return;
    messageListRef.current.scrollTop = messageListRef.current.scrollHeight;
  }, [messages, isOpen]);

  // Load history when chat is opened
  useEffect(() => {
    const fetchHistory = async () => {
      if (!isOpen) return;
      
      const token = localStorage.getItem('token');
      if (!token) return;

      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:9999'}/chatbot/history`, {
          headers: {
            "Authorization": `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const history = await response.json();
          if (history.length > 0) {
            const historyMessages: ChatMessage[] = [];
            history.reverse().forEach((item: any) => {
              historyMessages.push({
                id: `q-${item._id}`,
                role: "user",
                content: item.question
              });
              historyMessages.push({
                id: `a-${item._id}`,
                role: "agent",
                content: item.answer
              });
            });
            setMessages([DEFAULT_WELCOME_MESSAGE, ...historyMessages]);
          }
        }
      } catch (error) {
        console.error("Failed to fetch chat history:", error);
      }
    };

    fetchHistory();
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
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:9999'}/chatbot/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify({
          message: text,
        }),
      });

      if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Could not connect to the Backend.");
      }

      const data = await response.json();
      
      if (data.answer) {
        setMessages((prev) => [...prev, {
          id: `agent-${Date.now()}`,
          role: "agent",
          content: data.answer
        }]);
      }
    } catch (error: any) {
      console.error("API call error:", error);
      setMessages((prev) => [...prev, {
        id: `error-${Date.now()}`,
        role: "agent",
        content: `❌ Lỗi: ${error.message || "Không thể kết nối tới máy chủ."}`
      }]);
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
    console.log(`Asking details for: ${name} (${type})`);
    const typeLabel = type === 'product' ? 'sản phẩm' : type === 'service' ? 'dịch vụ' : 'atelier/phòng khám';
    sendMessage(`Hãy cho tôi biết thêm thông tin chi tiết về ${typeLabel} "${name}" này.`);
  };

  return (
    <div className="fixed inset-y-0 left-0 z-[70] pointer-events-none">
      {/* Trigger Button (Bouncing at bottom right) */}
      <motion.button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        animate={!isOpen ? { 
          y: [0, -8, 0],
        } : { y: 0 }}
        transition={{ 
          duration: 4, 
          repeat: Infinity, 
          ease: [0.45, 0.05, 0.55, 0.95] 
        }}
        whileHover={{ scale: 1.05, transition: { duration: 0.2 } }}
        whileTap={{ scale: 0.95 }}
        className="pointer-events-auto fixed bottom-6 right-6 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-caramel to-[#bb7f1d] text-white shadow-[0_10px_30px_-5px_rgba(122,79,45,0.5)] transition-all duration-500 z-[80] group"
        aria-label="Mở trợ lý AI"
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div
              key="close"
              initial={{ rotate: -180, scale: 0.5, opacity: 0 }}
              animate={{ rotate: 0, scale: 1, opacity: 1 }}
              exit={{ rotate: 180, scale: 0.5, opacity: 0 }}
              transition={{ duration: 0.4, ease: "backOut" }}
            >
              <X size={22} />
            </motion.div>
          ) : (
            <motion.div
              key="chat"
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              transition={{ duration: 0.4, ease: "backOut" }}
            >
               <MessageCircle size={22} className="group-hover:rotate-6 transition-transform duration-500" />
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Tooltip on hover */}
        {!isOpen && (
          <span className="absolute right-16 px-3 py-1.5 rounded-lg bg-ink text-white text-[10px] font-bold uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-xl border border-white/10">
            Chat with PNetAI
          </span>
        )}
      </motion.button>

      {/* Backdrop (Darken screen when open) */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-ink/20 backdrop-blur-[2px] pointer-events-auto z-[60]"
          />
        )}
      </AnimatePresence>

      {/* Sidebar Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="pointer-events-auto fixed inset-y-0 left-0 w-[90vw] sm:w-[480px] bg-white shadow-[25px_0_70px_-15px_rgba(0,0,0,0.12)] border-r border-sand/50 flex flex-col z-[70]"
          >
            {/* Header */}
            <div className="relative overflow-hidden bg-gradient-to-br from-caramel via-[#cf9c47] to-[#c9872a] px-6 py-8 text-white shrink-0">
               <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl" />
               <div className="relative flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-md ring-1 ring-white/30 shadow-lg">
                    <Bot size={24} className="text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-black tracking-tight uppercase">PNetAI Assistant</h2>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                      <span className="text-xs font-bold text-white/90 uppercase tracking-widest">Active Now</span>
                    </div>
                  </div>
               </div>
            </div>

            {/* Messages Area */}
            <div 
              ref={messageListRef} 
              className="flex-1 overflow-y-auto px-6 py-8 space-y-6 scrollbar-thin scrollbar-thumb-sand/50"
            >
              {messages.slice(-14).map((message) => (
                <div key={message.id} className={cn("flex flex-col", message.role === "user" ? "items-end" : "items-start")}>
                  <div className={cn(
                    "flex items-center gap-2 mb-1.5 px-1",
                    message.role === "user" ? "flex-row-reverse" : "flex-row"
                  )}>
                    {message.role === "agent" ? <Bot size={12} className="text-caramel" /> : <User size={12} className="text-muted" />}
                    <span className="text-[10px] font-black uppercase tracking-tighter text-muted/60">
                      {message.role === "agent" ? "PNetAI" : "You"}
                    </span>
                  </div>
                  <div
                    className={cn(
                      "max-w-[90%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm break-words overflow-hidden",
                      message.role === "user"
                        ? "bg-ink text-white rounded-tr-none"
                        : "bg-warm/30 border border-sand/30 text-ink rounded-tl-none w-full"
                    )}
                  >
                    {message.content === "" && message.role === "agent" ? (
                      <div className="flex items-center gap-1 py-1">
                        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-caramel/40" />
                        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-caramel/60 [animation-delay:0.2s]" />
                        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-caramel/80 [animation-delay:0.4s]" />
                      </div>
                    ) : message.role === "agent" ? (
                      <AIMessageRenderer 
                        content={message.content} 
                        onAskDetails={handleAskDetails}
                      />
                    ) : (
                      message.content
                    )}
                  </div>
                </div>
              ))}
              {isTyping && (
                <motion.div 
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col items-start"
                >
                   <div className="flex items-center gap-2 mb-1.5 px-1">
                      <Bot size={12} className="text-caramel animate-bounce" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-caramel animate-pulse">PNetAI đang suy nghĩ...</span>
                   </div>
                   <div className="bg-warm/30 border border-sand/30 rounded-2xl rounded-tl-none px-4 py-3 shadow-sm">
                      <div className="flex items-center gap-1.5">
                        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-caramel/40" />
                        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-caramel/60 [animation-delay:0.2s]" />
                        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-caramel/80 [animation-delay:0.4s]" />
                      </div>
                   </div>
                </motion.div>
              )}
            </div>

            {/* Quick Replies & Input */}
            <div className="p-6 border-t border-sand/30 bg-white/80 backdrop-blur-sm shrink-0">
              <div className="flex flex-wrap gap-2 mb-4">
                {quickReplies.map((reply) => (
                  <button
                    key={reply}
                    type="button"
                    onClick={() => handleQuickReply(reply)}
                    disabled={isTyping}
                    className="text-[11px] font-bold px-3 py-1.5 rounded-lg border border-sand bg-white text-muted transition-all hover:border-caramel hover:text-ink hover:bg-warm/20 disabled:opacity-50"
                  >
                    {reply}
                  </button>
                ))}
              </div>

              <form onSubmit={handleSubmit} className="relative">
                <textarea
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSubmit(e as any);
                    }
                  }}
                  placeholder="Ask PNetAI..."
                  disabled={isTyping}
                  className="w-full bg-warm/20 border border-sand rounded-2xl pl-4 pr-12 py-3.5 text-sm text-ink outline-none focus:border-caramel/50 transition-all placeholder:text-muted/60 resize-none h-[54px]"
                />
                <button
                  type="submit"
                  disabled={!canSend}
                  className="absolute right-2 top-2 h-9 w-9 flex items-center justify-center rounded-xl bg-caramel text-white shadow-md transition-all hover:bg-ink disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {isTyping ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                </button>
              </form>
              <p className="mt-3 text-[10px] text-center text-muted/50 font-medium italic">
                AI can make mistakes. Consider checking important info.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}