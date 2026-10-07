// SIM-TIRTA LESTARI Header Component
// Enterprise-grade responsive header: zero mobile cut-off + interactive User & RBAC Bottom Sheet

import React, { useState } from 'react';
import { UserRole, User, RoleDefinition } from '../types';
import { AppStorage } from '../services/storage';
import {
  Droplets,
  ShieldCheck,
  UserCheck,
  Eye,
  Menu,
  RotateCcw,
  ChevronDown,
  AlertCircle,
  UserCog,
  X,
  Check,
  LogOut,
} from 'lucide-react';

interface HeaderProps {
  currentRole: UserRole;
  onRoleChange: (role: UserRole) => void;
  currentUserId?: string;
  onUserChange?: (userId: string) => void;
  activeView: string;
  onNavigate: (view: string) => void;
  onResetData: () => void;
  onOpenMobileMenu?: () => void;
  onLogout?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentRole,
  onRoleChange,
  currentUserId,
  onUserChange,
  activeView,
  onNavigate,
  onResetData,
  onOpenMobileMenu,
  onLogout,
}) => {
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [isDesktopMenuOpen, setIsDesktopMenuOpen] = useState(false);
  const [showResetConfirmModal, setShowResetConfirmModal] = useState(false);

  const users: User[] = AppStorage.getUsers();
  const roles: RoleDefinition[] = AppStorage.getRoles();

  const currentUser = users.find((u) => u.user_id === currentUserId) || users.find((u) => u.role === currentRole) || users[0];
  const currentRoleDef = roles.find((r) => r.id === currentRole) || {
    id: currentRole,
    name: currentRole,
    badge_color: 'bg-slate-700 text-slate-300 border-slate-600',
    description: 'Hak akses sistem',
    permissions: [],
  };

  const handleSelectUser = (u: User) => {
    if (onUserChange) onUserChange(u.user_id);
    onRoleChange(u.role);
    setIsRoleModalOpen(false);
    setIsDesktopMenuOpen(false);
  };

  const handleSelectRole = (roleId: string) => {
    onRoleChange(roleId);
    // Find matching user if any
    const matchingUser = users.find((u) => u.role === roleId);
    if (matchingUser && onUserChange) {
      onUserChange(matchingUser.user_id);
    }
    setIsRoleModalOpen(false);
    setIsDesktopMenuOpen(false);
  };

  return (
    <>
      <header className="bg-slate-950 text-white border-b border-slate-800/80 sticky top-0 z-40 backdrop-blur-md bg-slate-950/95 shadow-sm w-full">
        <div className="w-full max-w-[1536px] mx-auto px-2.5 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16 gap-1.5 sm:gap-4">
            {/* Left: Mobile Menu Toggle & Brand Identity */}
            <div className="flex items-center space-x-1.5 sm:space-x-3 flex-1 min-w-0 mr-1 sm:mr-2">
              {activeView !== 'public' && (
                <button
                  type="button"
                  onClick={onOpenMobileMenu}
                  className="lg:hidden p-1.5 -ml-1 text-slate-400 hover:text-white hover:bg-slate-850 rounded-xl transition cursor-pointer shrink-0"
                  aria-label="Buka Menu Navigasi"
                >
                  <Menu className="w-5 h-5" />
                </button>
              )}

              <div
                className="flex items-center space-x-2 sm:space-x-2.5 cursor-pointer select-none group min-w-0 flex-1"
                onClick={() => onNavigate(activeView === 'public' ? 'public' : 'dashboard')}
              >
                <div className="relative shrink-0">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-sky-500 via-sky-600 to-blue-700 flex items-center justify-center text-white shadow-xs ring-1 ring-white/20 transition-transform group-hover:scale-105">
                    <Droplets className="w-4 h-4 sm:w-5 sm:h-5 text-white fill-sky-200" />
                  </div>
                  <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 sm:w-2.5 sm:h-2.5 bg-emerald-500 rounded-full ring-2 ring-slate-950" />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center space-x-1.5 min-w-0">
                    <span className="font-bold text-xs sm:text-base tracking-tight text-white block truncate leading-tight">
                      SIM-TIRTA LESTARI
                    </span>
                    <span className="hidden md:inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-sm bg-sky-950 text-sky-300 border border-sky-800/80 font-mono shrink-0">
                      v1.2
                    </span>
                  </div>
                  <p className="text-[10px] sm:text-[11px] text-slate-400 font-medium truncate leading-tight mt-0.5">
                    <span>Kalurahan Ngawu</span>
                    <span className="hidden sm:inline text-slate-600 mx-1">·</span>
                    <span className="hidden sm:inline text-slate-400">Playen</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Center: System Status Pill (Desktop only) */}
            <div className="hidden xl:flex items-center space-x-2 bg-slate-900/90 border border-slate-800 rounded-full px-3.5 py-1 text-xs text-slate-300 shrink-0">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="font-medium text-slate-400">Sistem:</span>
              <span className="font-semibold text-emerald-400">Normal</span>
              <span className="text-slate-600">|</span>
              <span className="text-slate-400">Periode:</span>
              <span className="font-mono font-medium text-slate-200">Oktober 2026</span>
              <span className="text-slate-600">|</span>
              <span className="text-slate-400">Jatuh Tempo:</span>
              <span className="font-semibold text-amber-400">28 Okt</span>
            </div>

            {/* Right: View Switcher, Role Badge, and Actions */}
            <div className="flex items-center space-x-1.5 sm:space-x-3 shrink-0">
              {/* Toggle Public Portal / Admin */}
              {activeView === 'public' ? (
                <button
                  onClick={() => onNavigate('dashboard')}
                  className="bg-sky-600 hover:bg-sky-500 text-white p-2 sm:px-3 sm:py-1.5 rounded-xl text-xs font-semibold flex items-center space-x-1 shadow-xs transition-colors cursor-pointer shrink-0"
                  title="Masuk ke Panel Pengurus"
                  aria-label="Panel Pengurus"
                >
                  <ShieldCheck className="w-4 h-4 sm:w-3.5 sm:h-3.5 text-sky-200 shrink-0" />
                  <span className="hidden sm:inline">Pengurus</span>
                </button>
              ) : (
                <button
                  onClick={() => onNavigate('public')}
                  className="bg-slate-900 hover:bg-slate-850 text-slate-300 hover:text-white p-2 sm:px-3 sm:py-1.5 rounded-xl text-xs font-medium flex items-center space-x-1 border border-slate-800 transition-colors cursor-pointer shrink-0"
                  title="Lihat portal website yang diakses oleh warga"
                  aria-label="Portal Warga"
                >
                  <Eye className="w-4 h-4 sm:w-3.5 sm:h-3.5 text-sky-400 shrink-0" />
                  <span className="hidden sm:inline">Portal Warga</span>
                </button>
              )}

              {/* Desktop Role Quick Segmented Control */}
              <div className="hidden md:flex items-center bg-slate-900 rounded-xl p-0.5 border border-slate-800 text-xs shrink-0">
                <span className="text-[11px] text-slate-400 font-medium px-2 flex items-center space-x-1">
                  <UserCheck className="w-3 h-3 text-slate-500" />
                  <span>Akses:</span>
                </span>
                {roles.slice(0, 3).map((r) => (
                  <button
                    key={r.id}
                    onClick={() => handleSelectRole(r.id)}
                    className={`px-2 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      currentRole === r.id
                        ? 'bg-sky-600 text-white shadow-xs'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                    }`}
                  >
                    {r.id}
                  </button>
                ))}
              </div>

              {/* Desktop User Profile Button & Dropdown */}
              <div className="hidden sm:block relative shrink-0">
                <button
                  type="button"
                  onClick={() => setIsDesktopMenuOpen(!isDesktopMenuOpen)}
                  className="bg-slate-900 hover:bg-slate-850 border border-slate-700/80 px-2.5 py-1.5 rounded-xl text-xs font-medium flex items-center gap-1.5 cursor-pointer text-slate-200 transition"
                >
                  <div className="w-5 h-5 rounded-md bg-sky-600 text-white flex items-center justify-center font-bold text-[10px]">
                    {currentUser?.name?.charAt(0) || 'U'}
                  </div>
                  <span className="font-semibold text-slate-200 max-w-[100px] truncate">
                    {currentUser?.name?.split(' ')[0] || currentRole}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {isDesktopMenuOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setIsDesktopMenuOpen(false)}
                    />
                    <div className="absolute right-0 top-full mt-2 w-64 bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl py-2 z-50 divide-y divide-slate-800">
                      <div className="px-3.5 py-2">
                        <div className="text-xs font-bold text-white truncate">{currentUser?.name}</div>
                        <div className="text-[11px] text-slate-400 truncate">{currentUser?.email}</div>
                        <div className="mt-1.5">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${currentRoleDef.badge_color}`}>
                            {currentRoleDef.name}
                          </span>
                        </div>
                      </div>

                      {/* Switch User List */}
                      <div className="p-1.5 space-y-1">
                        <div className="px-2 pt-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          Beralih Sesi Pengguna:
                        </div>
                        {users.map((u) => (
                          <button
                            key={u.user_id}
                            onClick={() => handleSelectUser(u)}
                            className={`w-full text-left px-2.5 py-1.5 rounded-xl text-xs flex items-center justify-between transition cursor-pointer ${
                              currentUser?.user_id === u.user_id
                                ? 'bg-sky-600/20 text-sky-300 font-bold border border-sky-500/30'
                                : 'text-slate-300 hover:bg-slate-800'
                            }`}
                          >
                            <div className="truncate pr-2">
                              <div className="truncate font-semibold">{u.name}</div>
                              <div className="text-[10px] text-slate-400">{u.role}</div>
                            </div>
                            {currentUser?.user_id === u.user_id && <Check className="w-4 h-4 text-sky-400 shrink-0" />}
                          </button>
                        ))}
                      </div>

                      {/* Manage RBAC & Reset */}
                      <div className="p-1.5 space-y-0.5">
                        <button
                          onClick={() => {
                            setIsDesktopMenuOpen(false);
                            onNavigate('users');
                          }}
                          className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-semibold text-sky-400 hover:bg-slate-800 flex items-center gap-2 cursor-pointer transition"
                        >
                          <UserCog className="w-3.5 h-3.5 text-sky-400" />
                          <span>Kelola Pengguna & Hak Akses (RBAC)</span>
                        </button>
                        <button
                          onClick={() => {
                            setIsDesktopMenuOpen(false);
                            setShowResetConfirmModal(true);
                          }}
                          className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-400 hover:bg-slate-800 flex items-center gap-2 cursor-pointer transition"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Reset Data Demo</span>
                        </button>
                        {onLogout && (
                          <button
                            onClick={() => {
                              setIsDesktopMenuOpen(false);
                              onLogout();
                            }}
                            className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-semibold text-rose-300 hover:bg-rose-950/40 flex items-center gap-2 cursor-pointer transition border-t border-slate-800 pt-2 mt-1"
                          >
                            <LogOut className="w-3.5 h-3.5 text-rose-400" />
                            <span>Keluar (Logout)</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Mobile Role Switcher Button - Prominent, High Touch Target, Never Cut Off */}
              <button
                type="button"
                onClick={() => setIsRoleModalOpen(true)}
                className="sm:hidden bg-slate-900 active:bg-slate-850 hover:bg-slate-850 border border-slate-700/90 text-white px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center space-x-1.5 cursor-pointer shrink-0 min-h-[38px] shadow-sm transition active:scale-95"
                title="Pilih Peran & Pengguna"
                aria-label="Pilih Peran & Pengguna"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                <span className="font-mono text-xs font-bold text-sky-300 max-w-[64px] truncate">
                  {currentRole}
                </span>
                <ChevronDown
                  className={`w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform duration-200 ${
                    isRoleModalOpen ? 'rotate-180 text-sky-400' : ''
                  }`}
                />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* MOBILE USER & ROLE BOTTOM SHEET MODAL (100% immune to cut-off on mobile devices) */}
      {isRoleModalOpen && (
        <div className="sm:hidden fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200">
          <div
            className="fixed inset-0"
            onClick={() => setIsRoleModalOpen(false)}
          />

          <div className="relative w-full max-w-lg bg-slate-950 border-t border-slate-800 rounded-t-3xl p-5 shadow-2xl z-50 max-h-[85vh] overflow-y-auto space-y-4 text-slate-100">
            {/* Sheet Handle */}
            <div className="flex justify-center -mt-1 mb-1">
              <div className="w-12 h-1.5 bg-slate-700 rounded-full" />
            </div>

            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-sky-400" />
                <h3 className="font-bold text-base text-white">Sesi Akun & Hak Akses</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsRoleModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
                aria-label="Tutup Dialog"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Active User Card */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500 to-blue-700 text-white font-black text-base flex items-center justify-center shrink-0 shadow-xs">
                  {currentUser?.name?.charAt(0) || 'U'}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-bold text-white truncate">{currentUser?.name}</div>
                  <div className="text-xs text-slate-400 truncate">{currentUser?.email}</div>
                  <div className="text-[11px] text-emerald-400 font-medium flex items-center gap-1 mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    <span>Akun Aktif saat ini</span>
                  </div>
                </div>
              </div>
              <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border shrink-0 ${currentRoleDef.badge_color}`}>
                {currentRole}
              </span>
            </div>

            {/* Switch User List */}
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 px-1">
                Pilih Pengguna untuk Mengganti Peran:
              </div>
              <div className="space-y-1.5">
                {users.map((u) => {
                  const roleObj = roles.find((r) => r.id === u.role);
                  const isSelected = currentUser?.user_id === u.user_id;

                  return (
                    <button
                      key={u.user_id}
                      type="button"
                      onClick={() => handleSelectUser(u)}
                      className={`w-full text-left p-3 rounded-2xl border transition-all flex items-center justify-between gap-2 cursor-pointer ${
                        isSelected
                          ? 'bg-sky-600/20 border-sky-500/50 text-white'
                          : 'bg-slate-900 border-slate-800/80 text-slate-300 hover:bg-slate-850'
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-white truncate">{u.name}</span>
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-md border ${roleObj?.badge_color || 'bg-slate-800 text-slate-300 border-slate-700'}`}>
                            {u.role}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400 truncate mt-0.5">{u.email}</div>
                      </div>

                      {isSelected ? (
                        <div className="w-6 h-6 rounded-full bg-sky-500 text-white flex items-center justify-center shrink-0">
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </div>
                      ) : (
                        <div className="w-6 h-6 rounded-full border border-slate-700 shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Roles Matrix Shortcut & Reset Data */}
            <div className="pt-2 border-t border-slate-800 space-y-2">
              <button
                type="button"
                onClick={() => {
                  setIsRoleModalOpen(false);
                  onNavigate('users');
                }}
                className="w-full bg-sky-600 hover:bg-sky-500 text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 shadow-md transition cursor-pointer"
              >
                <UserCog className="w-4 h-4" />
                <span>⚙ Kelola Pengguna & Hak Akses (RBAC)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsRoleModalOpen(false);
                  setShowResetConfirmModal(true);
                }}
                className="w-full bg-slate-900 hover:bg-slate-850 text-slate-400 font-semibold py-2 px-4 rounded-xl text-xs flex items-center justify-center gap-2 border border-slate-800 transition cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Data Demo SIM-TIRTA</span>
              </button>

              {onLogout && (
                <button
                  type="button"
                  onClick={() => {
                    setIsRoleModalOpen(false);
                    onLogout();
                  }}
                  className="w-full bg-rose-950/40 hover:bg-rose-900/50 text-rose-300 font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 border border-rose-800/60 transition cursor-pointer active:scale-95"
                >
                  <LogOut className="w-4 h-4 text-rose-400" />
                  <span>Keluar dari Akun (Logout)</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* IN-APP RESET DATA DEMO CONFIRMATION MODAL */}
      {showResetConfirmModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl text-slate-100 space-y-4">
            <div className="flex items-center space-x-3 text-amber-400">
              <div className="p-2.5 rounded-xl bg-amber-500/20 border border-amber-500/30">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Reset Seluruh Data Demo?</h3>
                <p className="text-xs text-slate-400 mt-0.5">SIM-TIRTA LESTARI Ngawu Playen</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/60 p-3 rounded-xl border border-slate-800">
              Tindakan ini akan mengembalikan seluruh data pelanggan, tagihan, catatan meter, kas, kwitansi, dan pengaturan ke data awal resmi KPSPAM Tirta Lestari. Data baru yang dimasukkan akan terhapus.
            </p>

            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setShowResetConfirmModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowResetConfirmModal(false);
                  onResetData();
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white shadow-md transition cursor-pointer flex items-center space-x-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Ya, Reset Data</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
