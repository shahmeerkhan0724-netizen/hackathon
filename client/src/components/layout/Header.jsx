import React, { useState, useEffect } from 'react';
import { Dropdown, Badge, Button, Avatar } from 'antd';
import { useNavigate } from 'react-router';
import {
  FiMenu,
  FiBell,
  FiCpu,
  FiLogOut,
  FiKey,
  FiUser,
  FiChevronDown,
} from 'react-icons/fi';
import { useAuth } from '../../contexts/AuthContext';
import communicationsApi from '../../api/communications.api';

export const Header = ({ onToggleSidebar, onOpenMobile, onOpenAI, onOpenChangePassword }) => {
  const { user, role, employee, logout } = useAuth();
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);

  // Poll or fetch unread notifications count
  const fetchUnreadCount = async () => {
    try {
      const res = await communicationsApi.getNotifications({ isRead: false, limit: 1 });
      setUnreadCount(res?.data?.pagination?.totalItems || 0);
    } catch {
      // Ignore background notification fetch errors
    }
  };

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 60000); // 1 min poll
    return () => clearInterval(interval);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const displayName = employee?.fullName || user?.email?.split('@')[0] || 'User';
  const displayEmail = user?.email || '';

  const userMenuItems = {
    items: [
      {
        key: 'header-info',
        disabled: true,
        label: (
          <div className="py-1 px-1 cursor-default">
            <p className="font-semibold text-slate-900 text-sm">{displayName}</p>
            <p className="text-xs text-slate-500 truncate max-w-[200px]">{displayEmail}</p>
            <span className="inline-block mt-1 px-2 py-0.5 bg-indigo-50 text-indigo-700 text-[10px] font-bold rounded-full">
              {role}
            </span>
          </div>
        ),
      },
      { type: 'divider' },
      ...(role === 'EMPLOYEE'
        ? [
            {
              key: 'my-profile',
              icon: <FiUser className="w-4 h-4 text-slate-600" />,
              label: 'My Profile',
              onClick: () => navigate('/profile/me'),
            },
          ]
        : []),
      {
        key: 'change-password',
        icon: <FiKey className="w-4 h-4 text-slate-600" />,
        label: 'Change Password',
        onClick: onOpenChangePassword,
      },
      { type: 'divider' },
      {
        key: 'logout',
        icon: <FiLogOut className="w-4 h-4 text-rose-600" />,
        label: <span className="text-rose-600 font-medium">Log out</span>,
        onClick: handleLogout,
      },
    ],
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-4 md:px-6 flex items-center justify-between sticky top-0 z-30 shadow-xs">
      {/* Left section: toggle button & branding on mobile */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="hidden md:flex p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          title="Toggle Sidebar"
        >
          <FiMenu className="w-5 h-5" />
        </button>

        <button
          onClick={onOpenMobile}
          className="md:hidden p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          title="Open Menu"
        >
          <FiMenu className="w-5 h-5" />
        </button>

        <div className="hidden sm:block">
          <span className="text-xs font-semibold text-indigo-600 tracking-wide uppercase">
            Human Capital Management
          </span>
        </div>
      </div>

      {/* Right controls: Ask AI, Notifications, User Profile */}
      <div className="flex items-center gap-3">
        {/* Groq AI Button */}
        <Button
          type="primary"
          onClick={onOpenAI}
          icon={<FiCpu className="w-4 h-4" />}
          className="bg-indigo-600 hover:bg-indigo-700 flex items-center gap-1.5 shadow-sm text-xs font-semibold"
        >
          <span className="hidden sm:inline">Ask AI</span>
        </Button>

        {/* Notifications Icon with Badge */}
        <button
          onClick={() => navigate('/notifications')}
          className="relative p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          title="Notifications"
        >
          <Badge count={unreadCount} overflowCount={99} size="small" offset={[2, -2]}>
            <FiBell className="w-5 h-5 text-slate-600" />
          </Badge>
        </button>

        <div className="h-6 w-px bg-slate-200 mx-1" />

        {/* User Dropdown */}
        <Dropdown menu={userMenuItems} trigger={['click']} placement="bottomRight">
          <button className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-50 transition-colors text-left">
            <Avatar className="bg-indigo-600 text-white font-bold shrink-0">
              {displayName.charAt(0).toUpperCase()}
            </Avatar>
            <div className="hidden md:block max-w-[120px]">
              <p className="text-xs font-semibold text-slate-900 truncate">{displayName}</p>
              <p className="text-[10px] text-slate-500 font-medium truncate">{role}</p>
            </div>
            <FiChevronDown className="w-3.5 h-3.5 text-slate-400 hidden md:block" />
          </button>
        </Dropdown>
      </div>
    </header>
  );
};

export default Header;
