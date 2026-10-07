// SIM-TIRTA LESTARI User & Role-Based Access Control (RBAC) Management
// Full dynamic user management, custom roles creation, and granular module permissions matrix

import React, { useState } from 'react';
import { User, RoleDefinition } from '../types';
import { AppStorage } from '../services/storage';
import { AuditLogger } from '../services/audit';
import {
  UserCog,
  Plus,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  X,
  Shield,
  Users,
  Lock,
  Key,
  Check,
  Edit2,
  Trash2,
  Search,
  Sliders,
  CheckSquare,
  Square,
  AlertCircle,
  Sparkles,
  Layers,
} from 'lucide-react';

interface ModuleConfig {
  id: string;
  name: string;
  category: 'OPERASIONAL' | 'BILLING' | 'KEUANGAN' | 'LOGISTIK' | 'TATA KELOLA';
  description: string;
}

const SYSTEM_MODULES: ModuleConfig[] = [
  // 1. Operasional Air
  { id: 'dashboard', name: 'Ringkasan & Beranda', category: 'OPERASIONAL', description: 'Cockpit telemetri, metrik efisiensi, dan statistik operasional' },
  { id: 'customers', name: 'Data Pelanggan & Sambungan', category: 'OPERASIONAL', description: 'Registrasi 150 KK, survei, cicilan sambungan baru' },
  { id: 'meters', name: 'Catat Angka Meter Air', category: 'OPERASIONAL', description: 'Input angka meter bulanan warga oleh petugas lapangan' },
  { id: 'maintenance', name: 'Pemeliharaan Jaringan Pipa', category: 'OPERASIONAL', description: 'Jadwal servis pompa sumur, kuras tandon, ganti stop kran' },
  { id: 'complaints', name: 'Layanan Pengaduan Warga', category: 'OPERASIONAL', description: 'Tiket aduan pipa bocor, air keruh, kran mampet' },

  // 2. Billing & Kasir
  { id: 'bills', name: 'Tagihan Rekening Air', category: 'BILLING', description: 'Generate tagihan massal bulanan, rekap tagihan, denda' },
  { id: 'payments', name: 'Kasir Loket Pembayaran', category: 'BILLING', description: 'Loket penerimaan tunai/transfer rekening air' },
  { id: 'receipts', name: 'Kwitansi & Cetak Ulang', category: 'BILLING', description: 'Penerbitan kwitansi A5/A6, verifikasi barcode & validasi' },
  { id: 'arrears', name: 'Tunggakan & Pengingat WA', category: 'BILLING', description: 'Pantau tunggakan warga > 1 bulan dan kirim notifikasi WA' },

  // 3. Keuangan Desa
  { id: 'cashin', name: 'Kas Masuk (Penerimaan)', category: 'KEUANGAN', description: 'Penerimaan operasional, hibah desa, biaya sambungan baru' },
  { id: 'cashout', name: 'Kas Keluar (Pengeluaran)', category: 'KEUANGAN', description: 'Biaya listrik pompa PLN, belanja sparepart pipa, honor' },
  { id: 'bank', name: 'Rekening Bank KPSPAM', category: 'KEUANGAN', description: 'Buku mutasi rekening giro / bank BPD DIY Tirta Lestari' },
  { id: 'reports', name: 'Laporan Keuangan & Neraca', category: 'KEUANGAN', description: 'Laporan laba rugi, arus kas, neraca, rekap pemakaian m³' },

  // 4. Logistik & Publikasi
  { id: 'assets', name: 'Inventaris & Aset Pompa', category: 'LOGISTIK', description: 'Daftar tandon, pompa submersible, pipa distribusi, genset' },
  { id: 'announcements', name: 'Pengumuman & Berita', category: 'LOGISTIK', description: 'CMS pengumuman jadwal bayar atau peringatan darurat kebocoran' },
  { id: 'transparency', name: 'Portal Transparansi Warga', category: 'LOGISTIK', description: 'Tampilan portal publik untuk cek tagihan & transparansi kas' },

  // 5. Tata Kelola & Sistem
  { id: 'tariffs', name: 'Penetapan Tarif Air & Denda', category: 'TATA KELOLA', description: 'Skema tarif blok 1 s/d 4 (Rp 2.500–5.000) dan biaya beban' },
  { id: 'users', name: 'Pengguna & Hak Akses (RBAC)', category: 'TATA KELOLA', description: 'Kelola akun pengguna, tambah peran baru, dan atur izin modul' },
  { id: 'settings', name: 'Konfigurasi Sistem KPSPAM', category: 'TATA KELOLA', description: 'Nama instansi, nomor WA resmi, jam kerja, template WA' },
  { id: 'audit', name: 'Catatan Audit (Audit Log)', category: 'TATA KELOLA', description: 'Rekam jejak setiap perubahan data, waktu, dan pelakunya' },
  { id: 'health', name: 'Kesehatan Database & Sistem', category: 'TATA KELOLA', description: 'Diagnostik integritas database dan status server lokal' },
  { id: 'tests', name: 'Uji Sistem Otomatis (E2E)', category: 'TATA KELOLA', description: 'Eksekusi automated test suite untuk verifikasi rumus tagihan' },
  { id: 'gasexport', name: 'Ekspor Google Apps Script', category: 'TATA KELOLA', description: 'Kode GAS untuk integrasi Google Sheets & WhatsApp API' },
];

export const UsersView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'USERS' | 'ROLES'>('USERS');

  // State Users & Roles
  const [users, setUsers] = useState<User[]>(() => AppStorage.getUsers());
  const [roles, setRoles] = useState<RoleDefinition[]>(() => AppStorage.getRoles());

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState<string>('ALL');

  // Feedback Notification
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // User Form Modal State
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userRole, setUserRole] = useState<string>('PENGURUS');
  const [userPhone, setUserPhone] = useState('');
  const [userPassword, setUserPassword] = useState('');
  const [userStatus, setUserStatus] = useState<'ACTIVE' | 'INACTIVE'>('ACTIVE');

  // Role Form Modal State
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [roleCode, setRoleCode] = useState('');
  const [roleName, setRoleName] = useState('');
  const [roleDescription, setRoleDescription] = useState('');
  const [roleBadgeColor, setRoleBadgeColor] = useState('bg-sky-100 text-sky-800 border-sky-200');
  const [roleSelectedPermissions, setRoleSelectedPermissions] = useState<string[]>(['dashboard', 'transparency']);

  // Role Permissions Matrix Active Role
  const [matrixSelectedRoleId, setMatrixSelectedRoleId] = useState<string>('PENGURUS');

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  // --- USER HANDLERS ---
  const handleOpenAddUser = () => {
    setEditingUserId(null);
    setUserName('');
    setUserEmail('');
    setUserRole(roles[0]?.id || 'PENGURUS');
    setUserPhone('');
    setUserPassword('');
    setUserStatus('ACTIVE');
    setIsUserModalOpen(true);
  };

  const handleOpenEditUser = (u: User) => {
    setEditingUserId(u.user_id);
    setUserName(u.name);
    setUserEmail(u.email);
    setUserRole(u.role);
    setUserPhone(u.phone || '');
    setUserPassword(u.password || '');
    setUserStatus(u.status);
    setIsUserModalOpen(true);
  };

  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userName.trim() || !userEmail.trim()) {
      showToast('Nama dan Email Google pengguna wajib diisi.', 'error');
      return;
    }

    if (editingUserId) {
      // Update existing
      const updated = users.map((u) => {
        if (u.user_id === editingUserId) {
          return {
            ...u,
            name: userName.trim(),
            email: userEmail.trim().toLowerCase(),
            role: userRole,
            phone: userPhone.trim(),
            password: userPassword.trim() || u.password || 'admin123',
            status: userStatus,
          };
        }
        return u;
      });

      setUsers(updated);
      AppStorage.setUsers(updated);

      AuditLogger.log({
        user: 'Administrator',
        role: 'ADMIN',
        action: 'CHANGE SETTINGS',
        module: 'USERS',
        record_id: editingUserId,
        new_value_summary: `Perbarui data pengguna ${userName} (${userEmail}) sebagai ${userRole}`,
      });

      showToast(`Data pengguna ${userName} berhasil diperbarui.`);
    } else {
      // Create new
      const newUser: User = {
        user_id: `USR-${String(users.length + 1).padStart(2, '0')}`,
        email: userEmail.trim().toLowerCase(),
        name: userName.trim(),
        role: userRole,
        status: userStatus,
        phone: userPhone.trim(),
        password: userPassword.trim() || 'admin123',
        created_at: new Date().toISOString().replace('T', ' ').substring(0, 19),
      };

      const updated = [...users, newUser];
      setUsers(updated);
      AppStorage.setUsers(updated);

      AuditLogger.log({
        user: 'Administrator',
        role: 'ADMIN',
        action: 'CHANGE SETTINGS',
        module: 'USERS',
        record_id: newUser.user_id,
        new_value_summary: `Tambah pengguna baru: ${userName} (${userEmail}) dengan peran ${userRole}`,
      });

      showToast(`Pengguna baru ${userName} berhasil ditambahkan.`);
    }

    setIsUserModalOpen(false);
  };

  const handleToggleUserStatus = (u: User) => {
    const newStatus = u.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    const updated = users.map((user) => {
      if (user.user_id === u.user_id) {
        return { ...user, status: newStatus as 'ACTIVE' | 'INACTIVE' };
      }
      return user;
    });

    setUsers(updated);
    AppStorage.setUsers(updated);

    AuditLogger.log({
      user: 'Administrator',
      role: 'ADMIN',
      action: 'CHANGE SETTINGS',
      module: 'USERS',
      record_id: u.user_id,
      new_value_summary: `Status akses ${u.name} diubah menjadi ${newStatus}`,
    });

    showToast(`Status akses ${u.name} diubah menjadi ${newStatus === 'ACTIVE' ? 'Aktif' : 'Nonaktif'}.`);
  };

  const handleDeleteUser = (u: User) => {
    if (u.user_id === 'USR-01') {
      showToast('Akun Super Admin utama tidak dapat dihapus.', 'error');
      return;
    }

    const updated = users.filter((user) => user.user_id !== u.user_id);
    setUsers(updated);
    AppStorage.setUsers(updated);

    AuditLogger.log({
      user: 'Administrator',
      role: 'ADMIN',
      action: 'CHANGE SETTINGS',
      module: 'USERS',
      record_id: u.user_id,
      new_value_summary: `Hapus pengguna ${u.name} (${u.email})`,
    });

    showToast(`Pengguna ${u.name} berhasil dihapus.`);
  };

  // --- ROLE HANDLERS ---
  const handleOpenAddRole = () => {
    setRoleCode('');
    setRoleName('');
    setRoleDescription('');
    setRoleBadgeColor('bg-sky-100 text-sky-800 border-sky-200');
    setRoleSelectedPermissions(['dashboard', 'transparency']);
    setIsRoleModalOpen(true);
  };

  const handleSaveNewRole = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = roleCode.trim().toUpperCase().replace(/[^A-Z0-9_]/g, '');
    if (!cleanCode || !roleName.trim()) {
      showToast('Kode Peran (ID) dan Nama Peran wajib diisi.', 'error');
      return;
    }

    if (roles.some((r) => r.id === cleanCode)) {
      showToast(`Peran dengan kode ${cleanCode} sudah ada. Gunakan kode lain.`, 'error');
      return;
    }

    const newRole: RoleDefinition = {
      id: cleanCode,
      name: roleName.trim(),
      description: roleDescription.trim() || `Peran khusus ${roleName}`,
      badge_color: roleBadgeColor,
      is_system: false,
      permissions: roleSelectedPermissions,
    };

    const updated = [...roles, newRole];
    setRoles(updated);
    AppStorage.setRoles(updated);
    setMatrixSelectedRoleId(cleanCode);

    AuditLogger.log({
      user: 'Administrator',
      role: 'ADMIN',
      action: 'CHANGE SETTINGS',
      module: 'ROLES',
      record_id: cleanCode,
      new_value_summary: `Buat peran baru: ${roleName} (${cleanCode}) dengan ${roleSelectedPermissions.length} hak akses modul`,
    });

    setIsRoleModalOpen(false);
    showToast(`Peran baru ${roleName} (${cleanCode}) berhasil dibuat!`);
  };

  const handleDeleteRole = (r: RoleDefinition) => {
    if (r.is_system) {
      showToast(`Peran sistem bawaan (${r.id}) tidak dapat dihapus.`, 'error');
      return;
    }

    const updated = roles.filter((role) => role.id !== r.id);
    setRoles(updated);
    AppStorage.setRoles(updated);

    // Reassign any user with this role back to PENGURUS
    const updatedUsers = users.map((u) => (u.role === r.id ? { ...u, role: 'PENGURUS' } : u));
    setUsers(updatedUsers);
    AppStorage.setUsers(updatedUsers);

    if (matrixSelectedRoleId === r.id) {
      setMatrixSelectedRoleId('PENGURUS');
    }

    AuditLogger.log({
      user: 'Administrator',
      role: 'ADMIN',
      action: 'CHANGE SETTINGS',
      module: 'ROLES',
      record_id: r.id,
      new_value_summary: `Hapus peran kustom ${r.name} (${r.id})`,
    });

    showToast(`Peran ${r.name} berhasil dihapus.`);
  };

  const handleToggleModulePermission = (roleId: string, moduleId: string) => {
    if (roleId === 'ADMIN') {
      showToast('Peran Administrator selalu memiliki akses ke seluruh modul sistem.', 'error');
      return;
    }

    const updated = roles.map((r) => {
      if (r.id === roleId) {
        const hasIt = r.permissions.includes(moduleId);
        const newPerms = hasIt
          ? r.permissions.filter((p) => p !== moduleId)
          : [...r.permissions, moduleId];
        return { ...r, permissions: newPerms };
      }
      return r;
    });

    setRoles(updated);
    AppStorage.setRoles(updated);

    AuditLogger.log({
      user: 'Administrator',
      role: 'ADMIN',
      action: 'CHANGE SETTINGS',
      module: 'ROLES',
      record_id: roleId,
      new_value_summary: `Ubah hak akses modul ${moduleId} untuk peran ${roleId}`,
    });
  };

  const handleSelectAllForRole = (roleId: string, selectAll: boolean) => {
    if (roleId === 'ADMIN') return;

    const allModuleIds = SYSTEM_MODULES.map((m) => m.id);
    const updated = roles.map((r) => {
      if (r.id === roleId) {
        return {
          ...r,
          permissions: selectAll ? allModuleIds : ['dashboard', 'transparency'],
        };
      }
      return r;
    });

    setRoles(updated);
    AppStorage.setRoles(updated);

    AuditLogger.log({
      user: 'Administrator',
      role: 'ADMIN',
      action: 'CHANGE SETTINGS',
      module: 'ROLES',
      record_id: roleId,
      new_value_summary: `${selectAll ? 'Berikan seluruh hak akses' : 'Reset hak akses'} untuk peran ${roleId}`,
    });

    showToast(selectAll ? `Seluruh hak akses diberikan ke ${roleId}.` : `Hak akses peran ${roleId} disetel minimal.`);
  };

  // Filtered Users
  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.user_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.phone && u.phone.includes(searchQuery));
    const matchesRole = filterRole === 'ALL' || u.role === filterRole;
    return matchesSearch && matchesRole;
  });

  const activeRoleDefinition = roles.find((r) => r.id === matrixSelectedRoleId) || roles[0];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed top-20 right-4 z-50 px-4 py-3 rounded-2xl shadow-xl flex items-center space-x-2 text-sm font-semibold transition-all animate-in slide-in-from-top-2 ${
            toastMessage.type === 'success'
              ? 'bg-emerald-900 text-emerald-100 border border-emerald-700'
              : 'bg-rose-900 text-rose-100 border border-rose-700'
          }`}
        >
          {toastMessage.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 text-white p-6 sm:p-7 rounded-3xl border border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-5">
        <div>
          <div className="flex items-center space-x-2.5">
            <div className="w-10 h-10 rounded-xl bg-sky-600/30 border border-sky-500/40 flex items-center justify-center text-sky-400 shadow-xs">
              <UserCog className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                Manajemen Pengguna & Hak Akses (RBAC)
              </h1>
              <p className="text-slate-400 text-xs sm:text-sm mt-0.5">
                Konfigurasi peran khusus siapa saja yang dapat mengakses 23 modul SIM-TIRTA LESTARI
              </p>
            </div>
          </div>
        </div>

        {/* Primary Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={handleOpenAddUser}
            className="bg-sky-600 hover:bg-sky-500 text-white px-4 py-2.5 rounded-xl font-bold text-xs flex items-center space-x-2 shadow-md transition cursor-pointer active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>+ Tambah Pengguna</span>
          </button>
          <button
            type="button"
            onClick={handleOpenAddRole}
            className="bg-slate-800 hover:bg-slate-750 text-sky-300 border border-slate-700 px-4 py-2.5 rounded-xl font-bold text-xs flex items-center space-x-2 shadow-xs transition cursor-pointer active:scale-95"
          >
            <Shield className="w-4 h-4 text-sky-400" />
            <span>+ Buat Peran Baru (Custom)</span>
          </button>
        </div>
      </div>

      {/* Segmented Tab Control */}
      <div className="flex items-center space-x-2 border-b border-slate-200 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('USERS')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer ${
            activeTab === 'USERS'
              ? 'bg-sky-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Daftar Pengguna Sistem ({users.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('ROLES')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer ${
            activeTab === 'ROLES'
              ? 'bg-sky-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Key className="w-4 h-4" />
          <span>Matriks Peran & Hak Akses Modul ({roles.length} Peran)</span>
        </button>
      </div>

      {/* ===================== TAB 1: USERS LIST ===================== */}
      {activeTab === 'USERS' && (
        <div className="space-y-4">
          {/* Quick Filters */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari berdasarkan nama, email Google, ID, atau no WA..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
              />
            </div>

            <div className="flex items-center space-x-2 shrink-0">
              <span className="text-xs text-slate-500 font-medium">Filter Peran:</span>
              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
              >
                <option value="ALL">Semua Peran ({users.length})</option>
                {roles.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name} ({users.filter((u) => u.role === r.id).length})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Users Table */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs sm:text-sm">
                <thead>
                  <tr className="bg-slate-50/90 text-slate-600 text-[11px] font-bold uppercase tracking-wider border-b border-slate-200">
                    <th className="py-3 px-4">Pengguna</th>
                    <th className="py-3 px-4">Akun Email Google</th>
                    <th className="py-3 px-4">Peran (Role)</th>
                    <th className="py-3 px-4">Kontak WhatsApp</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-center">Aksi Manajemen</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredUsers.map((u) => {
                    const roleObj = roles.find((r) => r.id === u.role);
                    return (
                      <tr key={u.user_id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="flex items-center space-x-3">
                            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-sky-500 to-blue-700 text-white font-black text-xs flex items-center justify-center shrink-0 shadow-xs">
                              {u.name.charAt(0)}
                            </div>
                            <div>
                              <span className="font-bold text-slate-900 block">{u.name}</span>
                              <span className="font-mono text-[10px] text-slate-400">{u.user_id}</span>
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-4 font-mono text-xs text-slate-700 whitespace-nowrap">
                          {u.email}
                        </td>

                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span
                            className={`text-xs font-bold px-2.5 py-1 rounded-full border ${
                              roleObj?.badge_color || 'bg-slate-100 text-slate-800 border-slate-200'
                            }`}
                          >
                            {roleObj?.name || u.role}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-xs font-mono text-slate-600 whitespace-nowrap">
                          {u.phone || '-'}
                        </td>

                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span
                            className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                              u.status === 'ACTIVE'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-slate-200 text-slate-700'
                            }`}
                          >
                            {u.status === 'ACTIVE' ? 'Aktif' : 'Nonaktif'}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center space-x-1.5">
                            <button
                              type="button"
                              onClick={() => handleOpenEditUser(u)}
                              className="p-1.5 text-slate-500 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition cursor-pointer"
                              title="Edit Data Pengguna"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>

                            <button
                              type="button"
                              onClick={() => handleToggleUserStatus(u)}
                              className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer transition ${
                                u.status === 'ACTIVE'
                                  ? 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                                  : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                              }`}
                            >
                              {u.status === 'ACTIVE' ? 'Nonaktifkan' : 'Aktifkan'}
                            </button>

                            {u.user_id !== 'USR-01' && (
                              <button
                                type="button"
                                onClick={() => handleDeleteUser(u)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                                title="Hapus Pengguna"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}

                  {filteredUsers.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400 text-xs">
                        Tidak ada pengguna yang cocok dengan pencarian atau filter.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ===================== TAB 2: ROLES & PERMISSIONS MATRIX ===================== */}
      {activeTab === 'ROLES' && (
        <div className="space-y-6">
          {/* Roles Selector Strip */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-sm sm:text-base flex items-center space-x-2">
                  <ShieldCheck className="w-5 h-5 text-sky-600" />
                  <span>Daftar Peran Resmi & Kustom ({roles.length} Peran)</span>
                </h3>
                <p className="text-slate-500 text-xs mt-0.5">
                  Klik pada peran untuk melihat dan mengatur modul yang boleh diakses.
                </p>
              </div>

              <button
                type="button"
                onClick={handleOpenAddRole}
                className="bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs px-3.5 py-2 rounded-xl flex items-center space-x-1.5 shadow-sm transition cursor-pointer self-start sm:self-auto"
              >
                <Plus className="w-4 h-4" />
                <span>+ Peran Baru</span>
              </button>
            </div>

            {/* Role Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              {roles.map((r) => {
                const isSelected = matrixSelectedRoleId === r.id;
                const userCount = users.filter((u) => u.role === r.id).length;

                return (
                  <div
                    key={r.id}
                    onClick={() => setMatrixSelectedRoleId(r.id)}
                    className={`p-4 rounded-2xl border-2 transition-all cursor-pointer relative flex flex-col justify-between ${
                      isSelected
                        ? 'border-sky-600 bg-sky-50/50 shadow-md ring-2 ring-sky-500/20'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${r.badge_color}`}>
                          {r.id}
                        </span>
                        {r.is_system ? (
                          <span className="text-[10px] font-mono text-slate-400">Sistem</span>
                        ) : (
                          <div className="flex items-center space-x-1">
                            <span className="text-[10px] font-semibold text-sky-600 bg-sky-100 px-1.5 py-0.5 rounded">
                              Kustom
                            </span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteRole(r);
                              }}
                              className="text-slate-400 hover:text-rose-600 p-0.5"
                              title="Hapus peran ini"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>

                      <h4 className="font-bold text-slate-900 text-sm leading-tight">{r.name}</h4>
                      <p className="text-slate-500 text-xs mt-1 leading-relaxed line-clamp-2">{r.description}</p>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                      <span>{userCount} Pengguna</span>
                      <span className="font-bold text-sky-700">
                        {r.id === 'ADMIN' ? '23 Modul (Penuh)' : `${r.permissions.length} Modul`}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Granular Module Permission Matrix for Active Role */}
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs p-5 sm:p-6 space-y-5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
              <div>
                <div className="flex items-center space-x-2">
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${activeRoleDefinition.badge_color}`}>
                    {activeRoleDefinition.id}
                  </span>
                  <h3 className="font-black text-slate-900 text-lg">
                    Izin Akses Modul: {activeRoleDefinition.name}
                  </h3>
                </div>
                <p className="text-slate-500 text-xs sm:text-sm mt-1">
                  Centang modul yang diizinkan untuk dibuka oleh pengguna dengan peran ini. Perubahan langsung tersimpan secara otomatis.
                </p>
              </div>

              {activeRoleDefinition.id !== 'ADMIN' && (
                <div className="flex items-center space-x-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleSelectAllForRole(activeRoleDefinition.id, true)}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    Centang Semua
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSelectAllForRole(activeRoleDefinition.id, false)}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    Batal Centang
                  </button>
                </div>
              )}
            </div>

            {/* Notice if ADMIN */}
            {activeRoleDefinition.id === 'ADMIN' && (
              <div className="p-3.5 bg-purple-50 border border-purple-200 rounded-2xl flex items-center space-x-3 text-purple-900 text-xs">
                <ShieldCheck className="w-5 h-5 text-purple-700 shrink-0" />
                <span>
                  Peran <strong>ADMINISTRATOR (Super Admin)</strong> adalah pemilik otoritas tertinggi dan memiliki hak akses ke seluruh 23 modul sistem tanpa batasan.
                </span>
              </div>
            )}

            {/* Modules Checkboxes Grouped by Category */}
            {(['OPERASIONAL', 'BILLING', 'KEUANGAN', 'LOGISTIK', 'TATA KELOLA'] as const).map((cat) => {
              const catModules = SYSTEM_MODULES.filter((m) => m.category === cat);

              return (
                <div key={cat} className="space-y-2.5">
                  <div className="flex items-center space-x-2">
                    <span className="text-[11px] font-black tracking-wider text-slate-400 uppercase">
                      Kategori: {cat} ({catModules.length} Modul)
                    </span>
                    <div className="h-px bg-slate-200 flex-1" />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {catModules.map((mod) => {
                      const isChecked =
                        activeRoleDefinition.id === 'ADMIN' ||
                        activeRoleDefinition.permissions.includes(mod.id);

                      return (
                        <div
                          key={mod.id}
                          onClick={() => {
                            if (activeRoleDefinition.id !== 'ADMIN') {
                              handleToggleModulePermission(activeRoleDefinition.id, mod.id);
                            }
                          }}
                          className={`p-3.5 rounded-2xl border transition-all flex items-start space-x-3 ${
                            activeRoleDefinition.id === 'ADMIN'
                              ? 'bg-slate-50 border-slate-200 cursor-default'
                              : isChecked
                              ? 'bg-sky-50/60 border-sky-300 cursor-pointer shadow-xs'
                              : 'bg-white border-slate-200 hover:border-slate-300 cursor-pointer'
                          }`}
                        >
                          <div className="pt-0.5 shrink-0">
                            {isChecked ? (
                              <CheckSquare className="w-5 h-5 text-sky-600" />
                            ) : (
                              <Square className="w-5 h-5 text-slate-300" />
                            )}
                          </div>

                          <div className="min-w-0 flex-1">
                            <span className="font-bold text-slate-900 text-xs sm:text-sm block">
                              {mod.name}
                            </span>
                            <span className="text-slate-500 text-[11px] leading-relaxed block mt-0.5">
                              {mod.description}
                            </span>
                            <span className="font-mono text-[9px] text-slate-400 mt-1 block">
                              id: {mod.id}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ===================== MODAL 1: ADD / EDIT USER ===================== */}
      {isUserModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center space-x-2 text-slate-900">
                <UserCog className="w-5 h-5 text-sky-600" />
                <h3 className="text-base font-bold">
                  {editingUserId ? 'Edit Akun Pengguna' : 'Tambah Pengguna Baru'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsUserModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveUser} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Nama Lengkap Pengguna <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Bpk. Bambang Irawan"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Email Akun Google <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="contoh: bambang@gmail.com"
                  value={userEmail}
                  onChange={(e) => setUserEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-mono focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  Digunakan untuk identifikasi otorisasi akun pengelola SIM-TIRTA.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Password Akun Pengurus <span className="text-rose-500">*</span>
                </label>
                <input
                  type="password"
                  required
                  placeholder="Masukkan password login (min. 6 karakter)"
                  value={userPassword}
                  onChange={(e) => setUserPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-mono focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  Password rahasia untuk masuk ke panel administrasi. {editingUserId && '(Ubah jika ingin mengganti password akun)'}
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Peran Otorisasi (Role) <span className="text-rose-500">*</span>
                </label>
                <select
                  value={userRole}
                  onChange={(e) => setUserRole(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold focus:ring-2 focus:ring-sky-500 focus:outline-none bg-white"
                >
                  {roles.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name} ({r.id})
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-slate-500 mt-1">
                  Hak akses menu & modul akan otomatis mengikuti konfigurasi peran yang dipilih.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Nomor Kontak WhatsApp
                </label>
                <input
                  type="tel"
                  placeholder="081234567890"
                  value={userPhone}
                  onChange={(e) => setUserPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-mono focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Status Akun
                </label>
                <div className="flex items-center space-x-3">
                  <label className="flex items-center space-x-2 text-xs font-semibold text-slate-700 cursor-pointer">
                    <input
                      type="radio"
                      name="status"
                      value="ACTIVE"
                      checked={userStatus === 'ACTIVE'}
                      onChange={() => setUserStatus('ACTIVE')}
                      className="text-sky-600 focus:ring-sky-500"
                    />
                    <span>Aktif</span>
                  </label>
                  <label className="flex items-center space-x-2 text-xs font-semibold text-slate-700 cursor-pointer">
                    <input
                      type="radio"
                      name="status"
                      value="INACTIVE"
                      checked={userStatus === 'INACTIVE'}
                      onChange={() => setUserStatus('INACTIVE')}
                      className="text-sky-600 focus:ring-sky-500"
                    />
                    <span>Nonaktif</span>
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsUserModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="bg-sky-600 hover:bg-sky-700 text-white px-5 py-2 rounded-xl text-xs font-bold shadow-md transition cursor-pointer"
                >
                  {editingUserId ? 'Simpan Perubahan' : 'Tambah Pengguna'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================== MODAL 2: CREATE CUSTOM ROLE ===================== */}
      {isRoleModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center space-x-2 text-slate-900">
                <Shield className="w-5 h-5 text-sky-600" />
                <h3 className="text-base font-bold">Buat Peran Baru (Custom Role)</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsRoleModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveNewRole} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Kode Peran (ID Huruf Besar) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: BENDAHARA, TEKNISI, OPERATOR"
                  value={roleCode}
                  onChange={(e) => setRoleCode(e.target.value.toUpperCase())}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm font-mono font-bold uppercase focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Nama Peran Tampilan <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Bendahara Keuangan Desa"
                  value={roleName}
                  onChange={(e) => setRoleName(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Deskripsi Tanggung Jawab
                </label>
                <textarea
                  rows={2}
                  placeholder="Keterangan lingkup wewenang peran ini..."
                  value={roleDescription}
                  onChange={(e) => setRoleDescription(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Warna Label Badge
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: 'Biru Langit', val: 'bg-sky-100 text-sky-800 border-sky-200' },
                    { label: 'Hijau Zamrud', val: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
                    { label: 'Kuning Amber', val: 'bg-amber-100 text-amber-800 border-amber-200' },
                    { label: 'Ungu Violet', val: 'bg-purple-100 text-purple-800 border-purple-200' },
                    { label: 'Merah Rose', val: 'bg-rose-100 text-rose-800 border-rose-200' },
                    { label: 'Indigo Gelap', val: 'bg-indigo-100 text-indigo-800 border-indigo-200' },
                  ].map((color) => (
                    <button
                      key={color.val}
                      type="button"
                      onClick={() => setRoleBadgeColor(color.val)}
                      className={`p-2 rounded-xl border text-xs font-bold flex items-center justify-between cursor-pointer ${
                        color.val
                      } ${roleBadgeColor === color.val ? 'ring-2 ring-slate-900' : ''}`}
                    >
                      <span>{color.label}</span>
                      {roleBadgeColor === color.val && <Check className="w-3.5 h-3.5" />}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700 uppercase">
                    Pilih Modul yang Boleh Diakses ({roleSelectedPermissions.length} Modul)
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      if (roleSelectedPermissions.length === SYSTEM_MODULES.length) {
                        setRoleSelectedPermissions(['dashboard', 'transparency']);
                      } else {
                        setRoleSelectedPermissions(SYSTEM_MODULES.map((m) => m.id));
                      }
                    }}
                    className="text-[11px] font-bold text-sky-600 hover:underline"
                  >
                    {roleSelectedPermissions.length === SYSTEM_MODULES.length ? 'Reset' : 'Pilih Semua'}
                  </button>
                </div>

                <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-xl p-2.5 space-y-1.5 bg-slate-50">
                  {SYSTEM_MODULES.map((m) => {
                    const checked = roleSelectedPermissions.includes(m.id);
                    return (
                      <label
                        key={m.id}
                        className="flex items-center space-x-2 text-xs text-slate-800 p-1.5 rounded-lg hover:bg-white cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setRoleSelectedPermissions([...roleSelectedPermissions, m.id]);
                            } else {
                              setRoleSelectedPermissions(roleSelectedPermissions.filter((p) => p !== m.id));
                            }
                          }}
                          className="rounded text-sky-600 focus:ring-sky-500"
                        />
                        <span className="font-semibold">{m.name}</span>
                        <span className="text-[10px] text-slate-400 font-mono">({m.category})</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsRoleModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="bg-sky-600 hover:bg-sky-700 text-white px-5 py-2 rounded-xl text-xs font-bold shadow-md transition cursor-pointer flex items-center space-x-1.5"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Simpan Peran Baru</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
