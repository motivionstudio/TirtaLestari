// SIM-TIRTA LESTARI Mini CMS & Announcements View
// Kelola Profil Website Publik, Pengumuman Desa, dan Banner Gangguan Darurat

import React, { useState } from 'react';
import { Announcement, AppSettings } from '../types';
import { AppStorage } from '../services/storage';
import { AuditLogger } from '../services/audit';
import {
  Megaphone,
  Globe,
  Plus,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Save,
  Clock,
  MapPin,
  X,
} from 'lucide-react';

export const WebsiteCmsView: React.FC = () => {
  const [announcements, setAnnouncements] = useState<Announcement[]>(() =>
    AppStorage.getAnnouncements()
  );
  const [settings, setSettings] = useState<AppSettings>(() => AppStorage.getSettings());
  const [activeTab, setActiveTab] = useState<'ANNOUNCEMENTS' | 'PROFILE'>('ANNOUNCEMENTS');

  // Modal Announcement State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAnn, setEditingAnn] = useState<Announcement | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState<Announcement['category']>('PENGUMUMAN');
  const [startDate, setStartDate] = useState(() => new Date().toISOString().substring(0, 10));
  const [endDate, setEndDate] = useState(() => new Date().toISOString().substring(0, 10));
  const [affectedArea, setAffectedArea] = useState('');
  const [isUrgentBanner, setIsUrgentBanner] = useState(false);
  const [status, setStatus] = useState<Announcement['status']>('PUBLISHED');

  const handleOpenAddModal = () => {
    setEditingAnn(null);
    setTitle('');
    setContent('');
    setCategory('PENGUMUMAN');
    setStartDate(new Date().toISOString().substring(0, 10));
    setEndDate(new Date().toISOString().substring(0, 10));
    setAffectedArea('');
    setIsUrgentBanner(false);
    setStatus('PUBLISHED');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (a: Announcement) => {
    setEditingAnn(a);
    setTitle(a.title);
    setContent(a.content);
    setCategory(a.category);
    setStartDate(a.start_date);
    setEndDate(a.end_date);
    setAffectedArea(a.affected_area || '');
    setIsUrgentBanner(Boolean(a.is_urgent_banner));
    setStatus(a.status);
    setIsModalOpen(true);
  };

  const handleSaveAnnouncement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);

    if (editingAnn) {
      const updated = announcements.map((a) => {
        if (a.announcement_id === editingAnn.announcement_id) {
          return {
            ...a,
            title: title.trim(),
            content: content.trim(),
            category,
            start_date: startDate,
            end_date: endDate,
            affected_area: affectedArea.trim(),
            is_urgent_banner: isUrgentBanner,
            status,
          };
        }
        return a;
      });

      setAnnouncements(updated);
      AppStorage.setAnnouncements(updated);
      AuditLogger.log({
        user: 'Admin Web',
        role: 'ADMIN',
        action: 'CHANGE SETTINGS',
        module: 'CMS',
        record_id: editingAnn.announcement_id,
        new_value_summary: `Update pengumuman: ${title}`,
      });
    } else {
      const newAnn: Announcement = {
        announcement_id: `ANN-${Date.now().toString().slice(-4)}`,
        title: title.trim(),
        content: content.trim(),
        category,
        start_date: startDate,
        end_date: endDate,
        status,
        affected_area: affectedArea.trim(),
        is_urgent_banner: isUrgentBanner,
        created_by: 'Super Admin',
        created_at: nowStr,
      };

      const updated = [newAnn, ...announcements];
      setAnnouncements(updated);
      AppStorage.setAnnouncements(updated);
      AuditLogger.log({
        user: 'Admin Web',
        role: 'ADMIN',
        action: 'CHANGE SETTINGS',
        module: 'CMS',
        record_id: newAnn.announcement_id,
        new_value_summary: `Buat pengumuman baru: ${title}`,
      });
    }

    setIsModalOpen(false);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    AppStorage.setSettings(settings);
    AuditLogger.log({
      user: 'Super Admin',
      role: 'ADMIN',
      action: 'CHANGE SETTINGS',
      module: 'CMS',
      record_id: 'ORG_PROFILE',
      new_value_summary: 'Update profil informasi landing page publik KPSPAM',
    });
    alert('Profil website publik berhasil diperbarui!');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 flex items-center space-x-2">
            <Megaphone className="w-7 h-7 text-sky-600" />
            <span>Kelola Website & Pengumuman Publik</span>
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Pengurus dapat memperbarui profil desa, kontak, dan siaran pengumuman tanpa mengedit kode HTML.
          </p>
        </div>

        {activeTab === 'ANNOUNCEMENTS' && (
          <button
            onClick={handleOpenAddModal}
            className="bg-sky-600 hover:bg-sky-700 text-white px-5 py-3 rounded-xl font-bold flex items-center space-x-2 shadow-md transition cursor-pointer self-start md:self-auto"
          >
            <Plus className="w-5 h-5" />
            <span>+ Publikasikan Pengumuman</span>
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 space-x-4">
        <button
          onClick={() => setActiveTab('ANNOUNCEMENTS')}
          className={`pb-3 font-bold text-sm transition border-b-2 flex items-center space-x-2 cursor-pointer ${
            activeTab === 'ANNOUNCEMENTS'
              ? 'border-sky-600 text-sky-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Megaphone className="w-4 h-4" />
          <span>Pengumuman & Info Gangguan</span>
        </button>

        <button
          onClick={() => setActiveTab('PROFILE')}
          className={`pb-3 font-bold text-sm transition border-b-2 flex items-center space-x-2 cursor-pointer ${
            activeTab === 'PROFILE'
              ? 'border-sky-600 text-sky-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Globe className="w-4 h-4" />
          <span>Profil Organisasi & Kontak Publik</span>
        </button>
      </div>

      {/* TAB 1: PENGUMUMAN */}
      {activeTab === 'ANNOUNCEMENTS' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {announcements.map((a) => (
            <div
              key={a.announcement_id}
              className={`p-6 rounded-2xl border-2 transition-all flex flex-col justify-between ${
                a.is_urgent_banner
                  ? 'bg-rose-50/80 border-rose-300'
                  : 'bg-white border-slate-200 hover:border-sky-300 shadow-xs'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span
                    className={`text-xs font-black uppercase px-2.5 py-1 rounded-full ${
                      a.category === 'GANGGUAN'
                        ? 'bg-rose-600 text-white'
                        : a.category === 'PEMELIHARAAN'
                        ? 'bg-amber-500 text-white'
                        : 'bg-sky-100 text-sky-800'
                    }`}
                  >
                    {a.category}
                  </span>

                  <span
                    className={`text-xs font-bold px-2 py-0.5 rounded ${
                      a.status === 'PUBLISHED'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {a.status}
                  </span>
                </div>

                <h3 className="text-lg font-black text-slate-900 mb-2 leading-snug">
                  {a.title}
                </h3>

                <p className="text-sm text-slate-700 leading-relaxed mb-4">{a.content}</p>

                {a.affected_area && (
                  <div className="flex items-center space-x-1.5 text-xs text-rose-700 font-bold bg-white/70 p-2 rounded-lg border border-rose-200 mb-3">
                    <MapPin className="w-4 h-4 shrink-0" />
                    <span>Wilayah Terdampak: {a.affected_area}</span>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
                <span>
                  Berlaku: {a.start_date} s/d {a.end_date}
                </span>
                <button
                  onClick={() => handleOpenEditModal(a)}
                  className="text-sky-700 hover:underline font-bold cursor-pointer"
                >
                  Edit Pengumuman
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 2: PROFIL KPSPAM */}
      {activeTab === 'PROFILE' && (
        <form onSubmit={handleSaveProfile} className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6 max-w-3xl">
          <h2 className="text-lg font-bold text-slate-800 border-b pb-3">
            Informasi Profil Landing Page KPSPAM Tirta Lestari
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Nama Organisasi
              </label>
              <input
                type="text"
                value={settings.ORG_NAME}
                onChange={(e) => setSettings({ ...settings, ORG_NAME: e.target.value })}
                className="w-full p-3 border border-slate-300 rounded-xl font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Tagline Slogan
              </label>
              <input
                type="text"
                value={settings.ORG_TAGLINE}
                onChange={(e) => setSettings({ ...settings, ORG_TAGLINE: e.target.value })}
                className="w-full p-3 border border-slate-300 rounded-xl"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Kalurahan
              </label>
              <input
                type="text"
                value={settings.ORG_VILLAGE}
                onChange={(e) => setSettings({ ...settings, ORG_VILLAGE: e.target.value })}
                className="w-full p-3 border border-slate-300 rounded-xl"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Kapanewon
              </label>
              <input
                type="text"
                value={settings.ORG_DISTRICT}
                onChange={(e) => setSettings({ ...settings, ORG_DISTRICT: e.target.value })}
                className="w-full p-3 border border-slate-300 rounded-xl"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Kabupaten
              </label>
              <input
                type="text"
                value={settings.ORG_REGENCY}
                onChange={(e) => setSettings({ ...settings, ORG_REGENCY: e.target.value })}
                className="w-full p-3 border border-slate-300 rounded-xl"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Alamat Kantor / Pos Pelayanan
            </label>
            <input
              type="text"
              value={settings.ORG_ADDRESS}
              onChange={(e) => setSettings({ ...settings, ORG_ADDRESS: e.target.value })}
              className="w-full p-3 border border-slate-300 rounded-xl"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Nomor WhatsApp Hotline Layanan
              </label>
              <input
                type="text"
                value={settings.ORG_PHONE}
                onChange={(e) => setSettings({ ...settings, ORG_PHONE: e.target.value })}
                className="w-full p-3 border border-slate-300 rounded-xl font-mono font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Jam Layanan Loket
              </label>
              <input
                type="text"
                value={settings.ORG_HOURS}
                onChange={(e) => setSettings({ ...settings, ORG_HOURS: e.target.value })}
                className="w-full p-3 border border-slate-300 rounded-xl"
              />
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <button
              type="submit"
              className="bg-sky-600 hover:bg-sky-700 text-white px-8 py-3 rounded-xl font-bold flex items-center space-x-2 shadow-md transition cursor-pointer"
            >
              <Save className="w-5 h-5" />
              <span>Simpan Profil Website</span>
            </button>
          </div>
        </form>
      )}

      {/* MODAL PENGUMUMAN */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-lg font-bold text-slate-800">
                {editingAnn ? 'Edit Pengumuman' : 'Publikasikan Pengumuman Baru'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAnnouncement} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Judul Pengumuman <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Jadwal Pembayaran Rekening Air Oktober..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-xl font-bold text-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Kategori
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as Announcement['category'])}
                    className="w-full p-2.5 border border-slate-300 rounded-xl font-bold"
                  >
                    <option value="PENGUMUMAN">PENGUMUMAN</option>
                    <option value="GANGGUAN">GANGGUAN AIR</option>
                    <option value="PEMELIHARAAN">PEMELIHARAAN</option>
                    <option value="RAPAT">RAPAT WARGA</option>
                    <option value="UMUM">UMUM</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Status
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as Announcement['status'])}
                    className="w-full p-2.5 border border-slate-300 rounded-xl font-bold"
                  >
                    <option value="PUBLISHED">PUBLIKASIKAN</option>
                    <option value="DRAFT">DRAFT</option>
                    <option value="ARCHIVED">ARSIPKAN</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Isi Pengumuman Lengkap
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Tuliskan pesan untuk masyarakat..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full p-3 border border-slate-300 rounded-xl text-sm"
                ></textarea>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Wilayah Terdampak (Jika ada gangguan)
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Dusun Ngawu RT 01 dan 02"
                  value={affectedArea}
                  onChange={(e) => setAffectedArea(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-xl text-sm"
                />
              </div>

              <div className="flex items-center space-x-2 p-3 bg-rose-50 rounded-xl border border-rose-200">
                <input
                  type="checkbox"
                  id="urgentCheck"
                  checked={isUrgentBanner}
                  onChange={(e) => setIsUrgentBanner(e.target.checked)}
                  className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500"
                />
                <label htmlFor="urgentCheck" className="text-xs font-bold text-rose-900 cursor-pointer">
                  Tampilkan sebagai Banner Merah Darurat di Beranda Landing Page Publik
                </label>
              </div>

              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-xl"
                >
                  Simpan & Publikasikan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
