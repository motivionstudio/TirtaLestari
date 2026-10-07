// SIM-TIRTA LESTARI Receipts View
// Format Resmi Kwitansi A5/A6 Siap Cetak & Kirim WhatsApp dengan Kode Verifikasi Resmi

import React, { useState } from 'react';
import { Receipt, Customer } from '../types';
import { AppStorage } from '../services/storage';
import { WhatsAppService } from '../services/whatsapp';
import {
  Receipt as ReceiptIcon,
  Search,
  Printer,
  Download,
  MessageSquare,
  Droplets,
  CheckCircle2,
  Calendar,
  User,
  ShieldCheck,
  FileCheck,
} from 'lucide-react';

interface ReceiptsViewProps {
  initialReceiptNumber?: string | null;
}

export const ReceiptsView: React.FC<ReceiptsViewProps> = ({ initialReceiptNumber }) => {
  const [receipts] = useState<Receipt[]>(() => AppStorage.getReceipts());
  const [customers] = useState<Customer[]>(() => AppStorage.getCustomers());
  const settings = AppStorage.getSettings();

  const [selectedReceiptNumber, setSelectedReceiptNumber] = useState<string>(
    initialReceiptNumber || (receipts.length > 0 ? receipts[0].receipt_number : '')
  );
  const [searchQuery, setSearchQuery] = useState('');

  const selectedReceipt = receipts.find((r) => r.receipt_number === selectedReceiptNumber);
  const selectedCustomer = selectedReceipt
    ? customers.find((c) => c.customer_id === selectedReceipt.customer_id)
    : null;

  const filteredReceipts = receipts.filter((r) => {
    const cust = customers.find((c) => c.customer_id === r.customer_id);
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      r.receipt_number.toLowerCase().includes(q) ||
      r.customer_id.toLowerCase().includes(q) ||
      (cust && cust.customer_name.toLowerCase().includes(q))
    );
  });

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = () => {
    // Generate text/pdf blob download simulation for Drive
    const receiptContent = `KWITANSI PEMBAYARAN REKENING AIR
KPSPAM TIRTA LESTARI
Kalurahan Ngawu, Kapanewon Playen, Kabupaten Gunungkidul
=========================================================
Nomor Kwitansi : ${selectedReceipt?.receipt_number}
Tanggal Bayar  : ${selectedReceipt?.payment_date}
Pelanggan      : ${selectedCustomer?.customer_name} (${selectedReceipt?.customer_id})
Alamat         : Dusun ${selectedCustomer?.dusun}, RT ${selectedCustomer?.rt}/RW ${selectedCustomer?.rw}
Periode        : ${selectedReceipt?.period}
Meter Air      : ${selectedReceipt?.previous_meter} -> ${selectedReceipt?.current_meter} (${selectedReceipt?.usage_m3} m3)
---------------------------------------------------------
Biaya Air      : Rp ${selectedReceipt?.water_charge.toLocaleString('id-ID')}
Beban Bulanan  : Rp ${selectedReceipt?.fixed_fee.toLocaleString('id-ID')}
Tunggakan      : Rp ${selectedReceipt?.arrears.toLocaleString('id-ID')}
Denda          : Rp ${selectedReceipt?.late_fee.toLocaleString('id-ID')}
Diskon         : Rp ${selectedReceipt?.discount.toLocaleString('id-ID')}
---------------------------------------------------------
TOTAL DIBAYAR  : Rp ${selectedReceipt?.total_amount.toLocaleString('id-ID')}
Metode Bayar   : ${selectedReceipt?.payment_method}
STATUS         : LUNAS
Petugas        : ${selectedReceipt?.officer}
Kode Verifikasi: ${selectedReceipt?.verification_code}
=========================================================
Terima kasih atas pembayaran rekening air KPSPAM Tirta Lestari.`;

    const blob = new Blob([receiptContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${selectedReceipt?.receipt_number}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner (No Print) */}
      <div className="no-print bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 flex items-center space-x-2">
            <ReceiptIcon className="w-7 h-7 text-sky-600" />
            <span>Kwitansi Resmi KPSPAM</span>
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Format resmi siap cetak ukuran A5/A6 dan dapat langsung dibagikan ke WhatsApp pelanggan.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={handlePrint}
            className="bg-sky-600 hover:bg-sky-700 text-white px-5 py-2.5 rounded-xl font-bold flex items-center space-x-2 shadow-md transition cursor-pointer"
          >
            <Printer className="w-5 h-5" />
            <span>Cetak Kwitansi</span>
          </button>

          <button
            onClick={handleDownloadPdf}
            className="bg-slate-800 hover:bg-slate-900 text-white px-4 py-2.5 rounded-xl font-bold flex items-center space-x-2 shadow-sm transition cursor-pointer text-sm"
          >
            <Download className="w-4 h-4" />
            <span>Unduh Arsip</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Kolom Kiri: Daftar Kwitansi (No Print) */}
        <div className="no-print bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
          <h3 className="font-bold text-slate-800 text-base">Pilih Kwitansi</h3>
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Cari No Kwitansi / Pelanggan..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:bg-white focus:outline-none"
            />
          </div>

          <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto">
            {filteredReceipts.map((r) => {
              const cust = customers.find((c) => c.customer_id === r.customer_id);
              const isSelected = r.receipt_number === selectedReceiptNumber;

              return (
                <button
                  key={r.receipt_id}
                  onClick={() => setSelectedReceiptNumber(r.receipt_number)}
                  className={`w-full text-left p-3 rounded-xl transition cursor-pointer my-1 ${
                    isSelected ? 'bg-sky-50 border-2 border-sky-400 shadow-xs' : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-black text-sky-800 text-xs">
                      {r.receipt_number}
                    </span>
                    <span className="text-[10px] text-slate-400">{r.payment_date.substring(0, 10)}</span>
                  </div>
                  <div className="font-bold text-slate-900 text-sm mt-0.5 truncate">
                    {cust?.customer_name}
                  </div>
                  <div className="flex items-center justify-between mt-1 text-xs text-slate-500">
                    <span>Periode {r.period}</span>
                    <span className="font-bold text-emerald-700 font-mono">
                      Rp {r.total_amount.toLocaleString('id-ID')}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Kolom Kanan / Lembar Kwitansi A5/A6 (Print Target) */}
        <div className="lg:col-span-2">
          {selectedReceipt ? (
            <div className="space-y-4">
              {/* WhatsApp Quick Share (No Print) */}
              {selectedCustomer && (
                <div className="no-print p-4 bg-emerald-50 rounded-2xl border border-emerald-200 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <MessageSquare className="w-5 h-5 text-emerald-600" />
                    <span className="text-sm font-bold text-emerald-900">
                      Kirim kwitansi ini ke WhatsApp Pelanggan ({selectedCustomer.phone})
                    </span>
                  </div>
                  <a
                    href={WhatsAppService.generateWhatsAppUrl(
                      selectedCustomer.phone,
                      WhatsAppService.getPaymentSuccessMessage({
                        customerName: selectedCustomer.customer_name,
                        period: selectedReceipt.period,
                        amountPaid: selectedReceipt.total_amount,
                        receiptNumber: selectedReceipt.receipt_number,
                        paymentMethod: selectedReceipt.payment_method,
                        paymentDate: selectedReceipt.payment_date,
                        officer: selectedReceipt.officer,
                        verificationCode: selectedReceipt.verification_code,
                      })
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-bold shadow transition flex items-center space-x-1"
                  >
                    <span>Kirim ke WhatsApp</span>
                  </a>
                </div>
              )}

              {/* TAMPILAN RESMI KWITANSI (A5/A6 Format) */}
              <div
                id="printable-receipt"
                className="bg-white p-8 rounded-2xl border-2 border-slate-300 shadow-md max-w-2xl mx-auto"
              >
                {/* Header Kwitansi dengan Logo & Identitas Resmi */}
                <div className="flex items-start justify-between border-b-2 border-slate-800 pb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-14 h-14 bg-sky-700 text-white rounded-xl flex items-center justify-center font-black">
                      <Droplets className="w-8 h-8 fill-sky-200" />
                    </div>
                    <div>
                      <h2 className="text-xl font-black text-slate-900 tracking-tight leading-tight">
                        KPSPAM TIRTA LESTARI
                      </h2>
                      <p className="text-xs text-slate-600 font-bold">
                        Kalurahan Ngawu, Kapanewon Playen, Kabupaten Gunungkidul
                      </p>
                      <p className="text-[11px] text-slate-500">
                        {settings.ORG_ADDRESS} | Telp/WA: {settings.ORG_PHONE}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-xs font-extrabold uppercase tracking-widest text-sky-800 block">
                      BUKTI PEMBAYARAN RESMI
                    </span>
                    <span className="text-sm font-black font-mono text-slate-900 block mt-0.5">
                      {selectedReceipt.receipt_number}
                    </span>
                  </div>
                </div>

                {/* Info Transaksi & Pelanggan */}
                <div className="grid grid-cols-2 gap-4 py-4 border-b border-slate-200 text-xs">
                  <div>
                    <span className="text-slate-500 block">Diterima dari:</span>
                    <strong className="text-base text-slate-900 block mt-0.5">
                      {selectedCustomer?.customer_name}
                    </strong>
                    <div className="text-slate-600 font-mono mt-0.5">
                      ID: {selectedReceipt.customer_id} | Sambungan: {selectedCustomer?.connection_id}
                    </div>
                    <div className="text-slate-600">
                      Alamat: Dusun {selectedCustomer?.dusun}, RT {selectedCustomer?.rt}/RW{' '}
                      {selectedCustomer?.rw}
                    </div>
                  </div>

                  <div className="text-right space-y-1">
                    <div>
                      <span className="text-slate-500">Periode Tagihan:</span>{' '}
                      <strong className="text-slate-900 font-bold">{selectedReceipt.period}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500">Tanggal Bayar:</span>{' '}
                      <strong className="text-slate-900 font-mono">
                        {selectedReceipt.payment_date}
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-500">Metode Bayar:</span>{' '}
                      <strong className="text-slate-900">{selectedReceipt.payment_method}</strong>
                    </div>
                  </div>
                </div>

                {/* Pencatatan Meter */}
                <div className="py-3 bg-slate-50 rounded-xl px-4 my-4 flex items-center justify-between text-xs border border-slate-200">
                  <div>
                    <span className="text-slate-500">Meter Lalu:</span>{' '}
                    <strong className="font-mono font-bold text-slate-800">
                      {selectedReceipt.previous_meter} m³
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-500">Meter Kini:</span>{' '}
                    <strong className="font-mono font-bold text-slate-800">
                      {selectedReceipt.current_meter} m³
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-500">Pemakaian:</span>{' '}
                    <strong className="font-mono font-black text-sky-800 bg-sky-100 px-2 py-0.5 rounded">
                      {selectedReceipt.usage_m3} m³
                    </strong>
                  </div>
                </div>

                {/* Rincian Tagihan */}
                <div className="space-y-1.5 text-xs py-2">
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-600">
                      Biaya Pemakaian Air ({selectedReceipt.usage_m3} m³)
                    </span>
                    <span className="font-mono font-bold text-slate-800">
                      Rp {selectedReceipt.water_charge.toLocaleString('id-ID')}
                    </span>
                  </div>

                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-600">Beban Pemeliharaan & Administrasi Bulanan</span>
                    <span className="font-mono font-bold text-slate-800">
                      Rp {selectedReceipt.fixed_fee.toLocaleString('id-ID')}
                    </span>
                  </div>

                  {selectedReceipt.arrears > 0 && (
                    <div className="flex justify-between py-1 border-b border-slate-100 text-rose-700">
                      <span>Tunggakan Rekening Sebelumnya</span>
                      <span className="font-mono font-bold">
                        Rp {selectedReceipt.arrears.toLocaleString('id-ID')}
                      </span>
                    </div>
                  )}

                  {selectedReceipt.late_fee > 0 && (
                    <div className="flex justify-between py-1 border-b border-slate-100 text-rose-700">
                      <span>Denda Keterlambatan</span>
                      <span className="font-mono font-bold">
                        Rp {selectedReceipt.late_fee.toLocaleString('id-ID')}
                      </span>
                    </div>
                  )}

                  {selectedReceipt.discount > 0 && (
                    <div className="flex justify-between py-1 border-b border-slate-100 text-emerald-700">
                      <span>Diskon / Promo Bulan Pertama (10 m³ Gratis)</span>
                      <span className="font-mono font-bold">
                        - Rp {selectedReceipt.discount.toLocaleString('id-ID')}
                      </span>
                    </div>
                  )}
                </div>

                {/* Total Box & Status LUNAS */}
                <div className="mt-4 p-4 bg-emerald-50 border-2 border-emerald-300 rounded-xl flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">
                      Jumlah Diterima
                    </span>
                    <span className="text-2xl font-black text-emerald-900 font-mono block">
                      Rp {selectedReceipt.total_amount.toLocaleString('id-ID')}
                    </span>
                  </div>

                  <div className="flex items-center space-x-2 bg-emerald-600 text-white px-4 py-2 rounded-xl shadow-xs">
                    <CheckCircle2 className="w-5 h-5" />
                    <span className="font-black text-base tracking-wider">LUNAS</span>
                  </div>
                </div>

                {/* Footer Tanda Tangan & Kode Verifikasi */}
                <div className="mt-6 pt-4 border-t-2 border-slate-200 flex items-end justify-between text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Kode Verifikasi Kwitansi:</span>
                    <span className="font-mono font-black text-sky-800 bg-sky-50 px-2 py-1 rounded border border-sky-200 inline-block mt-0.5">
                      {selectedReceipt.verification_code}
                    </span>
                    <div className="text-[10px] text-slate-400 mt-1">
                      Dokumen sah diterbitkan otomatis oleh sistem SIM-TIRTA LESTARI
                    </div>
                  </div>

                  <div className="text-center w-48">
                    <span className="text-slate-500 block">Petugas Penerima,</span>
                    <div className="h-12 flex items-center justify-center">
                      <span className="font-serif italic text-slate-400 text-xs">
                        [Tercatat di Sistem]
                      </span>
                    </div>
                    <strong className="text-slate-900 font-bold block border-t border-slate-300 pt-1">
                      {selectedReceipt.officer}
                    </strong>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center text-slate-400">
              Belum ada kwitansi yang dipilih.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
