"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { useState, useEffect } from "react";
import { api } from "@/lib/api";

interface NavLink {
  label: string;
  href: string;
}

interface NavBarProps {
  portalName: string;
  variant?: "light" | "dark";
  links?: NavLink[];
  showProfile?: boolean;
}

interface Notification {
  id: string;
  message: string;
  is_read: boolean;
  created_at: string;
  notification_type?: string;
}

const HouseIcon = ({ color }: { color?: string }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </svg>
);

const BellIcon = ({ color, hasUnread }: { color?: string, hasUnread?: boolean }) => (
  <div className="relative">
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
      <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
    </svg>
    {hasUnread && <span className="absolute -top-1 -right-1 block h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white"></span>}
  </div>
);

function NotificationDropdown({ 
  notifications, 
  onMarkRead, 
  onMarkAllRead,
  isOpen, 
  setIsOpen 
}: { 
  notifications: Notification[], 
  onMarkRead: (id: string) => void,
  onMarkAllRead: () => void,
  isOpen: boolean, 
  setIsOpen: (open: boolean) => void 
}) {
  if (!isOpen) return null;
  return (
    <div className="absolute top-12 right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-50 overflow-hidden flex flex-col max-h-[400px]">
      <div className="px-4 py-3 border-b border-gray-100 flex justify-between items-center bg-gray-50">
        <h3 className="font-bold text-[14px] text-gray-800">Notifications</h3>
        <button onClick={onMarkAllRead} className="text-[12px] text-blue-600 hover:underline">Mark all read</button>
      </div>
      <div className="overflow-y-auto flex-1">
        {notifications.length === 0 ? (
          <div className="p-4 text-center text-sm text-gray-500">No notifications</div>
        ) : (
          notifications.map(n => (
            <div 
              key={n.id} 
              className={`p-3 border-b border-gray-50 text-[13px] ${n.is_read ? 'bg-white text-gray-600' : 'bg-blue-50 text-gray-900 cursor-pointer hover:bg-blue-100'}`}
              onClick={() => { if (!n.is_read) onMarkRead(n.id); }}
            >
              <p>{n.message}</p>
              <span className="text-[11px] text-gray-400 mt-1 block">{new Date(n.created_at).toLocaleString()}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default function NavBar({ portalName, variant = "light", links, showProfile }: NavBarProps) {
  const router = useRouter();
  const logout = useAuthStore((s) => s.logout);
  const token = useAuthStore((s) => s.token);
  const isAuthenticated = !!token;
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);

  const fetchNotifications = async () => {
    if (!isAuthenticated) return;
    try {
      const res = await api.get('/notifications/');
      setNotifications(res.data.results || res.data || []);
    } catch (e) { console.error('Failed to fetch notifications'); }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  const handleMarkRead = async (id: string) => {
    try {
      await api.post(`/notifications/${id}/mark_read/`);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    } catch (e) {}
  };

  const handleMarkAllRead = async () => {
    try {
      await api.post(`/notifications/mark_all_read/`);
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch (e) {}
  };

  const hasUnread = notifications.some(n => !n.is_read);

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  const notifColor = variant === "dark" ? "white" : "#4B5563";

  return (
    <nav className={`h-14 flex items-center justify-between px-6 shrink-0 sticky top-0 z-30 ${variant === "dark" ? "bg-[#1F2937]" : "bg-white border-b border-gray-200"}`}>
      <div className="flex items-center gap-3">
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <HouseIcon color={variant === "dark" ? "white" : "#2563EB"} />
          <span className={`text-[19px] font-bold tracking-tight ${variant === "dark" ? "text-white" : "text-[#111827]"}`}>IDHRTS</span>
        </Link>
        {variant === "dark" && (
          <>
            <span className="text-gray-500 mx-1">|</span>
            <span className="text-[13px] text-gray-300 font-medium">{portalName}</span>
          </>
        )}
        {variant === "light" && (
          links && links.length > 0 ? (
            <div className="hidden md:flex items-center gap-6 ml-6">
              {links.map((l) => (
                <Link key={l.href} href={l.href} className="text-[14px] text-gray-600 font-medium hover:text-gray-900 transition-colors">
                  {l.label}
                </Link>
              ))}
            </div>
          ) : (
            <span className="text-[13px] font-medium text-gray-500 bg-gray-100 rounded-full px-3 py-1 ml-4">
              {portalName}
            </span>
          )
        )}
      </div>
      <div className="flex items-center gap-4">
        {/* Notifications */}
        <div className="relative flex items-center">
          <button onClick={() => setShowNotifications(!showNotifications)} className="focus:outline-none p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
            <BellIcon color={notifColor} hasUnread={hasUnread} />
          </button>
          <NotificationDropdown 
            notifications={notifications} 
            onMarkRead={handleMarkRead} 
            onMarkAllRead={handleMarkAllRead}
            isOpen={showNotifications} 
            setIsOpen={setShowNotifications} 
          />
        </div>

        {variant === "dark" ? (
          <>
            <div className="w-8 h-8 rounded-full bg-[#2563EB] flex items-center justify-center text-white text-[13px] font-bold select-none">
              W
            </div>
            <button
              onClick={handleLogout}
              className="text-[13px] font-medium text-white border border-white/40 rounded px-3 py-1.5 hover:bg-white/10 transition-colors"
            >
              Logout
            </button>
          </>
        ) : (
          <>
            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 shrink-0">
              <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </div>
            {showProfile ? (
              <span className="text-[14px] font-medium text-gray-700 flex items-center gap-1 cursor-pointer hover:text-gray-900">
                Profile
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>
              </span>
            ) : (
              <button
                onClick={handleLogout}
                className="text-[13px] font-medium text-gray-700 border border-gray-300 rounded px-3 py-1.5 hover:bg-gray-50 transition-colors"
              >
                Logout
              </button>
            )}
          </>
        )}
      </div>
    </nav>
  );
}
