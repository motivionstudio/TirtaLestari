// SIM-TIRTA LESTARI Reports View
// Laporan Keuangan Bulanan, Tahunan & Neraca Kas Kasir

import React, { useState } from 'react';
import { CashIn, CashOut } from '../types';
import { AppStorage } from '../services/storage';
import {
  BarChart3,
  Calendar,
  Printer,
  Download,
  FileSpreadsheet,
  TrendingUp,
  TrendingDown,
  Wallet,
} from 'lucide-react';

export const ReportsView: React.FC = () => {
  const [cashIns] = useState<CashIn[]>(() => AppStorage.getCashIn());
  const [cashOuts] = useState<CashOut[]>(() => AppStorage.getCashOut());
  const settings = AppStorage.getSettings();

  const [periodType, setPeriodType] = useState<'MONTHLY' | 'ANNUAL'>('MONTHLY');
  const [selectedMonth, setSelectedMonth] = useState('2026-09');
  const [selectedYear, setSelectedYear] = useState('2026');

  // Filter cash entries based on selected range
  const filterPrefix = periodType === 'MONTHLY' ? selectedMonth : selectedYear;

  const filteredIn = cashIns.filter((c) => c.date.startsWith(filterPrefix));
  const filteredOut = cashOuts.filter((c) => c.date.startsWith(filterPrefix));

  // Income Breakdown
  const incomeWater = filteredIn
    .filter((c) => c.category === 'REKENING AIR')
    .reduce((sum, c) => sum + (c.amount || 0), 0);

  const incomeConnection = filteredIn
    .filter((c) => c.category === 'SAMBUNGAN BARU')
    .reduce((sum, c) => sum + (c.amount || 0), 0);

  const incomeLateFee = filteredIn
    .filter((c) => c.category === 'DENDA')
    .reduce((sum, c) => sum + (c.amount || 0), 0);

  const incomeOther = filteredIn
    .filter((c) => c.category === 'LAINNYA')
    .reduce((sum, c) => sum + (c.amount || 0), 0);

  const totalIncome = incomeWater + incomeConnection + incomeLateFee + incomeOther;

  // Expense Breakdown
  const categories = [
    'LISTRIK',
    'PERAWATAN',
    'PIPA',
    'POMPA',
    'HONOR',
    'ADMINISTRASI',
    'OPERASIONAL',
    'LAINNYA',
  ] as const;

  const expenseBreakdown = categories.map((cat) => {
    const total = filteredOut
      .filter((c) => c.category === cat)
      .reduce((sum, c) => sum + (c.amount || 0), 0);
    return { category: cat, total };
  });

  const totalExpense = expenseBreakdown.reduce((sum, item) => sum + item.total, 0);

  // Initial balance estimation
  const openingBalance = 8500000;
  const closingBalance = openingBalance + totalIncome - totalExpense;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Top Banner (No Print) */}
      <div className="no-print bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 flex items-center space-x-2">
            <BarChart3 className="w-7 h-7 text-sky-600" />
            <span>Laporan Keuangan & Neraca Kas</span>
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Rekapitulasi resmi pendapatan rekening air, sambungan baru, dan rincian pengeluaran operasional.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2 bg-slate-50 p-2 rounded-xl border border-slate-300">
            <select
              value={periodType}
              onChange={(e) => setPeriodType(e.target.value as 'MONTHLY' | 'ANNUAL')}
              className="bg-white font-bold text-slate-800 border border-slate-300 rounded-lg px-2.5 py-1 text-sm"
            >
              <option value="MONTHLY">Bulanan</option>
              <option value="ANNUAL">Tahunan</option>
            </select>

            {periodType === 'MONTHLY' ? (
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="bg-white font-bold text-slate-800 border border-slate-300 rounded-lg px-2.5 py-1 text-sm font-mono"
              >
                <option value="2026-10">Oktober 2026</option>
                <option value="2026-09">September 2026</option>
                <option value="2026-08">Agustus 2026</option>
              </select>
            ) : (
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="bg-white font-bold text-slate-800 border border-slate-300 rounded-lg px-2.5 py-1 text-sm font-mono"
              >
                <option value="2026">Tahun 2026</option>
                <option value="2025">Tahun 2025</option>
              </select>
            )}
          </div>

          <button
            onClick={handlePrint}
            className="bg-sky-600 hover:bg-sky-700 text-white px-5 py-2.5 rounded-xl font-bold flex items-center space-x-2 shadow-md transition cursor-pointer"
          >
            <Printer className="w-5 h-5" />
            <span>Cetak Laporan</span>
          </button>
        </div>
      </div>

      {/* LEMBAR LAPORAN RESMI (PRINT TARGET) */}
      <div id="printable-receipt" className="bg-white p-8 rounded-2xl border-2 border-slate-300 shadow-sm max-w-4xl mx-auto space-y-6">
        {/* Header Resmi */}
        <div className="text-center border-b-2 border-slate-800 pb-4">
          <h2 className="text-2xl font-black text-slate-900 tracking-tight uppercase">
            {settings.ORG_NAME}
          </h2>
          <p className="text-sm font-bold text-slate-700">
            {settings.ORG_VILLAGE}, {settings.ORG_DISTRICT}, {settings.ORG_REGENCY}
          </p>
          <p className="text-xs text-slate-500">{settings.ORG_ADDRESS}</p>
          <div className="inline-block mt-3 px-4 py-1 bg-sky-50 border border-sky-300 rounded-full text-xs font-black text-sky-800 uppercase tracking-wider">
            LAPORAN PERTANGGUNGJAWABAN ARUS KAS &bull; PERIODE {filterPrefix}
          </div>
        </div>

        {/* Ringkasan Saldo 3 Kotak */}
        <div className="grid grid-cols-3 gap-4">
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-xs font-bold text-slate-500 uppercase block">Saldo Awal</span>
            <span className="text-xl font-black text-slate-800 font-mono mt-1 block">
              Rp {openingBalance.toLocaleString('id-ID')}
            </span>
          </div>

          <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200">
            <span className="text-xs font-bold text-emerald-800 uppercase block">
              Total Penerimaan
            </span>
            <span className="text-xl font-black text-emerald-700 font-mono mt-1 block">
              + Rp {totalIncome.toLocaleString('id-ID')}
            </span>
          </div>

          <div className="p-4 bg-rose-50 rounded-xl border border-rose-200">
            <span className="text-xs font-bold text-rose-800 uppercase block">
              Total Pengeluaran
            </span>
            <span className="text-xl font-black text-rose-700 font-mono mt-1 block">
              - Rp {totalExpense.toLocaleString('id-ID')}
            </span>
          </div>
        </div>

        {/* Rincian Pemasukan & Pengeluaran Berdampingan */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Sisi Kiri: Penerimaan Kas */}
          <div className="border border-slate-200 rounded-xl p-4">
            <h3 className="text-sm font-black text-emerald-800 uppercase tracking-wider border-b pb-2 mb-3 flex items-center justify-between">
              <span>I. Penerimaan Kas (Pemasukan)</span>
              <span className="font-mono text-emerald-700">Rp {totalIncome.toLocaleString('id-ID')}</span>
            </h3>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-700">1. Pendapatan Rekening Air</span>
                <span className="font-mono font-bold">Rp {incomeWater.toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-700">2. Biaya Sambungan Rumah Baru</span>
                <span className="font-mono font-bold">
                  Rp {incomeConnection.toLocaleString('id-ID')}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-700">3. Denda Keterlambatan</span>
                <span className="font-mono font-bold">Rp {incomeLateFee.toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-700">4. Pendapatan Lain-Lain</span>
                <span className="font-mono font-bold">Rp {incomeOther.toLocaleString('id-ID')}</span>
              </div>
            </div>
          </div>

          {/* Sisi Kanan: Pengeluaran Kas */}
          <div className="border border-slate-200 rounded-xl p-4">
            <h3 className="text-sm font-black text-rose-800 uppercase tracking-wider border-b pb-2 mb-3 flex items-center justify-between">
              <span>II. Pengeluaran Kas (Biaya)</span>
              <span className="font-mono text-rose-700">Rp {totalExpense.toLocaleString('id-ID')}</span>
            </h3>

            <div className="space-y-2 text-xs">
              {expenseBreakdown.map((exp, idx) => (
                <div
                  key={exp.category}
                  className="flex justify-between py-1 border-b border-slate-100"
                >
                  <span className="text-slate-700">
                    {idx + 1}. Biaya {exp.category}
                  </span>
                  <span className="font-mono font-bold">
                    Rp {exp.total.toLocaleString('id-ID')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Neraca Akhir Bersih */}
        <div className="p-4 bg-sky-50 rounded-xl border-2 border-sky-300 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-sky-800 uppercase tracking-wider block">
              Saldo Akhir Kas & Bank
            </span>
            <span className="text-[11px] text-slate-500">
              Formula: Saldo Awal + Total Penerimaan - Total Pengeluaran
            </span>
          </div>
          <span className="text-2xl font-black text-sky-900 font-mono">
            Rp {closingBalance.toLocaleString('id-ID')}
          </span>
        </div>

        {/* Tanda Tangan Pengurus KPSPAM */}
        <div className="pt-8 border-t-2 border-slate-200 grid grid-cols-2 gap-8 text-center text-xs">
          <div>
            <span className="text-slate-500 block">Mengetahui,</span>
            <span className="font-bold text-slate-800 block">Ketua KPSPAM Tirta Lestari</span>
            <div className="h-16"></div>
            <strong className="text-slate-900 block border-t border-slate-400 max-w-xs mx-auto pt-1 font-bold">
              Pak H. Sugiyanto
            </strong>
          </div>

          <div>
            <span className="text-slate-500 block">Ngawu, {new Date().toLocaleDateString('id-ID')}</span>
            <span className="font-bold text-slate-800 block">Bendahara / Administrator</span>
            <div className="h-16"></div>
            <strong className="text-slate-900 block border-t border-slate-400 max-w-xs mx-auto pt-1 font-bold">
              Sewindu (Admin Keuangan)
            </strong>
          </div>
        </div>
      </div>
    </div>
  );
};
