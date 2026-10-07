// SIM-TIRTA LESTARI Finance View
// Kas Masuk, Kas Keluar, Buku Bank & Rekonsiliasi Saldo Otomatis

import React, { useState } from 'react';
import { CashIn, CashOut, BankLedger } from '../types';
import { AppStorage } from '../services/storage';
import { AuditLogger } from '../services/audit';
import {
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
  Landmark,
  Plus,
  Search,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  FileText,
  User,
  X,
} from 'lucide-react';

export const FinanceView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'CASH_IN' | 'CASH_OUT' | 'BANK'>('CASH_IN');

  const [cashIns, setCashIns] = useState<CashIn[]>(() => AppStorage.getCashIn());
  const [cashOuts, setCashOuts] = useState<CashOut[]>(() => AppStorage.getCashOut());
  const [bankLedger, setBankLedger] = useState<BankLedger[]>(() => AppStorage.getBankLedger());

  const [searchQuery, setSearchQuery] = useState('');

  // Modal Kas Keluar State
  const [isCashOutModalOpen, setIsCashOutModalOpen] = useState(false);
  const [outCategory, setOutCategory] = useState<CashOut['category']>('LISTRIK');
  const [outDesc, setOutDesc] = useState('');
  const [outAmount, setOutAmount] = useState<number>(0);
  const [outRecipient, setOutRecipient] = useState('');
  const [outProofNo, setOutProofNo] = useState('');
  const [outRequestedBy, setOutRequestedBy] = useState('Mas Joko');
  const [outApprovedBy, setOutApprovedBy] = useState('Pak H. Sugiyanto');

  // Modal Kas Masuk Manual State
  const [isCashInModalOpen, setIsCashInModalOpen] = useState(false);
  const [inCategory, setInCategory] = useState<CashIn['category']>('SAMBUNGAN BARU');
  const [inDesc, setInDesc] = useState('');
  const [inAmount, setInAmount] = useState<number>(0);
  const [inMethod, setInMethod] = useState<'Tunai' | 'Transfer'>('Tunai');

  // Modal Bank Entry State
  const [isBankModalOpen, setIsBankModalOpen] = useState(false);
  const [bankType, setBankType] = useState<'DEBIT' | 'CREDIT'>('CREDIT');
  const [bankDesc, setBankDesc] = useState('');
  const [bankAmount, setBankAmount] = useState<number>(0);
  const [bankRef, setBankRef] = useState('');

  // Total Kas Masuk & Keluar
  const totalCashIn = cashIns.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  const totalCashOut = cashOuts.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  const bookBalance = totalCashIn - totalCashOut;

  // Saldo Bank Terakhir
  const latestBankBalance =
    bankLedger.length > 0 ? bankLedger[bankLedger.length - 1].balance : 0;
  
  // Rekonsiliasi Saldo (Saldo Pembukuan vs Saldo Riil Bank)
  // Perbedaan biasanya karena uang tunai yang belum disetor ke bank
  const cashOnHand = bookBalance - latestBankBalance;
  const isReconciled = cashOnHand >= 0;

  const handleSaveCashOut = (e: React.FormEvent) => {
    e.preventDefault();
    if (outAmount <= 0) {
      alert('Nominal pengeluaran harus lebih besar dari Rp 0.');
      return;
    }

    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const newEntry: CashOut = {
      transaction_id: `COUT-${Date.now()}`,
      date: nowStr.substring(0, 10),
      category: outCategory,
      description: outDesc.trim(),
      amount: outAmount,
      recipient: outRecipient.trim(),
      proof_number: outProofNo.trim() || `NOTA-${Math.floor(100 + Math.random() * 900)}`,
      requested_by: outRequestedBy,
      approved_by: outApprovedBy,
      created_by: outApprovedBy,
      created_at: nowStr,
    };

    const updated = [newEntry, ...cashOuts];
    setCashOuts(updated);
    AppStorage.setCashOut(updated);

    AuditLogger.log({
      user: outApprovedBy,
      role: 'PENGURUS',
      action: 'CREATE EXPENSE',
      module: 'FINANCE',
      record_id: newEntry.transaction_id,
      new_value_summary: `Pengeluaran ${outCategory}: ${outDesc} Rp ${outAmount.toLocaleString('id-ID')} kepada ${outRecipient}`,
    });

    setIsCashOutModalOpen(false);
    setOutDesc('');
    setOutAmount(0);
    setOutRecipient('');
    setOutProofNo('');
  };

  const handleSaveCashIn = (e: React.FormEvent) => {
    e.preventDefault();
    if (inAmount <= 0) {
      alert('Nominal kas masuk harus lebih dari Rp 0.');
      return;
    }

    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const newEntry: CashIn = {
      transaction_id: `CIN-${Date.now()}`,
      date: nowStr,
      category: inCategory,
      reference_number: `REF-${Math.floor(1000 + Math.random() * 9000)}`,
      description: inDesc.trim(),
      amount: inAmount,
      payment_method: inMethod,
      created_by: 'Pak H. Sugiyanto',
      created_at: nowStr,
    };

    const updated = [newEntry, ...cashIns];
    setCashIns(updated);
    AppStorage.setCashIn(updated);

    AuditLogger.log({
      user: 'Pengurus',
      role: 'PENGURUS',
      action: 'PAYMENT',
      module: 'FINANCE',
      record_id: newEntry.transaction_id,
      new_value_summary: `Penerimaan Kas ${inCategory}: ${inDesc} Rp ${inAmount.toLocaleString('id-ID')}`,
    });

    setIsCashInModalOpen(false);
    setInDesc('');
    setInAmount(0);
  };

  const handleSaveBankEntry = (e: React.FormEvent) => {
    e.preventDefault();
    if (bankAmount <= 0) return;

    const prevBalance = bankLedger.length > 0 ? bankLedger[bankLedger.length - 1].balance : 0;
    const isCredit = bankType === 'CREDIT';
    const newBalance = isCredit ? prevBalance + bankAmount : prevBalance - bankAmount;

    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const newEntry: BankLedger = {
      entry_id: `BNK-${Date.now()}`,
      date: nowStr.substring(0, 10),
      type: bankType,
      reference: bankRef || 'TRX-BANK',
      description: bankDesc,
      debit: !isCredit ? bankAmount : 0,
      credit: isCredit ? bankAmount : 0,
      balance: newBalance,
      created_at: nowStr,
    };

    const updated = [...bankLedger, newEntry];
    setBankLedger(updated);
    AppStorage.setBankLedger(updated);
    setIsBankModalOpen(false);
    setBankDesc('');
    setBankAmount(0);
    setBankRef('');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner with Financial Overview */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 flex items-center space-x-2">
            <Wallet className="w-7 h-7 text-sky-600" />
            <span>Pengelolaan Keuangan & Kas KPSPAM</span>
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Pembukuan kas masuk, kas keluar, buku rekening bank dan rekonsiliasi saldo.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => setIsCashInModalOpen(true)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl font-bold flex items-center space-x-1.5 shadow transition cursor-pointer text-sm"
          >
            <Plus className="w-4 h-4" />
            <span>+ Kas Masuk</span>
          </button>

          <button
            onClick={() => setIsCashOutModalOpen(true)}
            className="bg-rose-600 hover:bg-rose-700 text-white px-4 py-2.5 rounded-xl font-bold flex items-center space-x-1.5 shadow transition cursor-pointer text-sm"
          >
            <Plus className="w-4 h-4" />
            <span>+ Kas Keluar</span>
          </button>
        </div>
      </div>

      {/* 3 Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center space-x-2 text-emerald-700 font-bold text-xs uppercase mb-1">
            <ArrowDownLeft className="w-4 h-4" />
            <span>Total Penerimaan (Masuk)</span>
          </div>
          <span className="text-2xl font-black text-emerald-700 font-mono">
            Rp {totalCashIn.toLocaleString('id-ID')}
          </span>
          <span className="text-[11px] text-slate-400 block mt-1">
            {cashIns.length} transaksi tercatat
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center space-x-2 text-rose-700 font-bold text-xs uppercase mb-1">
            <ArrowUpRight className="w-4 h-4" />
            <span>Total Pengeluaran (Keluar)</span>
          </div>
          <span className="text-2xl font-black text-rose-700 font-mono">
            Rp {totalCashOut.toLocaleString('id-ID')}
          </span>
          <span className="text-[11px] text-slate-400 block mt-1">
            {cashOuts.length} transaksi operasional
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center space-x-2 text-sky-800 font-bold text-xs uppercase mb-1">
            <Wallet className="w-4 h-4" />
            <span>Saldo Pembukuan Kas</span>
          </div>
          <span className="text-2xl font-black text-sky-900 font-mono">
            Rp {bookBalance.toLocaleString('id-ID')}
          </span>
          <span className="text-[11px] text-slate-400 block mt-1">
            Penerimaan - Pengeluaran
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center space-x-2 text-indigo-700 font-bold text-xs uppercase mb-1">
            <Landmark className="w-4 h-4" />
            <span>Saldo di Rekening Bank</span>
          </div>
          <span className="text-2xl font-black text-indigo-900 font-mono">
            Rp {latestBankBalance.toLocaleString('id-ID')}
          </span>
          <span className="text-[11px] text-slate-400 block mt-1">
            Kas Tunai di Brankas: Rp {cashOnHand.toLocaleString('id-ID')}
          </span>
        </div>
      </div>

      {/* Rekonsiliasi Warning / Status Banner */}
      <div
        className={`p-4 rounded-2xl border flex items-center justify-between ${
          isReconciled
            ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
            : 'bg-rose-50 border-rose-300 text-rose-900'
        }`}
      >
        <div className="flex items-center space-x-3">
          {isReconciled ? (
            <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
          ) : (
            <AlertTriangle className="w-6 h-6 text-rose-600 shrink-0" />
          )}
          <div>
            <span className="font-extrabold text-sm block">
              {isReconciled
                ? 'Rekonsiliasi Saldo Pembukuan & Bank Sesuai'
                : 'Peringatan: Terdapat Selisih Saldo Tidak Wajar!'}
            </span>
            <span className="text-xs">
              Saldo Pembukuan: <strong>Rp {bookBalance.toLocaleString('id-ID')}</strong> | Saldo Bank:{' '}
              <strong>Rp {latestBankBalance.toLocaleString('id-ID')}</strong> | Uang Fisik Kas Loket:{' '}
              <strong>Rp {cashOnHand.toLocaleString('id-ID')}</strong>
            </span>
          </div>
        </div>

        <button
          onClick={() => setIsBankModalOpen(true)}
          className="text-xs bg-white text-slate-800 font-bold px-3 py-1.5 rounded-lg border border-slate-300 shadow-2xs hover:bg-slate-50 cursor-pointer"
        >
          + Mutasi Bank
        </button>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-slate-200 space-x-4">
        {[
          { id: 'CASH_IN', label: 'Buku Kas Masuk', count: cashIns.length },
          { id: 'CASH_OUT', label: 'Buku Kas Keluar', count: cashOuts.length },
          { id: 'BANK', label: 'Buku Bank & Ledger', count: bankLedger.length },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as 'CASH_IN' | 'CASH_OUT' | 'BANK')}
            className={`pb-3 font-bold text-sm transition border-b-2 flex items-center space-x-2 cursor-pointer ${
              activeTab === tab.id
                ? 'border-sky-600 text-sky-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <span>{tab.label}</span>
            <span
              className={`text-xs px-2 py-0.5 rounded-full ${
                activeTab === tab.id ? 'bg-sky-100 text-sky-800' : 'bg-slate-100 text-slate-600'
              }`}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* TAB 1: KAS MASUK */}
      {activeTab === 'CASH_IN' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {/* Mobile Card List for Cash In */}
          <div className="block md:hidden divide-y divide-slate-100 p-3 space-y-3">
            {cashIns.length === 0 ? (
              <div className="py-8 text-center text-slate-500 font-medium text-sm">
                Belum ada data kas masuk.
              </div>
            ) : (
              cashIns.map((ci) => (
                <div
                  key={ci.transaction_id}
                  className="p-3.5 bg-slate-50/70 border border-slate-200/90 rounded-2xl space-y-2"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center space-x-1.5">
                        <span className="font-mono text-xs font-bold text-slate-800 bg-white border border-slate-200 px-2 py-0.5 rounded-md">
                          {ci.transaction_id}
                        </span>
                        <span className="text-xs font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md">
                          {ci.category}
                        </span>
                      </div>
                      <h4 className="font-bold text-slate-900 text-sm mt-1.5 leading-snug">
                        {ci.description}
                      </h4>
                      <p className="text-xs text-slate-400 font-medium mt-0.5">
                        {ci.date.substring(0, 16)} · Ref: <span className="font-mono">{ci.reference_number}</span>
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Jumlah</span>
                      <span className="font-mono font-black text-emerald-700 text-base block">
                        +Rp {ci.amount.toLocaleString('id-ID')}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-500 pt-1.5 border-t border-slate-200/60">
                    <span>Metode: <strong className="text-slate-800">{ci.payment_method}</strong></span>
                    <span>Petugas: <strong className="text-slate-800">{ci.created_by}</strong></span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50 text-slate-600 text-xs font-bold uppercase tracking-wider border-b border-slate-200">
                  <th className="py-3 px-4">Tanggal & Transaksi ID</th>
                  <th className="py-3 px-4">Kategori</th>
                  <th className="py-3 px-4">Keterangan</th>
                  <th className="py-3 px-4">No. Bukti / Ref</th>
                  <th className="py-3 px-4 text-right">Jumlah (Rp)</th>
                  <th className="py-3 px-4">Metode</th>
                  <th className="py-3 px-4">Petugas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {cashIns.map((ci) => (
                  <tr key={ci.transaction_id} className="hover:bg-slate-50/80">
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="font-mono text-xs text-slate-800 font-bold block">
                        {ci.transaction_id}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {ci.date.substring(0, 16)}
                      </span>
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded">
                        {ci.category}
                      </span>
                    </td>

                    <td className="py-3 px-4 font-medium text-slate-800">
                      {ci.description}
                    </td>

                    <td className="py-3 px-4 font-mono text-xs text-slate-600 whitespace-nowrap">
                      {ci.reference_number}
                    </td>

                    <td className="py-3 px-4 text-right font-mono font-black text-emerald-700 whitespace-nowrap">
                      Rp {ci.amount.toLocaleString('id-ID')}
                    </td>

                    <td className="py-3 px-4 text-xs font-semibold text-slate-600">
                      {ci.payment_method}
                    </td>

                    <td className="py-3 px-4 text-xs text-slate-500">
                      {ci.created_by}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: KAS KELUAR */}
      {activeTab === 'CASH_OUT' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {/* Mobile Card List for Cash Out */}
          <div className="block md:hidden divide-y divide-slate-100 p-3 space-y-3">
            {cashOuts.length === 0 ? (
              <div className="py-8 text-center text-slate-500 font-medium text-sm">
                Belum ada data pengeluaran kas.
              </div>
            ) : (
              cashOuts.map((co) => (
                <div
                  key={co.transaction_id}
                  className="p-3.5 bg-slate-50/70 border border-slate-200/90 rounded-2xl space-y-2"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center space-x-1.5">
                        <span className="font-mono text-xs font-bold text-slate-800 bg-white border border-slate-200 px-2 py-0.5 rounded-md">
                          {co.transaction_id}
                        </span>
                        <span className="text-xs font-bold bg-rose-100 text-rose-800 px-2 py-0.5 rounded-md">
                          {co.category}
                        </span>
                      </div>
                      <h4 className="font-bold text-slate-900 text-sm mt-1.5 leading-snug">
                        {co.description}
                      </h4>
                      <p className="text-xs text-slate-400 font-medium mt-0.5">
                        {co.date} · Bukti: <span className="font-mono">{co.proof_number}</span>
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Jumlah</span>
                      <span className="font-mono font-black text-rose-700 text-base block">
                        -Rp {co.amount.toLocaleString('id-ID')}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-500 pt-1.5 border-t border-slate-200/60">
                    <span>Penerima: <strong className="text-slate-800">{co.recipient}</strong></span>
                    <span>Disetujui: <strong className="text-slate-800">{co.approved_by}</strong></span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50 text-slate-600 text-xs font-bold uppercase tracking-wider border-b border-slate-200">
                  <th className="py-3 px-4">Tanggal & Transaksi ID</th>
                  <th className="py-3 px-4">Kategori Biaya</th>
                  <th className="py-3 px-4">Keterangan Biaya</th>
                  <th className="py-3 px-4">Penerima & Bukti Nota</th>
                  <th className="py-3 px-4 text-right">Jumlah (Rp)</th>
                  <th className="py-3 px-4">Pemohon / Disetujui</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {cashOuts.map((co) => (
                  <tr key={co.transaction_id} className="hover:bg-rose-50/30">
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="font-mono text-xs text-slate-800 font-bold block">
                        {co.transaction_id}
                      </span>
                      <span className="text-[11px] text-slate-400">{co.date}</span>
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="text-xs font-bold bg-rose-50 text-rose-800 border border-rose-200 px-2 py-0.5 rounded">
                        {co.category}
                      </span>
                    </td>

                    <td className="py-3 px-4 font-medium text-slate-800">
                      {co.description}
                    </td>

                    <td className="py-3 px-4 text-xs">
                      <div className="font-bold text-slate-800">{co.recipient}</div>
                      <div className="font-mono text-slate-400">Bukti: {co.proof_number}</div>
                    </td>

                    <td className="py-3 px-4 text-right font-mono font-black text-rose-700 whitespace-nowrap">
                      Rp {co.amount.toLocaleString('id-ID')}
                    </td>

                    <td className="py-3 px-4 text-xs">
                      <div>Pemohon: {co.requested_by}</div>
                      <div className="text-slate-400">Disetujui: {co.approved_by}</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: BUKU BANK */}
      {activeTab === 'BANK' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50 text-slate-600 text-xs font-bold uppercase tracking-wider border-b border-slate-200">
                  <th className="py-3 px-4">Tanggal & Entry ID</th>
                  <th className="py-3 px-4">Keterangan Mutasi</th>
                  <th className="py-3 px-4">Referensi</th>
                  <th className="py-3 px-4 text-right">Debit (Keluar)</th>
                  <th className="py-3 px-4 text-right">Kredit (Masuk)</th>
                  <th className="py-3 px-4 text-right">Saldo Bank</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {bankLedger.map((b) => (
                  <tr key={b.entry_id} className="hover:bg-slate-50/80">
                    <td className="py-3 px-4 whitespace-nowrap font-mono text-xs">
                      <span className="font-bold text-slate-800 block">{b.date}</span>
                      <span className="text-slate-400">{b.entry_id}</span>
                    </td>

                    <td className="py-3 px-4 font-semibold text-slate-800">{b.description}</td>

                    <td className="py-3 px-4 font-mono text-xs text-slate-500">{b.reference}</td>

                    <td className="py-3 px-4 text-right font-mono text-rose-600 font-bold whitespace-nowrap">
                      {b.debit > 0 ? `Rp ${b.debit.toLocaleString('id-ID')}` : '-'}
                    </td>

                    <td className="py-3 px-4 text-right font-mono text-emerald-600 font-bold whitespace-nowrap">
                      {b.credit > 0 ? `Rp ${b.credit.toLocaleString('id-ID')}` : '-'}
                    </td>

                    <td className="py-3 px-4 text-right font-mono font-black text-indigo-900 whitespace-nowrap">
                      Rp {b.balance.toLocaleString('id-ID')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL KAS KELUAR */}
      {isCashOutModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-lg font-bold text-slate-800">Catat Kas Keluar (Biaya)</h3>
              <button
                onClick={() => setIsCashOutModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCashOut} className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Kategori Pengeluaran
                  </label>
                  <select
                    value={outCategory}
                    onChange={(e) => setOutCategory(e.target.value as CashOut['category'])}
                    className="w-full p-2.5 border border-slate-300 rounded-xl font-bold"
                  >
                    <option value="LISTRIK">LISTRIK PLN</option>
                    <option value="PERAWATAN">PERAWATAN</option>
                    <option value="PIPA">PIPA & FITTINGS</option>
                    <option value="POMPA">POMPA & PANEL</option>
                    <option value="HONOR">HONOR PETUGAS</option>
                    <option value="ADMINISTRASI">ADMINISTRASI</option>
                    <option value="OPERASIONAL">OPERASIONAL</option>
                    <option value="LAINNYA">LAINNYA</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Nominal Biaya (Rp) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min={1}
                    required
                    placeholder="0"
                    value={outAmount || ''}
                    onChange={(e) => setOutAmount(Number(e.target.value))}
                    className="w-full p-2.5 border border-slate-300 rounded-xl font-mono font-bold text-rose-700"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Keterangan Pembayaran
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="Contoh: Beli pipa HDPE 1 inch 2 roll dan lem pipa..."
                  value={outDesc}
                  onChange={(e) => setOutDesc(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-xl text-sm"
                ></textarea>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Penerima / Toko
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Toko Besi Berkah"
                    value={outRecipient}
                    onChange={(e) => setOutRecipient(e.target.value)}
                    className="w-full p-2.5 border border-slate-300 rounded-xl text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    No. Bukti / Nota
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: NOTA-492"
                    value={outProofNo}
                    onChange={(e) => setOutProofNo(e.target.value)}
                    className="w-full p-2.5 border border-slate-300 rounded-xl text-sm font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCashOutModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 font-bold rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl shadow-md"
                >
                  Simpan Pengeluaran
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL KAS MASUK MANUAL */}
      {isCashInModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-lg font-bold text-slate-800">Catat Penerimaan Kas Masuk Manual</h3>
              <button
                onClick={() => setIsCashInModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCashIn} className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Kategori Kas Masuk
                  </label>
                  <select
                    value={inCategory}
                    onChange={(e) => setInCategory(e.target.value as CashIn['category'])}
                    className="w-full p-2.5 border border-slate-300 rounded-xl font-bold"
                  >
                    <option value="SAMBUNGAN BARU">SAMBUNGAN BARU</option>
                    <option value="DENDA">DENDA</option>
                    <option value="REKENING AIR">REKENING AIR</option>
                    <option value="LAINNYA">LAINNYA</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Nominal (Rp)
                  </label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={inAmount || ''}
                    onChange={(e) => setInAmount(Number(e.target.value))}
                    className="w-full p-2.5 border border-slate-300 rounded-xl font-mono font-bold text-emerald-700"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Keterangan Penerimaan
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="Keterangan..."
                  value={inDesc}
                  onChange={(e) => setInDesc(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-xl text-sm"
                ></textarea>
              </div>

              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCashInModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 font-bold rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md"
                >
                  Simpan Kas Masuk
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL MUTASI BANK */}
      {isBankModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-lg font-bold text-slate-800">Catat Mutasi Rekening Bank</h3>
              <button
                onClick={() => setIsBankModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveBankEntry} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Jenis Transaksi
                </label>
                <select
                  value={bankType}
                  onChange={(e) => setBankType(e.target.value as 'DEBIT' | 'CREDIT')}
                  className="w-full p-2.5 border border-slate-300 rounded-xl font-bold"
                >
                  <option value="CREDIT">Setor / Uang Masuk ke Bank (Kredit)</option>
                  <option value="DEBIT">Tarik / Biaya Bank (Debit)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Nominal (Rp)
                </label>
                <input
                  type="number"
                  min={1}
                  required
                  value={bankAmount || ''}
                  onChange={(e) => setBankAmount(Number(e.target.value))}
                  className="w-full p-2.5 border border-slate-300 rounded-xl font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Keterangan
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Setoran uang kas hasil tagihan September"
                  value={bankDesc}
                  onChange={(e) => setBankDesc(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-xl text-sm"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsBankModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 font-bold rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md"
                >
                  Simpan Mutasi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
