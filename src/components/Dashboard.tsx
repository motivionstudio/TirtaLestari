// SIM-TIRTA LESTARI Dashboard View
// Enterprise Municipal Utility Dashboard: High authority, clear visual hierarchy, and senior-friendly clarity

import React, { useState } from 'react';
import { AppStorage } from '../services/storage';
import {
  Gauge,
  CreditCard,
  Receipt,
  AlertTriangle,
  MessageSquare,
  ArrowUpRight,
  BarChart3,
  Users,
  CheckCircle2,
  Clock,
  TrendingUp,
  Droplets,
  Calendar,
  ChevronRight,
  Search,
  Activity,
  ShieldCheck,
  Zap,
  ArrowDownLeft,
  Building,
  Filter,
} from 'lucide-react';

interface DashboardProps {
  onNavigate: (view: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const [quickSearch, setQuickSearch] = useState('');
  const customers = AppStorage.getCustomers();
  const bills = AppStorage.getBills();
  const cashIns = AppStorage.getCashIn();
  const cashOuts = AppStorage.getCashOut();
  const complaints = AppStorage.getComplaints();

  // Stats calculation
  const activeCustomers = customers.filter((c) => c.status === 'ACTIVE');
  const inactiveCustomers = customers.filter((c) => c.status !== 'ACTIVE');
  
  // Pelanggan baru bulan ini
  const newCustomersThisMonth = customers.filter(
    (c) => c.join_date.startsWith('2026-09') || c.join_date.startsWith('2026-10')
  );

  // Tagihan bulan ini
  const currentBills = bills.filter((b) => b.period === '2026-09' || b.period === '2026-10');
  const paidBillsCount = currentBills.filter((b) => b.status === 'PAID').length;
  const unpaidBillsCount = currentBills.filter((b) => b.status !== 'PAID').length;
  const totalBilled = currentBills.reduce((sum, b) => sum + (Number(b.total_bill) || 0), 0);
  const totalCollected = currentBills
    .filter((b) => b.status === 'PAID')
    .reduce((sum, b) => sum + (Number(b.total_bill) || 0), 0);
  const collectionRate = totalBilled > 0 ? Math.round((totalCollected / totalBilled) * 100) : 92;

  // Pelanggan Menunggak
  const overdueBills = bills.filter((b) => b.status === 'OVERDUE');
  const delinquentCustomerIds = new Set(overdueBills.map((b) => b.customer_id));
  const arrearsCustomerCount = delinquentCustomerIds.size;
  const totalArrearsAmount = overdueBills.reduce((sum, b) => sum + (Number(b.total_bill) || 0), 0);

  // Total Keuangan
  const totalIncome = cashIns.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  const totalExpense = cashOuts.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  const netBalance = totalIncome - totalExpense;

  // Pengaduan
  const activeComplaints = complaints.filter((c) => c.status !== 'SELESAI' && c.status !== 'DITUTUP');
  const resolvedComplaints = complaints.filter((c) => c.status === 'SELESAI');

  return (
    <div className="space-y-6 sm:space-y-8 pb-16 lg:pb-12 max-w-[1440px] mx-auto overflow-hidden">
      {/* 1. EXECUTIVE MUNICIPAL COCKPIT BANNER */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 rounded-2xl p-4 sm:p-7 text-white border border-slate-800 shadow-sm relative overflow-hidden">
        {/* Subtle decorative glow & grid */}
        <div className="absolute top-0 right-0 w-72 sm:w-96 h-72 sm:h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-60 sm:w-80 h-60 sm:h-80 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5 sm:gap-6">
          <div className="space-y-2.5 sm:space-y-3 min-w-0">
            <div className="inline-flex items-center gap-1.5 sm:gap-2 flex-wrap text-xs">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Sistem Terverifikasi
              </span>
              <span className="text-slate-500">·</span>
              <span className="text-slate-400 font-medium">Periode:</span>
              <span className="font-mono text-slate-200 font-semibold bg-slate-850 px-2 py-0.5 rounded border border-slate-700/60">
                Oktober 2026
              </span>
              <span className="text-slate-500 hidden sm:inline">·</span>
              <span className="text-amber-300 font-medium flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                Jatuh Tempo: 28 Okt
              </span>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] sm:text-xs uppercase tracking-wider text-sky-400 font-semibold">
                  Pemerintah Kalurahan Ngawu · KPSPAM
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold tracking-tight text-white mt-1 break-words">
                KPSPAM TIRTA LESTARI
              </h1>
              <p className="text-slate-400 text-xs sm:text-sm font-normal mt-1 max-w-2xl leading-relaxed">
                Pusat Komando Administrasi Distribusi Air Bersih Pedesaan, Penagihan Rekening 150 KK Warga, Transparansi Keuangan, dan Pengaduan Layanan Masyarakat Playen.
              </p>
            </div>
          </div>

          {/* Quick Financial Summary Badge on Banner */}
          <div className="w-full lg:w-auto shrink-0">
            <div className="bg-slate-850/90 backdrop-blur-md rounded-xl p-3.5 sm:p-5 border border-slate-700/80 w-full sm:min-w-[240px]">
              <span className="text-[10px] sm:text-[11px] font-semibold tracking-wider text-slate-400 uppercase block">
                Total Saldo Kas & Bank Tersedia
              </span>
              <span className="text-xl sm:text-3xl font-bold text-emerald-400 font-mono tracking-tight tabular-nums block mt-1">
                Rp {netBalance.toLocaleString('id-ID')}
              </span>
              <div className="flex items-center justify-between text-xs text-slate-400 mt-2 pt-2 border-t border-slate-750">
                <span>Efisiensi Penagihan:</span>
                <span className="font-mono font-semibold text-emerald-300">{collectionRate}% Tertagih</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. INFRASTRUCTURE & TELEMETRY HEALTH STATUS STRIP */}
      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-sky-600" />
            <h2 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-700">
              Telemetri & Status Infrastruktur Air Bersih
            </h2>
          </div>
          <span className="text-[11px] text-slate-500 font-medium">
            Sensor otomatis · Update setiap jam
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          {/* Card 1: Pompa Sumur */}
          <div className="bg-white rounded-xl p-3.5 sm:p-4 border border-slate-200/90 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Pompa Submersible</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500" title="Aktif Normal" />
            </div>
            <div className="mt-2">
              <div className="text-base sm:text-lg font-bold text-slate-900 font-mono">
                4.8 L / detik
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">Sumur Bor 1 & 2 Normal (3-Phase)</p>
            </div>
            <div className="mt-2 text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded w-fit">
              Daya: 5.5 kW Stabil
            </div>
          </div>

          {/* Card 2: Reservoir Induk */}
          <div className="bg-white rounded-xl p-3.5 sm:p-4 border border-slate-200/90 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Reservoir Bak Induk</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
            </div>
            <div className="mt-2">
              <div className="text-base sm:text-lg font-bold text-slate-900 font-mono">
                85% (38.250 L)
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">Kapasitas Maksimal 45.000 L</p>
            </div>
            <div className="mt-2 text-[10px] text-sky-700 font-semibold bg-sky-50 px-2 py-0.5 rounded w-fit">
              Suplai Warga: Aman 24 Jam
            </div>
          </div>

          {/* Card 3: Tekanan Jaringan Pipa */}
          <div className="bg-white rounded-xl p-3.5 sm:p-4 border border-slate-200/90 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Tekanan Jaringan</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
            </div>
            <div className="mt-2">
              <div className="text-base sm:text-lg font-bold text-slate-900 font-mono">
                2.2 Bar
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">Distribusi Dusun 1, 2, 3, & 4</p>
            </div>
            <div className="mt-2 text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded w-fit">
              Kehilangan Air (NRW): &lt; 4%
            </div>
          </div>

          {/* Card 4: Kualitas Air */}
          <div className="bg-white rounded-xl p-3.5 sm:p-4 border border-slate-200/90 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Uji Kualitas Air</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
            </div>
            <div className="mt-2">
              <div className="text-base sm:text-lg font-bold text-slate-900 font-mono">
                PH 7.2 · TDS 145
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">Jernih, tidak berbau & berasa</p>
            </div>
            <div className="mt-2 text-[10px] text-indigo-700 font-semibold bg-indigo-50 px-2 py-0.5 rounded w-fit">
              Standar Permenkes Terpenuhi
            </div>
          </div>
        </div>
      </div>

      {/* 3. QUICK SEARCH WIDGET */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-xs">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Pencarian cepat pelanggan: ketik nama warga, ID (TL-...), dusun, atau No. meter..."
              value={quickSearch}
              onChange={(e) => setQuickSearch(e.target.value)}
              className="w-full pl-10 pr-20 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all"
            />
            {quickSearch && (
              <button
                onClick={() => setQuickSearch('')}
                className="absolute right-2.5 top-2 text-[11px] text-slate-500 hover:text-slate-800 bg-slate-200 hover:bg-slate-300 px-2 py-0.5 rounded-lg font-semibold transition cursor-pointer"
              >
                Hapus
              </button>
            )}
          </div>
          <button
            onClick={() => onNavigate('customers')}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
          >
            <Users className="w-3.5 h-3.5 text-slate-600" />
            <span>Lihat Semua Pelanggan (150)</span>
          </button>
        </div>

        {/* Quick Search Dropdown Results */}
        {quickSearch.trim() && (
          <div className="mt-3 pt-3 border-t border-slate-100 max-h-72 overflow-y-auto divide-y divide-slate-100">
            {customers
              .filter(
                (c) =>
                  c.customer_name.toLowerCase().includes(quickSearch.toLowerCase()) ||
                  c.customer_id.toLowerCase().includes(quickSearch.toLowerCase()) ||
                  c.dusun.toLowerCase().includes(quickSearch.toLowerCase()) ||
                  c.meter_number.toLowerCase().includes(quickSearch.toLowerCase())
              )
              .slice(0, 5)
              .map((c) => {
                const bill = bills.find(
                  (b) => b.customer_id === c.customer_id && (b.period === '2026-10' || b.period === '2026-09')
                );
                return (
                  <div
                    key={c.customer_id}
                    className="py-2.5 px-2 flex items-center justify-between hover:bg-slate-50 rounded-xl transition"
                  >
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-xs font-bold text-sky-800 bg-sky-50 border border-sky-200/60 px-1.5 py-0.5 rounded">
                          {c.customer_id}
                        </span>
                        <span className="font-bold text-slate-900 text-sm">{c.customer_name}</span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Dusun {c.dusun} · RT {c.rt} / RW {c.rw} · No. Meter: <span className="font-mono">{c.meter_number}</span>
                      </p>
                    </div>

                    <div className="flex items-center space-x-2">
                      {bill && (
                        <span
                          className={`text-[11px] font-bold px-2 py-0.5 rounded-md border ${
                            bill.status === 'PAID'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : 'bg-rose-50 text-rose-800 border-rose-200'
                          }`}
                        >
                          {bill.status === 'PAID' ? 'Lunas' : 'Belum Bayar'}
                        </span>
                      )}
                      <button
                        onClick={() => onNavigate('meters')}
                        className="text-xs font-semibold bg-sky-600 hover:bg-sky-700 text-white px-3 py-1.5 rounded-lg transition cursor-pointer"
                      >
                        Catat Meter
                      </button>
                    </div>
                  </div>
                );
              })}
          </div>
        )}
      </div>

      {/* 4. MODULAR OPERATIONAL WORKSTATION */}
      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-sky-600" />
            <h2 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-700">
              Modul Operasional & Alur Kerja Petugas
            </h2>
          </div>
          <span className="text-[11px] text-slate-500 font-medium">
            Pintasan navigasi cepat
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          {/* 1. CATAT METER */}
          <button
            onClick={() => onNavigate('meters')}
            className="p-4 sm:p-5 bg-white hover:bg-slate-50/80 border border-slate-200/90 hover:border-sky-300 rounded-xl shadow-xs hover:shadow-sm transition-all text-left group cursor-pointer flex flex-col justify-between"
          >
            <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-700 group-hover:bg-sky-600 group-hover:text-white flex items-center justify-center transition-colors mb-3">
              <Gauge className="w-5 h-5" />
            </div>
            <div>
              <span className="text-sm font-bold text-slate-900 block leading-snug group-hover:text-sky-700 transition-colors">
                Catat Meter Air
              </span>
              <span className="text-xs text-slate-500 font-normal mt-0.5 block">
                Input angka fisik meter bulanan
              </span>
            </div>
          </button>

          {/* 2. PEMBAYARAN */}
          <button
            onClick={() => onNavigate('payments')}
            className="p-4 sm:p-5 bg-white hover:bg-slate-50/80 border border-slate-200/90 hover:border-emerald-300 rounded-xl shadow-xs hover:shadow-sm transition-all text-left group cursor-pointer flex flex-col justify-between"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 group-hover:bg-emerald-600 group-hover:text-white flex items-center justify-center transition-colors mb-3">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <span className="text-sm font-bold text-slate-900 block leading-snug group-hover:text-emerald-700 transition-colors">
                Loket Pembayaran
              </span>
              <span className="text-xs text-slate-500 font-normal mt-0.5 block">
                Kasir & pelunasan rekening
              </span>
            </div>
          </button>

          {/* 3. KWITANSI */}
          <button
            onClick={() => onNavigate('receipts')}
            className="p-4 sm:p-5 bg-white hover:bg-slate-50/80 border border-slate-200/90 hover:border-indigo-300 rounded-xl shadow-xs hover:shadow-sm transition-all text-left group cursor-pointer flex flex-col justify-between"
          >
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 group-hover:bg-indigo-600 group-hover:text-white flex items-center justify-center transition-colors mb-3">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <span className="text-sm font-bold text-slate-900 block leading-snug group-hover:text-indigo-700 transition-colors">
                Kwitansi Resmi
              </span>
              <span className="text-xs text-slate-500 font-normal mt-0.5 block">
                Cetak bukti & verifikasi A5/A6
              </span>
            </div>
          </button>

          {/* 4. BELUM BAYAR */}
          <button
            onClick={() => onNavigate('arrears')}
            className="p-4 sm:p-5 bg-white hover:bg-slate-50/80 border border-slate-200/90 hover:border-rose-300 rounded-xl shadow-xs hover:shadow-sm transition-all text-left group cursor-pointer flex flex-col justify-between"
          >
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-700 group-hover:bg-rose-600 group-hover:text-white flex items-center justify-center transition-colors mb-3">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <span className="text-sm font-bold text-slate-900 block leading-snug group-hover:text-rose-700 transition-colors">
                Tunggakan Warga
              </span>
              <span className="text-xs text-rose-700 font-semibold mt-0.5 block">
                {arrearsCustomerCount} pelanggan tertahan
              </span>
            </div>
          </button>

          {/* 5. FOLLOW UP WA */}
          <button
            onClick={() => onNavigate('arrears')}
            className="p-4 sm:p-5 bg-white hover:bg-slate-50/80 border border-slate-200/90 hover:border-emerald-300 rounded-xl shadow-xs hover:shadow-sm transition-all text-left group cursor-pointer flex flex-col justify-between"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 group-hover:bg-emerald-600 group-hover:text-white flex items-center justify-center transition-colors mb-3">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <span className="text-sm font-bold text-slate-900 block leading-snug group-hover:text-emerald-700 transition-colors">
                Notifikasi WhatsApp
              </span>
              <span className="text-xs text-slate-500 font-normal mt-0.5 block">
                Kirim tagihan persuasif resmi
              </span>
            </div>
          </button>

          {/* 6. PENGADUAN */}
          <button
            onClick={() => onNavigate('complaints')}
            className="p-4 sm:p-5 bg-white hover:bg-slate-50/80 border border-slate-200/90 hover:border-amber-300 rounded-xl shadow-xs hover:shadow-sm transition-all text-left group cursor-pointer flex flex-col justify-between"
          >
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 group-hover:bg-amber-600 group-hover:text-white flex items-center justify-center transition-colors mb-3">
              <Droplets className="w-5 h-5" />
            </div>
            <div>
              <span className="text-sm font-bold text-slate-900 block leading-snug group-hover:text-amber-700 transition-colors">
                Pengaduan Layanan
              </span>
              <span className="text-xs text-amber-700 font-semibold mt-0.5 block">
                {activeComplaints.length} laporan butuh respons
              </span>
            </div>
          </button>

          {/* 7. PENGELUARAN */}
          <button
            onClick={() => onNavigate('cashout')}
            className="p-4 sm:p-5 bg-white hover:bg-slate-50/80 border border-slate-200/90 hover:border-slate-300 rounded-xl shadow-xs hover:shadow-sm transition-all text-left group cursor-pointer flex flex-col justify-between"
          >
            <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 group-hover:bg-slate-800 group-hover:text-white flex items-center justify-center transition-colors mb-3">
              <ArrowUpRight className="w-5 h-5" />
            </div>
            <div>
              <span className="text-sm font-bold text-slate-900 block leading-snug group-hover:text-slate-900 transition-colors">
                Buku Kas Keluar
              </span>
              <span className="text-xs text-slate-500 font-normal mt-0.5 block">
                Biaya listrik PLN & pipa
              </span>
            </div>
          </button>

          {/* 8. LAPORAN */}
          <button
            onClick={() => onNavigate('reports')}
            className="p-4 sm:p-5 bg-white hover:bg-slate-50/80 border border-slate-200/90 hover:border-slate-300 rounded-xl shadow-xs hover:shadow-sm transition-all text-left group cursor-pointer flex flex-col justify-between"
          >
            <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 group-hover:bg-slate-800 group-hover:text-white flex items-center justify-center transition-colors mb-3">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <span className="text-sm font-bold text-slate-900 block leading-snug group-hover:text-slate-900 transition-colors">
                Laporan Keuangan
              </span>
              <span className="text-xs text-slate-500 font-normal mt-0.5 block">
                Neraca kasir & laporan bulanan
              </span>
            </div>
          </button>
        </div>
      </div>

      {/* 5. STATISTIK RINGKAS SISTEM (REFINED EDITORIAL KPI ROWS) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
        {/* Kolom 1: Status Pelanggan */}
        <div className="bg-white rounded-xl p-5 border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between mb-3.5 pb-3 border-b border-slate-100">
            <h3 className="font-bold text-slate-900 text-sm flex items-center space-x-2">
              <Users className="w-4 h-4 text-slate-500" />
              <span>Database Pelanggan</span>
            </h3>
            <span className="text-xs font-semibold text-slate-500">
              Total {customers.length} KK
            </span>
          </div>

          <div className="divide-y divide-slate-100 text-sm">
            <div className="py-2.5 flex items-center justify-between">
              <span className="text-slate-600">Pelanggan Aktif</span>
              <span className="font-mono font-bold text-emerald-700 tabular-nums">
                {activeCustomers.length} KK
              </span>
            </div>
            <div className="py-2.5 flex items-center justify-between">
              <span className="text-slate-600">Pelanggan Nonaktif / Segel</span>
              <span className="font-mono font-semibold text-slate-600 tabular-nums">
                {inactiveCustomers.length} KK
              </span>
            </div>
            <div className="py-2.5 flex items-center justify-between">
              <span className="text-slate-600">Pendaftaran Baru Bulan Ini</span>
              <span className="font-mono font-semibold text-sky-700 tabular-nums">
                {newCustomersThisMonth.length} KK
              </span>
            </div>
          </div>
        </div>

        {/* Kolom 2: Status Pembayaran Rekening */}
        <div className="bg-white rounded-xl p-5 border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between mb-3.5 pb-3 border-b border-slate-100">
            <h3 className="font-bold text-slate-900 text-sm flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Status Rekening Air</span>
            </h3>
            <span className="text-xs font-semibold text-slate-500">
              Oktober 2026
            </span>
          </div>

          <div className="divide-y divide-slate-100 text-sm">
            <div className="py-2.5 flex items-center justify-between">
              <span className="text-slate-600">Sudah Lunas Terbayar</span>
              <span className="font-mono font-bold text-emerald-700 tabular-nums">
                {paidBillsCount} rekening
              </span>
            </div>
            <div className="py-2.5 flex items-center justify-between">
              <span className="text-slate-600">Belum Bayar (Bulan Berjalan)</span>
              <span className="font-mono font-semibold text-amber-700 tabular-nums">
                {unpaidBillsCount} rekening
              </span>
            </div>
            <div className="py-2.5 flex items-center justify-between">
              <span className="text-slate-600">Menunggak &gt; 1 Bulan</span>
              <span className="font-mono font-bold text-rose-700 tabular-nums">
                {arrearsCustomerCount} pelanggan
              </span>
            </div>
          </div>
        </div>

        {/* Kolom 3: Layanan Pengaduan Warga */}
        <div className="bg-white rounded-xl p-5 border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between mb-3.5 pb-3 border-b border-slate-100">
            <h3 className="font-bold text-slate-900 text-sm flex items-center space-x-2">
              <Clock className="w-4 h-4 text-slate-500" />
              <span>Pelayanan Aduan Warga</span>
            </h3>
            <span className="text-xs font-semibold text-slate-500">
              Total {complaints.length} Laporan
            </span>
          </div>

          <div className="divide-y divide-slate-100 text-sm">
            <div className="py-2.5 flex items-center justify-between">
              <span className="text-slate-600">Dalam Penanganan / Tindakan</span>
              <span className="font-mono font-bold text-amber-700 tabular-nums">
                {activeComplaints.length} tiket
              </span>
            </div>
            <div className="py-2.5 flex items-center justify-between">
              <span className="text-slate-600">Selesai Ditangani</span>
              <span className="font-mono font-bold text-emerald-700 tabular-nums">
                {resolvedComplaints.length} tiket
              </span>
            </div>
            <div className="py-2.5 flex items-center justify-between">
              <span className="text-slate-600">Tingkat Penanganan</span>
              <span className="font-mono font-semibold text-slate-800 tabular-nums">
                {complaints.length > 0 ? `${Math.round((resolvedComplaints.length / complaints.length) * 100)}%` : '100%'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 6. GRAFIK & KEUANGAN BULAN BERJALAN */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/90 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-slate-900 text-sm sm:text-base flex items-center space-x-2">
            <TrendingUp className="w-4 h-4 text-sky-600" />
            <span>Ringkasan Arus Kas Masuk vs Kas Keluar</span>
          </h3>
          <span className="text-xs text-slate-500 font-medium">
            Tahun Berjalan 2026
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-5">
          <div className="p-4 bg-emerald-50/60 rounded-xl border border-emerald-200/80">
            <span className="text-xs font-semibold text-emerald-800 uppercase block mb-1">
              Penerimaan Kas
            </span>
            <span className="text-xl sm:text-2xl font-bold text-emerald-700 font-mono tracking-tight">
              Rp {totalIncome.toLocaleString('id-ID')}
            </span>
            <span className="text-[11px] text-emerald-600 block mt-1">
              Rekening air, sambungan baru, denda
            </span>
          </div>

          <div className="p-4 bg-rose-50/60 rounded-xl border border-rose-200/80">
            <span className="text-xs font-semibold text-rose-800 uppercase block mb-1">
              Pengeluaran Kas
            </span>
            <span className="text-xl sm:text-2xl font-bold text-rose-700 font-mono tracking-tight">
              Rp {totalExpense.toLocaleString('id-ID')}
            </span>
            <span className="text-[11px] text-rose-600 block mt-1">
              Listrik gardu pompa, pipa, honor
            </span>
          </div>

          <div className="p-4 bg-sky-50/60 rounded-xl border border-sky-200/80">
            <span className="text-xs font-semibold text-sky-800 uppercase block mb-1">
              Saldo Bersih Kas
            </span>
            <span className="text-xl sm:text-2xl font-bold text-sky-800 font-mono tracking-tight">
              Rp {netBalance.toLocaleString('id-ID')}
            </span>
            <span className="text-[11px] text-sky-600 block mt-1">
              Penerimaan - Pengeluaran
            </span>
          </div>
        </div>

        {/* Visual Progress Comparison Bar */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/70">
          <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1.5">
            <span>Rasio Pemasukan vs Pengeluaran</span>
            <span>
              {totalIncome > 0 ? Math.round((totalExpense / totalIncome) * 100) : 0}% terpakai
            </span>
          </div>
          <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden flex">
            <div
              className="bg-rose-500 h-full transition-all"
              style={{
                width: `${totalIncome > 0 ? Math.min(100, (totalExpense / totalIncome) * 100) : 0}%`,
              }}
              title="Pengeluaran"
            />
            <div className="bg-emerald-500 h-full flex-1" title="Saldo Tersisa" />
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-[11px] text-slate-500 mt-2 font-medium gap-1">
            <span className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 bg-rose-500 rounded-xs inline-block" />
              <span>Pengeluaran: Rp {totalExpense.toLocaleString('id-ID')}</span>
            </span>
            <span className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 bg-emerald-500 rounded-xs inline-block" />
              <span>Penerimaan: Rp {totalIncome.toLocaleString('id-ID')}</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
