// SIM-TIRTA LESTARI Sidebar Navigation Component
// Enterprise executive navigation with micro-interactions, high accessibility, and clean typography

import React from 'react';
import { UserRole } from '../types';
import { AppStorage } from '../services/storage';
import {
  Home,
  Users,
  Gauge,
  FileText,
  CreditCard,
  Receipt,
  AlertTriangle,
  MessageSquareWarning,
  Wrench,
  ArrowDownLeft,
  ArrowUpRight,
  Landmark,
  BarChart3,
  Box,
  Megaphone,
  Globe,
  UserCog,
  Sliders,
  History,
  Activity,
  CheckCircle2,
  Code2,
  X,
  Droplets,
  Shield,
  Layers,
} from 'lucide-react';

interface SidebarProps {
  activeView: string;
  onNavigate: (view: string) => void;
  userRole: UserRole;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

interface MenuItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  allowedRoles: UserRole[];
  badge?: string;
  badgeColor?: string;
}

interface MenuSection {
  title: string;
  items: MenuItem[];
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeView,
  onNavigate,
  userRole,
  isMobileOpen = false,
  onCloseMobile,
}) => {
  const sections: MenuSection[] = [
    {
      title: 'UTAMA',
      items: [
        {
          id: 'dashboard',
          label: 'Dashboard Pengurus',
          icon: <Home className="w-4 h-4" />,
          allowedRoles: ['ADMIN', 'PENGURUS', 'PETUGAS'],
        },
      ],
    },
    {
      title: 'PELAYANAN AIR',
      items: [
        {
          id: 'customers',
          label: 'Data Pelanggan (150 KK)',
          icon: <Users className="w-4 h-4" />,
          allowedRoles: ['ADMIN', 'PENGURUS'],
        },
        {
          id: 'meters',
          label: 'Pencatatan Meter Air',
          icon: <Gauge className="w-4 h-4" />,
          allowedRoles: ['ADMIN', 'PENGURUS', 'PETUGAS'],
        },
        {
          id: 'bills',
          label: 'Tagihan & Rekening',
          icon: <FileText className="w-4 h-4" />,
          allowedRoles: ['ADMIN', 'PENGURUS'],
        },
        {
          id: 'payments',
          label: 'Kasir & Pembayaran',
          icon: <CreditCard className="w-4 h-4" />,
          allowedRoles: ['ADMIN', 'PENGURUS'],
        },
        {
          id: 'receipts',
          label: 'Kwitansi Pembayaran',
          icon: <Receipt className="w-4 h-4" />,
          allowedRoles: ['ADMIN', 'PENGURUS'],
        },
        {
          id: 'arrears',
          label: 'Tunggakan Rekening',
          icon: <AlertTriangle className="w-4 h-4" />,
          allowedRoles: ['ADMIN', 'PENGURUS'],
          badge: 'WA Follow-Up',
          badgeColor: 'bg-rose-500/20 text-rose-300 border border-rose-500/30',
        },
      ],
    },
    {
      title: 'LAYANAN WARGA & JARINGAN',
      items: [
        {
          id: 'complaints',
          label: 'Pengaduan Layanan Air',
          icon: <MessageSquareWarning className="w-4 h-4" />,
          allowedRoles: ['ADMIN', 'PENGURUS', 'PETUGAS'],
        },
        {
          id: 'maintenance',
          label: 'Pemeliharaan Jaringan',
          icon: <Wrench className="w-4 h-4" />,
          allowedRoles: ['ADMIN', 'PENGURUS', 'PETUGAS'],
        },
      ],
    },
    {
      title: 'KEUANGAN & KAS',
      items: [
        {
          id: 'cashin',
          label: 'Buku Kas Masuk',
          icon: <ArrowDownLeft className="w-4 h-4 text-emerald-400" />,
          allowedRoles: ['ADMIN', 'PENGURUS'],
        },
        {
          id: 'cashout',
          label: 'Buku Kas Keluar',
          icon: <ArrowUpRight className="w-4 h-4 text-rose-400" />,
          allowedRoles: ['ADMIN', 'PENGURUS'],
        },
        {
          id: 'bank',
          label: 'Rekening Bank KPSPAM',
          icon: <Landmark className="w-4 h-4 text-sky-400" />,
          allowedRoles: ['ADMIN', 'PENGURUS'],
        },
        {
          id: 'reports',
          label: 'Laporan Keuangan & Neraca',
          icon: <BarChart3 className="w-4 h-4" />,
          allowedRoles: ['ADMIN', 'PENGURUS'],
        },
      ],
    },
    {
      title: 'LOGISTIK & PUBLIKASI',
      items: [
        {
          id: 'assets',
          label: 'Inventaris & Aset Desa',
          icon: <Box className="w-4 h-4" />,
          allowedRoles: ['ADMIN', 'PENGURUS'],
        },
        {
          id: 'announcements',
          label: 'Pengumuman & Berita',
          icon: <Megaphone className="w-4 h-4" />,
          allowedRoles: ['ADMIN', 'PENGURUS'],
        },
        {
          id: 'transparency',
          label: 'Portal Transparansi Warga',
          icon: <Globe className="w-4 h-4" />,
          allowedRoles: ['ADMIN', 'PENGURUS', 'PETUGAS'],
        },
      ],
    },
    {
      title: 'SISTEM & TATA KELOLA',
      items: [
        {
          id: 'tariffs',
          label: 'Tarif Air & Denda',
          icon: <Layers className="w-4 h-4" />,
          allowedRoles: ['ADMIN'],
        },
        {
          id: 'users',
          label: 'Pengguna & Hak Akses',
          icon: <UserCog className="w-4 h-4" />,
          allowedRoles: ['ADMIN'],
        },
        {
          id: 'settings',
          label: 'Konfigurasi Sistem',
          icon: <Sliders className="w-4 h-4" />,
          allowedRoles: ['ADMIN'],
        },
        {
          id: 'audit',
          label: 'Catatan Audit (Audit Log)',
          icon: <History className="w-4 h-4" />,
          allowedRoles: ['ADMIN'],
        },
        {
          id: 'health',
          label: 'Kesehatan Sistem & DB',
          icon: <Activity className="w-4 h-4 text-emerald-400" />,
          allowedRoles: ['ADMIN'],
        },
        {
          id: 'tests',
          label: 'Uji Sistem Otomatis',
          icon: <CheckCircle2 className="w-4 h-4 text-emerald-400" />,
          allowedRoles: ['ADMIN', 'PENGURUS'],
          badge: '10 Tes',
          badgeColor: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30',
        },
        {
          id: 'gasexport',
          label: 'Kode Google Apps Script',
          icon: <Code2 className="w-4 h-4 text-sky-400" />,
          allowedRoles: ['ADMIN', 'PENGURUS'],
          badge: 'GAS v1.0',
          badgeColor: 'bg-sky-500/20 text-sky-300 border border-sky-500/30',
        },
      ],
    },
  ];

  const handleItemClick = (id: string) => {
    onNavigate(id);
    if (onCloseMobile) onCloseMobile();
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isMobileOpen && (
        <div
          onClick={onCloseMobile}
          className="lg:hidden fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-50 transition-opacity"
        />
      )}

      {/* Sidebar container: sliding drawer on mobile, static on desktop */}
      <aside
        className={`fixed lg:static top-0 bottom-0 left-0 z-50 w-72 bg-slate-950 text-slate-300 border-r border-slate-800/80 flex flex-col justify-between select-none transition-transform duration-300 ease-in-out shadow-lg lg:shadow-none ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Mobile Header in Drawer */}
        <div className="lg:hidden p-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-sky-600 flex items-center justify-center text-white">
              <Droplets className="w-4 h-4 fill-sky-200" />
            </div>
            <div>
              <span className="font-bold text-sm text-white block">SIM-TIRTA LESTARI</span>
              <span className="text-[10px] text-slate-400">KPSPAM Kalurahan Ngawu</span>
            </div>
          </div>
          <button
            onClick={onCloseMobile}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 cursor-pointer transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable menu */}
        <div className="py-4 px-3 overflow-y-auto flex-1 space-y-5">
          {sections.map((section, sIdx) => {
            const filteredItems = section.items.filter((item) =>
              AppStorage.hasPermission(userRole, item.id)
            );

            if (filteredItems.length === 0) return null;

            return (
              <div key={sIdx}>
                <div className="flex items-center justify-between px-3 mb-1.5">
                  <h3 className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                    {section.title}
                  </h3>
                </div>
                <nav className="space-y-0.5">
                  {filteredItems.map((item) => {
                    const isActive = activeView === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => handleItemClick(item.id)}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer group relative ${
                          isActive
                            ? 'bg-sky-600 text-white font-semibold shadow-xs'
                            : 'text-slate-400 hover:bg-slate-900 hover:text-slate-100'
                        }`}
                      >
                        <div className="flex items-center space-x-2.5 truncate">
                          <span
                            className={`transition-colors ${
                              isActive
                                ? 'text-white'
                                : 'text-slate-400 group-hover:text-slate-200'
                            }`}
                          >
                            {item.icon}
                          </span>
                          <span className="truncate">{item.label}</span>
                        </div>
                        {item.badge && (
                          <span
                            className={`text-[9px] font-semibold px-2 py-0.5 rounded-md ${
                              item.badgeColor || 'bg-slate-800 text-slate-300'
                            }`}
                          >
                            {item.badge}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </nav>
              </div>
            );
          })}
        </div>

        {/* Organization trust badge footer */}
        <div className="p-3.5 border-t border-slate-800/80 bg-slate-950/90 text-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Shield className="w-3.5 h-3.5 text-emerald-400" />
              <span className="font-semibold text-slate-300 text-[11px]">KPSPAM Tirta Lestari</span>
            </div>
            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-850 text-slate-400 border border-slate-800">
              v1.2
            </span>
          </div>
          <p className="text-[10px] text-slate-400 mt-1">
            Kalurahan Ngawu, Kapanewon Playen, Kab. Gunungkidul
          </p>
        </div>
      </aside>
    </>
  );
};
