// SIM-TIRTA LESTARI Mobile Bottom Navigation Bar
// Thumb-zone ergonomic navigation for smartphones (Petugas Lapangan & Pengurus di HP)

import React from 'react';
import { Home, Gauge, CreditCard, AlertTriangle, Users, Menu } from 'lucide-react';
import { UserRole } from '../types';
import { AppStorage } from '../services/storage';

interface MobileBottomNavProps {
  activeView: string;
  onNavigate: (view: string) => void;
  onOpenMenu: () => void;
  userRole: UserRole;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeView,
  onNavigate,
  onOpenMenu,
  userRole,
}) => {
  const candidateItems = [
    {
      id: 'dashboard',
      label: 'Beranda',
      icon: <Home className="w-5 h-5" />,
    },
    {
      id: 'meters',
      label: 'Catat Meter',
      icon: <Gauge className="w-5 h-5" />,
    },
    {
      id: 'payments',
      label: 'Kasir',
      icon: <CreditCard className="w-5 h-5" />,
    },
    {
      id: 'customers',
      label: 'Warga',
      icon: <Users className="w-5 h-5" />,
    },
    {
      id: 'arrears',
      label: 'Tunggakan',
      icon: <AlertTriangle className="w-5 h-5" />,
    },
    {
      id: 'complaints',
      label: 'Aduan',
      icon: <AlertTriangle className="w-5 h-5" />,
    },
  ];

  // Filter based on role permissions (max 4 primary shortcuts + 1 menu button)
  const navItems = candidateItems
    .filter((item) => AppStorage.hasPermission(userRole, item.id))
    .slice(0, 4);

  return (
    <nav
      aria-label="Navigasi Bawah Ponsel"
      className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/90 shadow-[0_-4px_16px_rgba(0,0,0,0.06)] px-2 py-1.5 transition-all select-none"
    >
      <div className="max-w-md mx-auto flex items-center justify-around">
        {navItems.map((item) => {
          const isActive = activeView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`flex-1 min-h-[48px] py-1 px-1 flex flex-col items-center justify-center rounded-xl transition-all cursor-pointer active:scale-95 ${
                isActive
                  ? 'text-sky-700 font-extrabold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <div
                className={`p-1 rounded-xl transition-colors ${
                  isActive ? 'bg-sky-100 text-sky-700' : 'text-slate-500'
                }`}
              >
                {item.icon}
              </div>
              <span className="text-[11px] leading-tight tracking-tight mt-0.5 truncate max-w-[68px]">
                {item.label}
              </span>
            </button>
          );
        })}

        {/* Tab Menu Lengkap (Membuka Drawer Sidebar) */}
        <button
          onClick={onOpenMenu}
          className="flex-1 min-h-[48px] py-1 px-1 flex flex-col items-center justify-center rounded-xl text-slate-500 hover:text-slate-800 active:scale-95 transition-all cursor-pointer"
        >
          <div className="p-1 rounded-xl bg-slate-100 text-slate-600">
            <Menu className="w-5 h-5" />
          </div>
          <span className="text-[11px] leading-tight tracking-tight mt-0.5">
            Semua Menu
          </span>
        </button>
      </div>
    </nav>
  );
};
