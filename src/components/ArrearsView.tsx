// SIM-TIRTA LESTARI Arrears & WhatsApp Follow-Up View
// Pengelolaan Tunggakan Pelanggan, Denda Keterlambatan, dan Follow-up 1-Klik WhatsApp

import React, { useState } from 'react';
import { Customer, Bill } from '../types';
import { AppStorage } from '../services/storage';
import { WhatsAppService } from '../services/whatsapp';
import { AuditLogger } from '../services/audit';
import {
  AlertTriangle,
  Search,
  MessageSquare,
  Clock,
  CheckCircle2,
  Calendar,
  Filter,
  Phone,
} from 'lucide-react';

interface ArrearItem {
  customerId: string;
  customerName: string;
  phone: string;
  dusun: string;
  unpaidBills: Bill[];
  monthCount: number;
  principalAmount: number;
  lateFeeTotal: number;
  totalArrears: number;
  lastFollowUp?: string;
}

export const ArrearsView: React.FC = () => {
  const [bills] = useState<Bill[]>(() => AppStorage.getBills());
  const [customers] = useState<Customer[]>(() => AppStorage.getCustomers());
  const [durationFilter, setDurationFilter] = useState<'ALL' | '1' | '2' | '3+'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [followUpRecord, setFollowUpRecord] = useState<Record<string, string>>({});

  // Group unpaid & overdue bills by customer
  const unpaidBills = bills.filter((b) => b.status !== 'PAID' && b.status !== 'CANCELLED');
  const customerMap = new Map<string, Bill[]>();

  unpaidBills.forEach((b) => {
    const list = customerMap.get(b.customer_id) || [];
    list.push(b);
    customerMap.set(b.customer_id, list);
  });

  const arrearList: ArrearItem[] = [];

  customerMap.forEach((cBills, cId) => {
    const cust = customers.find((c) => c.customer_id === cId);
    if (!cust) return;

    // Hitung pokok dan denda
    let principal = 0;
    let lateFee = 0;

    cBills.forEach((b) => {
      principal += b.water_charge + b.fixed_fee + (b.arrears || 0) - (b.discount || 0);
      lateFee += b.late_fee || 0;
    });

    const total = principal + lateFee;

    arrearList.push({
      customerId: cust.customer_id,
      customerName: cust.customer_name,
      phone: cust.phone,
      dusun: cust.dusun,
      unpaidBills: cBills,
      monthCount: cBills.length,
      principalAmount: principal,
      lateFeeTotal: lateFee,
      totalArrears: total,
      lastFollowUp: followUpRecord[cust.customer_id],
    });
  });

  // Sort by highest arrears or month count
  arrearList.sort((a, b) => b.monthCount - a.monthCount || b.totalArrears - a.totalArrears);

  // Filter duration
  const filteredArrears = arrearList.filter((item) => {
    if (durationFilter === '1' && item.monthCount !== 1) return false;
    if (durationFilter === '2' && item.monthCount !== 2) return false;
    if (durationFilter === '3+' && item.monthCount < 3) return false;

    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      item.customerName.toLowerCase().includes(q) ||
      item.customerId.toLowerCase().includes(q) ||
      item.phone.includes(q) ||
      item.dusun.toLowerCase().includes(q)
    );
  });

  const handleFollowUpClick = (item: ArrearItem) => {
    const nowStr = new Date().toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
    setFollowUpRecord((prev) => ({ ...prev, [item.customerId]: nowStr }));

    AuditLogger.log({
      user: 'Pengurus',
      role: 'PENGURUS',
      action: 'UPDATE CUSTOMER',
      module: 'ARREARS',
      record_id: item.customerId,
      new_value_summary: `Follow up WA tunggakan ${item.customerName} (${item.customerId}): ${item.monthCount} bulan, total Rp ${item.totalArrears.toLocaleString('id-ID')}`,
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-rose-800 flex items-center space-x-2">
            <AlertTriangle className="w-7 h-7 text-rose-600" />
            <span>Daftar Pelanggan Belum Bayar / Menunggak</span>
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Pantau tunggakan warga dan lakukan penagihan persuasif melalui pesan WhatsApp resmi 1-klik.
          </p>
        </div>

        <div className="bg-rose-50 px-4 py-2.5 rounded-xl border border-rose-200 text-right">
          <span className="text-xs uppercase font-bold text-rose-700 block">
            Total Tunggakan Tertahan
          </span>
          <span className="text-2xl font-black text-rose-900 font-mono">
            Rp{' '}
            {arrearList
              .reduce((sum, item) => sum + item.totalArrears, 0)
              .toLocaleString('id-ID')}
          </span>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        {/* Duration Tabs */}
        <div className="flex items-center space-x-2 overflow-x-auto">
          <span className="text-xs font-bold text-slate-500 mr-1 flex items-center space-x-1">
            <Filter className="w-3.5 h-3.5" />
            <span>Kategori:</span>
          </span>
          {[
            { id: 'ALL', label: 'Semua Tunggakan' },
            { id: '1', label: '1 Bulan' },
            { id: '2', label: '2 Bulan' },
            { id: '3+', label: '3+ Bulan (Kritis)' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setDurationFilter(tab.id as 'ALL' | '1' | '2' | '3+')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                durationFilter === tab.id
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative max-w-sm w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Cari nama, ID pelanggan, WA..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:bg-white focus:outline-none"
          />
        </div>
      </div>

      {/* Arrears List: Mobile Cards + Desktop Table */}
      <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-4 sm:px-6 py-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
          <span className="font-extrabold text-slate-800 text-sm">
            Menampilkan {filteredArrears.length} Pelanggan Menunggak
          </span>
          <span className="text-xs text-rose-600 font-bold">
            Denda: Rp 5.000 / bulan per tagihan lewat tanggal 28
          </span>
        </div>

        {/* MOBILE CARD VIEW (Phone Users) */}
        <div className="md:hidden divide-y divide-slate-100 p-2 space-y-2.5">
          {filteredArrears.length === 0 ? (
            <div className="py-8 text-center text-slate-500 font-medium text-sm">
              Tidak ada pelanggan yang menunggak pada kategori ini.
            </div>
          ) : (
            filteredArrears.map((item) => {
              const waMessage = WhatsAppService.getArrearsMessage({
                customerName: item.customerName,
                customerId: item.customerId,
                monthCount: item.monthCount,
                principalAmount: item.principalAmount,
                lateFee: item.lateFeeTotal,
                totalAmount: item.totalArrears,
              });

              const waUrl = WhatsAppService.generateWhatsAppUrl(item.phone, waMessage);

              return (
                <div
                  key={item.customerId}
                  className="p-4 bg-rose-50/50 border border-rose-200 rounded-2xl space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center space-x-1.5">
                        <span className="font-mono font-bold text-xs text-slate-700 bg-white border border-slate-300 px-2 py-0.5 rounded">
                          {item.customerId}
                        </span>
                        <span
                          className={`font-black px-2.5 py-0.5 rounded-full text-[11px] ${
                            item.monthCount >= 3
                              ? 'bg-rose-600 text-white'
                              : item.monthCount === 2
                              ? 'bg-amber-500 text-white'
                              : 'bg-slate-200 text-slate-800'
                          }`}
                        >
                          {item.monthCount} Bulan
                        </span>
                      </div>
                      <h3 className="font-black text-slate-900 text-base mt-1">
                        {item.customerName}
                      </h3>
                      <div className="text-xs text-slate-500 font-medium">
                        Dusun {item.dusun} &bull; WA: {item.phone}
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] uppercase font-bold text-rose-700 block">Total Tunggakan:</span>
                      <span className="text-lg font-black text-rose-900 font-mono">
                        Rp {item.totalArrears.toLocaleString('id-ID')}
                      </span>
                    </div>
                  </div>

                  {/* Periode and Arrear Breakdown */}
                  <div className="p-3 bg-white rounded-xl border border-rose-100 text-xs space-y-1.5">
                    <div className="flex items-center justify-between text-slate-600">
                      <span>Bulan Tagihan:</span>
                      <div className="flex flex-wrap gap-1 justify-end font-mono font-bold text-slate-800">
                        {item.unpaidBills.map((b) => (
                          <span key={b.bill_id} className="bg-slate-100 px-1.5 py-0.5 rounded text-[10px]">
                            {b.period}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-slate-600">
                      <span>Pokok Tagihan:</span>
                      <span className="font-mono font-bold text-slate-800">
                        Rp {item.principalAmount.toLocaleString('id-ID')}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-rose-700 font-bold">
                      <span>Denda Keterlambatan:</span>
                      <span className="font-mono">Rp {item.lateFeeTotal.toLocaleString('id-ID')}</span>
                    </div>
                  </div>

                  {/* Follow-up status & WA Button */}
                  <div className="flex items-center justify-between pt-1">
                    <div className="text-[11px] text-slate-500">
                      {item.lastFollowUp ? (
                        <span className="text-emerald-700 font-semibold block">
                          ✓ Dihubungi: {item.lastFollowUp}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic block">Belum dihubungi</span>
                      )}
                    </div>

                    <a
                      href={waUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => handleFollowUpClick(item)}
                      className="bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white px-4 py-2.5 rounded-xl text-xs font-bold inline-flex items-center space-x-1.5 shadow-xs transition"
                    >
                      <MessageSquare className="w-4 h-4" />
                      <span>Kirim WhatsApp</span>
                    </a>
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
                <th className="py-3 px-4">Pelanggan</th>
                <th className="py-3 px-4">Periode Tertunggak</th>
                <th className="py-3 px-4 text-center">Bulan</th>
                <th className="py-3 px-4 text-right">Pokok Tagihan</th>
                <th className="py-3 px-4 text-right">Denda</th>
                <th className="py-3 px-4 text-right">Total Tunggakan</th>
                <th className="py-3 px-4">Status Follow-up</th>
                <th className="py-3 px-4 text-center">Aksi WA</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredArrears.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500 font-medium">
                    Tidak ada pelanggan yang menunggak pada kategori ini.
                  </td>
                </tr>
              ) : (
                filteredArrears.map((item) => {
                  const waMessage = WhatsAppService.getArrearsMessage({
                    customerName: item.customerName,
                    customerId: item.customerId,
                    monthCount: item.monthCount,
                    principalAmount: item.principalAmount,
                    lateFee: item.lateFeeTotal,
                    totalAmount: item.totalArrears,
                  });

                  const waUrl = WhatsAppService.generateWhatsAppUrl(item.phone, waMessage);

                  return (
                    <tr key={item.customerId} className="hover:bg-rose-50/40">
                      <td className="py-3.5 px-4">
                        <div className="font-extrabold text-slate-900 text-base">
                          {item.customerName}
                        </div>
                        <div className="text-xs text-slate-500 font-mono">
                          ID: {item.customerId} | Dusun {item.dusun}
                        </div>
                        <div className="text-xs text-slate-400 flex items-center space-x-1 mt-0.5">
                          <Phone className="w-3 h-3" />
                          <span>{item.phone}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex flex-wrap gap-1">
                          {item.unpaidBills.map((b) => (
                            <span
                              key={b.bill_id}
                              className="font-mono text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200"
                            >
                              {b.period}
                            </span>
                          ))}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <span
                          className={`font-black px-2.5 py-1 rounded-full text-xs ${
                            item.monthCount >= 3
                              ? 'bg-rose-600 text-white'
                              : item.monthCount === 2
                              ? 'bg-amber-500 text-white'
                              : 'bg-slate-200 text-slate-800'
                          }`}
                        >
                          {item.monthCount} Bulan
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right font-mono font-semibold text-slate-700 whitespace-nowrap">
                        Rp {item.principalAmount.toLocaleString('id-ID')}
                      </td>

                      <td className="py-3.5 px-4 text-right font-mono font-bold text-rose-600 whitespace-nowrap">
                        Rp {item.lateFeeTotal.toLocaleString('id-ID')}
                      </td>

                      <td className="py-3.5 px-4 text-right font-mono font-black text-rose-900 text-base whitespace-nowrap">
                        Rp {item.totalArrears.toLocaleString('id-ID')}
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap text-xs">
                        {item.lastFollowUp ? (
                          <span className="text-emerald-700 font-bold flex items-center space-x-1">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Di-follow up: {item.lastFollowUp}</span>
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">Belum dihubungi</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <a
                          href={waUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => handleFollowUpClick(item)}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2 rounded-xl text-xs font-bold inline-flex items-center space-x-1.5 shadow-xs transition"
                          title="Kirim pesan peringatan WhatsApp"
                        >
                          <MessageSquare className="w-4 h-4" />
                          <span>[ KIRIM WA ]</span>
                        </a>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
