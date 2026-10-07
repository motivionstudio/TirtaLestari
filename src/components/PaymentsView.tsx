// SIM-TIRTA LESTARI Payments View
// Loket Pembayaran Rekening Air: Alur Sangat Sederhana, Proteksi Double-Click, Buat Kwitansi & Kirim WA

import React, { useState, useEffect } from 'react';
import { Customer, Bill, Payment, Receipt } from '../types';
import { AppStorage } from '../services/storage';
import { BillingEngine } from '../services/billing';
import { WhatsAppService } from '../services/whatsapp';
import {
  CreditCard,
  Search,
  CheckCircle2,
  Receipt as ReceiptIcon,
  MessageSquare,
  Printer,
  XCircle,
  AlertCircle,
  User,
  ShieldCheck,
  History,
} from 'lucide-react';

interface PaymentsViewProps {
  initialBillId?: string | null;
  onClearInitialBill?: () => void;
  onViewReceipt: (receiptNumber: string) => void;
}

export const PaymentsView: React.FC<PaymentsViewProps> = ({
  initialBillId,
  onClearInitialBill,
  onViewReceipt,
}) => {
  const [bills, setBills] = useState<Bill[]>(() => AppStorage.getBills());
  const [customers] = useState<Customer[]>(() => AppStorage.getCustomers());
  const [payments, setPayments] = useState<Payment[]>(() => AppStorage.getPayments());

  // Search & Selection State
  const [customerSearchQuery, setCustomerSearchQuery] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [selectedBillId, setSelectedBillId] = useState<string | null>(initialBillId || null);

  // Form State
  const [paymentMethod, setPaymentMethod] = useState<'Tunai' | 'Transfer Bank' | 'Lainnya'>('Tunai');
  const [officerName, setOfficerName] = useState('Pak H. Sugiyanto');
  const [notes, setNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Result State after payment
  const [lastProcessedReceipt, setLastProcessedReceipt] = useState<Receipt | null>(null);
  const [lastProcessedPayment, setLastProcessedPayment] = useState<Payment | null>(null);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  // Void / Cancel Modal
  const [cancellingPayment, setCancellingPayment] = useState<Payment | null>(null);
  const [cancelReason, setCancelReason] = useState('');

  // Handle pre-selected bill passed from BillsView
  useEffect(() => {
    if (initialBillId) {
      const b = bills.find((item) => item.bill_id === initialBillId);
      if (b) {
        setSelectedBillId(b.bill_id);
        setSelectedCustomerId(b.customer_id);
        const c = customers.find((cust) => cust.customer_id === b.customer_id);
        if (c) {
          setCustomerSearchQuery(`${c.customer_name} (${c.customer_id})`);
        }
      }
      if (onClearInitialBill) onClearInitialBill();
    }
  }, [initialBillId, bills, customers, onClearInitialBill]);

  // Selected Data
  const selectedCustomer = customers.find((c) => c.customer_id === selectedCustomerId);
  const selectedBill = bills.find((b) => b.bill_id === selectedBillId);

  // Customer's Unpaid Bills
  const customerUnpaidBills = selectedCustomerId
    ? bills.filter(
        (b) =>
          b.customer_id === selectedCustomerId &&
          b.status !== 'PAID' &&
          b.status !== 'CANCELLED'
      )
    : [];

  // Filtered customer search list
  const filteredCustomers = customers.filter((c) => {
    const q = customerSearchQuery.toLowerCase().trim();
    if (!q) return false;
    return (
      c.customer_name.toLowerCase().includes(q) ||
      c.customer_id.toLowerCase().includes(q) ||
      c.meter_number.toLowerCase().includes(q) ||
      c.phone.includes(q)
    );
  });

  const handleSelectCustomer = (c: Customer) => {
    setSelectedCustomerId(c.customer_id);
    setCustomerSearchQuery(`${c.customer_name} (${c.customer_id})`);

    // Auto-select first unpaid bill if available
    const unpaid = bills.filter(
      (b) =>
        b.customer_id === c.customer_id &&
        b.status !== 'PAID' &&
        b.status !== 'CANCELLED'
    );
    if (unpaid.length > 0) {
      setSelectedBillId(unpaid[0].bill_id);
    } else {
      setSelectedBillId(null);
    }
    setLastProcessedReceipt(null);
    setSuccessBanner(null);
  };

  /**
   * PROSES BAYAR & BUAT KWITANSI (DENGAN PROTEKSI DOUBLE-CLICK)
   */
  const handleProcessPayment = async () => {
    if (!selectedBill || !selectedCustomer) {
      alert('Pilih tagihan yang akan dibayar.');
      return;
    }

    if (
      !window.confirm(
        `Konfirmasi pembayaran rekening air:\n\nPelanggan: ${selectedCustomer.customer_name}\nPeriode: ${selectedBill.period}\nTotal: Rp ${selectedBill.total_bill.toLocaleString('id-ID')}\nMetode: ${paymentMethod}\n\nLanjutkan transaksi?`
      )
    ) {
      return;
    }

    setIsProcessing(true);
    setSuccessBanner(null);

    const result = await BillingEngine.processPayment({
      billId: selectedBill.bill_id,
      amountPaid: selectedBill.total_bill,
      paymentMethod,
      officer: officerName,
      userRole: 'PENGURUS',
      notes,
    });

    setIsProcessing(false);

    if (result.success && result.receipt && result.payment) {
      // Refresh local states
      setBills(AppStorage.getBills());
      setPayments(AppStorage.getPayments());
      setLastProcessedReceipt(result.receipt);
      setLastProcessedPayment(result.payment);
      setSuccessBanner(result.message);
      setSelectedBillId(null);
    } else {
      alert(result.message);
    }
  };

  /**
   * CANCEL / VOID PAYMENT
   */
  const handleConfirmCancelPayment = () => {
    if (!cancellingPayment) return;
    if (!cancelReason.trim()) {
      alert('Alasan pembatalan wajib diisi.');
      return;
    }

    const res = BillingEngine.cancelPayment({
      paymentId: cancellingPayment.payment_id,
      cancelReason,
      cancelledBy: officerName,
      userRole: 'PENGURUS',
    });

    if (res.success) {
      alert(res.message);
      setBills(AppStorage.getBills());
      setPayments(AppStorage.getPayments());
      setCancellingPayment(null);
      setCancelReason('');
    } else {
      alert(res.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 flex items-center space-x-2">
            <CreditCard className="w-7 h-7 text-emerald-600" />
            <span>Loket Pembayaran Rekening Air</span>
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Alur cepat pembayaran loket: Cari Pelanggan &rarr; Pilih Tagihan &rarr; Bayar & Buat Kwitansi.
          </p>
        </div>

        <div className="flex items-center space-x-2 bg-emerald-50 px-3.5 py-2 rounded-xl border border-emerald-200 text-emerald-900 text-sm font-bold">
          <ShieldCheck className="w-5 h-5 text-emerald-600" />
          <span>Proteksi Anti Double-Click Aktif</span>
        </div>
      </div>

      {/* SUCCESS MODAL / BANNER WITH RECEIPT & WA SHORTCUT */}
      {lastProcessedReceipt && lastProcessedPayment && (
        <div className="bg-emerald-50 border-2 border-emerald-400 p-6 rounded-2xl shadow-lg">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-xl font-black text-emerald-900">
                  Pembayaran Berhasil Diproses!
                </h3>
                <p className="text-emerald-700 text-sm font-medium">
                  Nomor Kwitansi: <strong className="font-mono text-base">{lastProcessedReceipt.receipt_number}</strong> | Kode Verifikasi:{' '}
                  <strong className="font-mono">{lastProcessedReceipt.verification_code}</strong>
                </p>
              </div>
            </div>

            <button
              onClick={() => setLastProcessedReceipt(null)}
              className="text-xs text-emerald-700 hover:text-emerald-900 font-bold bg-emerald-100 px-3 py-1.5 rounded-lg cursor-pointer"
            >
              Tutup Notifikasi
            </button>
          </div>

          {/* Quick Buttons: WA & View Receipt */}
          <div className="mt-5 flex flex-wrap gap-3 pt-4 border-t border-emerald-200">
            {/* Tombol WhatsApp */}
            {selectedCustomer && (
              <a
                href={WhatsAppService.generateWhatsAppUrl(
                  selectedCustomer.phone,
                  WhatsAppService.getPaymentSuccessMessage({
                    customerName: selectedCustomer.customer_name,
                    period: lastProcessedReceipt.period,
                    amountPaid: lastProcessedReceipt.total_amount,
                    receiptNumber: lastProcessedReceipt.receipt_number,
                    paymentMethod: lastProcessedReceipt.payment_method,
                    paymentDate: lastProcessedReceipt.payment_date,
                    officer: lastProcessedReceipt.officer,
                    verificationCode: lastProcessedReceipt.verification_code,
                  })
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-3 rounded-xl font-bold flex items-center space-x-2 shadow transition"
              >
                <MessageSquare className="w-5 h-5" />
                <span>Kirim Bukti Kwitansi via WhatsApp</span>
              </a>
            )}

            {/* Tombol Lihat & Cetak Kwitansi */}
            <button
              onClick={() => onViewReceipt(lastProcessedReceipt.receipt_number)}
              className="bg-white hover:bg-slate-100 text-slate-800 border-2 border-slate-300 px-5 py-3 rounded-xl font-bold flex items-center space-x-2 shadow-xs transition cursor-pointer"
            >
              <Printer className="w-5 h-5 text-sky-600" />
              <span>Cetak Kwitansi Resmi (A5/A6)</span>
            </button>
          </div>
        </div>
      )}

      {/* 4-STEP PAYMENT WIZARD */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Kolom Kiri: Cari Pelanggan & Tagihan (2 Kolom) */}
        <div className="lg:col-span-2 space-y-6">
          {/* STEP 1: CARI PELANGGAN */}
          <div className="bg-white p-6 rounded-2xl border-2 border-sky-100 shadow-sm">
            <div className="flex items-center space-x-2 mb-3">
              <span className="w-7 h-7 rounded-full bg-sky-600 text-white font-black text-sm flex items-center justify-center">
                1
              </span>
              <h2 className="text-lg font-bold text-slate-800">
                Cari Pelanggan (Tanpa Perlu Hafal ID)
              </h2>
            </div>

            <div className="relative">
              <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="text"
                placeholder="Ketik Nama Pelanggan, Nomor ID (TL-...), No. Meter, atau No. WA..."
                value={customerSearchQuery}
                onChange={(e) => {
                  setCustomerSearchQuery(e.target.value);
                  setSelectedCustomerId(null);
                  setSelectedBillId(null);
                }}
                className="w-full pl-11 pr-4 py-3 bg-slate-50 border-2 border-slate-300 rounded-xl text-base font-semibold focus:bg-white focus:border-sky-500 focus:outline-none"
              />
            </div>

            {/* Quick Suggestions list */}
            {filteredCustomers.length > 0 && !selectedCustomerId && (
              <div className="mt-2 bg-white border border-slate-200 rounded-xl shadow-lg max-h-56 overflow-y-auto divide-y divide-slate-100">
                {filteredCustomers.map((c) => (
                  <button
                    key={c.customer_id}
                    onClick={() => handleSelectCustomer(c)}
                    className="w-full text-left p-3 hover:bg-sky-50 flex items-center justify-between transition cursor-pointer"
                  >
                    <div>
                      <span className="font-extrabold text-slate-900">{c.customer_name}</span>
                      <span className="text-xs text-sky-700 ml-2 font-mono bg-sky-100 px-2 py-0.5 rounded font-bold">
                        {c.customer_id}
                      </span>
                      <div className="text-xs text-slate-500 mt-0.5">
                        Dusun {c.dusun} | RT {c.rt}/RW {c.rw} | No. Meter: {c.meter_number}
                      </div>
                    </div>
                    <span className="text-xs text-sky-700 font-bold bg-sky-50 px-2.5 py-1 rounded border border-sky-200">
                      Pilih Pelanggan
                    </span>
                  </button>
                ))}
              </div>
            )}

            {/* Selected Customer Card */}
            {selectedCustomer && (
              <div className="mt-4 p-4 bg-sky-50/80 rounded-xl border border-sky-200 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-sky-800 uppercase block">
                    Pelanggan Terpilih:
                  </span>
                  <span className="text-lg font-black text-slate-900">
                    {selectedCustomer.customer_name}
                  </span>
                  <div className="text-xs text-slate-600 mt-0.5">
                    ID: <strong className="font-mono">{selectedCustomer.customer_id}</strong> | Dusun {selectedCustomer.dusun} | WA: {selectedCustomer.phone}
                  </div>
                </div>

                <button
                  onClick={() => {
                    setSelectedCustomerId(null);
                    setSelectedBillId(null);
                    setCustomerSearchQuery('');
                  }}
                  className="text-xs text-rose-600 font-bold hover:underline cursor-pointer"
                >
                  Ganti Pelanggan
                </button>
              </div>
            )}
          </div>

          {/* STEP 2: PILIH TAGIHAN BELUM LUNAS */}
          {selectedCustomer && (
            <div className="bg-white p-6 rounded-2xl border-2 border-sky-100 shadow-sm">
              <div className="flex items-center space-x-2 mb-3">
                <span className="w-7 h-7 rounded-full bg-sky-600 text-white font-black text-sm flex items-center justify-center">
                  2
                </span>
                <h2 className="text-lg font-bold text-slate-800">
                  Pilih Tagihan Rekening Air yang Dibayar
                </h2>
              </div>

              {customerUnpaidBills.length === 0 ? (
                <div className="p-6 bg-emerald-50 rounded-xl border border-emerald-200 text-center">
                  <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto mb-2" />
                  <span className="font-extrabold text-emerald-900 text-base block">
                    Pelanggan Ini Tidak Memiliki Tagihan Tertunggak!
                  </span>
                  <span className="text-emerald-700 text-sm">
                    Semua tagihan rekening air {selectedCustomer.customer_name} sudah lunas.
                  </span>
                </div>
              ) : (
                <div className="space-y-3">
                  {customerUnpaidBills.map((b) => {
                    const isSelected = selectedBillId === b.bill_id;

                    return (
                      <div
                        key={b.bill_id}
                        onClick={() => setSelectedBillId(b.bill_id)}
                        className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                          isSelected
                            ? 'border-emerald-500 bg-emerald-50/70 shadow-sm'
                            : 'border-slate-200 hover:border-sky-300 bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="flex items-center space-x-2">
                              <span className="font-black text-slate-900 text-base">
                                Periode: {b.period}
                              </span>
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                  b.status === 'OVERDUE'
                                    ? 'bg-rose-100 text-rose-800'
                                    : 'bg-amber-100 text-amber-800'
                                }`}
                              >
                                {b.status === 'OVERDUE' ? 'MENUNGGAK' : 'BELUM BAYAR'}
                              </span>
                            </div>
                            <div className="text-xs text-slate-500 font-mono mt-1">
                              No: {b.bill_number} | Pakai: {b.usage_m3} m³ ({b.previous_meter} &rarr; {b.current_meter})
                            </div>
                          </div>

                          <div className="text-right">
                            <span className="text-lg font-black text-slate-900 block font-mono">
                              Rp {b.total_bill.toLocaleString('id-ID')}
                            </span>
                            <span className="text-xs text-sky-700 font-bold">
                              {isSelected ? '✓ Terpilih' : 'Klik untuk memilih'}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Kolom Kanan: Rincian & Tombol Bayar */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border-2 border-emerald-200 shadow-md sticky top-24">
            <div className="flex items-center space-x-2 mb-4 border-b border-slate-200 pb-3">
              <span className="w-7 h-7 rounded-full bg-emerald-600 text-white font-black text-sm flex items-center justify-center">
                3
              </span>
              <h2 className="text-lg font-bold text-slate-800">Rincian Pembayaran</h2>
            </div>

            {selectedBill ? (
              <div className="space-y-4">
                <div className="space-y-2 text-sm border-b border-slate-200 pb-4">
                  <div className="flex justify-between text-slate-600">
                    <span>Biaya Air ({selectedBill.usage_m3} m³):</span>
                    <span className="font-mono font-bold text-slate-800">
                      Rp {selectedBill.water_charge.toLocaleString('id-ID')}
                    </span>
                  </div>

                  <div className="flex justify-between text-slate-600">
                    <span>Beban Tetap Bulanan:</span>
                    <span className="font-mono font-bold text-slate-800">
                      Rp {selectedBill.fixed_fee.toLocaleString('id-ID')}
                    </span>
                  </div>

                  {selectedBill.arrears > 0 && (
                    <div className="flex justify-between text-slate-600">
                      <span>Tunggakan Sebelumnya:</span>
                      <span className="font-mono font-bold text-rose-700">
                        Rp {selectedBill.arrears.toLocaleString('id-ID')}
                      </span>
                    </div>
                  )}

                  {selectedBill.late_fee > 0 && (
                    <div className="flex justify-between text-slate-600">
                      <span>Denda Keterlambatan:</span>
                      <span className="font-mono font-bold text-rose-700">
                        Rp {selectedBill.late_fee.toLocaleString('id-ID')}
                      </span>
                    </div>
                  )}

                  {selectedBill.discount > 0 && (
                    <div className="flex justify-between text-emerald-700 font-semibold">
                      <span>Promo Bulan Pertama (10 m³):</span>
                      <span className="font-mono font-bold">
                        - Rp {selectedBill.discount.toLocaleString('id-ID')}
                      </span>
                    </div>
                  )}
                </div>

                {/* TOTAL BESAR */}
                <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 text-center">
                  <span className="text-xs uppercase font-bold tracking-wider text-emerald-800 block">
                    Total yang Harus Dibayar
                  </span>
                  <span className="text-3xl font-black text-emerald-900 font-mono mt-1 block">
                    Rp {selectedBill.total_bill.toLocaleString('id-ID')}
                  </span>
                </div>

                {/* METODE BAYAR */}
                <div>
                  <label className="block text-sm font-bold text-slate-800 mb-1">
                    Metode Pembayaran
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {(['Tunai', 'Transfer Bank'] as const).map((method) => (
                      <button
                        type="button"
                        key={method}
                        onClick={() => setPaymentMethod(method)}
                        className={`py-2.5 px-3 rounded-xl text-sm font-bold border-2 transition cursor-pointer ${
                          paymentMethod === method
                            ? 'bg-emerald-600 text-white border-emerald-700 shadow-sm'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {method}
                      </button>
                    ))}
                  </div>
                </div>

                {/* PETUGAS */}
                <div>
                  <label className="block text-sm font-bold text-slate-800 mb-1">
                    Petugas Penerima Loket
                  </label>
                  <input
                    type="text"
                    value={officerName}
                    onChange={(e) => setOfficerName(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm font-bold"
                  />
                </div>

                {/* TOMBOL BESAR BAYAR */}
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={handleProcessPayment}
                  className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black text-lg shadow-lg hover:shadow-xl transition-all cursor-pointer flex items-center justify-center space-x-2 disabled:opacity-50"
                >
                  <CreditCard className="w-6 h-6" />
                  <span>
                    {isProcessing ? 'Sedang Memproses...' : '[ BAYAR & BUAT KWITANSI ]'}
                  </span>
                </button>
              </div>
            ) : (
              <div className="text-center py-10 text-slate-400">
                <ReceiptIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <span className="text-sm font-medium">
                  Pilih pelanggan dan tagihan di sebelah kiri untuk melihat rincian pembayaran.
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* TABEL RIWAYAT TRANSAKSI TERBARU & BATALKAN (VOID) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mt-8">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <h3 className="font-bold text-slate-800 text-base flex items-center space-x-2">
            <History className="w-5 h-5 text-sky-600" />
            <span>Riwayat Pembayaran Terbaru (Dukungan Koreksi & Batal)</span>
          </h3>
          <span className="text-xs text-slate-400">
            Pembatalan memerlukan alasan wajib dan mencatat audit log
          </span>
        </div>

        {/* MOBILE CARD VIEW FOR RECENT PAYMENTS */}
        <div className="block md:hidden divide-y divide-slate-100 p-3 space-y-3">
          {payments.length === 0 ? (
            <div className="py-8 text-center text-slate-500 font-medium text-sm">
              Belum ada riwayat pembayaran.
            </div>
          ) : (
            payments.map((p) => {
              const cust = customers.find((c) => c.customer_id === p.customer_id);
              return (
                <div
                  key={p.payment_id}
                  className="p-3.5 bg-slate-50/70 border border-slate-200/90 rounded-2xl space-y-2.5"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center space-x-1.5">
                        <span className="font-mono text-xs font-bold text-slate-800 bg-white border border-slate-200 px-2 py-0.5 rounded-md">
                          {p.receipt_number}
                        </span>
                        <span
                          className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                            p.status === 'SUCCESS'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {p.status === 'SUCCESS' ? 'Lunas' : 'Batal'}
                        </span>
                      </div>
                      <h4 className="font-black text-slate-900 text-base mt-1">
                        {cust ? cust.customer_name : p.customer_id}
                      </h4>
                      <div className="text-xs text-slate-500 font-medium">
                        Periode: <strong className="text-slate-800">{p.period}</strong> · ID: <span className="font-mono">{p.customer_id}</span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Nominal</span>
                      <span className="font-mono font-black text-emerald-700 text-base block">
                        Rp {p.amount_paid.toLocaleString('id-ID')}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-200/60">
                    <span>
                      Metode: <strong className="text-slate-800">{p.payment_method}</strong> ({p.officer})
                    </span>

                    <div className="flex items-center space-x-2">
                      {p.status === 'SUCCESS' && (
                        <button
                          onClick={() => onViewReceipt(p.receipt_number)}
                          className="px-2.5 py-1.5 bg-sky-600 active:bg-sky-700 text-white rounded-lg text-xs font-bold shadow-xs cursor-pointer"
                        >
                          Kwitansi
                        </button>
                      )}

                      {p.status === 'SUCCESS' && (
                        <button
                          onClick={() => {
                            setCancellingPayment(p);
                            setCancelReason('');
                          }}
                          className="px-2.5 py-1.5 bg-rose-100 hover:bg-rose-200 text-rose-700 rounded-lg text-xs font-bold cursor-pointer"
                        >
                          Batal
                        </button>
                      )}
                    </div>
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
              <tr className="bg-slate-50 text-slate-600 text-xs font-bold uppercase tracking-wider border-b border-slate-200">
                <th className="py-3 px-4">No. Bayar & Kwitansi</th>
                <th className="py-3 px-4">Pelanggan</th>
                <th className="py-3 px-4">Periode</th>
                <th className="py-3 px-4 text-right">Nominal</th>
                <th className="py-3 px-4">Metode & Petugas</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {payments.map((p) => {
                const cust = customers.find((c) => c.customer_id === p.customer_id);

                return (
                  <tr key={p.payment_id} className="hover:bg-slate-50/80">
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="font-mono text-xs font-bold text-slate-800 block">
                        {p.payment_number}
                      </span>
                      <span className="font-mono text-[11px] text-sky-700 bg-sky-50 px-1.5 py-0.5 rounded">
                        {p.receipt_number}
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      <span className="font-bold text-slate-900">
                        {cust ? cust.customer_name : p.customer_id}
                      </span>
                      <div className="text-xs text-slate-400">{p.customer_id}</div>
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap font-medium text-slate-700">
                      {p.period}
                    </td>

                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 whitespace-nowrap">
                      Rp {p.amount_paid.toLocaleString('id-ID')}
                    </td>

                    <td className="py-3 px-4 text-xs">
                      <div className="font-semibold text-slate-800">{p.payment_method}</div>
                      <div className="text-slate-400">{p.officer}</div>
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap">
                      <span
                        className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                          p.status === 'SUCCESS'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {p.status === 'SUCCESS' ? 'LUNAS' : 'DIBATALKAN'}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center space-x-2">
                        {/* Lihat Kwitansi */}
                        {p.status === 'SUCCESS' && (
                          <button
                            onClick={() => onViewReceipt(p.receipt_number)}
                            className="p-1.5 bg-sky-50 hover:bg-sky-100 text-sky-700 rounded-lg text-xs font-bold transition cursor-pointer"
                            title="Buka Kwitansi"
                          >
                            Kwitansi
                          </button>
                        )}

                        {/* Batal Transaksi */}
                        {p.status === 'SUCCESS' && (
                          <button
                            onClick={() => {
                              setCancellingPayment(p);
                              setCancelReason('');
                            }}
                            className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-xs font-bold transition cursor-pointer"
                            title="Batalkan Transaksi (Void)"
                          >
                            Batal
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL BATAL TRANSAKSI (VOID) */}
      {cancellingPayment && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center space-x-3 text-rose-700 mb-3">
              <AlertCircle className="w-6 h-6 shrink-0" />
              <h3 className="text-lg font-bold">Batalkan Pembayaran (Void)</h3>
            </div>

            <p className="text-sm text-slate-600 mb-3">
              Anda akan membatalkan pembayaran{' '}
              <strong className="font-mono">{cancellingPayment.payment_number}</strong> senilai Rp{' '}
              <strong>{cancellingPayment.amount_paid.toLocaleString('id-ID')}</strong>. Tagihan akan
              dikembalikan ke status Belum Bayar.
            </p>

            <div className="mb-4">
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Alasan Pembatalan Wajib <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={3}
                required
                placeholder="Contoh: Salah input nomor meter atau salah pilih pelanggan..."
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full p-3 border border-slate-300 rounded-xl text-sm focus:border-rose-500 focus:outline-none"
              ></textarea>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setCancellingPayment(null)}
                className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-bold hover:bg-slate-50 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmCancelPayment}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold cursor-pointer"
              >
                Konfirmasi Batalkan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
