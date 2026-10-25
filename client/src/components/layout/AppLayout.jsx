import React, { useState } from 'react';
import { Outlet } from 'react-router';
import { Drawer } from 'antd';
import Sidebar from './Sidebar';
import Header from './Header';
import AIChatDrawer from '../ai/AIChatDrawer';
import ChangePasswordModal from '../../pages/auth/ChangePasswordModal';
import { useAuth } from '../../contexts/AuthContext';

export const AppLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);

  const { mustChangePassword } = useAuth();

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      {/* Desktop Sidebar */}
      <div className="hidden md:flex shrink-0">
        <Sidebar collapsed={collapsed} />
      </div>

      {/* Mobile Drawer Sidebar */}
      <Drawer
        placement="left"
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        width={260}
        bodyStyle={{ padding: 0 }}
        headerStyle={{ display: 'none' }}
      >
        <Sidebar collapsed={false} onCloseMobile={() => setMobileOpen(false)} />
      </Drawer>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header
          onToggleSidebar={() => setCollapsed(!collapsed)}
          onOpenMobile={() => setMobileOpen(true)}
          onOpenAI={() => setAiOpen(true)}
          onOpenChangePassword={() => setPasswordModalOpen(true)}
        />

        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 bg-[#F8FAFC]">
          <div className="max-w-7xl mx-auto space-y-6">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Global AI Assistant Drawer */}
      <AIChatDrawer open={aiOpen} onClose={() => setAiOpen(false)} />

      {/* Change Password Modal (Forced or Voluntary) */}
      <ChangePasswordModal
        open={passwordModalOpen || mustChangePassword}
        onClose={() => setPasswordModalOpen(false)}
        isForced={mustChangePassword}
      />
    </div>
  );
};

export default AppLayout;
