// SIM-TIRTA LESTARI Bills View
// Generator Tagihan Individual & Massal dengan Tarif Progresif Per Blok + Beban + Denda

import React, { useState } from 'react';
import { Bill, Customer, MeterReading, TariffTier } from '../types';
import { AppStorage } from '../services/storage';
import { BillingEngine } from '../services/billing';
import { AuditLogger } from '../services/audit';
import {
  FileText,
  Search,
  Zap,
  Calendar,
  CreditCard,
  AlertCircle,
  CheckCircle2,
  Clock,
  ChevronRight,
  Filter,
} from 'lucide-react';

interface BillsViewProps {
  onGoToPayment: (billId: string) => void;
}

export const BillsView: React.FC<BillsViewProps> = ({ onGoToPayment }) => {
  const [bills, setBills] = useState<Bill[]>(() => AppStorage.getBills());
  const [customers] = useState<Customer[]>(() => AppStorage.getCustomers());
  const [readings] = useState<MeterReading[]>(() => AppStorage.getReadings());
  const [tariffs] = useState<TariffTier[]>(() => AppStorage.getTariffs());
  const settings = AppStorage.getSettings();

  const [selectedPeriod, setSelectedPeriod] = useState('2026-10');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateLog, setGenerateLog] = useState<string | null>(null);
  const [showGenerateModal, setShowGenerateModal] = useState(false);

  // Filter tagihan
  const filteredBills = bills.filter((b) => {
    const matchPeriod = selectedPeriod === 'ALL' || b.period === selectedPeriod;
    const matchStatus = statusFilter === 'ALL' || b.status === statusFilter;
    const cust = customers.find((c) => c.customer_id === b.customer_id);
    const q = searchQuery.toLowerCase().trim();
    const matchSearch =
      !q ||
      b.bill_number.toLowerCase().includes(q) ||
      b.customer_id.toLowerCase().includes(q) ||
      (cust && cust.customer_name.toLowerCase().includes(q));

    return matchPeriod && matchStatus && matchSearch;
  });

  /**
   * GENERATE TAGIHAN MASSAL UNTUK PERIODE TERPILIH
   */
  const handleBulkGenerateBills = () => {
    setShowGenerateModal(true);
  };

  const confirmBulkGenerate = () => {
    setShowGenerateModal(false);
    setIsGenerating(true);
    setGenerateLog(null);

    try {
      const activeCustomers = customers.filter((c) => c.status === 'ACTIVE');
      let createdCount = 0;
      let skippedCount = 0;
      const updatedBills = [...bills];
      const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);

      // Jatuh tempo: tanggal 28 bulan bersangkutan
      const [yearStr, monthStr] = selectedPeriod.split('-');
      const dueDate = `${selectedPeriod}-${String(settings.PAYMENT_DUE_DAY).padStart(2, '0')}`;

      activeCustomers.forEach((cust) => {
        // Cek apakah sudah ada tagihan untuk periode ini
        const alreadyExists = updatedBills.some(
          (b) => b.customer_id === cust.customer_id && b.period === selectedPeriod
        );

        if (alreadyExists) {
          skippedCount++;
          return;
        }

        // Ambil bacaan meter periode ini
        const reading = readings.find(
          (r) => r.customer_id === cust.customer_id && r.period === selectedPeriod
        );

        const prevMeter = reading ? reading.previous_reading : 0;
        const currMeter = reading ? reading.current_reading : 0;
        const usage = reading ? reading.usage_m3 : 0;

        // Cek promo bulan pertama
        const isFirstMonth = BillingEngine.isFirstMonthCustomer(cust, selectedPeriod);

        // Hitung tarif progresif per blok
        const tariffResult = BillingEngine.calculateProgressiveTariff(
          usage,
          tariffs,
          isFirstMonth,
          settings.FIRST_MONTH_FREE_LIMIT
        );

        // Cek tunggakan sebelumnya (tagihan lama yang belum PAID)
        const unpaidPrevious = updatedBills
          .filter(
            (b) =>
              b.customer_id === cust.customer_id &&
              b.period < selectedPeriod &&
              b.status !== 'PAID' &&
              b.status !== 'CANCELLED'
          )
          .reduce((sum, b) => sum + (b.total_bill || 0), 0);

        const fixedFee = settings.MONTHLY_FIXED_FEE;
        const waterCharge = tariffResult.waterCharge;
        const discount = tariffResult.discountAmount;
        const total = waterCharge + fixedFee + unpaidPrevious - discount;

        const newBillNumber = BillingEngine.generateBillNumber(selectedPeriod, updatedBills);

        const newBill: Bill = {
          bill_id: `BIL-${selectedPeriod.replace('-', '')}-${Date.now().toString().slice(-4)}-${createdCount}`,
          bill_number: newBillNumber,
          customer_id: cust.customer_id,
          period: selectedPeriod,
          previous_meter: prevMeter,
          current_meter: currMeter,
          usage_m3: usage,
          water_charge: waterCharge,
          fixed_fee: fixedFee,
          arrears: unpaidPrevious,
          late_fee: 0,
          other_charge: 0,
          discount: discount,
          total_bill: total,
          status: 'UNPAID',
          created_at: nowStr,
          due_date: dueDate,
        };

        updatedBills.unshift(newBill);
        createdCount++;
      });

      setBills(updatedBills);
      AppStorage.setBills(updatedBills);

      AuditLogger.log({
        user: 'Super Admin',
        role: 'ADMIN',
        action: 'GENERATE BILL',
        module: 'BILLING',
        record_id: `BULK-${selectedPeriod}`,
        new_value_summary: `Generate massal periode ${selectedPeriod}: ${createdCount} tagihan baru dibuat, ${skippedCount} dilewati (sudah ada).`,
      });

      setGenerateLog(
        `Sukses! Berhasil menerbitkan ${createdCount} tagihan baru untuk periode ${selectedPeriod} (${skippedCount} dilewati karena sudah ada).`
      );
    } catch (err: unknown) {
      alert(`Gagal generate tagihan: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 flex items-center space-x-2">
            <FileText className="w-7 h-7 text-sky-600" />
            <span>Tagihan Rekening Air Warga</span>
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Penetapan biaya air progresif per blok + beban tetap bulanan (Rp{' '}
            {settings.MONTHLY_FIXED_FEE.toLocaleString('id-ID')}).
          </p>
        </div>

        {/* Generate Massal Button */}
        <button
          onClick={handleBulkGenerateBills}
          disabled={isGenerating}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-3 rounded-xl font-bold flex items-center space-x-2 shadow-md transition cursor-pointer self-start md:self-auto disabled:opacity-50"
        >
          <Zap className="w-5 h-5 text-amber-300" />
          <span>{isGenerating ? 'Memproses...' : 'Generate Tagihan Periode Ini'}</span>
        </button>
      </div>

      {generateLog && (
        <div className="p-4 bg-emerald-50 border-2 border-emerald-300 rounded-xl text-emerald-800 flex items-center space-x-3">
          <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
          <span className="font-bold text-sm">{generateLog}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm grid grid-cols-1 md:grid-cols-4 gap-3">
        <div className="relative md:col-span-2">
          <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-3.5" />
          <input
            type="text"
            placeholder="Cari No. Tagihan (INV-...), Nama Pelanggan, atau ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-base focus:bg-white focus:border-sky-500 focus:outline-none"
          />
        </div>

        <div>
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="w-full py-3 px-3 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold focus:bg-white focus:border-sky-500 focus:outline-none"
          >
            <option value="ALL">Semua Periode</option>
            <option value="2026-10">Oktober 2026</option>
            <option value="2026-09">September 2026</option>
            <option value="2026-08">Agustus 2026</option>
            <option value="2026-07">Juli 2026</option>
          </select>
        </div>

        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full py-3 px-3 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold focus:bg-white focus:border-sky-500 focus:outline-none"
          >
            <option value="ALL">Semua Status Bayar</option>
            <option value="UNPAID">Belum Bayar</option>
            <option value="PAID">Lunas</option>
            <option value="OVERDUE">Terlambat / Menunggak</option>
          </select>
        </div>
      </div>

      {/* Bills Display: Mobile Card View + Desktop Table View */}
      <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-4 sm:px-6 py-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
          <span className="font-extrabold text-slate-800 text-sm">
            Menampilkan {filteredBills.length} Tagihan
          </span>
          <span className="text-[11px] text-slate-500 font-medium">
            Jatuh Tempo: Tanggal {settings.PAYMENT_DUE_DAY} setiap bulan
          </span>
        </div>

        {/* MOBILE BILL CARDS */}
        <div className="md:hidden divide-y divide-slate-100 p-2 space-y-2">
          {filteredBills.length === 0 ? (
            <div className="py-8 text-center text-slate-500 font-medium text-sm">
              Tidak ditemukan tagihan yang sesuai kriteria filter.
            </div>
          ) : (
            filteredBills.map((b) => {
              const cust = customers.find((c) => c.customer_id === b.customer_id);

              return (
                <div
                  key={b.bill_id}
                  className="p-4 bg-slate-50/70 border border-slate-200 rounded-2xl space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center space-x-1.5">
                        <span className="text-[11px] font-black text-sky-800 bg-sky-100 px-2 py-0.5 rounded">
                          Periode: {b.period}
                        </span>
                        <span
                          className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                            b.status === 'PAID'
                              ? 'bg-emerald-100 text-emerald-800'
                              : b.status === 'OVERDUE'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {b.status === 'PAID' ? 'LUNAS' : b.status === 'OVERDUE' ? 'MENUNGGAK' : 'BELUM BAYAR'}
                        </span>
                      </div>
                      <h3 className="font-black text-slate-900 text-base mt-1">
                        {cust ? cust.customer_name : b.customer_id}
                      </h3>
                      <div className="text-xs text-slate-500 font-mono">
                        {b.customer_id} &bull; No: {b.bill_number}
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-xs text-slate-400 block uppercase font-bold">Total:</span>
                      <span className="text-lg font-black text-slate-900 font-mono">
                        Rp {b.total_bill.toLocaleString('id-ID')}
                      </span>
                    </div>
                  </div>

                  <div className="p-2.5 bg-white rounded-xl border border-slate-200/90 grid grid-cols-3 gap-2 text-center text-xs">
                    <div>
                      <span className="text-slate-400 block text-[10px]">Meter</span>
                      <span className="font-mono font-bold text-slate-700">
                        {b.previous_meter} &rarr; {b.current_meter}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Pakai</span>
                      <span className="font-mono font-black text-sky-700">
                        {b.usage_m3} m³
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Biaya Air</span>
                      <span className="font-mono font-bold text-slate-700">
                        Rp {b.water_charge.toLocaleString('id-ID')}
                      </span>
                    </div>
                  </div>

                  {b.late_fee > 0 && (
                    <div className="text-xs text-rose-700 font-bold bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200 flex items-center justify-between">
                      <span>Denda Keterlambatan:</span>
                      <span className="font-mono">Rp {b.late_fee.toLocaleString('id-ID')}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[11px] text-slate-400">
                      Jatuh tempo: {b.due_date}
                    </span>

                    {b.status !== 'PAID' ? (
                      <button
                        onClick={() => onGoToPayment(b.bill_id)}
                        className="bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white px-5 py-2.5 rounded-xl text-xs font-black flex items-center space-x-1.5 shadow-sm transition cursor-pointer"
                      >
                        <CreditCard className="w-4 h-4" />
                        <span>Bayar Sekarang</span>
                      </button>
                    ) : (
                      <span className="text-xs text-emerald-700 font-black bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-200">
                        ✓ LUNAS
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* DESKTOP TABLE VIEW */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 text-xs uppercase font-extrabold tracking-wider">
                <th className="py-3 px-4">No. Tagihan & Periode</th>
                <th className="py-3 px-4">Pelanggan</th>
                <th className="py-3 px-4 text-center">Meter (Lalu / Kini)</th>
                <th className="py-3 px-4 text-right">Pakai (m³)</th>
                <th className="py-3 px-4 text-right">Biaya Air</th>
                <th className="py-3 px-4 text-right">Beban + Lain</th>
                <th className="py-3 px-4 text-right">Total Tagihan</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredBills.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-500 font-medium">
                    Tidak ditemukan tagihan yang sesuai kriteria filter.
                  </td>
                </tr>
              ) : (
                filteredBills.map((b) => {
                  const cust = customers.find((c) => c.customer_id === b.customer_id);

                  return (
                    <tr key={b.bill_id} className="hover:bg-slate-50/80">
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="font-mono font-bold text-slate-800 block text-xs">
                          {b.bill_number}
                        </span>
                        <span className="text-[11px] font-semibold text-sky-700 bg-sky-50 px-2 py-0.5 rounded inline-block mt-0.5">
                          Periode: {b.period}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">
                          {cust ? cust.customer_name : b.customer_id}
                        </div>
                        <div className="text-xs text-slate-500">
                          ID: {b.customer_id} | Dusun {cust?.dusun}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-center font-mono text-xs text-slate-600">
                        {b.previous_meter} &rarr; {b.current_meter}
                      </td>

                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <span className="font-mono font-black text-sky-700 bg-sky-100 px-2 py-0.5 rounded text-xs">
                          {b.usage_m3} m³
                        </span>
                        {b.discount > 0 && (
                          <span className="block text-[10px] text-emerald-600 font-bold">
                            (Promo Gratis 10m³)
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right font-mono text-slate-700">
                        Rp {b.water_charge.toLocaleString('id-ID')}
                      </td>

                      <td className="py-3.5 px-4 text-right font-mono text-xs text-slate-500">
                        Rp {(b.fixed_fee + b.arrears + b.late_fee).toLocaleString('id-ID')}
                        {b.late_fee > 0 && (
                          <span className="block text-[10px] text-rose-600 font-bold">
                            (Denda: Rp {b.late_fee.toLocaleString('id-ID')})
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <span className="font-mono font-black text-base text-slate-900 block">
                          Rp {b.total_bill.toLocaleString('id-ID')}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                            b.status === 'PAID'
                              ? 'bg-emerald-100 text-emerald-800'
                              : b.status === 'OVERDUE'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {b.status === 'PAID' && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
                          {b.status === 'OVERDUE' && <AlertCircle className="w-3 h-3 text-rose-600" />}
                          {b.status === 'UNPAID' && <Clock className="w-3 h-3 text-amber-600" />}
                          <span>{b.status === 'PAID' ? 'LUNAS' : b.status === 'OVERDUE' ? 'MENUNGGAK' : 'BELUM BAYAR'}</span>
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        {b.status !== 'PAID' ? (
                          <button
                            onClick={() => onGoToPayment(b.bill_id)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1 shadow transition cursor-pointer"
                          >
                            <CreditCard className="w-3.5 h-3.5" />
                            <span>Bayar</span>
                          </button>
                        ) : (
                          <span className="text-xs text-emerald-700 font-bold">Lunas</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* IN-APP CONFIRMATION MODAL FOR BULK GENERATE BILLS */}
      {showGenerateModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Generate Tagihan Rekening?</h3>
                <p className="text-xs text-slate-500">Periode Tagihan: {selectedPeriod}</p>
              </div>
            </div>

            <p className="text-sm text-slate-600 mb-6 leading-relaxed">
              Sistem akan menghitung tagihan air seluruh pelanggan aktif ({customers.filter((c) => c.status === 'ACTIVE').length} KK) berdasarkan tarif progresif, biaya beban abonemen, dan tunggakan sebelumnya.
            </p>

            <div className="flex items-center justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowGenerateModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={confirmBulkGenerate}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-sky-600 hover:bg-sky-500 text-white transition shadow-sm cursor-pointer"
              >
                Mulai Generate Tagihan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
