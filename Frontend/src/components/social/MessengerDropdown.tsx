import React, { useState, useEffect, useRef } from "react";
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
  const [searchLoading, setSearchLoading] = useState(false);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const { onlineUsers, queryUsersStatus } = useSocket();
  const { openChat, openChatWithUser } = useChatWindows();

  // Load initial tab data
  useEffect(() => {
    loadTabData();
  }, [activeTab]);

  const loadTabData = async () => {
    if (activeTab === "search") return;
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
      toast.error("Unable to load data.");
    } finally {
      setLoading(false);
    }
  };

  // Auto search suggestions as the user types
  useEffect(() => {
    const trimmed = searchQuery.trim();
    if (!trimmed) {
      setSearchResults([]);
      setSearchLoading(false);
      return;
    }

    setSearchLoading(true);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const data = await socialService.searchUsers(trimmed);
        setSearchResults(data);
      } catch (error) {
        // Fail silently
      } finally {
        setSearchLoading(false);
      }
    }, 400);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery]);

  // Search logic
  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = searchQuery.trim();
    if (!trimmed) return;

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    setSearchLoading(true);
    try {
      const data = await socialService.searchUsers(trimmed);
      setSearchResults(data);
    } catch (error) {
      toast.error("Failed to search members.");
    } finally {
      setSearchLoading(false);
    }
  };

  // Actions
  const handleSendRequest = async (userId: string) => {
    setActionLoading(userId);
    try {
      await socialService.sendFriendRequest(userId);
      toast.success("Friend request sent!");
      setSearchResults((prev) =>
        prev.map((u) => (u._id === userId ? { ...u, friendshipStatus: "pending_sent" } : u))
      );
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to send request.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancelRequest = async (userId: string) => {
    setActionLoading(userId);
    try {
      await socialService.cancelFriendRequest(userId);
      toast.success("Friend request cancelled.");
      setSearchResults((prev) =>
        prev.map((u) => (u._id === userId ? { ...u, friendshipStatus: "none" } : u))
      );
      setSentRequests((prev) => prev.filter((r) => r.recipient._id !== userId));
    } catch (error) {
      toast.error("Failed to cancel request.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleAcceptRequest = async (userId: string) => {
    setActionLoading(userId);
    try {
      await socialService.acceptFriendRequest(userId);
      toast.success("Friend request accepted!");
      setPendingRequests((prev) => prev.filter((r) => r.requester._id !== userId));
      setSearchResults((prev) =>
        prev.map((u) => (u._id === userId ? { ...u, friendshipStatus: "friends" } : u))
      );
    } catch (error) {
      toast.error("Failed to accept friend request.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectRequest = async (userId: string) => {
    setActionLoading(userId);
    try {
      await socialService.rejectFriendRequest(userId);
      toast.success("Friend request declined.");
      setPendingRequests((prev) => prev.filter((r) => r.requester._id !== userId));
      setSearchResults((prev) =>
        prev.map((u) => (u._id === userId ? { ...u, friendshipStatus: "none" } : u))
      );
    } catch (error) {
      toast.error("Failed to decline request.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleUnfriend = async (friendId: string) => {
    if (!window.confirm("Are you sure you want to unfriend this user?")) return;

    setActionLoading(friendId);
    try {
      await socialService.unfriend(friendId);
      toast.success("Unfriended successfully.");
      // Remove from friends list
      setFriends((prev) => prev.filter((f) => f._id !== friendId));
      // Update search results list if present
      setSearchResults((prev) =>
        prev.map((u) => (u._id === friendId ? { ...u, friendshipStatus: "none" } : u))
      );
    } catch (error) {
      toast.error("Failed to unfriend.");
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
            chats: "Chats",
            friends: "Friends",
            requests: "Requests",
            search: "Search",
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
                  <p className="text-xs text-muted dark:text-slate-500 italic">No messages yet</p>
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
                            {convo.lastMessage?.text || (convo.lastMessage?.attachments?.length ? "📸 Sent an image" : "Start a conversation")}
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
                  <p className="text-xs text-muted dark:text-slate-500 italic">No friends yet</p>
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
                          title="Unfriend"
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
                  <p className="text-xs text-muted dark:text-slate-500 italic">No friend requests yet</p>
                </div>
              ) : (
                <div className="space-y-5">
                  {/* Received */}
                  {pendingRequests.length > 0 && (
                    <div>
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-muted dark:text-slate-400 mb-2 px-1">Received</h4>
                      <div className="space-y-2">
                        {pendingRequests.map((req) => (
                          <div
                            key={req._id}
                            className="flex items-start gap-3 p-3 rounded-2xl border border-sand/50 bg-[#FBF9F2]/40 dark:border-slate-800 dark:bg-slate-950/20"
                          >
                            <div className="relative shrink-0 mt-0.5">
                              {req.requester.avatarUrl ? (
                                <img
                                  src={req.requester.avatarUrl}
                                  alt="Avatar"
                                  className="h-12 w-12 rounded-full object-cover border border-sand/70 dark:border-slate-800"
                                />
                              ) : (
                                <span className="grid h-12 w-12 place-items-center rounded-full bg-brown/10 text-brown text-sm font-bold border border-sand/70 dark:border-slate-800">
                                  {getInitials(req.requester.name)}
                                </span>
                              )}
                            </div>
                            <div className="min-w-0 flex-1 space-y-2">
                              <div>
                                <p className="text-xs text-ink dark:text-slate-200 leading-normal">
                                  <span className="font-bold">{req.requester.name}</span>
                                  {" "}sent you a friend request.
                                </p>
                                <p className="text-[10px] text-muted dark:text-slate-500 mt-0.5 truncate">
                                  {req.requester.email} · {req.requester.role === "user" ? "Customer" : (req.requester.role ? req.requester.role.charAt(0).toUpperCase() + req.requester.role.slice(1) : "")}
                                </p>
                              </div>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleAcceptRequest(req.requester._id)}
                                  disabled={actionLoading === req.requester._id}
                                  className="flex-1 py-2 text-xs font-bold rounded-xl bg-brown text-white hover:bg-ink dark:bg-amber-800 transition active:scale-95 disabled:opacity-50"
                                >
                                  Confirm
                                </button>
                                <button
                                  onClick={() => handleRejectRequest(req.requester._id)}
                                  disabled={actionLoading === req.requester._id}
                                  className="flex-1 py-2 text-xs font-bold rounded-xl bg-sand/35 text-ink border border-sand/65 hover:bg-sand/65 dark:bg-slate-800 dark:text-slate-350 dark:border-slate-700 transition active:scale-95 disabled:opacity-50"
                                >
                                  Delete
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Sent */}
                  {sentRequests.length > 0 && (
                    <div>
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-muted dark:text-slate-400 mb-2 px-1">Sent</h4>
                      <div className="space-y-2">
                        {sentRequests.map((req) => (
                          <div
                            key={req._id}
                            className="flex items-start gap-3 p-3 rounded-2xl border border-sand/50 bg-[#FBF9F2]/20 dark:border-slate-800 dark:bg-slate-950/10"
                          >
                            <div className="relative shrink-0 mt-0.5">
                              {req.recipient.avatarUrl ? (
                                <img
                                  src={req.recipient.avatarUrl}
                                  alt="Avatar"
                                  className="h-10 w-10 rounded-full object-cover border border-sand/70 dark:border-slate-800"
                                />
                              ) : (
                                <span className="grid h-10 w-10 place-items-center rounded-full bg-brown/10 text-brown text-xs font-bold border border-sand/70 dark:border-slate-800">
                                  {getInitials(req.recipient.name)}
                                </span>
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-xs text-ink dark:text-slate-200 leading-normal">
                                You sent a friend request to <span className="font-bold">{req.recipient.name}</span>.
                              </p>
                              <p className="text-[10px] text-muted dark:text-slate-500 mt-0.5 truncate">
                                {req.recipient.email}
                              </p>
                              <div className="flex gap-2 mt-2">
                                <button
                                  onClick={() => handleCancelRequest(req.recipient._id)}
                                  disabled={actionLoading === req.recipient._id}
                                  className="flex-1 py-1.5 text-[10px] font-bold rounded-xl border border-rust/40 bg-white text-rust hover:bg-rust/5 dark:bg-slate-800 dark:text-red-400 dark:border-red-900/30 transition active:scale-95 disabled:opacity-50"
                                >
                                  Cancel Request
                                </button>
                              </div>
                            </div>
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
                    placeholder="Search by name, email or phone..."
                    className="h-9 flex-1 rounded-xl border border-sand bg-warm/10 px-3 text-xs text-ink outline-none transition focus:border-caramel focus:bg-white dark:border-slate-800 dark:bg-slate-950 dark:text-white dark:focus:bg-slate-950"
                  />
                  <button
                    type="submit"
                    className="h-9 px-3 text-xs font-bold rounded-xl bg-brown text-white hover:bg-ink dark:bg-amber-800 transition"
                  >
                    Search
                  </button>
                </form>

                {searchLoading ? (
                  <div className="flex justify-center py-6">
                    <Loader2 className="h-5 w-5 animate-spin text-caramel dark:text-amber-600" />
                  </div>
                ) : searchResults.length === 0 ? (
                  searchQuery.trim() && (
                    <p className="text-center py-6 text-xs text-muted dark:text-slate-500 italic">No results found</p>
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
                              title="Add Friend"
                            >
                              <UserPlus className="h-4 w-4" />
                            </button>
                          )}
                          {user.friendshipStatus === "pending_sent" && (
                            <button
                              onClick={() => handleCancelRequest(user._id)}
                              disabled={actionLoading === user._id}
                              className="p-1.5 rounded-lg border border-rust text-rust hover:bg-rust/5 transition"
                              title="Cancel Request"
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
                                Accept
                              </button>
                              <button
                                onClick={() => handleRejectRequest(user._id)}
                                disabled={actionLoading === user._id}
                                className="px-2 py-1 text-[10px] font-black rounded-lg border border-sand text-gray-500 hover:bg-warm"
                              >
                                Decline
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
                                title="Message"
                              >
                                <MessageSquare className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleUnfriend(user._id)}
                                disabled={actionLoading === user._id}
                                className="p-1.5 rounded-lg border border-sand bg-white text-muted hover:text-rust hover:border-rust/45 dark:border-slate-850 dark:bg-slate-950 dark:text-slate-400 dark:hover:text-red-400 transition"
                                title="Unfriend"
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
