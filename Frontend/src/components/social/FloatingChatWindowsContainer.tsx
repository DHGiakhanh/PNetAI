import React, { useEffect, useState } from "react";
import { X } from "lucide-react";
import { useChatWindows } from "../../context/ChatWindowContext";
import { FloatingChatWindow } from "./FloatingChatWindow";

export const FloatingChatWindowsContainer: React.FC = () => {
  const { openChats, minimizedChats, closeChat, toggleMinimize, maximizeChat } = useChatWindows();
  const [isMobile, setIsMobile] = useState(false);

  // Monitor window resize to adjust responsive layout
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
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
      toMinimize.forEach((c) => {
        toggleMinimize(c._id);
      });
    }
  }, [openChats, minimizedChats, displayLimit, activeChats.length]);

  if (openChats.length === 0) return null;

  return (
    <div className="fixed bottom-0 right-4 z-[90] flex items-end gap-3 pointer-events-none sm:right-6">
      
      {/* Minimized Bubbles Column */}
      {hiddenChats.length > 0 && (
        <div className="flex flex-col gap-2 mb-4 pointer-events-auto items-end">
          {hiddenChats.map((convo) => {
            const other = convo.otherParticipant;
            if (!other) return null;

            const initials = other.name
              .split(" ")
              .slice(0, 2)
              .map((n) => n[0]?.toUpperCase())
              .join("");

            return (
              <div key={convo._id} className="group relative">
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
                  
                  {/* Unread dot in minimized bubble */}
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

      {/* Maximized Windows (Rendered side-by-side) */}
      <div className="flex items-end gap-3 pointer-events-none">
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
    </div>
  );
};
