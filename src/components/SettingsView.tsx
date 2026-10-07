// SIM-TIRTA LESTARI Settings & Tariffs Management View
// Kelola Tarif Progresif Per Blok, Versioning, Biaya Beban, Denda, Template WhatsApp & Konfigurasi Sistem

import React, { useState } from 'react';
import { AppSettings, TariffTier } from '../types';
import { AppStorage } from '../services/storage';
import { AuditLogger } from '../services/audit';
import {
  Sliders,
  Save,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
  DollarSign,
  Calendar,
  Layers,
  ShieldCheck,
  RotateCcw,
} from 'lucide-react';

interface SettingsViewProps {
  initialTab?: 'GENERAL' | 'TARIFFS';
}

export const SettingsView: React.FC<SettingsViewProps> = ({ initialTab = 'GENERAL' }) => {
  const [activeTab, setActiveTab] = useState<'GENERAL' | 'TARIFFS'>(initialTab);
  const [settings, setSettings] = useState<AppSettings>(() => AppStorage.getSettings());
  const [tariffs, setTariffs] = useState<TariffTier[]>(() => AppStorage.getTariffs());
  const [saveBanner, setSaveBanner] = useState<string | null>(null);

  const handleSaveGeneralSettings = (e: React.FormEvent) => {
    e.preventDefault();
    AppStorage.setSettings(settings);

    AuditLogger.log({
      user: 'Super Admin',
      role: 'ADMIN',
      action: 'CHANGE SETTINGS',
      module: 'SETTINGS',
      record_id: 'SYSTEM_SETTINGS',
      new_value_summary: `Perubahan pengaturan: Beban Rp ${settings.MONTHLY_FIXED_FEE}, Denda Rp ${settings.LATE_FEE_PER_MONTH}, Jatuh Tempo Tgl ${settings.PAYMENT_DUE_DAY}`,
    });

    setSaveBanner('Pengaturan aplikasi berhasil disimpan ke database!');
    setTimeout(() => setSaveBanner(null), 4000);
  };

  const handleUpdateTariff = (idx: number, field: keyof TariffTier, value: unknown) => {
    const updated = [...tariffs];
    updated[idx] = { ...updated[idx], [field]: value };
    setTariffs(updated);
  };

  const handleSaveTariffs = (e: React.FormEvent) => {
    e.preventDefault();
    AppStorage.setTariffs(tariffs);

    AuditLogger.log({
      user: 'Super Admin',
      role: 'ADMIN',
      action: 'CHANGE TARIFF',
      module: 'TARIFFS',
      record_id: 'ACTIVE_TARIFFS',
      new_value_summary: 'Pembaruan struktur tarif progresif air minum per blok',
    });

    setSaveBanner('Struktur tarif progresif berhasil diperbarui dan disimpan!');
    setTimeout(() => setSaveBanner(null), 4000);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 flex items-center space-x-2">
            <Sliders className="w-7 h-7 text-sky-600" />
            <span>Pengaturan Sistem & Struktur Tarif</span>
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Konfigurasi tarif progresif per blok, biaya beban tetap, denda keterlambatan, dan template WhatsApp.
          </p>
        </div>

        <span className="text-xs bg-sky-50 text-sky-800 font-bold px-3 py-1.5 rounded-xl border border-sky-200">
          Khusus Akses Administrator
        </span>
      </div>

      {saveBanner && (
        <div className="p-4 bg-emerald-50 border-2 border-emerald-300 rounded-xl text-emerald-800 flex items-center space-x-3">
          <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
          <span className="font-bold text-sm">{saveBanner}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-slate-200 space-x-4">
        <button
          onClick={() => setActiveTab('TARIFFS')}
          className={`pb-3 font-bold text-sm transition border-b-2 flex items-center space-x-2 cursor-pointer ${
            activeTab === 'TARIFFS'
              ? 'border-sky-600 text-sky-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Pengaturan Tarif Progresif Per Blok</span>
        </button>

        <button
          onClick={() => setActiveTab('GENERAL')}
          className={`pb-3 font-bold text-sm transition border-b-2 flex items-center space-x-2 cursor-pointer ${
            activeTab === 'GENERAL'
              ? 'border-sky-600 text-sky-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>Beban, Denda & Template WA</span>
        </button>
      </div>

      {/* TAB 1: PENGATURAN TARIF PROGRESIF */}
      {activeTab === 'TARIFFS' && (
        <form onSubmit={handleSaveTariffs} className="space-y-6">
          <div className="bg-amber-50 p-4 rounded-2xl border border-amber-200 text-amber-900 text-xs flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
            <div>
              <strong className="block font-bold text-sm">
                Catatan Penting Dokumen Dasar KPSPAM Tirta Lestari:
              </strong>
              <span>
                Tarif blok 21-30 m³ pada dokumen dasar memiliki perbedaan antara angka (Rp 4.000)
                dan terbilang (lima ribu rupiah). Sistem SIM-TIRTA LESTARI sengaja menyediakan
                pengaturan ini agar Administrator dapat menetapkan tarif yang sah sesuai keputusan musyawarah
                warga tanpa mengubah source code.
              </span>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-slate-800">
              Daftar Jenjang Blok Tarif Air (Sheet TARIFFS)
            </h2>

            <div className="space-y-4">
              {tariffs.map((t, idx) => (
                <div
                  key={t.tariff_id}
                  className="p-4 bg-slate-50 rounded-2xl border border-slate-200 grid grid-cols-1 md:grid-cols-5 gap-4 items-center"
                >
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                      Nama Blok & Keterangan
                    </label>
                    <input
                      type="text"
                      value={t.name}
                      onChange={(e) => handleUpdateTariff(idx, 'name', e.target.value)}
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg text-sm font-bold"
                    />
                    <input
                      type="text"
                      value={t.notes || ''}
                      placeholder="Catatan blok..."
                      onChange={(e) => handleUpdateTariff(idx, 'notes', e.target.value)}
                      className="w-full p-1.5 bg-white border border-slate-200 rounded text-xs text-slate-500 mt-1"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                      Rentang Pemakaian (m³)
                    </label>
                    <div className="flex items-center space-x-1 font-mono text-sm">
                      <input
                        type="number"
                        value={t.minimum_usage}
                        onChange={(e) =>
                          handleUpdateTariff(idx, 'minimum_usage', Number(e.target.value))
                        }
                        className="w-16 p-2 bg-white border border-slate-300 rounded-lg text-center"
                      />
                      <span>s/d</span>
                      <input
                        type="number"
                        value={t.maximum_usage}
                        onChange={(e) =>
                          handleUpdateTariff(idx, 'maximum_usage', Number(e.target.value))
                        }
                        className="w-16 p-2 bg-white border border-slate-300 rounded-lg text-center"
                        title="-1 untuk tidak terbatas"
                      />
                    </div>
                    <span className="text-[10px] text-slate-400 mt-1 block">
                      {t.maximum_usage === -1 ? '(-1 = tak terhingga)' : 'm³ per bulan'}
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                      Tarif per m³ (Rp)
                    </label>
                    <input
                      type="number"
                      value={t.rate_per_m3}
                      onChange={(e) =>
                        handleUpdateTariff(idx, 'rate_per_m3', Number(e.target.value))
                      }
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg font-mono font-bold text-sky-800"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                      Status
                    </label>
                    <select
                      value={t.status}
                      onChange={(e) =>
                        handleUpdateTariff(idx, 'status', e.target.value as 'ACTIVE' | 'INACTIVE')
                      }
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs font-bold"
                    >
                      <option value="ACTIVE">AKTIF</option>
                      <option value="INACTIVE">NONAKTIF</option>
                    </select>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-4">
              <button
                type="submit"
                className="bg-sky-600 hover:bg-sky-700 text-white px-8 py-3 rounded-xl font-bold flex items-center space-x-2 shadow-md transition cursor-pointer"
              >
                <Save className="w-5 h-5" />
                <span>Simpan Perubahan Tarif</span>
              </button>
            </div>
          </div>
        </form>
      )}

      {/* TAB 2: PENGATURAN UMUM, BEBAN, DENDA, WA TEMPLATE */}
      {activeTab === 'GENERAL' && (
        <form onSubmit={handleSaveGeneralSettings} className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-slate-800 border-b pb-2">
              Beban Bulanan, Denda & Sambungan Baru
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Beban Tetap Bulanan (Rp)
                </label>
                <input
                  type="number"
                  value={settings.MONTHLY_FIXED_FEE}
                  onChange={(e) =>
                    setSettings({ ...settings, MONTHLY_FIXED_FEE: Number(e.target.value) })
                  }
                  className="w-full p-3 border border-slate-300 rounded-xl font-mono font-bold"
                />
                <span className="text-[11px] text-slate-500 mt-1 block">Default: Rp 10.000</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Tanggal Batas Bayar (Jatuh Tempo)
                </label>
                <input
                  type="number"
                  min={1}
                  max={31}
                  value={settings.PAYMENT_DUE_DAY}
                  onChange={(e) =>
                    setSettings({ ...settings, PAYMENT_DUE_DAY: Number(e.target.value) })
                  }
                  className="w-full p-3 border border-slate-300 rounded-xl font-mono font-bold"
                />
                <span className="text-[11px] text-slate-500 mt-1 block">
                  Tanggal 28 setiap bulan
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Denda Keterlambatan per Bulan (Rp)
                </label>
                <input
                  type="number"
                  value={settings.LATE_FEE_PER_MONTH}
                  onChange={(e) =>
                    setSettings({ ...settings, LATE_FEE_PER_MONTH: Number(e.target.value) })
                  }
                  className="w-full p-3 border border-slate-300 rounded-xl font-mono font-bold text-rose-700"
                />
                <span className="text-[11px] text-slate-500 mt-1 block">Default: Rp 5.000 / bln</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Biaya Sambungan Baru (Rp)
                </label>
                <input
                  type="number"
                  value={settings.CONNECTION_FEE}
                  onChange={(e) =>
                    setSettings({ ...settings, CONNECTION_FEE: Number(e.target.value) })
                  }
                  className="w-full p-3 border border-slate-300 rounded-xl font-mono font-bold"
                />
                <span className="text-[11px] text-slate-500 mt-1 block">Default: Rp 600.000</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Batas Cicilan Sambungan (Kali)
                </label>
                <input
                  type="number"
                  value={settings.CONNECTION_INSTALLMENTS}
                  onChange={(e) =>
                    setSettings({ ...settings, CONNECTION_INSTALLMENTS: Number(e.target.value) })
                  }
                  className="w-full p-3 border border-slate-300 rounded-xl font-mono font-bold"
                />
                <span className="text-[11px] text-slate-500 mt-1 block">Bisa dicicil 2 kali</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Promo Bulan Pertama Gratis (m³)
                </label>
                <input
                  type="number"
                  value={settings.FIRST_MONTH_FREE_LIMIT}
                  onChange={(e) =>
                    setSettings({ ...settings, FIRST_MONTH_FREE_LIMIT: Number(e.target.value) })
                  }
                  className="w-full p-3 border border-slate-300 rounded-xl font-mono font-bold text-emerald-700"
                />
                <span className="text-[11px] text-slate-500 mt-1 block">Gratis 10 m³ pertama</span>
              </div>
            </div>
          </div>

          {/* TEMPLATE WHATSAPP EDITABLE */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-slate-800 border-b pb-2 flex items-center space-x-2">
              <MessageSquare className="w-5 h-5 text-emerald-600" />
              <span>Template Pesan WhatsApp Otomatis</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Template A: Pengingat Tagihan Rutin
                </label>
                <textarea
                  rows={5}
                  value={settings.WA_TEMPLATE_REMINDER}
                  onChange={(e) =>
                    setSettings({ ...settings, WA_TEMPLATE_REMINDER: e.target.value })
                  }
                  className="w-full p-3 border border-slate-300 rounded-xl font-mono text-xs text-slate-800"
                ></textarea>
                <span className="text-[10px] text-slate-400">
                  Tag: {'{{nama}}'}, {'{{customer_id}}'}, {'{{periode}}'}, {'{{total}}'}, {'{{pemakaian}}'}, {'{{due_day}}'}
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Template B: Peringatan Tunggakan
                </label>
                <textarea
                  rows={5}
                  value={settings.WA_TEMPLATE_ARREARS}
                  onChange={(e) =>
                    setSettings({ ...settings, WA_TEMPLATE_ARREARS: e.target.value })
                  }
                  className="w-full p-3 border border-slate-300 rounded-xl font-mono text-xs text-slate-800"
                ></textarea>
                <span className="text-[10px] text-slate-400">
                  Tag: {'{{nama}}'}, {'{{customer_id}}'}, {'{{jumlah_bulan}}'}, {'{{pokok}}'}, {'{{denda}}'}, {'{{total}}'}
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Template C: Konfirmasi Pembayaran & Kwitansi
                </label>
                <textarea
                  rows={5}
                  value={settings.WA_TEMPLATE_PAYMENT}
                  onChange={(e) =>
                    setSettings({ ...settings, WA_TEMPLATE_PAYMENT: e.target.value })
                  }
                  className="w-full p-3 border border-slate-300 rounded-xl font-mono text-xs text-slate-800"
                ></textarea>
                <span className="text-[10px] text-slate-400">
                  Tag: {'{{nama}}'}, {'{{periode}}'}, {'{{jumlah_bayar}}'}, {'{{nomor_kwitansi}}'}, {'{{kode_verifikasi}}'}
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Template D: Update Pengaduan Warga
                </label>
                <textarea
                  rows={5}
                  value={settings.WA_TEMPLATE_COMPLAINT}
                  onChange={(e) =>
                    setSettings({ ...settings, WA_TEMPLATE_COMPLAINT: e.target.value })
                  }
                  className="w-full p-3 border border-slate-300 rounded-xl font-mono text-xs text-slate-800"
                ></textarea>
                <span className="text-[10px] text-slate-400">
                  Tag: {'{{nama}}'}, {'{{ticket_number}}'}, {'{{status}}'}, {'{{petugas}}'}, {'{{catatan}}'}
                </span>
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <button
                type="submit"
                className="bg-sky-600 hover:bg-sky-700 text-white px-8 py-3 rounded-xl font-bold flex items-center space-x-2 shadow-md transition cursor-pointer"
              >
                <Save className="w-5 h-5" />
                <span>Simpan Pengaturan Aplikasi</span>
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
};
