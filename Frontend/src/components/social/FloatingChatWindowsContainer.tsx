import React, { useEffect, useState } from "react";
import { X } from "lucide-react";
import { useChatWindows } from "../../context/ChatWindowContext";
import { FloatingChatWindow } from "./FloatingChatWindow";

export const FloatingChatWindowsContainer: React.FC = () => {
  const { openChats, minimizedChats, closeChat, toggleMinimize, maximizeChat } = useChatWindows();
  const [isMobile, setIsMobile] = useState(false);
  const [isChatbotOpen, setIsChatbotOpen] = useState(false);

  // Monitor window resize
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Listen to chatbot open/close state
  useEffect(() => {
    const handleChatbotToggle = (e: Event) => {
      const customEvent = e as CustomEvent<{ open: boolean }>;
      setIsChatbotOpen(customEvent.detail.open);
    };
    window.addEventListener("chatbot:toggle", handleChatbotToggle as EventListener);
    return () => window.removeEventListener("chatbot:toggle", handleChatbotToggle as EventListener);
  }, []);

  // Filter conversations
  const activeChats = openChats.filter((c) => !minimizedChats.includes(c._id));
  const hiddenChats = openChats.filter((c) => minimizedChats.includes(c._id));

  // Limit display count of maximized chats (1 on mobile, 3 on desktop)
  const displayLimit = isMobile ? 1 : 3;
  const visibleChats = activeChats.slice(-displayLimit);

  // Auto-minimize overflow chats
  useEffect(() => {
    if (activeChats.length > displayLimit) {
      const overflowCount = activeChats.length - displayLimit;
      const toMinimize = activeChats.slice(0, overflowCount);
      toMinimize.forEach((c) => toggleMinimize(c._id));
    }
  }, [openChats, minimizedChats, displayLimit, activeChats.length]);

  // Dispatch active user chat status to other components (like chatbot agent)
  const hasActiveChat = visibleChats.length > 0;
  useEffect(() => {
    const event = new CustomEvent("userchat:toggle", { detail: { hasActiveChat } });
    window.dispatchEvent(event);
  }, [hasActiveChat]);

  if (openChats.length === 0) return null;

  // ----- Positioning logic -----
  // Chatbot button is at: bottom-5 right-5 (sm: bottom-6 right-6), size h-14 w-14 (56px)
  // So bottom-20 (80px) clears the chatbot button with a small gap.
  // When chatbot window is open on desktop, shift left by 470px to clear its 430px width.

  const chatWindowsRight = isChatbotOpen && !isMobile ? "right-[470px]" : "right-4 sm:right-6";
  const bubblesRight = isChatbotOpen && !isMobile ? "right-[470px]" : "right-4 sm:right-6";
  const showBubbles = hiddenChats.length > 0 && !(isChatbotOpen && isMobile);
  const showWindows = visibleChats.length > 0 && !(isChatbotOpen && isMobile);

  return (
    <>
      {/* Minimized Chat Bubbles — stacked vertically above the chatbot button */}
      {showBubbles && (
        <div
          className={`fixed bottom-20 sm:bottom-24 ${bubblesRight} z-[90] flex flex-col-reverse gap-2 pointer-events-none transition-all duration-300`}
        >
          {hiddenChats.map((convo) => {
            const other = convo.otherParticipant;
            if (!other) return null;

            const initials = other.name
              .split(" ")
              .slice(0, 2)
              .map((n) => n[0]?.toUpperCase())
              .join("");

            return (
              <div key={convo._id} className="group relative pointer-events-auto">
                {/* Close Button on Hover */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    closeChat(convo._id);
                  }}
                  className="absolute -top-1 -left-1 hidden group-hover:grid h-5 w-5 place-items-center rounded-full bg-rust text-white shadow-md hover:bg-ink transition z-10"
                >
                  <X className="h-3 w-3" />
                </button>

                {/* Bubble Button */}
                <button
                  type="button"
                  onClick={() => maximizeChat(convo._id)}
                  className="relative flex h-12 w-12 items-center justify-center rounded-full bg-brown text-white shadow-lg border border-sand hover:scale-105 active:scale-95 transition dark:border-slate-800 dark:bg-amber-800"
                  title={`Trò chuyện với ${other.name}`}
                >
                  {other.avatarUrl ? (
                    <img
                      src={other.avatarUrl}
                      alt={other.name}
                      className="h-full w-full rounded-full object-cover"
                    />
                  ) : (
                    <span className="text-sm font-black">{initials}</span>
                  )}

                  {/* Unread dot */}
                  {convo.unreadCount > 0 && (
                    <span className="absolute -right-0.5 -top-0.5 h-3.5 w-3.5 rounded-full bg-rust border-2 border-white dark:border-slate-900 animate-pulse" />
                  )}
                </button>

                {/* Tooltip Name */}
                <span className="absolute right-14 top-1/2 -translate-y-1/2 scale-0 group-hover:scale-100 bg-slate-900 text-white text-[10px] font-bold px-2.5 py-1.5 rounded-lg shadow-xl transition-all duration-150 origin-right whitespace-nowrap z-50">
                  {other.name}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* Maximized Chat Windows — anchored at the bottom */}
      {showWindows && (
        <div
          className={`fixed bottom-0 ${chatWindowsRight} z-[90] flex items-end gap-3 pointer-events-none transition-all duration-300`}
        >
          {visibleChats.map((convo) => (
            <FloatingChatWindow
              key={convo._id}
              conversation={convo}
              isMinimized={false}
              onClose={() => closeChat(convo._id)}
              onMinimize={() => toggleMinimize(convo._id)}
            />
          ))}
        </div>
      )}
    </>
  );
};
