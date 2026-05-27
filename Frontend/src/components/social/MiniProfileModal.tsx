import React, { useEffect, useState } from "react";
import {
  MessageSquare,
  UserPlus,
  UserMinus,
  UserCheck,
  UserX,
  Loader2,
  X,
  Phone,
  Mail,
  User,
  Shield,
  Briefcase,
  Stethoscope,
} from "lucide-react";
import { useChatWindows } from "../../context/ChatWindowContext";
import { socialService } from "../../services/social.service";
import { toast } from "react-hot-toast";
import { motion } from "framer-motion";

interface MiniProfileModalProps {
  userId: string | null;
  onClose: () => void;
}

interface UserProfile {
  _id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  role: string;
  description?: string;
  phone?: string;
}

export const MiniProfileModal: React.FC<MiniProfileModalProps> = ({
  userId,
  onClose,
}) => {
  const { openChatWithUser } = useChatWindows();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [friendshipStatus, setFriendshipStatus] = useState<
    "none" | "pending_sent" | "pending_received" | "friends" | "self"
  >("none");
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const isLoggedIn = Boolean(localStorage.getItem("token"));

  useEffect(() => {
    if (!userId) {
      setProfile(null);
      return;
    }

    const fetchProfile = async () => {
      try {
        setLoading(true);
        const data = await socialService.getUserProfile(userId);
        setProfile(data.user);
        setFriendshipStatus(data.friendshipStatus);
      } catch (error: any) {
        toast.error("Không thể tải thông tin hồ sơ.");
        onClose();
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [userId]);

  if (!userId) return null;

  const handleSendRequest = async () => {
    if (!isLoggedIn) {
      toast.error("Vui lòng đăng nhập để thực hiện hành động này.");
      return;
    }
    try {
      setActionLoading(true);
      await socialService.sendFriendRequest(userId);
      setFriendshipStatus("pending_sent");
      toast.success("Đã gửi lời mời kết bạn!");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Không thể gửi lời mời kết bạn.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelRequest = async () => {
    try {
      setActionLoading(true);
      await socialService.cancelFriendRequest(userId);
      setFriendshipStatus("none");
      toast.success("Đã hủy lời mời kết bạn.");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Không thể hủy lời mời.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleAcceptRequest = async () => {
    try {
      setActionLoading(true);
      await socialService.acceptFriendRequest(userId);
      setFriendshipStatus("friends");
      toast.success("Hai bạn đã trở thành bạn bè!");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Không thể chấp nhận lời mời.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectRequest = async () => {
    try {
      setActionLoading(true);
      await socialService.rejectFriendRequest(userId);
      setFriendshipStatus("none");
      toast.success("Đã từ chối lời mời kết bạn.");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Không thể từ chối lời mời.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleUnfriend = async () => {
    if (!window.confirm(`Bạn có chắc chắn muốn hủy kết bạn với ${profile?.name}?`)) {
      return;
    }
    try {
      setActionLoading(true);
      await socialService.unfriend(userId);
      setFriendshipStatus("none");
      toast.success("Đã hủy kết bạn.");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Không thể hủy kết bạn.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleMessageClick = () => {
    if (!isLoggedIn) {
      toast.error("Vui lòng đăng nhập để nhắn tin.");
      return;
    }
    openChatWithUser(userId);
    onClose();
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "admin":
        return (
          <span className="flex items-center gap-1 px-3 py-1 bg-red-50 text-red-600 border border-red-200 text-[10px] font-bold uppercase tracking-wider rounded-full shadow-sm">
            <Shield className="w-3 h-3" />
            Admin
          </span>
        );
      case "shop":
        return (
          <span className="flex items-center gap-1 px-3 py-1 bg-amber-50 text-amber-600 border border-amber-200 text-[10px] font-bold uppercase tracking-wider rounded-full shadow-sm">
            <Briefcase className="w-3 h-3" />
            Cửa hàng
          </span>
        );
      case "service_provider":
        return (
          <span className="flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-600 border border-blue-200 text-[10px] font-bold uppercase tracking-wider rounded-full shadow-sm">
            <Briefcase className="w-3 h-3" />
            Dịch vụ
          </span>
        );
      case "veterinarian":
        return (
          <span className="flex items-center gap-1 px-3 py-1 bg-emerald-50 text-emerald-600 border border-emerald-200 text-[10px] font-bold uppercase tracking-wider rounded-full shadow-sm">
            <Stethoscope className="w-3 h-3" />
            Bác sĩ thú y
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1 px-3 py-1 bg-sand/35 text-ink/75 border border-sand/65 text-[10px] font-bold uppercase tracking-wider rounded-full shadow-sm">
            <User className="w-3 h-3" />
            Chủ nuôi
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-ink/40 backdrop-blur-sm"
      />

      {/* Card Content */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-sm overflow-hidden bg-white/95 backdrop-blur-md border border-sand/40 shadow-2xl rounded-[2.5rem] p-6 z-10 flex flex-col items-center"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 hover:bg-warm rounded-full text-muted hover:text-ink transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {loading ? (
          <div className="py-16 flex flex-col items-center justify-center">
            <Loader2 className="w-10 h-10 animate-spin text-caramel mb-4" />
            <p className="text-xs font-semibold text-muted italic">Đang tải hồ sơ...</p>
          </div>
        ) : (
          profile && (
            <>
              {/* Profile Avatar */}
              <div className="relative mt-4">
                <div className="w-24 h-24 rounded-3xl bg-warm overflow-hidden border-[4px] border-white shadow-lg ring-1 ring-sand/40">
                  {profile.avatarUrl ? (
                    <img
                      src={profile.avatarUrl}
                      alt={profile.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-caramel-dark font-serif text-3xl font-bold italic">
                      {profile.name[0].toUpperCase()}
                    </div>
                  )}
                </div>
              </div>

              {/* User Name & Role */}
              <h3 className="font-serif text-2xl font-bold italic text-ink mt-4 text-center">
                {profile.name}
              </h3>
              <div className="mt-2">{getRoleBadge(profile.role)}</div>

              {/* Bio Description */}
              <p className="text-muted/70 text-xs leading-relaxed font-medium italic text-center max-w-xs mt-4 px-2 min-h-[3rem] line-clamp-3">
                {profile.description
                  ? `"${profile.description}"`
                  : "Chưa có lời giới thiệu bản thân."}
              </p>

              {/* Phone & Email contact info (only if friends or self) */}
              {(friendshipStatus === "friends" || friendshipStatus === "self") && (
                <div className="w-full mt-4 p-3 bg-[#FBF9F2] rounded-2xl border border-sand/30 text-left text-xs font-semibold space-y-2 text-ink/75">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-muted/50" />
                    <span>{profile.email}</span>
                  </div>
                  {profile.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-muted/50" />
                      <span>{profile.phone}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="w-full mt-6 flex flex-col gap-2.5">
                {!isLoggedIn ? (
                  <div className="text-center p-3 bg-amber-50 rounded-2xl border border-amber-100">
                    <p className="text-[11px] font-bold text-amber-700">
                      Vui lòng đăng nhập để bắt đầu trò chuyện và kết bạn.
                    </p>
                  </div>
                ) : (
                  <>
                    {/* Friendship actions */}
                    {friendshipStatus === "self" && (
                      <div className="text-center p-2.5 bg-sand/15 rounded-2xl border border-sand/40">
                        <span className="text-[11px] font-bold text-muted uppercase tracking-wider">
                          Hồ sơ của bạn
                        </span>
                      </div>
                    )}

                    {friendshipStatus === "none" && (
                      <button
                        onClick={handleSendRequest}
                        disabled={actionLoading}
                        className="w-full py-3 bg-ink hover:bg-caramel text-white text-xs font-bold rounded-2xl transition-all shadow-xl shadow-ink/5 flex items-center justify-center gap-2 active:scale-98 disabled:opacity-50"
                      >
                        {actionLoading ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <UserPlus className="w-4 h-4" />
                        )}
                        Thêm bạn bè
                      </button>
                    )}

                    {friendshipStatus === "pending_sent" && (
                      <button
                        onClick={handleCancelRequest}
                        disabled={actionLoading}
                        className="w-full py-3 border border-sand hover:bg-red-50 text-red-600 hover:border-red-200 text-xs font-bold rounded-2xl transition-all flex items-center justify-center gap-2 active:scale-98 disabled:opacity-50"
                      >
                        {actionLoading ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <UserMinus className="w-4 h-4" />
                        )}
                        Hủy yêu cầu kết bạn
                      </button>
                    )}

                    {friendshipStatus === "pending_received" && (
                      <div className="flex gap-2 w-full">
                        <button
                          onClick={handleAcceptRequest}
                          disabled={actionLoading}
                          className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-2xl transition-all shadow-md flex items-center justify-center gap-2 active:scale-98 disabled:opacity-50"
                        >
                          {actionLoading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <UserCheck className="w-4 h-4" />
                          )}
                          Đồng ý
                        </button>
                        <button
                          onClick={handleRejectRequest}
                          disabled={actionLoading}
                          className="flex-1 py-3 border border-sand hover:bg-red-50 text-red-600 hover:border-red-200 text-xs font-bold rounded-2xl transition-all flex items-center justify-center gap-2 active:scale-98 disabled:opacity-50"
                        >
                          <UserX className="w-4 h-4" />
                          Từ chối
                        </button>
                      </div>
                    )}

                    {friendshipStatus === "friends" && (
                      <div className="flex gap-2 w-full">
                        <div className="flex-1 py-3 bg-emerald-50 text-emerald-600 border border-emerald-200 text-xs font-bold rounded-2xl flex items-center justify-center gap-2">
                          <UserCheck className="w-4 h-4" />
                          Bạn bè
                        </div>
                        <button
                          onClick={handleUnfriend}
                          disabled={actionLoading}
                          className="px-4 py-3 border border-sand hover:bg-red-50 text-red-600 hover:border-red-200 text-xs font-bold rounded-2xl transition-all flex items-center justify-center active:scale-98 disabled:opacity-50"
                          title="Hủy kết bạn"
                        >
                          {actionLoading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <UserX className="w-4.5 h-4.5" />
                          )}
                        </button>
                      </div>
                    )}

                    {/* Chat messaging button */}
                    {friendshipStatus !== "self" && (
                      <button
                        onClick={handleMessageClick}
                        className="w-full py-3 bg-warm text-caramel hover:bg-ink hover:text-white text-xs font-bold rounded-2xl transition-all shadow-sm flex items-center justify-center gap-2 active:scale-98"
                      >
                        <MessageSquare className="w-4 h-4" />
                        Nhắn tin
                      </button>
                    )}
                  </>
                )}
              </div>
            </>
          )
        )}
      </motion.div>
    </div>
  );
};
