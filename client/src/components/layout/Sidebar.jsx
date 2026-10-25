import React from 'react';
import { NavLink } from 'react-router';
import {
  FiHome,
  FiUsers,
  FiClock,
  FiCalendar,
  FiDollarSign,
  FiSettings,
  FiSliders,
  FiBell,
  FiShield,
  FiUser,
  FiCpu,
} from 'react-icons/fi';
import { useAuth } from '../../contexts/AuthContext';

export const Sidebar = ({ collapsed, onCloseMobile }) => {
  const { role, company } = useAuth();

  const getNavLinks = () => {
    switch (role) {
      case 'ADMIN':
        return [
          { to: '/dashboard/admin', label: 'Dashboard', icon: FiHome },
          { to: '/admin/employees', label: 'Employees', icon: FiUsers },
          { to: '/admin/attendance', label: 'Attendance Board', icon: FiClock },
          { to: '/admin/leaves', label: 'Leave Requests', icon: FiCalendar },
          { to: '/admin/payroll', label: 'Payroll & Salary', icon: FiDollarSign },
          { to: '/admin/organization', label: 'Organization Structure', icon: FiSliders },
          { to: '/admin/company', label: 'Company Settings', icon: FiSettings },
          { to: '/announcements', label: 'Announcements', icon: FiBell },
          { to: '/admin/audit', label: 'Audit Logs', icon: FiShield },
        ];
      case 'HR':
        return [
          { to: '/dashboard/hr', label: 'Dashboard', icon: FiHome },
          { to: '/hr/employees', label: 'Employees Directory', icon: FiUsers },
          { to: '/hr/attendance', label: 'Attendance Board', icon: FiClock },
          { to: '/hr/leaves', label: 'Leave Approvals', icon: FiCalendar },
          { to: '/hr/payroll', label: 'Payroll Management', icon: FiDollarSign },
          { to: '/announcements', label: 'Announcements', icon: FiBell },
        ];
      case 'EMPLOYEE':
        return [
          { to: '/dashboard/me', label: 'My Dashboard', icon: FiHome },
          { to: '/attendance/me', label: 'My Attendance', icon: FiClock },
          { to: '/leaves/me', label: 'My Leaves', icon: FiCalendar },
          { to: '/payroll/me', label: 'My Payslips', icon: FiDollarSign },
          { to: '/profile/me', label: 'My Profile 360', icon: FiUser },
          { to: '/announcements', label: 'Announcements', icon: FiBell },
        ];
      default:
        return [];
    }
  };

  const links = getNavLinks();

  return (
    <aside
      className={`bg-slate-900 text-slate-300 flex flex-col h-full border-r border-slate-800 transition-all duration-300 ease-in-out ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Brand Header */}
      <div className="h-16 flex items-center px-4 border-b border-slate-800 shrink-0">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 flex items-center justify-center shrink-0 shadow-md shadow-indigo-900/50">
            <span className="font-black text-lg text-white tracking-wider">H</span>
          </div>
          {!collapsed && (
            <div className="truncate">
              <h1 className="font-bold text-white text-base tracking-tight leading-none">HCM Lite</h1>
              <p className="text-[11px] text-slate-400 font-medium truncate mt-1">
                {company?.name || 'Human Capital'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation Menu */}
      <div className="flex-1 py-4 px-3 overflow-y-auto space-y-1 scrollbar-thin scrollbar-thumb-slate-700">
        <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
          {!collapsed && (role === 'ADMIN' ? 'Administration' : role === 'HR' ? 'HR Operations' : 'Self Service')}
        </div>

        {links.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onCloseMobile}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-950 font-semibold'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                } ${collapsed ? 'justify-center px-0' : ''}`
              }
              title={collapsed ? item.label : undefined}
            >
              <Icon className="w-5 h-5 shrink-0" />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </NavLink>
          );
        })}
      </div>

      {/* Footer Role Indicator */}
      <div className="p-3 border-t border-slate-800 shrink-0 bg-slate-950/40">
        <div className={`flex items-center gap-2.5 ${collapsed ? 'justify-center' : 'px-2'}`}>
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0 animate-pulse" />
          {!collapsed && (
            <div className="text-xs truncate">
              <span className="text-slate-400">Role: </span>
              <span className="font-semibold text-white">{role}</span>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
