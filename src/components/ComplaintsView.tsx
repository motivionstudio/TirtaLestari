// SIM-TIRTA LESTARI Complaints & Service Desk View
// Pengaduan Warga, Generator Tiket PGD-TL-..., Riwayat Perubahan Status & Follow-Up WA

import React, { useState } from 'react';
import { Complaint, ComplaintHistory } from '../types';
import { AppStorage } from '../services/storage';
import { WhatsAppService } from '../services/whatsapp';
import { AuditLogger } from '../services/audit';
import {
  MessageSquareWarning,
  Search,
  Plus,
  Clock,
  CheckCircle2,
  AlertTriangle,
  MessageSquare,
  History,
  User,
  Wrench,
  Filter,
  X,
} from 'lucide-react';

export const ComplaintsView: React.FC = () => {
  const [complaints, setComplaints] = useState<Complaint[]>(() => AppStorage.getComplaints());
  const [history, setHistory] = useState<ComplaintHistory[]>(() => AppStorage.getComplaintHistory());

  const [statusFilter, setStatusFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Selected complaint for details / timeline
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);

  // Status Update Modal
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [newStatus, setNewStatus] = useState<Complaint['status']>('DALAM PENANGANAN');
  const [updateOfficer, setUpdateOfficer] = useState('Mas Joko');
  const [updateNote, setUpdateNote] = useState('');

  // New Complaint Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newCustName, setNewCustName] = useState('');
  const [newCustId, setNewCustId] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newCategory, setNewCategory] = useState<Complaint['category']>('KEBOCORAN');
  const [newAddress, setNewAddress] = useState('');
  const [newDescription, setNewDescription] = useState('');

  // Filter complaints
  const filteredComplaints = complaints.filter((c) => {
    const matchStatus = statusFilter === 'ALL' || c.status === statusFilter;
    const matchCategory = categoryFilter === 'ALL' || c.category === categoryFilter;
    const q = searchQuery.toLowerCase().trim();
    const matchSearch =
      !q ||
      c.ticket_number.toLowerCase().includes(q) ||
      c.customer_name.toLowerCase().includes(q) ||
      c.phone.includes(q) ||
      c.address_location.toLowerCase().includes(q);

    return matchStatus && matchCategory && matchSearch;
  });

  const handleOpenUpdateModal = (c: Complaint) => {
    setSelectedComplaint(c);
    setNewStatus(c.status);
    setUpdateOfficer(c.assigned_officer || 'Mas Joko');
    setUpdateNote('');
    setIsUpdateModalOpen(true);
  };

  const handleSaveStatusUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedComplaint) return;

    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const oldStatus = selectedComplaint.status;

    // 1. Update Complaint Record
    const updatedComplaints = complaints.map((c) => {
      if (c.complaint_id === selectedComplaint.complaint_id) {
        return {
          ...c,
          status: newStatus,
          assigned_officer: updateOfficer,
          public_note: updateNote || c.public_note,
          updated_at: nowStr,
        };
      }
      return c;
    });

    // 2. Append Complaint History
    const newHist: ComplaintHistory = {
      history_id: `CH-${Date.now()}`,
      complaint_id: selectedComplaint.ticket_number,
      old_status: oldStatus,
      new_status: newStatus,
      note: updateNote || `Status diperbarui menjadi ${newStatus}.`,
      officer: updateOfficer,
      created_at: nowStr,
      created_by: updateOfficer,
    };

    const updatedHistories = [newHist, ...history];

    setComplaints(updatedComplaints);
    setHistory(updatedHistories);

    AppStorage.setComplaints(updatedComplaints);
    AppStorage.setComplaintHistory(updatedHistories);

    AuditLogger.log({
      user: updateOfficer,
      role: 'PETUGAS',
      action: 'UPDATE COMPLAINT',
      module: 'COMPLAINTS',
      record_id: selectedComplaint.ticket_number,
      old_value_summary: `Status lama: ${oldStatus}`,
      new_value_summary: `Status baru: ${newStatus}. Petugas: ${updateOfficer}. Catatan: ${updateNote}`,
    });

    // Keep active selected complaint updated
    const fresh = updatedComplaints.find((c) => c.complaint_id === selectedComplaint.complaint_id);
    setSelectedComplaint(fresh || null);
    setIsUpdateModalOpen(false);
  };

  const handleCreateNewComplaint = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustName.trim() || !newPhone.trim()) {
      alert('Nama warga dan nomor WhatsApp wajib diisi.');
      return;
    }

    const now = new Date();
    const yyyymm = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
    const seq = String(complaints.length + 1).padStart(4, '0');
    const ticketNumber = `PGD-TL-${yyyymm}-${seq}`;
    const nowStr = now.toISOString().replace('T', ' ').substring(0, 19);

    const newComp: Complaint = {
      complaint_id: ticketNumber,
      ticket_number: ticketNumber,
      customer_name: newCustName.trim(),
      customer_id: newCustId.trim() || undefined,
      phone: newPhone.trim(),
      category: newCategory,
      address_location: newAddress.trim(),
      description: newDescription.trim(),
      status: 'DITERIMA',
      assigned_officer: 'Koordinator Pelayanan',
      public_note: 'Laporan baru diterima dan siap ditindaklanjuti oleh petugas.',
      created_at: nowStr,
      updated_at: nowStr,
    };

    const newHist: ComplaintHistory = {
      history_id: `CH-${Date.now()}`,
      complaint_id: ticketNumber,
      old_status: '-',
      new_status: 'DITERIMA',
      note: 'Laporan warga diterima melalui loket pengurus.',
      officer: 'Koordinator Pelayanan',
      created_at: nowStr,
      created_by: 'Pengurus',
    };

    const updatedC = [newComp, ...complaints];
    const updatedH = [newHist, ...history];

    setComplaints(updatedC);
    setHistory(updatedH);

    AppStorage.setComplaints(updatedC);
    AppStorage.setComplaintHistory(updatedH);

    AuditLogger.log({
      user: 'Pengurus',
      role: 'PENGURUS',
      action: 'UPDATE COMPLAINT',
      module: 'COMPLAINTS',
      record_id: ticketNumber,
      new_value_summary: `Penerimaan aduan warga ${newCustName} (${ticketNumber}): ${newCategory}`,
    });

    setIsAddModalOpen(false);
    alert(`Pengaduan berhasil dicatat dengan Nomor Tiket: ${ticketNumber}`);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 flex items-center space-x-2">
            <MessageSquareWarning className="w-7 h-7 text-amber-500" />
            <span>Pengaduan Warga & Layanan Lapangan</span>
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Penanganan kebocoran, pompa, air mati, serta timeline pelacakan status dengan verifikasi No Tiket & WA.
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="bg-amber-500 hover:bg-amber-600 text-white px-5 py-3 rounded-xl font-bold flex items-center space-x-2 shadow-md transition cursor-pointer self-start md:self-auto"
        >
          <Plus className="w-5 h-5" />
          <span>Input Pengaduan Baru</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm grid grid-cols-1 md:grid-cols-4 gap-3">
        <div className="relative md:col-span-2">
          <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-3.5" />
          <input
            type="text"
            placeholder="Cari Tiket (PGD-TL-...), Nama Pelapor, WA, Alamat..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-base focus:bg-white focus:border-sky-500 focus:outline-none"
          />
        </div>

        <div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full py-3 px-3 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold focus:outline-none"
          >
            <option value="ALL">Semua Kategori</option>
            <option value="KEBOCORAN">Kebocoran</option>
            <option value="AIR TIDAK MENGALIR">Air Tidak Mengalir</option>
            <option value="METER AIR">Meter Air</option>
            <option value="TAGIHAN">Tagihan</option>
            <option value="KUALITAS AIR">Kualitas Air</option>
            <option value="SAMBUNGAN RUMAH">Sambungan Rumah</option>
            <option value="LAINNYA">Lainnya</option>
          </select>
        </div>

        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full py-3 px-3 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold focus:outline-none"
          >
            <option value="ALL">Semua Status</option>
            <option value="DITERIMA">Diterima</option>
            <option value="TERVERIFIKASI">Terverifikasi</option>
            <option value="DIJADWALKAN">Dijadwalkan</option>
            <option value="DALAM PENANGANAN">Dalam Penanganan</option>
            <option value="SELESAI">Selesai</option>
            <option value="DITUTUP">Ditutup</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Kolom Kiri: Tabel Pengaduan (2 Kolom) */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
            <span className="font-bold text-slate-800 text-sm">
              Daftar Pengaduan ({filteredComplaints.length} Laporan)
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50 text-slate-600 text-xs font-bold uppercase tracking-wider border-b border-slate-200">
                  <th className="py-3 px-4">Tiket & Tanggal</th>
                  <th className="py-3 px-4">Pelapor</th>
                  <th className="py-3 px-4">Kategori & Lokasi</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredComplaints.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-500 font-medium">
                      Tidak ada pengaduan yang cocok dengan filter.
                    </td>
                  </tr>
                ) : (
                  filteredComplaints.map((c) => {
                    const isSelected = selectedComplaint?.complaint_id === c.complaint_id;

                    return (
                      <tr
                        key={c.complaint_id}
                        onClick={() => setSelectedComplaint(c)}
                        className={`cursor-pointer transition-colors ${
                          isSelected ? 'bg-amber-50/70 border-l-4 border-l-amber-500' : 'hover:bg-slate-50'
                        }`}
                      >
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span className="font-mono text-xs font-bold text-slate-800 block">
                            {c.ticket_number}
                          </span>
                          <span className="text-[11px] text-slate-400">
                            {c.created_at.substring(0, 16)}
                          </span>
                        </td>

                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900">{c.customer_name}</div>
                          <div className="text-xs text-slate-500">{c.phone}</div>
                        </td>

                        <td className="py-3 px-4">
                          <span className="inline-block text-xs font-bold bg-slate-100 text-slate-800 px-2 py-0.5 rounded">
                            {c.category}
                          </span>
                          <div className="text-xs text-slate-500 truncate max-w-xs mt-0.5">
                            {c.address_location}
                          </div>
                        </td>

                        <td className="py-3 px-4 whitespace-nowrap">
                          <span
                            className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                              c.status === 'SELESAI'
                                ? 'bg-emerald-100 text-emerald-800'
                                : c.status === 'DALAM PENANGANAN'
                                ? 'bg-amber-100 text-amber-800 animate-pulse'
                                : 'bg-slate-200 text-slate-700'
                            }`}
                          >
                            {c.status}
                          </span>
                        </td>

                        <td className="py-3 px-4 text-center whitespace-nowrap">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenUpdateModal(c);
                            }}
                            className="bg-sky-50 hover:bg-sky-100 text-sky-700 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer"
                          >
                            Update
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Kolom Kanan: Detail & Timeline Riwayat Pengaduan */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
          <h3 className="font-bold text-slate-800 text-base flex items-center space-x-2 border-b border-slate-200 pb-3">
            <History className="w-5 h-5 text-sky-600" />
            <span>Detail & Timeline Penanganan</span>
          </h3>

          {selectedComplaint ? (
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-sky-800 bg-sky-100 px-2 py-0.5 rounded">
                    {selectedComplaint.ticket_number}
                  </span>
                  <span className="text-xs font-bold text-amber-700">
                    {selectedComplaint.status}
                  </span>
                </div>

                <div className="font-black text-slate-900 text-base">
                  {selectedComplaint.customer_name}
                </div>
                <div className="text-xs text-slate-600">
                  <strong>Kategori:</strong> {selectedComplaint.category}
                </div>
                <div className="text-xs text-slate-600">
                  <strong>Lokasi:</strong> {selectedComplaint.address_location}
                </div>
                <div className="text-xs text-slate-700 bg-white p-2.5 rounded-lg border border-slate-200">
                  &ldquo;{selectedComplaint.description}&rdquo;
                </div>
                <div className="text-xs text-slate-500">
                  <strong>Petugas Lapangan:</strong> {selectedComplaint.assigned_officer || '-'}
                </div>
              </div>

              {/* Action Buttons: Update & WhatsApp Notification */}
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => handleOpenUpdateModal(selectedComplaint)}
                  className="w-full py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-sm font-bold shadow-xs transition cursor-pointer"
                >
                  Perbarui Status Penanganan
                </button>

                <a
                  href={WhatsAppService.generateWhatsAppUrl(
                    selectedComplaint.phone,
                    WhatsAppService.getComplaintUpdateMessage({
                      customerName: selectedComplaint.customer_name,
                      ticketNumber: selectedComplaint.ticket_number,
                      status: selectedComplaint.status,
                      category: selectedComplaint.category,
                      officer: selectedComplaint.assigned_officer || 'Petugas Lapangan',
                      note: selectedComplaint.public_note || '',
                    })
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold shadow-xs transition text-center flex items-center justify-center space-x-2"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Kirim Update ke WhatsApp Warga</span>
                </a>
              </div>

              {/* Timeline Riwayat Status */}
              <div>
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
                  Riwayat Perjalanan Tiket (Timeline)
                </h4>
                <div className="relative border-l-2 border-slate-200 ml-3 space-y-4 pl-4">
                  {history
                    .filter((h) => h.complaint_id === selectedComplaint.ticket_number)
                    .map((h) => (
                      <div key={h.history_id} className="relative">
                        <div className="absolute -left-[23px] top-1 w-3 h-3 rounded-full bg-sky-600 border-2 border-white"></div>
                        <div className="text-xs font-extrabold text-slate-800">
                          {h.new_status}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">{h.note}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          Oleh {h.officer} &bull; {h.created_at}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-slate-400">
              <MessageSquareWarning className="w-10 h-10 mx-auto mb-2 opacity-40" />
              <span className="text-sm font-medium">Pilih laporan di sebelah kiri untuk melihat detail timeline.</span>
            </div>
          )}
        </div>
      </div>

      {/* MODAL UPDATE STATUS */}
      {isUpdateModalOpen && selectedComplaint && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-lg font-bold text-slate-800">
                Update Status ({selectedComplaint.ticket_number})
              </h3>
              <button
                onClick={() => setIsUpdateModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveStatusUpdate} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Status Baru
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as Complaint['status'])}
                  className="w-full p-3 border border-slate-300 rounded-xl font-bold text-slate-800 focus:outline-none"
                >
                  <option value="DITERIMA">DITERIMA</option>
                  <option value="TERVERIFIKASI">TERVERIFIKASI</option>
                  <option value="DIJADWALKAN">DIJADWALKAN</option>
                  <option value="DALAM PENANGANAN">DALAM PENANGANAN</option>
                  <option value="SELESAI">SELESAI</option>
                  <option value="DITUTUP">DITUTUP</option>
                  <option value="TIDAK DAPAT DIPROSES">TIDAK DAPAT DIPROSES</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Petugas Bertanggung Jawab
                </label>
                <input
                  type="text"
                  value={updateOfficer}
                  onChange={(e) => setUpdateOfficer(e.target.value)}
                  className="w-full p-3 border border-slate-300 rounded-xl font-bold text-slate-800 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Catatan Kemajuan / Keterangan Penanganan
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Contoh: Pipa bocor di depan rumah Bpk. Suhardi sudah diganti klem baru dan air mengalir kembali."
                  value={updateNote}
                  onChange={(e) => setUpdateNote(e.target.value)}
                  className="w-full p-3 border border-slate-300 rounded-xl text-sm focus:outline-none"
                ></textarea>
              </div>

              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsUpdateModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 font-bold rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-xl shadow-md"
                >
                  Simpan Status
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL INPUT PENGADUAN BARU */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-lg font-bold text-slate-800">Catat Pengaduan Warga Baru</h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateNewComplaint} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Nama Warga Pelapor <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Nama warga..."
                  value={newCustName}
                  onChange={(e) => setNewCustName(e.target.value)}
                  className="w-full p-3 border border-slate-300 rounded-xl text-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    No. WhatsApp Warga <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="08xxxxxxxxxx"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    className="w-full p-3 border border-slate-300 rounded-xl text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    ID Pelanggan (Bila Ada)
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: TL-0001"
                    value={newCustId}
                    onChange={(e) => setNewCustId(e.target.value)}
                    className="w-full p-3 border border-slate-300 rounded-xl font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Jenis Pengaduan
                </label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value as Complaint['category'])}
                  className="w-full p-3 border border-slate-300 rounded-xl font-bold"
                >
                  <option value="AIR TIDAK MENGALIR">AIR TIDAK MENGALIR</option>
                  <option value="KEBOCORAN">KEBOCORAN</option>
                  <option value="METER AIR">METER AIR</option>
                  <option value="TAGIHAN">TAGIHAN</option>
                  <option value="SAMBUNGAN RUMAH">SAMBUNGAN RUMAH</option>
                  <option value="KUALITAS AIR">KUALITAS AIR</option>
                  <option value="LAINNYA">LAINNYA</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Alamat / Patokan Lokasi Gangguan
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Dekat gardu RT 02 Dusun Ngawu"
                  value={newAddress}
                  onChange={(e) => setNewAddress(e.target.value)}
                  className="w-full p-3 border border-slate-300 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Keterangan Kejadian
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Jelaskan kendala..."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full p-3 border border-slate-300 rounded-xl text-sm"
                ></textarea>
              </div>

              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 font-bold rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl shadow-md"
                >
                  Terbitkan Tiket Pengaduan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
