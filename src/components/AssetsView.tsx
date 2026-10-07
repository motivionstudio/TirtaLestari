// SIM-TIRTA LESTARI Assets & Maintenance View
// Pengelolaan Aset Pompa, Tandon, Meter Induk & Riwayat Pemeliharaan Jaringan Pipa

import React, { useState } from 'react';
import { Asset, Maintenance } from '../types';
import { AppStorage } from '../services/storage';
import { AuditLogger } from '../services/audit';
import {
  Box,
  Wrench,
  Plus,
  Search,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Calendar,
  X,
} from 'lucide-react';

export const AssetsView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'ASSETS' | 'MAINTENANCE'>('ASSETS');
  const [assets, setAssets] = useState<Asset[]>(() => AppStorage.getAssets());
  const [maintenance, setMaintenance] = useState<Maintenance[]>(() => AppStorage.getMaintenance());

  // Modal State Asset
  const [isAssetModalOpen, setIsAssetModalOpen] = useState(false);
  const [assetName, setAssetName] = useState('');
  const [assetCategory, setAssetCategory] = useState<Asset['category']>('Pompa');
  const [assetValue, setAssetValue] = useState<number>(0);
  const [assetLocation, setAssetLocation] = useState('');
  const [assetCondition, setAssetCondition] = useState<Asset['condition']>('BAIK');

  // Modal State Maintenance
  const [isMntModalOpen, setIsMntModalOpen] = useState(false);
  const [mntAsset, setMntAsset] = useState('');
  const [mntLocation, setMntLocation] = useState('');
  const [mntIssue, setMntIssue] = useState('');
  const [mntAction, setMntAction] = useState('');
  const [mntCost, setMntCost] = useState<number>(0);
  const [mntTech, setMntTech] = useState('Mas Joko');
  const [mntStatus, setMntStatus] = useState<Maintenance['status']>('SELESAI');

  const handleSaveAsset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!assetName.trim()) return;

    const newId = `AST-${String(assets.length + 1).padStart(3, '0')}`;
    const newAsset: Asset = {
      asset_id: newId,
      asset_code: `AST-KPS-${Math.floor(100 + Math.random() * 900)}`,
      asset_name: assetName.trim(),
      category: assetCategory,
      purchase_date: new Date().toISOString().substring(0, 10),
      purchase_value: assetValue,
      location: assetLocation.trim(),
      condition: assetCondition,
      status: 'AKTIF',
    };

    const updated = [newAsset, ...assets];
    setAssets(updated);
    AppStorage.setAssets(updated);

    AuditLogger.log({
      user: 'Super Admin',
      role: 'ADMIN',
      action: 'SYSTEM SETUP',
      module: 'ASSETS',
      record_id: newId,
      new_value_summary: `Tambah data aset: ${assetName} (${newId})`,
    });

    setIsAssetModalOpen(false);
  };

  const handleSaveMaintenance = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mntAsset.trim() || !mntIssue.trim()) return;

    const newId = `MNT-${Date.now().toString().slice(-6)}`;
    const newEntry: Maintenance = {
      maintenance_id: newId,
      date: new Date().toISOString().substring(0, 10),
      asset_or_network: mntAsset.trim(),
      location: mntLocation.trim(),
      issue: mntIssue.trim(),
      action: mntAction.trim(),
      cost: mntCost,
      technician: mntTech.trim(),
      status: mntStatus,
    };

    const updated = [newEntry, ...maintenance];
    setMaintenance(updated);
    AppStorage.setMaintenance(updated);

    // Catat ke Kas Keluar jika ada biaya
    if (mntCost > 0) {
      const cashOuts = AppStorage.getCashOut();
      cashOuts.unshift({
        transaction_id: `COUT-${Date.now()}`,
        date: newEntry.date,
        category: 'PERAWATAN',
        description: `Pemeliharaan ${mntAsset}: ${mntIssue}`,
        amount: mntCost,
        recipient: mntTech,
        proof_number: newId,
        requested_by: mntTech,
        approved_by: 'Pak H. Sugiyanto',
        created_by: 'Mas Joko',
        created_at: new Date().toISOString().replace('T', ' ').substring(0, 19),
      });
      AppStorage.setCashOut(cashOuts);
    }

    AuditLogger.log({
      user: mntTech,
      role: 'PETUGAS',
      action: 'CREATE EXPENSE',
      module: 'MAINTENANCE',
      record_id: newId,
      new_value_summary: `Pemeliharaan ${mntAsset}: ${mntIssue}, Biaya Rp ${mntCost.toLocaleString('id-ID')}`,
    });

    setIsMntModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 flex items-center space-x-2">
            <Box className="w-7 h-7 text-sky-600" />
            <span>Aset & Pemeliharaan Sarana Air</span>
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Data inventaris pompa submersible, menara tandon, pipa distribusi, serta agenda servis berkala.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {activeTab === 'ASSETS' ? (
            <button
              onClick={() => setIsAssetModalOpen(true)}
              className="bg-sky-600 hover:bg-sky-700 text-white px-4 py-2.5 rounded-xl font-bold flex items-center space-x-1.5 shadow transition cursor-pointer text-sm"
            >
              <Plus className="w-4 h-4" />
              <span>+ Tambah Aset</span>
            </button>
          ) : (
            <button
              onClick={() => setIsMntModalOpen(true)}
              className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2.5 rounded-xl font-bold flex items-center space-x-1.5 shadow transition cursor-pointer text-sm"
            >
              <Plus className="w-4 h-4" />
              <span>+ Catat Pemeliharaan</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 space-x-4">
        <button
          onClick={() => setActiveTab('ASSETS')}
          className={`pb-3 font-bold text-sm transition border-b-2 flex items-center space-x-2 cursor-pointer ${
            activeTab === 'ASSETS'
              ? 'border-sky-600 text-sky-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Box className="w-4 h-4" />
          <span>Daftar Aset Fisik</span>
          <span className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full">
            {assets.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('MAINTENANCE')}
          className={`pb-3 font-bold text-sm transition border-b-2 flex items-center space-x-2 cursor-pointer ${
            activeTab === 'MAINTENANCE'
              ? 'border-sky-600 text-sky-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Wrench className="w-4 h-4" />
          <span>Log Pemeliharaan & Perbaikan</span>
          <span className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full">
            {maintenance.length}
          </span>
        </button>
      </div>

      {/* TAB ASET */}
      {activeTab === 'ASSETS' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {assets.map((ast) => (
            <div
              key={ast.asset_id}
              className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-xs font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded">
                    {ast.asset_code}
                  </span>
                  <span
                    className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                      ast.condition === 'BAIK'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {ast.condition}
                  </span>
                </div>

                <h3 className="font-extrabold text-slate-900 text-base">{ast.asset_name}</h3>
                <span className="text-xs text-slate-500 block mt-0.5">Kategori: {ast.category}</span>
                <span className="text-xs text-slate-600 block mt-1">Lokasi: {ast.location}</span>
                {ast.notes && <p className="text-xs text-slate-500 italic mt-2">&ldquo;{ast.notes}&rdquo;</p>}
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-mono">
                <span className="text-slate-400">Nilai Aset:</span>
                <span className="font-bold text-slate-800">
                  Rp {ast.purchase_value.toLocaleString('id-ID')}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB PEMELIHARAAN */}
      {activeTab === 'MAINTENANCE' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50 text-slate-600 text-xs font-bold uppercase tracking-wider border-b border-slate-200">
                  <th className="py-3 px-4">Tanggal & ID</th>
                  <th className="py-3 px-4">Aset / Jaringan</th>
                  <th className="py-3 px-4">Kendala / Kerusakan</th>
                  <th className="py-3 px-4">Tindakan Perbaikan</th>
                  <th className="py-3 px-4 text-right">Biaya (Rp)</th>
                  <th className="py-3 px-4">Teknisi</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {maintenance.map((m) => (
                  <tr key={m.maintenance_id} className="hover:bg-slate-50/80">
                    <td className="py-3.5 px-4 whitespace-nowrap font-mono text-xs">
                      <span className="font-bold text-slate-800 block">{m.date}</span>
                      <span className="text-slate-400">{m.maintenance_id}</span>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{m.asset_or_network}</div>
                      <div className="text-xs text-slate-500">{m.location}</div>
                    </td>

                    <td className="py-3.5 px-4 text-xs text-slate-700">{m.issue}</td>

                    <td className="py-3.5 px-4 text-xs font-medium text-slate-800">{m.action}</td>

                    <td className="py-3.5 px-4 text-right font-mono font-bold text-rose-700 whitespace-nowrap">
                      Rp {m.cost.toLocaleString('id-ID')}
                    </td>

                    <td className="py-3.5 px-4 text-xs font-semibold text-slate-700">
                      {m.technician}
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="text-xs font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                        {m.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Asset */}
      {isAssetModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-lg font-bold text-slate-800 pb-3 border-b border-slate-200">
              Tambah Data Aset KPSPAM
            </h3>
            <form onSubmit={handleSaveAsset} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Nama Aset
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Pompa Submersible 3 HP"
                  value={assetName}
                  onChange={(e) => setAssetName(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Kategori
                  </label>
                  <select
                    value={assetCategory}
                    onChange={(e) => setAssetCategory(e.target.value as Asset['category'])}
                    className="w-full p-2.5 border border-slate-300 rounded-xl"
                  >
                    <option value="Pompa">Pompa</option>
                    <option value="Tandon">Tandon</option>
                    <option value="Meter Induk">Meter Induk</option>
                    <option value="Pipa Utama">Pipa Utama</option>
                    <option value="Peralatan Teknis">Peralatan Teknis</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Kondisi
                  </label>
                  <select
                    value={assetCondition}
                    onChange={(e) => setAssetCondition(e.target.value as Asset['condition'])}
                    className="w-full p-2.5 border border-slate-300 rounded-xl"
                  >
                    <option value="BAIK">Baik</option>
                    <option value="RUSAK RINGAN">Rusak Ringan</option>
                    <option value="RUSAK BERAT">Rusak Berat</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Nilai Pembelian (Rp)
                </label>
                <input
                  type="number"
                  min={0}
                  value={assetValue || ''}
                  onChange={(e) => setAssetValue(Number(e.target.value))}
                  className="w-full p-2.5 border border-slate-300 rounded-xl font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Lokasi Fisik
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Menara RT 01 Ngawu"
                  value={assetLocation}
                  onChange={(e) => setAssetLocation(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-xl"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAssetModalOpen(false)}
                  className="px-4 py-2 border rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-sky-600 text-white font-bold rounded-xl"
                >
                  Simpan Aset
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Maintenance */}
      {isMntModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-lg font-bold text-slate-800 pb-3 border-b border-slate-200">
              Catat Pemeliharaan / Perbaikan Jaringan
            </h3>
            <form onSubmit={handleSaveMaintenance} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Aset / Wilayah Jaringan Pipa
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Pipa Distribusi RT 02 Dusun Ngawu"
                  value={mntAsset}
                  onChange={(e) => setMntAsset(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Kendala / Masalah yang Terjadi
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Kebocoran klem sambungan nepel pipa"
                  value={mntIssue}
                  onChange={(e) => setMntIssue(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Tindakan Penanganan yang Dilakukan
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="Contoh: Penggantian socket compression HDPE 1 inch dan pengencangan baut flange."
                  value={mntAction}
                  onChange={(e) => setMntAction(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-xl text-sm"
                ></textarea>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Biaya Material & Jasa (Rp)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={mntCost || ''}
                    onChange={(e) => setMntCost(Number(e.target.value))}
                    className="w-full p-2.5 border border-slate-300 rounded-xl font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Teknisi Lapangan
                  </label>
                  <input
                    type="text"
                    value={mntTech}
                    onChange={(e) => setMntTech(e.target.value)}
                    className="w-full p-2.5 border border-slate-300 rounded-xl"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsMntModalOpen(false)}
                  className="px-4 py-2 border rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-600 text-white font-bold rounded-xl"
                >
                  Simpan Catatan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
