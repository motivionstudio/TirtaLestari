// SIM-TIRTA LESTARI Login Authentication Modal
// Protected Security Authentication for Production Servers

import React, { useState } from 'react';
import { AppStorage } from '../services/storage';
import { AuditLogger } from '../services/audit';
import { User } from '../types';
import {
  Lock,
  Mail,
  KeyRound,
  Eye,
  EyeOff,
  ShieldCheck,
  AlertCircle,
  X,
  Sparkles,
  ArrowRight,
  Droplets,
  ShieldAlert,
} from 'lucide-react';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: User) => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showDemoHint, setShowDemoHint] = useState(true);

  if (!isOpen) return null;

  const users = AppStorage.getUsers();
  const superAdmin = users.find((u) => u.role === 'ADMIN');
  // Check if admin is still using default initial setup password
  const isDefaultPassword = !superAdmin?.password || superAdmin.password === 'admin123';

  const handleQuickFillAdmin = () => {
    setEmail(superAdmin?.email || 'SewinduP@gmail.com');
    setPassword('admin123');
    setErrorMessage(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    if (!cleanEmail || !cleanPassword) {
      setErrorMessage('Mohon masukkan email dan password akun.');
      return;
    }

    const matchedUser = users.find(
      (u) =>
        u.email.toLowerCase() === cleanEmail ||
        u.user_id.toLowerCase() === cleanEmail
    );

    if (!matchedUser) {
      setErrorMessage(
        'Akun email tidak terdaftar. Hanya akun resmi pengurus KPSPAM yang diizinkan masuk.'
      );
      return;
    }

    if (matchedUser.status === 'INACTIVE') {
      setErrorMessage(
        'Akun ini sedang dinonaktifkan oleh Administrator. Akses tidak diizinkan.'
      );
      return;
    }

    // Verify secret password
    const expectedPassword = matchedUser.password || 'admin123';
    if (cleanPassword !== expectedPassword) {
      setErrorMessage('Password yang Anda masukkan salah. Akses ditolak.');
      return;
    }

    // Success!
    if (rememberMe) {
      AppStorage.setActiveSession(matchedUser);
    }

    AuditLogger.log({
      user: matchedUser.name,
      role: matchedUser.role,
      action: 'LOGIN',
      module: 'AUTH',
      record_id: matchedUser.user_id,
      new_value_summary: `Login berhasil sebagai ${matchedUser.role}`,
    });

    onLoginSuccess(matchedUser);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div
        className="fixed inset-0"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 p-6 sm:p-7 z-10 overflow-hidden space-y-5">
        {/* Decorative Top Accent */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-600" />

        {/* Modal Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-sky-500 to-blue-700 text-white flex items-center justify-center shadow-xs">
              <Droplets className="w-5 h-5 fill-sky-200 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 leading-tight">
                Login Masuk Pengurus
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                SIM-TIRTA LESTARI · Kalurahan Ngawu
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition cursor-pointer"
            aria-label="Tutup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Security Notification Banner */}
        {isDefaultPassword && showDemoHint ? (
          <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl text-xs space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-1.5 font-bold text-amber-900">
                <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Inisialisasi Pertama di Server:</span>
              </div>
              <button
                type="button"
                onClick={() => setShowDemoHint(false)}
                className="text-[10px] text-amber-700 hover:underline font-semibold"
              >
                Sembunyikan
              </button>
            </div>
            <p className="text-[11px] text-amber-800 leading-relaxed">
              Akun Super Admin pertama menggunakan password inisialisasi default <strong>admin123</strong>. Segera ganti dengan password rahasia pribadi Anda setelah masuk di menu Pengguna!
            </p>
            <button
              type="button"
              onClick={handleQuickFillAdmin}
              className="w-full bg-amber-600 hover:bg-amber-500 text-white font-bold py-1.5 px-3 rounded-xl text-[11px] flex items-center justify-center space-x-1.5 shadow-xs transition cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Isi Kredensial Inisialisasi Super Admin</span>
            </button>
          </div>
        ) : (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs flex items-center space-x-2 text-emerald-800">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="leading-snug">
              <strong>Server Terproteksi:</strong> Akses hanya diberikan kepada pengurus yang memiliki akun dan password terdaftar.
            </span>
          </div>
        )}

        {/* Error Alert */}
        {errorMessage && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-start space-x-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Form Login */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Email Google Akun Pengurus
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                placeholder="SewinduP@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold text-slate-700 uppercase">
                Password Rahasia
              </label>
            </div>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="Masukkan password Anda"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                aria-label="Tampilkan Password"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs pt-1">
            <label className="flex items-center space-x-2 text-slate-600 cursor-pointer">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="rounded text-sky-600 focus:ring-sky-500"
              />
              <span>Ingat sesi masuk di perangkat ini</span>
            </label>
          </div>

          <button
            type="submit"
            className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 px-4 rounded-xl text-xs sm:text-sm flex items-center justify-center space-x-2 shadow-md transition cursor-pointer active:scale-95 mt-2"
          >
            <span>Masuk ke Panel Pengurus</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Footer Note */}
        <p className="text-[11px] text-slate-400 text-center leading-relaxed pt-2 border-t border-slate-100">
          Sistem Resmi Pengelolaan Air Bersih KPSPAM Tirta Lestari. Kalurahan Ngawu, Kapanewon Playen, Kabupaten Gunungkidul.
        </p>
      </div>
    </div>
  );
};
