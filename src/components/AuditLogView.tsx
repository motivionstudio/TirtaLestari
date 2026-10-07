// SIM-TIRTA LESTARI Audit Log View
// Immutable Audit Trail: Mencatat Setiap Perubahan Data Penting

import React, { useState } from 'react';
import { AuditLogEntry } from '../types';
import { AppStorage } from '../services/storage';
import { History, Search, ShieldCheck, Filter } from 'lucide-react';

export const AuditLogView: React.FC = () => {
  const [logs] = useState<AuditLogEntry[]>(() => AppStorage.getAuditLogs());
  const [searchQuery, setSearchQuery] = useState('');
  const [moduleFilter, setModuleFilter] = useState('ALL');

  const filteredLogs = logs.filter((l) => {
    const matchModule = moduleFilter === 'ALL' || l.module === moduleFilter;
    const q = searchQuery.toLowerCase().trim();
    const matchSearch =
      !q ||
      l.user.toLowerCase().includes(q) ||
      l.action.toLowerCase().includes(q) ||
      l.record_id.toLowerCase().includes(q) ||
      (l.new_value_summary && l.new_value_summary.toLowerCase().includes(q));

    return matchModule && matchSearch;
  });

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 flex items-center space-x-2">
            <History className="w-7 h-7 text-sky-600" />
            <span>Audit Log Sistem (Jejak Aktivitas)</span>
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Catatan permanen dan tidak dapat diedit untuk setiap pembayaran, pembatalan transaksi, input meter, dan perubahan tarif.
          </p>
        </div>

        <div className="flex items-center space-x-2 bg-emerald-50 px-3.5 py-2 rounded-xl border border-emerald-200 text-emerald-800 text-xs font-bold">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Immutable Ledger Aktif</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="relative md:col-span-2">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
          <input
            type="text"
            placeholder="Cari user, aksi, ID transaksi, keterangan..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none"
          />
        </div>

        <div>
          <select
            value={moduleFilter}
            onChange={(e) => setModuleFilter(e.target.value)}
            className="w-full py-2.5 px-3 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold focus:outline-none"
          >
            <option value="ALL">Semua Modul</option>
            <option value="PAYMENT">Pembayaran & Kasir</option>
            <option value="METER">Pencatatan Meter</option>
            <option value="CUSTOMERS">Pelanggan</option>
            <option value="BILLING">Tagihan Rekening</option>
            <option value="COMPLAINTS">Pengaduan</option>
            <option value="FINANCE">Keuangan & Kas</option>
            <option value="TARIFFS">Tarif</option>
            <option value="SETTINGS">Pengaturan</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50 text-slate-600 text-xs font-bold uppercase tracking-wider border-b border-slate-200">
                <th className="py-3 px-4">Waktu</th>
                <th className="py-3 px-4">Pengguna & Peran</th>
                <th className="py-3 px-4">Aksi & Modul</th>
                <th className="py-3 px-4">Record ID</th>
                <th className="py-3 px-4">Rincian Perubahan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLogs.map((log) => (
                <tr key={log.log_id} className="hover:bg-slate-50">
                  <td className="py-3.5 px-4 whitespace-nowrap font-mono text-xs text-slate-500">
                    {log.timestamp}
                  </td>

                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <span className="font-bold text-slate-900 block text-xs">{log.user}</span>
                    <span className="text-[10px] text-slate-400 font-semibold uppercase">
                      {log.role}
                    </span>
                  </td>

                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <span className="text-xs font-extrabold text-sky-800 bg-sky-50 px-2 py-0.5 rounded border border-sky-200 block w-max">
                      {log.action}
                    </span>
                    <span className="text-[10px] text-slate-400 mt-0.5 block">{log.module}</span>
                  </td>

                  <td className="py-3.5 px-4 font-mono text-xs text-slate-700 whitespace-nowrap">
                    {log.record_id}
                  </td>

                  <td className="py-3.5 px-4 text-xs text-slate-700">
                    {log.old_value_summary && (
                      <div className="text-rose-600 line-through text-[11px]">
                        Lama: {log.old_value_summary}
                      </div>
                    )}
                    <div className="font-medium">{log.new_value_summary}</div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
