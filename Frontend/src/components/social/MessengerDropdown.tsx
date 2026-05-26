import React, { useState, useEffect } from "react";
import {
  MessageSquare,
  UserCheck,
  Loader2,
  MessageCircle,
  UserPlus,
  UserX,
  MessageSquareX,
  UserMinus,
} from "lucide-react";
import { useSocket } from "../../context/SocketContext";
import { useChatWindows } from "../../context/ChatWindowContext";
import {
  socialService,
  Conversation,
  Friend,
  FriendRequest,
  SentRequest,
  SearchedUser,
} from "../../services/social.service";
import { toast } from "react-hot-toast";

interface MessengerDropdownProps {
  onClose: () => void;
}

type SubTab = "chats" | "friends" | "requests" | "search";

export const MessengerDropdown: React.FC<MessengerDropdownProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<SubTab>("chats");

  // States
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [pendingRequests, setPendingRequests] = useState<FriendRequest[]>([]);
  const [sentRequests, setSentRequests] = useState<SentRequest[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchedUser[]>([]);
  
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const { onlineUsers, queryUsersStatus } = useSocket();
  const { openChat, openChatWithUser } = useChatWindows();

  // Load initial tab data
  useEffect(() => {
    loadTabData();
  }, [activeTab]);

  const loadTabData = async () => {
    setLoading(true);
    try {
      if (activeTab === "chats") {
        const data = await socialService.getConversations();
        setConversations(data);
        
        // Query status for other participants
        const otherIds = data
          .map((c) => c.otherParticipant?._id)
          .filter((id): id is string => !!id);
        if (otherIds.length > 0) queryUsersStatus(otherIds);
      } else if (activeTab === "friends") {
        const data = await socialService.getFriends();
        setFriends(data);
        if (data.length > 0) queryUsersStatus(data.map((f) => f._id));
      } else if (activeTab === "requests") {
        const pending = await socialService.getPendingRequests();
        const sent = await socialService.getSentRequests();
        setPendingRequests(pending);
        setSentRequests(sent);
      }
    } catch (error) {
      toast.error("Không thể tải dữ liệu.");
    } finally {
      setLoading(false);
    }
  };

  // Search logic
  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setLoading(true);
    try {
      const data = await socialService.searchUsers(searchQuery);
      setSearchResults(data);
    } catch (error) {
      toast.error("Lỗi khi tìm kiếm thành viên.");
    } finally {
      setLoading(false);
    }
  };

  // Actions
  const handleSendRequest = async (userId: string) => {
    setActionLoading(userId);
    try {
      await socialService.sendFriendRequest(userId);
      toast.success("Đã gửi yêu cầu kết bạn!");
      setSearchResults((prev) =>
        prev.map((u) => (u._id === userId ? { ...u, friendshipStatus: "pending_sent" } : u))
      );
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Lỗi gửi yêu cầu.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancelRequest = async (userId: string) => {
    setActionLoading(userId);
    try {
      await socialService.cancelFriendRequest(userId);
      toast.success("Đã hủy yêu cầu kết bạn.");
      setSearchResults((prev) =>
        prev.map((u) => (u._id === userId ? { ...u, friendshipStatus: "none" } : u))
      );
      setSentRequests((prev) => prev.filter((r) => r.recipient._id !== userId));
    } catch (error) {
      toast.error("Lỗi hủy yêu cầu.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleAcceptRequest = async (userId: string) => {
    setActionLoading(userId);
    try {
      await socialService.acceptFriendRequest(userId);
      toast.success("Đã chấp nhận kết bạn!");
      setPendingRequests((prev) => prev.filter((r) => r.requester._id !== userId));
      setSearchResults((prev) =>
        prev.map((u) => (u._id === userId ? { ...u, friendshipStatus: "friends" } : u))
      );
    } catch (error) {
      toast.error("Lỗi khi chấp nhận kết bạn.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectRequest = async (userId: string) => {
    setActionLoading(userId);
    try {
      await socialService.rejectFriendRequest(userId);
      toast.success("Đã từ chối kết bạn.");
      setPendingRequests((prev) => prev.filter((r) => r.requester._id !== userId));
      setSearchResults((prev) =>
        prev.map((u) => (u._id === userId ? { ...u, friendshipStatus: "none" } : u))
      );
    } catch (error) {
      toast.error("Lỗi khi từ chối.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleUnfriend = async (friendId: string) => {
    if (!window.confirm("Bạn có chắc chắn muốn hủy kết bạn với người này không?")) return;

    setActionLoading(friendId);
    try {
      await socialService.unfriend(friendId);
      toast.success("Đã hủy kết bạn thành công.");
      // Remove from friends list
      setFriends((prev) => prev.filter((f) => f._id !== friendId));
      // Update search results list if present
      setSearchResults((prev) =>
        prev.map((u) => (u._id === friendId ? { ...u, friendshipStatus: "none" } : u))
      );
    } catch (error) {
      toast.error("Lỗi khi hủy kết bạn.");
    } finally {
      setActionLoading(null);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .slice(0, 2)
      .map((n) => n[0]?.toUpperCase())
      .join("");
  };

  return (
    <div className="flex h-[480px] w-full flex-col rounded-2xl border border-sand bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
      {/* Title */}
      <div className="px-4 pt-4 pb-2 flex items-center justify-between">
        <h3 className="font-serif text-xl font-bold italic text-ink dark:text-white">Messenger</h3>
        <span className="text-[9px] font-black uppercase tracking-widest text-muted dark:text-slate-400">PNetAI Social</span>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-sand/35 dark:border-slate-800/80 px-2 gap-0.5">
        {(["chats", "friends", "requests", "search"] as SubTab[]).map((tab) => {
          const tabLabels = {
            chats: "Trò chuyện",
            friends: "Bạn bè",
            requests: "Lời mời",
            search: "Tìm kiếm",
          };
          const isActive = activeTab === tab;

          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2 text-center text-xs font-semibold border-b-2 transition ${
                isActive
                  ? "border-brown text-brown dark:border-amber-700 dark:text-amber-500"
                  : "border-transparent text-gray-500 hover:text-ink hover:border-sand dark:text-slate-400 dark:hover:text-white"
              }`}
            >
              {tabLabels[tab]}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-3 scrollbar-thin dark:bg-slate-950/20">
        {loading && (
          <div className="flex h-full items-center justify-center py-12">
            <Loader2 className="h-7 w-7 animate-spin text-caramel dark:text-amber-600" />
          </div>
        )}

        {!loading && (
          <>
            {/* CHATS TAB */}
            {activeTab === "chats" && (
              conversations.length === 0 ? (
                <div className="flex flex-col items-center justify-center text-center h-full py-12">
                  <MessageCircle className="h-8 w-8 text-caramel/20 dark:text-slate-700 mb-2" />
                  <p className="text-xs text-muted dark:text-slate-500 italic">Chưa có tin nhắn nào</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {conversations.map((convo) => {
                    const other = convo.otherParticipant;
                    if (!other) return null;
                    const isOnline = onlineUsers[other._id] === "online" || other.onlineStatus === "online";
                    const hasUnread = convo.unreadCount > 0;

                    return (
                      <button
                        key={convo._id}
                        onClick={() => {
                          openChat(convo);
                          onClose();
                        }}
                        className="w-full flex items-center gap-3 p-2.5 rounded-xl text-left transition hover:bg-warm/40 dark:hover:bg-slate-800/40"
                      >
                        <div className="relative shrink-0">
                          {other.avatarUrl ? (
                            <img
                              src={other.avatarUrl}
                              alt="Avatar"
                              className="h-10 w-10 rounded-full object-cover border border-sand dark:border-slate-800"
                            />
                          ) : (
                            <span className="grid h-10 w-10 place-items-center rounded-full bg-brown/10 text-brown text-sm font-bold border border-sand dark:border-slate-800">
                              {getInitials(other.name)}
                            </span>
                          )}
                          <span
                            className={`absolute bottom-0 right-0 h-3 w-3 rounded-full ring-2 ring-white dark:ring-slate-900 ${
                              isOnline ? "bg-emerald-500" : "bg-gray-400"
                            }`}
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-baseline justify-between mb-0.5">
                            <h4 className={`text-xs font-bold truncate text-ink dark:text-white ${hasUnread ? "font-black" : ""}`}>
                              {other.name}
                            </h4>
                            <span className="text-[9px] text-muted/70 dark:text-slate-500">
                              {convo.lastMessage
                                ? new Date(convo.lastMessage.createdAt).toLocaleTimeString([], {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })
                                : ""}
                            </span>
                          </div>
                          <p className={`text-[11px] truncate ${hasUnread ? "text-ink font-bold dark:text-white" : "text-muted dark:text-slate-400"}`}>
                            {convo.lastMessage?.text || (convo.lastMessage?.attachments?.length ? "📸 Đã gửi một ảnh" : "Bắt đầu cuộc trò chuyện")}
                          </p>
                        </div>
                        {hasUnread && (
                          <span className="h-2 w-2 rounded-full bg-rust shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
              )
            )}

            {/* FRIENDS TAB */}
            {activeTab === "friends" && (
              friends.length === 0 ? (
                <div className="flex flex-col items-center justify-center text-center h-full py-12">
                  <MessageSquareX className="h-8 w-8 text-caramel/20 dark:text-slate-700 mb-2" />
                  <p className="text-xs text-muted dark:text-slate-500 italic">Chưa có bạn bè nào</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {friends.map((friend) => {
                    const isOnline = onlineUsers[friend._id] === "online" || friend.onlineStatus === "online";
                    return (
                      <div
                        key={friend._id}
                        className="w-full flex items-center justify-between p-2 rounded-xl transition hover:bg-warm/40 dark:hover:bg-slate-800/40 group"
                      >
                        <button
                          onClick={() => {
                            openChatWithUser(friend._id);
                            onClose();
                          }}
                          className="flex-1 flex items-center gap-3 text-left min-w-0"
                        >
                          <div className="relative shrink-0">
                            {friend.avatarUrl ? (
                              <img
                                src={friend.avatarUrl}
                                alt="Avatar"
                                className="h-10 w-10 rounded-full object-cover border border-sand dark:border-slate-800"
                              />
                            ) : (
                              <span className="grid h-10 w-10 place-items-center rounded-full bg-brown/10 text-brown text-sm font-bold border border-sand dark:border-slate-800">
                                {getInitials(friend.name)}
                              </span>
                            )}
                            <span
                              className={`absolute bottom-0 right-0 h-3 w-3 rounded-full ring-2 ring-white dark:ring-slate-900 ${
                                isOnline ? "bg-emerald-500" : "bg-gray-400"
                              }`}
                            />
                          </div>
                          <div className="min-w-0 flex-1">
                            <h4 className="text-xs font-bold text-ink dark:text-white truncate">{friend.name}</h4>
                            <p className="text-[10px] text-muted dark:text-slate-400 truncate">{friend.email}</p>
                          </div>
                        </button>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleUnfriend(friend._id);
                          }}
                          disabled={actionLoading === friend._id}
                          className="p-1.5 rounded-lg border border-sand bg-white text-muted hover:text-rust hover:border-rust/45 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400 dark:hover:text-red-400 transition"
                          title="Hủy kết bạn"
                        >
                          <UserMinus className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )
            )}

            {/* REQUESTS TAB */}
            {activeTab === "requests" && (
              (pendingRequests.length === 0 && sentRequests.length === 0) ? (
                <div className="flex flex-col items-center justify-center text-center h-full py-12">
                  <UserCheck className="h-8 w-8 text-caramel/20 dark:text-slate-700 mb-2" />
                  <p className="text-xs text-muted dark:text-slate-500 italic">Không có lời mời kết bạn nào</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Received */}
                  {pendingRequests.length > 0 && (
                    <div>
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-muted dark:text-slate-400 mb-2 px-1">Nhận được</h4>
                      <div className="space-y-1.5">
                        {pendingRequests.map((req) => (
                          <div
                            key={req._id}
                            className="flex items-center justify-between p-2.5 rounded-xl border border-sand/50 bg-warm/5 dark:border-slate-800 dark:bg-slate-950/20"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              {req.requester.avatarUrl ? (
                                <img
                                  src={req.requester.avatarUrl}
                                  alt="Avatar"
                                  className="h-8 w-8 rounded-full object-cover border border-sand dark:border-slate-850"
                                />
                              ) : (
                                <span className="grid h-8 w-8 place-items-center rounded-full bg-brown/10 text-brown text-xs font-bold border border-sand dark:border-slate-850">
                                  {getInitials(req.requester.name)}
                                </span>
                              )}
                              <span className="text-xs font-bold text-ink dark:text-white truncate max-w-[100px]">{req.requester.name}</span>
                            </div>
                            <div className="flex gap-1.5 shrink-0">
                              <button
                                onClick={() => handleAcceptRequest(req.requester._id)}
                                disabled={actionLoading === req.requester._id}
                                className="px-2.5 py-1 text-[10px] font-black uppercase rounded-lg bg-brown text-white hover:bg-ink dark:bg-amber-800 transition"
                              >
                                Đồng ý
                              </button>
                              <button
                                onClick={() => handleRejectRequest(req.requester._id)}
                                disabled={actionLoading === req.requester._id}
                                className="px-2.5 py-1 text-[10px] font-black uppercase rounded-lg border border-sand bg-white text-gray-600 hover:bg-warm transition dark:border-slate-700 dark:bg-slate-800 dark:text-slate-350"
                              >
                                Từ chối
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Sent */}
                  {sentRequests.length > 0 && (
                    <div>
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-muted dark:text-slate-400 mb-2 px-1">Đã gửi</h4>
                      <div className="space-y-1.5">
                        {sentRequests.map((req) => (
                          <div
                            key={req._id}
                            className="flex items-center justify-between p-2.5 rounded-xl border border-sand/50 bg-warm/5 dark:border-slate-800 dark:bg-slate-950/20"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              {req.recipient.avatarUrl ? (
                                <img
                                  src={req.recipient.avatarUrl}
                                  alt="Avatar"
                                  className="h-8 w-8 rounded-full object-cover border border-sand dark:border-slate-850"
                                />
                              ) : (
                                <span className="grid h-8 w-8 place-items-center rounded-full bg-brown/10 text-brown text-xs font-bold border border-sand dark:border-slate-850">
                                  {getInitials(req.recipient.name)}
                                </span>
                              )}
                              <span className="text-xs font-bold text-ink dark:text-white truncate max-w-[100px]">{req.recipient.name}</span>
                            </div>
                            <button
                              onClick={() => handleCancelRequest(req.recipient._id)}
                              disabled={actionLoading === req.recipient._id}
                              className="px-2.5 py-1 text-[10px] font-black uppercase rounded-lg border border-rust bg-white text-rust hover:bg-rust/5 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950/20 transition"
                            >
                              Hủy
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )
            )}

            {/* SEARCH TAB */}
            {activeTab === "search" && (
              <div className="space-y-3">
                <form onSubmit={handleSearchSubmit} className="flex gap-1.5">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Tìm tên hoặc email..."
                    className="h-9 flex-1 rounded-xl border border-sand bg-warm/10 px-3 text-xs text-ink outline-none transition focus:border-caramel focus:bg-white dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                  />
                  <button
                    type="submit"
                    className="h-9 px-3 text-xs font-bold rounded-xl bg-brown text-white hover:bg-ink dark:bg-amber-800 transition"
                  >
                    Tìm
                  </button>
                </form>

                {searchResults.length === 0 ? (
                  searchQuery && (
                    <p className="text-center py-6 text-xs text-muted dark:text-slate-500 italic">Không tìm thấy kết quả</p>
                  )
                ) : (
                  <div className="divide-y divide-sand/20 dark:divide-slate-800/80 border border-sand/50 dark:border-slate-800 rounded-xl overflow-hidden bg-warm/5">
                    {searchResults.map((user) => (
                      <div
                        key={user._id}
                        className="flex items-center justify-between p-2.5 bg-white dark:bg-slate-900 hover:bg-warm/20 dark:hover:bg-slate-800/40"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          {user.avatarUrl ? (
                            <img
                              src={user.avatarUrl}
                              alt="Avatar"
                              className="h-8 w-8 rounded-full object-cover border border-sand dark:border-slate-800"
                            />
                          ) : (
                            <span className="grid h-8 w-8 place-items-center rounded-full bg-brown/10 text-brown text-xs font-bold border border-sand dark:border-slate-800">
                              {getInitials(user.name)}
                            </span>
                          )}
                          <div className="min-w-0">
                            <h4 className="text-xs font-bold text-ink dark:text-white truncate">{user.name}</h4>
                            <p className="text-[10px] text-muted dark:text-slate-400 truncate">{user.email}</p>
                          </div>
                        </div>

                        {/* Actions */}
                        <div>
                          {user.friendshipStatus === "none" && (
                            <button
                              onClick={() => handleSendRequest(user._id)}
                              disabled={actionLoading === user._id}
                              className="p-1.5 rounded-lg bg-brown text-white hover:bg-ink dark:bg-amber-800 transition"
                              title="Kết bạn"
                            >
                              <UserPlus className="h-4 w-4" />
                            </button>
                          )}
                          {user.friendshipStatus === "pending_sent" && (
                            <button
                              onClick={() => handleCancelRequest(user._id)}
                              disabled={actionLoading === user._id}
                              className="p-1.5 rounded-lg border border-rust text-rust hover:bg-rust/5 transition"
                              title="Hủy yêu cầu"
                            >
                              <UserX className="h-4 w-4" />
                            </button>
                          )}
                          {user.friendshipStatus === "pending_received" && (
                            <div className="flex gap-1">
                              <button
                                onClick={() => handleAcceptRequest(user._id)}
                                disabled={actionLoading === user._id}
                                className="px-2 py-1 text-[10px] font-black rounded-lg bg-brown text-white hover:bg-ink"
                              >
                                Nhận
                              </button>
                              <button
                                onClick={() => handleRejectRequest(user._id)}
                                disabled={actionLoading === user._id}
                                className="px-2 py-1 text-[10px] font-black rounded-lg border border-sand text-gray-500 hover:bg-warm"
                              >
                                Hủy
                              </button>
                            </div>
                          )}
                          {user.friendshipStatus === "friends" && (
                            <div className="flex gap-1.5">
                              <button
                                onClick={() => {
                                  openChatWithUser(user._id);
                                  onClose();
                                }}
                                className="p-1.5 rounded-lg bg-brown text-white hover:bg-ink dark:bg-amber-800 transition"
                                title="Nhắn tin"
                              >
                                <MessageSquare className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleUnfriend(user._id)}
                                disabled={actionLoading === user._id}
                                className="p-1.5 rounded-lg border border-sand bg-white text-muted hover:text-rust hover:border-rust/45 dark:border-slate-850 dark:bg-slate-950 dark:text-slate-400 dark:hover:text-red-400 transition"
                                title="Hủy kết bạn"
                              >
                                <UserMinus className="h-4 w-4" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
