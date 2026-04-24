import { useState, useEffect } from 'react';
import { Bell, Check, Trash2, AlertCircle, Info, CheckCircle, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import apiClient from '@/utils/api.service';
import toast from 'react-hot-toast';

type Notification = {
  _id: string;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "error" | "refund_request";
  isRead: boolean;
  createdAt: string;
};

export const NotificationCenter = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = async () => {
    try {
      const response = await apiClient.get('/admin/notifications');
      const data = response.data.notifications;
      setNotifications(data);
      setUnreadCount(data.filter((n: Notification) => !n.isRead).length);
    } catch (error) {
      console.error("Failed to fetch notifications", error);
    }
  };

  useEffect(() => {
    fetchNotifications();
    // Poll every 60 seconds
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, []);

  const markAsRead = async (id: string) => {
    try {
      await apiClient.patch(`/admin/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      toast.error("Action failed");
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      await apiClient.delete(`/admin/notifications/${id}`);
      setNotifications(prev => prev.filter(n => n._id !== id));
      if (!notifications.find(n => n._id === id)?.isRead) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
      toast.success("Notification removed");
    } catch (error) {
      toast.error("Action failed");
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'refund_request':
      case 'warning': return <AlertCircle className="w-5 h-5 text-amber-500" />;
      case 'error': return <X className="w-5 h-5 text-rose-500" />;
      case 'success': return <CheckCircle className="w-5 h-5 text-emerald-500" />;
      default: return <Info className="w-5 h-5 text-sky-500" />;
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-xl bg-white border border-sand hover:bg-warm transition-all group"
      >
        <Bell className="w-5 h-5 text-ink group-hover:scale-110 transition-transform" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white animate-pulse">
            {unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute right-0 mt-4 w-96 bg-[#FBF9F2] border border-sand shadow-2xl rounded-[2.5rem] z-50 overflow-hidden"
            >
              <div className="p-6 border-b border-sand bg-white/50 backdrop-blur-md flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-black uppercase tracking-widest text-ink">Notifications</h3>
                  <p className="text-[10px] font-bold text-muted mt-1">{unreadCount} unread alerts</p>
                </div>
                <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-warm rounded-full transition">
                  <X className="w-4 h-4 text-muted" />
                </button>
              </div>

              <div className="max-h-[32rem] overflow-y-auto custom-scrollbar">
                {notifications.length === 0 ? (
                  <div className="py-12 text-center">
                    <p className="text-xs font-bold text-muted uppercase tracking-widest italic">All clear!</p>
                  </div>
                ) : (
                  <div className="divide-y divide-sand/30">
                    {notifications.map((notif) => (
                      <div
                        key={notif._id}
                        className={`p-6 transition-colors hover:bg-warm/40 group relative ${!notif.isRead ? 'bg-white' : 'opacity-60'}`}
                      >
                        {!notif.isRead && (
                          <div className="absolute left-2 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-sky-500 rounded-full" />
                        )}
                        <div className="flex gap-4">
                          <div className="mt-1">{getIcon(notif.type)}</div>
                          <div className="flex-1 min-w-0">
                            <p className={`text-xs font-black mb-1 ${notif.type === 'refund_request' ? 'text-amber-700' : 'text-ink'}`}>
                              {notif.title}
                            </p>
                            <p className="text-[11px] text-muted font-medium leading-relaxed">
                              {notif.message}
                            </p>
                            <p className="text-[9px] font-bold text-muted/40 uppercase tracking-widest mt-2">
                              {new Date(notif.createdAt).toLocaleString()}
                            </p>
                          </div>
                        </div>

                        <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          {!notif.isRead && (
                            <button
                              onClick={() => markAsRead(notif._id)}
                              className="p-2 bg-white rounded-full shadow-sm border border-sand hover:bg-sky-50 hover:text-sky-600 transition"
                              title="Mark as read"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            onClick={() => deleteNotification(notif._id)}
                            className="p-2 bg-white rounded-full shadow-sm border border-sand hover:bg-rose-50 hover:text-rose-600 transition"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
