// SIM-TIRTA LESTARI Customers View
// Database Pelanggan, Search Box Autocomplete, Tambah Pelanggan (TL-0001...), Nonaktifkan (Soft Delete)

import React, { useState } from 'react';
import { Customer, Connection } from '../types';
import { AppStorage } from '../services/storage';
import { AuditLogger } from '../services/audit';
import { WhatsAppService } from '../services/whatsapp';
import {
  Users,
  Search,
  Plus,
  Phone,
  MapPin,
  Gauge,
  CheckCircle2,
  XCircle,
  AlertCircle,
  MessageSquare,
  Edit2,
  Calendar,
  X,
  CreditCard,
} from 'lucide-react';

export const CustomersView: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>(() => AppStorage.getCustomers());
  const [connections, setConnections] = useState<Connection[]>(() => AppStorage.getConnections());
  const [searchQuery, setSearchQuery] = useState('');
  const [dusunFilter, setDusunFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  // Form State
  const [formName, setFormName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formAddress, setFormAddress] = useState('');
  const [formDusun, setFormDusun] = useState('Ngawu');
  const [formRt, setFormRt] = useState('01');
  const [formRw, setFormRw] = useState('01');
  const [formMeterNumber, setFormMeterNumber] = useState('');
  const [formJoinDate, setFormJoinDate] = useState(() => new Date().toISOString().substring(0, 10));
  const [formStatus, setFormStatus] = useState<'ACTIVE' | 'INACTIVE' | 'TEMP_SUSPENDED'>('ACTIVE');
  const [formNotes, setFormNotes] = useState('');
  const [initialConnectionPaid, setInitialConnectionPaid] = useState<number>(300000); // Default installment 1
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [confirmDeactivateCustomer, setConfirmDeactivateCustomer] = useState<Customer | null>(null);

  // Filter logic
  const filteredCustomers = customers.filter((c) => {
    const q = searchQuery.toLowerCase().trim();
    const matchQuery =
      !q ||
      c.customer_id.toLowerCase().includes(q) ||
      c.customer_name.toLowerCase().includes(q) ||
      c.meter_number.toLowerCase().includes(q) ||
      c.phone.includes(q) ||
      c.address.toLowerCase().includes(q) ||
      c.dusun.toLowerCase().includes(q);

    const matchDusun = dusunFilter === 'ALL' || c.dusun === dusunFilter;
    const matchStatus = statusFilter === 'ALL' || c.status === statusFilter;

    return matchQuery && matchDusun && matchStatus;
  });

  const generateNextCustomerId = (): string => {
    // Cari angka tertinggi dari ID yang sudah pernah dibuat
    let maxNum = 0;
    customers.forEach((c) => {
      const match = c.customer_id.match(/TL-(\d+)/);
      if (match) {
        const n = parseInt(match[1], 10);
        if (n > maxNum) maxNum = n;
      }
    });
    return `TL-${String(maxNum + 1).padStart(4, '0')}`;
  };

  const handleOpenAddModal = () => {
    setEditingCustomer(null);
    setFormName('');
    setFormPhone('');
    setFormAddress('');
    setFormDusun('Ngawu');
    setFormRt('01');
    setFormRw('01');
    setFormMeterNumber(`MTR-${Math.floor(1000 + Math.random() * 9000)}`);
    setFormJoinDate(new Date().toISOString().substring(0, 10));
    setFormStatus('ACTIVE');
    setFormNotes('');
    setInitialConnectionPaid(300000);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (c: Customer) => {
    setEditingCustomer(c);
    setFormName(c.customer_name);
    setFormPhone(c.phone);
    setFormAddress(c.address);
    setFormDusun(c.dusun);
    setFormRt(c.rt);
    setFormRw(c.rw);
    setFormMeterNumber(c.meter_number);
    setFormJoinDate(c.join_date);
    setFormStatus(c.status);
    setFormNotes(c.notes || '');
    setIsModalOpen(true);
  };

  const handleSaveCustomer = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formName.trim()) {
      setToastMessage({ text: 'Nama pelanggan wajib diisi.', type: 'error' });
      return;
    }

    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);

    if (editingCustomer) {
      // Edit
      const updated = customers.map((c) => {
        if (c.customer_id === editingCustomer.customer_id) {
          return {
            ...c,
            customer_name: formName.trim(),
            phone: formPhone.trim(),
            address: formAddress.trim(),
            dusun: formDusun,
            rt: formRt,
            rw: formRw,
            meter_number: formMeterNumber.trim(),
            join_date: formJoinDate,
            status: formStatus,
            notes: formNotes.trim(),
            updated_at: nowStr,
            updated_by: 'Super Admin',
          };
        }
        return c;
      });

      setCustomers(updated);
      AppStorage.setCustomers(updated);

      AuditLogger.log({
        user: 'Super Admin',
        role: 'ADMIN',
        action: 'UPDATE CUSTOMER',
        module: 'CUSTOMERS',
        record_id: editingCustomer.customer_id,
        new_value_summary: `Update data pelanggan ${formName} (${editingCustomer.customer_id})`,
      });

      setToastMessage({ text: `Data pelanggan ${editingCustomer.customer_id} berhasil diperbarui.`, type: 'success' });
    } else {
      // Create New
      const newId = generateNextCustomerId();
      const newConnectionId = `CON-${newId.replace('TL-', '')}`;

      const newCustomer: Customer = {
        customer_id: newId,
        connection_id: newConnectionId,
        customer_name: formName.trim(),
        phone: formPhone.trim(),
        address: formAddress.trim() || `RT ${formRt} RW ${formRw} Dusun ${formDusun}`,
        dusun: formDusun,
        rt: formRt,
        rw: formRw,
        meter_number: formMeterNumber.trim(),
        join_date: formJoinDate,
        status: formStatus,
        notes: formNotes.trim(),
        created_at: nowStr,
        created_by: 'Super Admin',
        updated_at: nowStr,
        updated_by: 'Super Admin',
      };

      // Buat sambungan baru & cicilan
      const totalFee = 600000;
      const paid = Math.min(totalFee, initialConnectionPaid);
      const remaining = totalFee - paid;
      const newConnection: Connection = {
        connection_id: newConnectionId,
        customer_id: newId,
        connection_fee: totalFee,
        paid_amount: paid,
        remaining_amount: remaining,
        installment_number: paid >= totalFee ? 1 : 1,
        due_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().substring(0, 10), // 3 bulan
        status: paid >= totalFee ? 'LUNAS' : paid > 0 ? 'SEBAGIAN' : 'BELUM LUNAS',
        created_at: nowStr,
        updated_at: nowStr,
      };

      // Catat Kas Masuk jika ada setoran sambungan awal
      if (paid > 0) {
        const cashIns = AppStorage.getCashIn();
        cashIns.unshift({
          transaction_id: `CIN-${Date.now()}`,
          date: nowStr,
          category: 'SAMBUNGAN BARU',
          reference_number: newConnectionId,
          customer_id: newId,
          description: `Setoran Biaya Sambungan Rumah Baru Pelanggan ${formName} (${newId})`,
          amount: paid,
          payment_method: 'Tunai',
          created_by: 'Super Admin',
          created_at: nowStr,
        });
        AppStorage.setCashIn(cashIns);
      }

      const updatedCustomers = [newCustomer, ...customers];
      const updatedConnections = [newConnection, ...connections];

      setCustomers(updatedCustomers);
      setConnections(updatedConnections);

      AppStorage.setCustomers(updatedCustomers);
      AppStorage.setConnections(updatedConnections);

      AuditLogger.log({
        user: 'Super Admin',
        role: 'ADMIN',
        action: 'CREATE CUSTOMER',
        module: 'CUSTOMERS',
        record_id: newId,
        new_value_summary: `Pendaftaran pelanggan baru: ${formName} (${newId}), Dusun ${formDusun}. Setoran sambungan: Rp ${paid.toLocaleString('id-ID')}`,
      });

      setToastMessage({ text: `Pelanggan baru berhasil didaftarkan: ${newId} (${formName})`, type: 'success' });
    }

    setIsModalOpen(false);
  };

  const handleDeactivate = (customer: Customer) => {
    setConfirmDeactivateCustomer(customer);
  };

  const executeDeactivation = (customer: Customer) => {
    const isActivating = customer.status !== 'ACTIVE';
    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const newStatus = isActivating ? 'ACTIVE' : 'INACTIVE';

    const updated = customers.map((c) => {
      if (c.customer_id === customer.customer_id) {
        return {
          ...c,
          status: newStatus as 'ACTIVE' | 'INACTIVE',
          updated_at: nowStr,
          updated_by: 'Super Admin',
        };
      }
      return c;
    });

    setCustomers(updated);
    AppStorage.setCustomers(updated);

    AuditLogger.log({
      user: 'Super Admin',
      role: 'ADMIN',
      action: 'DEACTIVATE CUSTOMER',
      module: 'CUSTOMERS',
      record_id: customer.customer_id,
      new_value_summary: `Status pelanggan ${customer.customer_name} diubah menjadi ${newStatus}`,
    });

    setToastMessage({
      text: `Status pelanggan ${customer.customer_name} berhasil diubah menjadi ${newStatus === 'ACTIVE' ? 'Aktif' : 'Nonaktif'}.`,
      type: 'success',
    });
    setConfirmDeactivateCustomer(null);
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Search */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 flex items-center space-x-2">
            <Users className="w-7 h-7 text-sky-600" />
            <span>Database Pelanggan KPSPAM</span>
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Kelola data warga pelanggan air, status sambungan rumah, dan nomor meter.
          </p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="bg-sky-600 hover:bg-sky-700 text-white px-5 py-3 rounded-xl font-bold flex items-center space-x-2 shadow-md transition cursor-pointer self-start md:self-auto"
        >
          <Plus className="w-5 h-5" />
          <span>Tambah Pelanggan Baru</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm grid grid-cols-1 md:grid-cols-4 gap-3">
        <div className="relative md:col-span-2">
          <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-3.5" />
          <input
            type="text"
            placeholder="Cari ID (TL-0001), Nama, No. Meter, No. WA, Alamat..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-base focus:bg-white focus:border-sky-500 focus:outline-none"
          />
        </div>

        <div>
          <select
            value={dusunFilter}
            onChange={(e) => setDusunFilter(e.target.value)}
            className="w-full py-3 px-3 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold focus:bg-white focus:border-sky-500 focus:outline-none"
          >
            <option value="ALL">Semua Dusun</option>
            <option value="Ngawu">Dusun Ngawu</option>
            <option value="Melikan">Dusun Melikan</option>
            <option value="Playen Kulon">Dusun Playen Kulon</option>
          </select>
        </div>

        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full py-3 px-3 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold focus:bg-white focus:border-sky-500 focus:outline-none"
          >
            <option value="ALL">Semua Status</option>
            <option value="ACTIVE">Aktif</option>
            <option value="INACTIVE">Nonaktif</option>
            <option value="TEMP_SUSPENDED">Segel Sementara</option>
          </select>
        </div>
      </div>

      {/* Customer List: Responsive Card on Mobile + Table on Desktop */}
      <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-4 sm:px-6 py-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
          <span className="font-extrabold text-slate-800 text-sm">
            Menampilkan {filteredCustomers.length} dari {customers.length} Pelanggan
          </span>
          <span className="text-[11px] text-slate-400">
            ID Format: TL-XXXX (Otomatis & Unik)
          </span>
        </div>

        {/* MOBILE CARD VIEW (Phone users: 360px - 640px) */}
        <div className="md:hidden divide-y divide-slate-100 p-2 space-y-2">
          {filteredCustomers.length === 0 ? (
            <div className="py-8 text-center text-slate-500 font-medium text-sm">
              Tidak ditemukan pelanggan yang cocok dengan pencarian.
            </div>
          ) : (
            filteredCustomers.map((c) => {
              const conn = connections.find((con) => con.customer_id === c.customer_id);

              return (
                <div
                  key={c.customer_id}
                  className="p-4 bg-slate-50/70 border border-slate-200 rounded-2xl space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center space-x-1.5">
                        <span className="font-mono font-black text-xs text-sky-800 bg-sky-100 px-2 py-0.5 rounded-md border border-sky-200">
                          {c.customer_id}
                        </span>
                        <span
                          className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                            c.status === 'ACTIVE'
                              ? 'bg-emerald-100 text-emerald-800'
                              : c.status === 'TEMP_SUSPENDED'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-slate-200 text-slate-700'
                          }`}
                        >
                          {c.status === 'ACTIVE' ? 'Aktif' : c.status === 'TEMP_SUSPENDED' ? 'Disegel' : 'Nonaktif'}
                        </span>
                      </div>
                      <h3 className="font-black text-slate-900 text-base mt-1">
                        {c.customer_name}
                      </h3>
                      <div className="text-xs text-slate-600 font-medium mt-0.5">
                        Dusun {c.dusun}, RT {c.rt} / RW {c.rw}
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="inline-flex items-center space-x-1 font-mono text-slate-700 bg-white border border-slate-200 px-2 py-1 rounded-lg text-xs font-bold">
                        <Gauge className="w-3.5 h-3.5 text-sky-600" />
                        <span>{c.meter_number}</span>
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-200/80">
                    <div>
                      <span className="text-slate-500 block text-[10px] uppercase font-bold">Biaya Sambungan:</span>
                      {conn ? (
                        <span className="font-bold text-slate-800">
                          {conn.status}{' '}
                          {conn.remaining_amount > 0 && (
                            <span className="text-rose-600">(Sisa: Rp {conn.remaining_amount.toLocaleString('id-ID')})</span>
                          )}
                        </span>
                      ) : (
                        <span className="text-emerald-700 font-bold">Lunas</span>
                      )}
                    </div>

                    {/* Action buttons with large tap targets */}
                    <div className="flex items-center space-x-2">
                      <a
                        href={WhatsAppService.generateWhatsAppUrl(
                          c.phone,
                          `Halo Bapak/Ibu ${c.customer_name}, kami dari KPSPAM Tirta Lestari...`
                        )}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2.5 bg-emerald-600 active:bg-emerald-700 text-white rounded-xl shadow-xs transition"
                        title="Chat WhatsApp"
                      >
                        <MessageSquare className="w-4 h-4" />
                      </a>

                      <button
                        onClick={() => handleOpenEditModal(c)}
                        className="p-2.5 bg-sky-100 active:bg-sky-200 text-sky-800 rounded-xl transition cursor-pointer"
                        title="Edit Data"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => handleDeactivate(c)}
                        className={`p-2.5 rounded-xl transition cursor-pointer ${
                          c.status === 'ACTIVE'
                            ? 'bg-rose-100 text-rose-700'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                        title={c.status === 'ACTIVE' ? 'Nonaktifkan' : 'Aktifkan'}
                      >
                        {c.status === 'ACTIVE' ? <XCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* DESKTOP TABLE VIEW (Screens >= 768px) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 text-xs uppercase font-extrabold tracking-wider">
                <th className="py-3.5 px-4">ID & No. Sambungan</th>
                <th className="py-3.5 px-4">Nama Pelanggan</th>
                <th className="py-3.5 px-4">Wilayah / Alamat</th>
                <th className="py-3.5 px-4">No. Meter</th>
                <th className="py-3.5 px-4">Biaya Sambungan</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500 font-medium">
                    Tidak ditemukan pelanggan yang cocok dengan pencarian.
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((c) => {
                  const conn = connections.find((con) => con.customer_id === c.customer_id);

                  return (
                    <tr key={c.customer_id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="font-bold text-sky-700 bg-sky-50 px-2.5 py-1 rounded-md text-xs font-mono border border-sky-200">
                          {c.customer_id}
                        </span>
                        <div className="text-[11px] text-slate-400 mt-1 font-mono">
                          {c.connection_id}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-extrabold text-slate-900 text-base">
                          {c.customer_name}
                        </div>
                        <div className="flex items-center space-x-1 text-slate-500 text-xs mt-0.5">
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span>{c.phone}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-800">
                          Dusun {c.dusun}, RT {c.rt} / RW {c.rw}
                        </div>
                        <div className="text-xs text-slate-500 truncate max-w-xs">{c.address}</div>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="inline-flex items-center space-x-1 font-mono text-slate-700 bg-slate-100 px-2 py-0.5 rounded text-xs">
                          <Gauge className="w-3 h-3 text-slate-500" />
                          <span>{c.meter_number}</span>
                        </span>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          Pasang: {c.join_date}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {conn ? (
                          <div>
                            <span
                              className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                                conn.status === 'LUNAS'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {conn.status}
                            </span>
                            {conn.remaining_amount > 0 && (
                              <div className="text-[11px] text-rose-600 font-semibold mt-0.5">
                                Sisa: Rp {conn.remaining_amount.toLocaleString('id-ID')}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-emerald-700 font-semibold">Lunas</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                            c.status === 'ACTIVE'
                              ? 'bg-emerald-100 text-emerald-800'
                              : c.status === 'TEMP_SUSPENDED'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-slate-200 text-slate-700'
                          }`}
                        >
                          {c.status === 'ACTIVE' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                          {c.status === 'INACTIVE' && <XCircle className="w-3.5 h-3.5 text-slate-500" />}
                          {c.status === 'TEMP_SUSPENDED' && <AlertCircle className="w-3.5 h-3.5 text-amber-600" />}
                          <span>{c.status === 'ACTIVE' ? 'Aktif' : c.status === 'TEMP_SUSPENDED' ? 'Disegel' : 'Nonaktif'}</span>
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center space-x-2">
                          {/* WA Button */}
                          <a
                            href={WhatsAppService.generateWhatsAppUrl(
                              c.phone,
                              `Halo Bapak/Ibu ${c.customer_name}, kami dari KPSPAM Tirta Lestari...`
                            )}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg transition"
                            title="Chat WhatsApp"
                          >
                            <MessageSquare className="w-4 h-4" />
                          </a>

                          {/* Edit Button */}
                          <button
                            onClick={() => handleOpenEditModal(c)}
                            className="p-2 bg-sky-50 hover:bg-sky-100 text-sky-700 rounded-lg transition cursor-pointer"
                            title="Ubah Data Pelanggan"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          {/* Deactivate / Soft Delete */}
                          <button
                            onClick={() => handleDeactivate(c)}
                            className={`p-2 rounded-lg transition cursor-pointer ${
                              c.status === 'ACTIVE'
                                ? 'bg-rose-50 hover:bg-rose-100 text-rose-700'
                                : 'bg-slate-100 hover:bg-emerald-100 text-slate-600 hover:text-emerald-700'
                            }`}
                            title={c.status === 'ACTIVE' ? 'Nonaktifkan Pelanggan' : 'Aktifkan Kembali'}
                          >
                            {c.status === 'ACTIVE' ? <XCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Add / Edit Customer */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <h2 className="text-xl font-bold text-slate-800">
                {editingCustomer ? `Edit Pelanggan (${editingCustomer.customer_id})` : 'Pendaftaran Pelanggan Baru'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSaveCustomer} className="mt-4 space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">
                  Nama Lengkap Warga / Kepala Keluarga <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Bpk. Suhardi"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">
                    Nomor WhatsApp / HP
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: 081234567890"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">
                    Nomor Meter Air
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: MTR-1001"
                    value={formMeterNumber}
                    onChange={(e) => setFormMeterNumber(e.target.value)}
                    className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Dusun</label>
                  <select
                    value={formDusun}
                    onChange={(e) => setFormDusun(e.target.value)}
                    className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  >
                    <option value="Ngawu">Ngawu</option>
                    <option value="Melikan">Melikan</option>
                    <option value="Playen Kulon">Playen Kulon</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">RT</label>
                  <input
                    type="text"
                    value={formRt}
                    onChange={(e) => setFormRt(e.target.value)}
                    className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none"
                    placeholder="01"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">RW</label>
                  <input
                    type="text"
                    value={formRw}
                    onChange={(e) => setFormRw(e.target.value)}
                    className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none"
                    placeholder="01"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Alamat Lengkap</label>
                <input
                  type="text"
                  placeholder="Detail alamat atau patokan rumah"
                  value={formAddress}
                  onChange={(e) => setFormAddress(e.target.value)}
                  className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">
                    Tanggal Pemasangan / Sambungan
                  </label>
                  <input
                    type="date"
                    value={formJoinDate}
                    onChange={(e) => setFormJoinDate(e.target.value)}
                    className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">
                    Status Pelanggan
                  </label>
                  <select
                    value={formStatus}
                    onChange={(e) =>
                      setFormStatus(e.target.value as 'ACTIVE' | 'INACTIVE' | 'TEMP_SUSPENDED')
                    }
                    className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none font-bold"
                  >
                    <option value="ACTIVE">Aktif (Mengalir)</option>
                    <option value="TEMP_SUSPENDED">Segel Sementara</option>
                    <option value="INACTIVE">Nonaktif</option>
                  </select>
                </div>
              </div>

              {!editingCustomer && (
                <div className="bg-sky-50 p-4 rounded-xl border border-sky-200">
                  <span className="block text-xs font-bold uppercase text-sky-800 tracking-wider mb-2">
                    Biaya Sambungan Rumah Baru (Rp 600.000)
                  </span>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">
                        Setoran Awal (Bisa Dicicil 2x)
                      </label>
                      <select
                        value={initialConnectionPaid}
                        onChange={(e) => setInitialConnectionPaid(Number(e.target.value))}
                        className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-sm font-bold focus:outline-none"
                      >
                        <option value={600000}>Lunas Langsung (Rp 600.000)</option>
                        <option value={300000}>Cicilan 1 (Rp 300.000)</option>
                        <option value={0}>Belum Ada Setoran (Rp 0)</option>
                      </select>
                    </div>
                    <div className="flex flex-col justify-center">
                      <span className="text-xs text-slate-500">Sisa Tanggungan Sambungan:</span>
                      <span className="text-sm font-bold text-rose-600">
                        Rp {(600000 - initialConnectionPaid).toLocaleString('id-ID')}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        Batas pelunasan maks. 3 bulan
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Catatan Tambahan</label>
                <textarea
                  rows={2}
                  placeholder="Catatan khusus pelanggan..."
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none text-sm"
                ></textarea>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold hover:bg-slate-50 transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold shadow-md transition cursor-pointer"
                >
                  {editingCustomer ? 'Simpan Perubahan' : 'Daftarkan Pelanggan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* IN-APP CONFIRMATION MODAL FOR DEACTIVATE/ACTIVATE */}
      {confirmDeactivateCustomer && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center space-x-3 mb-4">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  confirmDeactivateCustomer.status === 'ACTIVE'
                    ? 'bg-rose-100 text-rose-600'
                    : 'bg-emerald-100 text-emerald-600'
                }`}
              >
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {confirmDeactivateCustomer.status === 'ACTIVE'
                    ? 'Nonaktifkan Pelanggan?'
                    : 'Aktifkan Kembali Pelanggan?'}
                </h3>
                <p className="text-xs text-slate-500">
                  {confirmDeactivateCustomer.customer_name} ({confirmDeactivateCustomer.customer_id})
                </p>
              </div>
            </div>

            <p className="text-sm text-slate-600 mb-6 leading-relaxed">
              {confirmDeactivateCustomer.status === 'ACTIVE'
                ? `Pelanggan ${confirmDeactivateCustomer.customer_name} akan disetel ke status nonaktif/segel sementara.`
                : `Pelanggan ${confirmDeactivateCustomer.customer_name} akan diaktifkan kembali status alirannya.`}
            </p>

            <div className="flex items-center justify-end space-x-3">
              <button
                type="button"
                onClick={() => setConfirmDeactivateCustomer(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => executeDeactivation(confirmDeactivateCustomer)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold text-white transition shadow-sm cursor-pointer ${
                  confirmDeactivateCustomer.status === 'ACTIVE'
                    ? 'bg-rose-600 hover:bg-rose-500'
                    : 'bg-emerald-600 hover:bg-emerald-500'
                }`}
              >
                {confirmDeactivateCustomer.status === 'ACTIVE' ? 'Ya, Nonaktifkan' : 'Ya, Aktifkan'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TOAST NOTIFICATION BANNER */}
      {toastMessage && (
        <div className="fixed bottom-20 right-6 z-50 max-w-sm w-full bg-slate-900 text-white p-4 rounded-2xl shadow-2xl border border-slate-800 flex items-center justify-between gap-3 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <div className="flex items-center space-x-3">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                toastMessage.type === 'success' ? 'bg-emerald-400' : 'bg-rose-400'
              }`}
            />
            <span className="text-xs font-semibold">{toastMessage.text}</span>
          </div>
          <button
            onClick={() => setToastMessage(null)}
            className="text-slate-400 hover:text-white p-1 rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};
