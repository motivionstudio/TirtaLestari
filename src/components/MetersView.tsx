// SIM-TIRTA LESTARI Meter Readings View
// Pencatatan Meter Air Bulanan, Validasi Meter Mundur, Riwayat & Filter

import React, { useState } from 'react';
import { Customer, MeterReading } from '../types';
import { AppStorage } from '../services/storage';
import { AuditLogger } from '../services/audit';
import {
  Gauge,
  Search,
  Plus,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  User,
  History,
  Info,
  Clock,
} from 'lucide-react';

export const MetersView: React.FC = () => {
  const [readings, setReadings] = useState<MeterReading[]>(() => AppStorage.getReadings());
  const [customers] = useState<Customer[]>(() => AppStorage.getCustomers());

  const currentMonthStr = '2026-10';
  const [selectedPeriod, setSelectedPeriod] = useState(currentMonthStr);
  const [searchQuery, setSearchQuery] = useState('');

  // Form State
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [customerSearchInput, setCustomerSearchInput] = useState('');
  const [isCustomerDropdownOpen, setIsCustomerDropdownOpen] = useState(false);
  const [previousReading, setPreviousReading] = useState<number>(0);
  const [currentReading, setCurrentReading] = useState<string>('');
  const [readingDate, setReadingDate] = useState(() => new Date().toISOString().substring(0, 10));
  const [officer, setOfficer] = useState('Mas Joko');
  const [notes, setNotes] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Ambil meter sebelumnya otomatis saat pelanggan dipilih
  const handleSelectCustomer = (cust: Customer) => {
    setSelectedCustomerId(cust.customer_id);
    setCustomerSearchInput(`${cust.customer_name} (${cust.customer_id}) - ${cust.meter_number}`);
    setIsCustomerDropdownOpen(false);
    setValidationError(null);

    // Cari bacaan terakhir pelanggan ini di periode sebelumnya
    const customerReadings = readings
      .filter((r) => r.customer_id === cust.customer_id)
      .sort((a, b) => b.period.localeCompare(a.period));

    if (customerReadings.length > 0) {
      setPreviousReading(customerReadings[0].current_reading);
    } else {
      setPreviousReading(0); // Pelanggan baru pertama kali catat
    }

    // Cek apakah periode ini sudah pernah dicatat
    const existing = readings.find(
      (r) => r.customer_id === cust.customer_id && r.period === selectedPeriod
    );
    if (existing) {
      setCurrentReading(String(existing.current_reading));
      setNotes(existing.notes || '');
    } else {
      setCurrentReading('');
    }
  };

  const calculatedUsage =
    currentReading !== '' && !isNaN(Number(currentReading))
      ? Number(currentReading) - previousReading
      : 0;

  const handleSaveReading = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);
    setSuccessMessage(null);

    if (!selectedCustomerId) {
      setValidationError('Pilih pelanggan terlebih dahulu.');
      return;
    }

    if (currentReading === '' || isNaN(Number(currentReading))) {
      setValidationError('Masukkan angka meter saat ini.');
      return;
    }

    const currentVal = Number(currentReading);

    // VALIDASI WAJIB: Meter sekarang TIDAK BOLEH lebih kecil dari meter sebelumnya
    if (currentVal < previousReading) {
      setValidationError(
        `Angka meter saat ini (${currentVal} m³) tidak boleh lebih kecil dari meter sebelumnya (${previousReading} m³)! Periksa kembali angka pada meteran fisik.`
      );
      return;
    }

    const customer = customers.find((c) => c.customer_id === selectedCustomerId);
    if (!customer) {
      setValidationError('Data pelanggan tidak valid.');
      return;
    }

    // Cek apakah sudah pernah dicatat untuk periode ini
    const existingIdx = readings.findIndex(
      (r) => r.customer_id === selectedCustomerId && r.period === selectedPeriod
    );

    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const usage = currentVal - previousReading;

    if (existingIdx !== -1) {
      // Update / Koreksi
      const updated = [...readings];
      const oldVal = updated[existingIdx].current_reading;
      updated[existingIdx] = {
        ...updated[existingIdx],
        previous_reading: previousReading,
        current_reading: currentVal,
        usage_m3: usage,
        reading_date: readingDate,
        officer,
        notes,
      };

      setReadings(updated);
      AppStorage.setReadings(updated);

      AuditLogger.log({
        user: officer,
        role: 'PETUGAS',
        action: 'METER INPUT',
        module: 'METER',
        record_id: updated[existingIdx].reading_id,
        old_value_summary: `Meter lama: ${oldVal} m³`,
        new_value_summary: `Koreksi meter ${customer.customer_name} (${selectedCustomerId}) periode ${selectedPeriod}: ${currentVal} m³ (pemakaian ${usage} m³)`,
      });

      setSuccessMessage(
        `Pencatatan meter ${customer.customer_name} berhasil diperbarui (Pemakaian: ${usage} m³).`
      );
    } else {
      // Simpan Baru
      const newReading: MeterReading = {
        reading_id: `MR-${selectedPeriod.replace('-', '')}-${Date.now().toString().slice(-4)}`,
        period: selectedPeriod,
        customer_id: selectedCustomerId,
        previous_reading: previousReading,
        current_reading: currentVal,
        usage_m3: usage,
        reading_date: readingDate,
        officer,
        notes,
        created_at: nowStr,
      };

      const updated = [newReading, ...readings];
      setReadings(updated);
      AppStorage.setReadings(updated);

      AuditLogger.log({
        user: officer,
        role: 'PETUGAS',
        action: 'METER INPUT',
        module: 'METER',
        record_id: newReading.reading_id,
        new_value_summary: `Catat meter ${customer.customer_name} (${selectedCustomerId}) periode ${selectedPeriod}: ${currentVal} m³ (pemakaian ${usage} m³)`,
      });

      setSuccessMessage(
        `Data meter ${customer.customer_name} berhasil disimpan! Pemakaian: ${usage} m³.`
      );
    }

    // Reset Form Input
    setSelectedCustomerId('');
    setCustomerSearchInput('');
    setCurrentReading('');
    setPreviousReading(0);
    setNotes('');
  };

  // Filter daftar catatan
  const filteredReadings = readings.filter((r) => {
    const matchPeriod = r.period === selectedPeriod;
    const cust = customers.find((c) => c.customer_id === r.customer_id);
    const q = searchQuery.toLowerCase().trim();
    const matchSearch =
      !q ||
      r.customer_id.toLowerCase().includes(q) ||
      (cust && cust.customer_name.toLowerCase().includes(q)) ||
      (cust && cust.meter_number.toLowerCase().includes(q));

    return matchPeriod && matchSearch;
  });

  // Autocomplete customer list
  const filteredCustomerOptions = customers.filter((c) => {
    const q = customerSearchInput.toLowerCase().trim();
    if (!q) return true;
    return (
      c.customer_id.toLowerCase().includes(q) ||
      c.customer_name.toLowerCase().includes(q) ||
      c.meter_number.toLowerCase().includes(q) ||
      c.phone.includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 flex items-center space-x-2">
            <Gauge className="w-7 h-7 text-sky-600" />
            <span>Pencatatan Meter Air Bulanan</span>
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Input angka meter fisik pelanggan setiap bulan untuk penghitungan tagihan rekening air.
          </p>
        </div>

        {/* Periode Selector */}
        <div className="flex items-center space-x-2 bg-slate-50 p-2 rounded-xl border border-slate-300">
          <Calendar className="w-5 h-5 text-sky-600 ml-1" />
          <span className="text-sm font-bold text-slate-700">Periode:</span>
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="bg-white font-bold text-slate-900 border border-slate-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
          >
            <option value="2026-10">Oktober 2026</option>
            <option value="2026-09">September 2026</option>
            <option value="2026-08">Agustus 2026</option>
          </select>
        </div>
      </div>

      {/* Form Pencatatan Meter */}
      <div className="bg-white p-6 rounded-2xl border-2 border-sky-100 shadow-sm">
        <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center space-x-2">
          <span>Form Input Pembacaan Meter</span>
          <span className="text-xs bg-sky-100 text-sky-800 px-2 py-0.5 rounded font-semibold">
            Mudah & Cepat
          </span>
        </h2>

        {validationError && (
          <div className="mb-4 p-4 bg-rose-50 border-2 border-rose-300 rounded-xl text-rose-800 flex items-start space-x-3">
            <AlertTriangle className="w-6 h-6 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-extrabold block text-base">Peringatan Validasi:</span>
              <span className="text-sm font-medium">{validationError}</span>
            </div>
          </div>
        )}

        {successMessage && (
          <div className="mb-4 p-4 bg-emerald-50 border-2 border-emerald-300 rounded-xl text-emerald-800 flex items-center space-x-3">
            <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
            <span className="font-bold text-sm">{successMessage}</span>
          </div>
        )}

        <form onSubmit={handleSaveReading} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Customer Searchable Input */}
            <div className="relative md:col-span-2">
              <label className="block text-sm font-bold text-slate-800 mb-1">
                Pilih Pelanggan Air (Cari Nama / ID / No. Meter) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Ketik nama atau ID pelanggan (contoh: Suhardi atau TL-0001)..."
                  value={customerSearchInput}
                  onChange={(e) => {
                    setCustomerSearchInput(e.target.value);
                    setIsCustomerDropdownOpen(true);
                  }}
                  onFocus={() => setIsCustomerDropdownOpen(true)}
                  className="w-full p-3.5 pl-10 border-2 border-slate-300 rounded-xl font-semibold text-slate-800 focus:border-sky-500 focus:outline-none"
                />
                <Search className="w-5 h-5 text-slate-400 absolute left-3 top-4" />
              </div>

              {/* Dropdown Options */}
              {isCustomerDropdownOpen && (
                <div className="absolute z-20 left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl max-h-60 overflow-y-auto divide-y divide-slate-100">
                  {filteredCustomerOptions.length === 0 ? (
                    <div className="p-3 text-slate-500 text-sm text-center">
                      Pelanggan tidak ditemukan.
                    </div>
                  ) : (
                    filteredCustomerOptions.map((c) => (
                      <button
                        type="button"
                        key={c.customer_id}
                        onClick={() => handleSelectCustomer(c)}
                        className="w-full text-left p-3 hover:bg-sky-50 flex items-center justify-between transition cursor-pointer"
                      >
                        <div>
                          <span className="font-bold text-slate-900">{c.customer_name}</span>
                          <span className="text-xs text-sky-700 ml-2 font-mono bg-sky-100 px-1.5 py-0.5 rounded">
                            {c.customer_id}
                          </span>
                          <div className="text-xs text-slate-500">
                            Dusun {c.dusun} | RT {c.rt}/RW {c.rw} | No. Meter: {c.meter_number}
                          </div>
                        </div>
                        <span className="text-xs text-emerald-700 font-bold bg-emerald-50 px-2 py-1 rounded">
                          Pilih
                        </span>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Petugas Pencatat */}
            <div>
              <label className="block text-sm font-bold text-slate-800 mb-1">
                Petugas Pencatat
              </label>
              <select
                value={officer}
                onChange={(e) => setOfficer(e.target.value)}
                className="w-full p-3.5 border-2 border-slate-300 rounded-xl font-bold text-slate-800 focus:border-sky-500 focus:outline-none"
              >
                <option value="Mas Joko">Mas Joko (Petugas Lapangan)</option>
                <option value="Pak H. Sugiyanto">Pak H. Sugiyanto (Pengurus)</option>
                <option value="Sewindu">Sewindu (Admin)</option>
              </select>
            </div>
          </div>

          {/* Meter Readings Comparison */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
            {/* Meter Sebelumnya */}
            <div className="bg-white p-3.5 rounded-xl border border-slate-200">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                Meter Bulan Lalu
              </span>
              <span className="text-2xl font-black text-slate-700 font-mono mt-1 block">
                {previousReading} <span className="text-sm font-medium text-slate-500">m³</span>
              </span>
              <span className="text-[11px] text-slate-400 mt-1 block">
                Diambil otomatis dari sistem
              </span>
            </div>

            {/* Meter Saat Ini */}
            <div className="bg-white p-3.5 rounded-xl border-2 border-sky-400 shadow-xs">
              <label className="text-xs font-bold text-sky-800 uppercase tracking-wider block mb-1">
                Meter Saat Ini <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min={0}
                required
                placeholder="0"
                value={currentReading}
                onChange={(e) => {
                  setCurrentReading(e.target.value);
                  setValidationError(null);
                }}
                className="w-full text-2xl font-black text-sky-900 font-mono border-b-2 border-sky-500 focus:outline-none"
              />
              <span className="text-[11px] text-slate-500 mt-1 block">
                Ketik angka yang tertera di meteran fisik
              </span>
            </div>

            {/* Pemakaian Hasil Hitung */}
            <div
              className={`p-3.5 rounded-xl border ${
                calculatedUsage < 0
                  ? 'bg-rose-50 border-rose-300 text-rose-800'
                  : 'bg-emerald-50 border-emerald-300 text-emerald-800'
              }`}
            >
              <span className="text-xs font-bold uppercase tracking-wider block">
                Pemakaian Air
              </span>
              <span className="text-2xl font-black font-mono mt-1 block">
                {calculatedUsage}{' '}
                <span className="text-sm font-medium">m³</span>
              </span>
              <span className="text-[11px] font-semibold mt-1 block">
                {calculatedUsage < 0
                  ? 'Error: Angka meter turun!'
                  : 'Meter Sekarang - Meter Lalu'}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">
                Tanggal Pembacaan
              </label>
              <input
                type="date"
                value={readingDate}
                onChange={(e) => setReadingDate(e.target.value)}
                className="w-full p-3 border border-slate-300 rounded-xl text-slate-800 font-medium focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">
                Catatan Kondisi Lapangan (Opsional)
              </label>
              <input
                type="text"
                placeholder="Contoh: Meter tertutup lumpur, kran lancar, dll."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full p-3 border border-slate-300 rounded-xl text-slate-800 text-sm focus:outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="bg-sky-600 hover:bg-sky-700 text-white px-8 py-3.5 rounded-xl font-black text-base shadow-md transition cursor-pointer flex items-center space-x-2"
            >
              <Gauge className="w-5 h-5" />
              <span>Simpan Pencatatan Meter</span>
            </button>
          </div>
        </form>
      </div>

      {/* Riwayat & Daftar Bacaan Periode Ini */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <span className="font-bold text-slate-800 text-base">
            Catatan Meter Periode: {selectedPeriod} ({filteredReadings.length} Pelanggan Tercatat)
          </span>

          <div className="relative max-w-xs w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Cari dalam daftar..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:bg-white focus:outline-none"
            />
          </div>
        </div>

        {/* MOBILE CARD LIST (HP / Layar Kecil) */}
        <div className="block md:hidden divide-y divide-slate-100 p-3 space-y-3">
          {filteredReadings.length === 0 ? (
            <div className="py-8 text-center text-slate-500 font-medium text-sm">
              Belum ada data pencatatan meter untuk periode {selectedPeriod}.
            </div>
          ) : (
            filteredReadings.map((r) => {
              const cust = customers.find((c) => c.customer_id === r.customer_id);
              return (
                <div
                  key={r.reading_id}
                  className="p-3.5 bg-slate-50/70 border border-slate-200/90 rounded-2xl space-y-2.5"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center space-x-1.5">
                        <span className="font-mono text-xs font-bold text-sky-800 bg-sky-100 px-2 py-0.5 rounded-md">
                          {r.reading_id}
                        </span>
                        <span className="text-[11px] text-slate-500 font-medium">
                          {r.reading_date}
                        </span>
                      </div>
                      <h4 className="font-black text-slate-900 text-base mt-1">
                        {cust ? cust.customer_name : r.customer_id}
                      </h4>
                      <div className="text-xs text-slate-500 font-medium">
                        ID: <span className="font-mono">{r.customer_id}</span> · Dusun {cust?.dusun || '-'}
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Pemakaian</span>
                      <span className="font-mono font-black text-sky-700 bg-sky-100 px-2 py-1 rounded-lg text-sm inline-block">
                        {r.usage_m3} m³
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 bg-white p-2.5 rounded-xl border border-slate-200/70 text-xs">
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Meter Lalu</span>
                      <span className="font-mono font-bold text-slate-700 text-sm">{r.previous_reading} m³</span>
                    </div>
                    <div className="text-right">
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Meter Kini</span>
                      <span className="font-mono font-black text-slate-900 text-sm">{r.current_reading} m³</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                    <span>Petugas: <strong className="text-slate-700">{r.officer}</strong></span>
                    {r.notes && <span className="italic text-slate-400 truncate max-w-[140px]">{r.notes}</span>}
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
                <th className="py-3 px-4">No. Catat & Tanggal</th>
                <th className="py-3 px-4">Pelanggan</th>
                <th className="py-3 px-4 text-right">Meter Lalu</th>
                <th className="py-3 px-4 text-right">Meter Kini</th>
                <th className="py-3 px-4 text-right">Pemakaian</th>
                <th className="py-3 px-4">Petugas</th>
                <th className="py-3 px-4">Catatan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredReadings.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500 font-medium">
                    Belum ada data pencatatan meter untuk periode {selectedPeriod}.
                  </td>
                </tr>
              ) : (
                filteredReadings.map((r) => {
                  const cust = customers.find((c) => c.customer_id === r.customer_id);
                  return (
                    <tr key={r.reading_id} className="hover:bg-slate-50/80">
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="font-mono text-xs font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded">
                          {r.reading_id}
                        </span>
                        <div className="text-[11px] text-slate-400 mt-0.5">{r.reading_date}</div>
                      </td>

                      <td className="py-3 px-4">
                        <span className="font-bold text-slate-900">
                          {cust ? cust.customer_name : r.customer_id}
                        </span>
                        <div className="text-xs text-slate-500">
                          ID: {r.customer_id} | Dusun {cust?.dusun}
                        </div>
                      </td>

                      <td className="py-3 px-4 text-right font-mono text-slate-600">
                        {r.previous_reading} m³
                      </td>

                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                        {r.current_reading} m³
                      </td>

                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <span className="font-mono font-black text-sky-700 bg-sky-100 px-2 py-0.5 rounded text-sm">
                          {r.usage_m3} m³
                        </span>
                      </td>

                      <td className="py-3 px-4 text-xs font-semibold text-slate-700">
                        {r.officer}
                      </td>

                      <td className="py-3 px-4 text-xs text-slate-500 italic max-w-xs truncate">
                        {r.notes || '-'}
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
