// SIM-TIRTA LESTARI Public Website Portal
// Portal Terbuka untuk Warga Kalurahan Ngawu: Profil, Tarif, Transparansi Agregat, Pengaduan & Tracking

import React, { useState } from 'react';
import { AppStorage } from '../services/storage';
import { WhatsAppService } from '../services/whatsapp';
import { Complaint, ComplaintHistory } from '../types';
import {
  Droplets,
  ShieldCheck,
  Megaphone,
  CheckCircle2,
  Clock,
  Search,
  MessageSquareWarning,
  Send,
  Phone,
  MapPin,
  Calendar,
  AlertTriangle,
  Info,
  DollarSign,
  ChevronRight,
  TrendingUp,
  UserCheck,
  Copy,
  ExternalLink,
  Menu,
  X,
  Home,
} from 'lucide-react';
import { User } from '../types';
import { LoginModal } from './LoginModal';

interface PublicPortalProps {
  onGoToAdmin: (user?: User) => void;
}

export const PublicPortalView: React.FC<PublicPortalProps> = ({ onGoToAdmin }) => {
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const settings = AppStorage.getSettings();
  const tariffs = AppStorage.getTariffs().filter((t) => t.status === 'ACTIVE');
  const announcements = AppStorage.getAnnouncements().filter((a) => a.status === 'PUBLISHED');
  const complaints = AppStorage.getComplaints();
  const history = AppStorage.getComplaintHistory();
  const maintenance = AppStorage.getMaintenance();
  const cashIns = AppStorage.getCashIn();
  const cashOuts = AppStorage.getCashOut();
  const customers = AppStorage.getCustomers();
  const bills = AppStorage.getBills();

  const [activeSection, setActiveSection] = useState<string>('home');
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  // Public Complaint Form State
  const [complainantName, setComplainantName] = useState('');
  const [complainantId, setComplainantId] = useState('');
  const [complainantPhone, setComplainantPhone] = useState('');
  const [complainantCategory, setComplainantCategory] = useState<Complaint['category']>('KEBOCORAN');
  const [complainantAddress, setComplainantAddress] = useState('');
  const [complainantDescription, setComplainantDescription] = useState('');
  const [submittedTicket, setSubmittedTicket] = useState<string | null>(null);
  const [complaintError, setComplaintError] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  // Tracking Complaint State (Ticket + WhatsApp Number dual verification)
  const [trackTicketNumber, setTrackTicketNumber] = useState('');
  const [trackPhone, setTrackPhone] = useState('');
  const [trackResult, setTrackResult] = useState<Complaint | null>(null);
  const [trackTimeline, setTrackTimeline] = useState<ComplaintHistory[]>([]);
  const [trackError, setTrackError] = useState<string | null>(null);

  // Urgent Emergency Banner (Gangguan Air)
  const urgentBanner = announcements.find((a) => a.is_urgent_banner);

  // Aggregated Transparency Data (Strict Whitelist - NO PII)
  const totalIncome = cashIns.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  const totalExpense = cashOuts.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  const netBalance = totalIncome - totalExpense;
  const activeCustomerCount = customers.filter((c) => c.status === 'ACTIVE').length;
  const currentBills = bills.filter((b) => b.period === '2026-09' || b.period === '2026-10');
  const paidCount = currentBills.filter((b) => b.status === 'PAID').length;
  const unpaidCount = currentBills.filter((b) => b.status !== 'PAID').length;
  const totalComplaints = complaints.length;
  const resolvedComplaints = complaints.filter((c) => c.status === 'SELESAI').length;

  const handleSubmitComplaint = (e: React.FormEvent) => {
    e.preventDefault();
    setComplaintError(null);
    if (!complainantName.trim() || !complainantPhone.trim() || !complainantDescription.trim()) {
      setComplaintError('Mohon lengkapi nama warga, nomor WhatsApp, dan uraian pengaduan.');
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
      customer_name: complainantName.trim(),
      customer_id: complainantId.trim() || undefined,
      phone: complainantPhone.trim(),
      category: complainantCategory,
      address_location: complainantAddress.trim() || 'Kalurahan Ngawu',
      description: complainantDescription.trim(),
      status: 'DITERIMA',
      assigned_officer: 'Koordinator Pelayanan',
      public_note: 'Pengaduan telah masuk ke sistem dan menunggu verifikasi petugas.',
      created_at: nowStr,
      updated_at: nowStr,
    };

    const newHist: ComplaintHistory = {
      history_id: `CH-${Date.now()}`,
      complaint_id: ticketNumber,
      old_status: '-',
      new_status: 'DITERIMA',
      note: 'Laporan warga diterima melalui portal online publik.',
      officer: 'Sistem Online',
      created_at: nowStr,
      created_by: 'Masyarakat',
    };

    const updatedC = [newComp, ...complaints];
    const updatedH = [newHist, ...history];
    AppStorage.setComplaints(updatedC);
    AppStorage.setComplaintHistory(updatedH);

    setSubmittedTicket(ticketNumber);
    // Reset Form
    setComplainantName('');
    setComplainantId('');
    setComplainantPhone('');
    setComplainantAddress('');
    setComplainantDescription('');
  };

  const handleTrackComplaint = (e: React.FormEvent) => {
    e.preventDefault();
    setTrackError(null);
    setTrackResult(null);
    setTrackTimeline([]);

    const ticketClean = trackTicketNumber.trim().toUpperCase();
    const phoneClean = WhatsAppService.normalizePhoneNumber(trackPhone.trim());

    if (!ticketClean || !phoneClean) {
      setTrackError('Masukkan Nomor Tiket dan Nomor WhatsApp.');
      return;
    }

    // WAJIB: Nomor Tiket DAN Nomor WhatsApp harus cocok!
    const matched = complaints.find(
      (c) =>
        c.ticket_number.trim().toUpperCase() === ticketClean &&
        WhatsAppService.normalizePhoneNumber(c.phone) === phoneClean
    );

    if (!matched) {
      setTrackError(
        'Pengaduan tidak ditemukan. Pastikan Nomor Tiket dan Nomor WhatsApp sesuai dengan data yang didaftarkan.'
      );
      return;
    }

    const relatedHistory = history
      .filter((h) => h.complaint_id === matched.ticket_number)
      .sort((a, b) => b.created_at.localeCompare(a.created_at));

    setTrackResult(matched);
    setTrackTimeline(relatedHistory);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* URGENT BANNER GANGGUAN AIR (JIKA ADA) */}
      {urgentBanner && (
        <div className="bg-rose-600 text-white py-3 px-4 shadow-md sticky top-0 z-50">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <span className="p-1.5 bg-rose-700 rounded-lg animate-pulse">
                <AlertTriangle className="w-5 h-5 text-amber-300" />
              </span>
              <div className="text-sm">
                <strong className="font-extrabold uppercase tracking-wide mr-2">
                  [PEMBERITAHUAN GANGGUAN AIR]:
                </strong>
                <span>{urgentBanner.title} &mdash; </span>
                <span className="font-medium text-rose-100">{urgentBanner.content}</span>
                {urgentBanner.affected_area && (
                  <span className="ml-2 font-bold bg-rose-800/80 px-2 py-0.5 rounded text-xs">
                    Wilayah: {urgentBanner.affected_area}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PUBLIC NAVBAR */}
      <nav className="bg-white/95 backdrop-blur-md border-b border-slate-200 sticky top-0 z-40 shadow-xs w-full overflow-hidden">
        <div className="max-w-7xl mx-auto px-2.5 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-20 gap-2">
            {/* Hamburger on Mobile & Brand */}
            <div className="flex items-center space-x-2 flex-1 min-w-0 mr-1 sm:mr-2">
              <button
                type="button"
                onClick={() => setIsMobileNavOpen(!isMobileNavOpen)}
                className="lg:hidden p-1.5 text-slate-700 hover:bg-slate-100 rounded-xl transition cursor-pointer shrink-0"
                aria-label="Buka Menu"
              >
                {isMobileNavOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>

              <div
                className="flex items-center space-x-2 sm:space-x-2.5 cursor-pointer min-w-0 flex-1"
                onClick={() => {
                  setActiveSection('home');
                  setIsMobileNavOpen(false);
                }}
              >
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-sky-600 text-white rounded-xl flex items-center justify-center font-black shadow-xs shrink-0">
                  <Droplets className="w-4 h-4 sm:w-5 sm:h-5 fill-sky-200" />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="font-black text-xs sm:text-lg md:text-xl tracking-tight text-slate-900 block truncate leading-tight">
                    KPSPAM TIRTA LESTARI
                  </span>
                  <span className="text-[10px] sm:text-xs text-sky-800 font-semibold block truncate leading-tight mt-0.5">
                    Kalurahan Ngawu, Playen
                  </span>
                </div>
              </div>
            </div>

            {/* Menu Links Desktop */}
            <div className="hidden lg:flex items-center space-x-1">
              {[
                { id: 'home', label: 'Beranda' },
                { id: 'profile', label: 'Profil' },
                { id: 'tariffs', label: 'Tarif Air' },
                { id: 'announcements', label: 'Pengumuman' },
                { id: 'transparency', label: 'Transparansi' },
                { id: 'complaint', label: 'Pengaduan' },
                { id: 'tracking', label: 'Cek Status' },
                { id: 'contact', label: 'Kontak' },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveSection(item.id)}
                  className={`px-3 py-2 rounded-xl text-sm font-bold transition cursor-pointer ${
                    activeSection === item.id
                      ? 'text-sky-700 bg-sky-50'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            {/* Tombol WA & Login Pengurus */}
            <div className="flex items-center space-x-1.5 sm:space-x-3 shrink-0">
              <a
                href={WhatsAppService.generateWhatsAppUrl(
                  settings.ORG_PHONE,
                  'Halo KPSPAM Tirta Lestari, saya ingin bertanya perihal layanan air...'
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="hidden sm:flex bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2 rounded-xl text-xs font-bold items-center space-x-1.5 shadow-xs transition shrink-0"
              >
                <Phone className="w-4 h-4" />
                <span>WhatsApp Layanan</span>
              </a>

              <button
                type="button"
                onClick={() => setIsLoginModalOpen(true)}
                className="bg-sky-800 hover:bg-sky-900 text-white px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs font-bold shadow-xs transition cursor-pointer flex items-center space-x-1 shrink-0"
              >
                <UserCheck className="w-3.5 h-3.5 text-sky-300 shrink-0" />
                <span className="hidden xs:inline">Login Pengurus</span>
                <span className="xs:hidden">Pengurus</span>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Horizontal Quick Category Scrollbar */}
        <div className="lg:hidden border-t border-slate-100 bg-slate-50/90 px-3 py-1.5 overflow-x-auto flex items-center space-x-1.5 no-scrollbar">
          {[
            { id: 'home', label: 'Beranda' },
            { id: 'tariffs', label: 'Tarif Air' },
            { id: 'announcements', label: 'Pengumuman' },
            { id: 'transparency', label: 'Transparansi' },
            { id: 'complaint', label: 'Pengaduan' },
            { id: 'tracking', label: 'Cek Status' },
            { id: 'profile', label: 'Profil' },
            { id: 'contact', label: 'Kontak' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveSection(item.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition cursor-pointer shrink-0 ${
                activeSection === item.id
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Mobile Full Dropdown Menu */}
        {isMobileNavOpen && (
          <div className="lg:hidden bg-white border-b border-slate-200 shadow-xl px-4 py-3 space-y-1">
            {[
              { id: 'home', label: 'Beranda' },
              { id: 'profile', label: 'Profil KPSPAM Tirta Lestari' },
              { id: 'tariffs', label: 'Tarif Air Progresif' },
              { id: 'announcements', label: 'Pengumuman & Info Gangguan' },
              { id: 'transparency', label: 'Transparansi Keuangan Publik' },
              { id: 'complaint', label: 'Form Pengaduan Warga' },
              { id: 'tracking', label: 'Cek Status Tiket Aduan' },
              { id: 'contact', label: 'Kontak & Lokasi Kantor' },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setActiveSection(item.id);
                  setIsMobileNavOpen(false);
                }}
                className={`w-full text-left px-3 py-2.5 rounded-xl text-sm font-bold flex items-center justify-between transition ${
                  activeSection === item.id
                    ? 'bg-sky-600 text-white'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <span>{item.label}</span>
                {activeSection === item.id && <span>✓</span>}
              </button>
            ))}

            <div className="pt-2 border-t border-slate-100">
              <a
                href={WhatsAppService.generateWhatsAppUrl(
                  settings.ORG_PHONE,
                  'Halo KPSPAM Tirta Lestari, saya warga Kalurahan Ngawu...'
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full bg-emerald-600 text-white py-2.5 rounded-xl text-xs font-bold flex items-center justify-center space-x-2"
              >
                <Phone className="w-4 h-4" />
                <span>Chat WhatsApp Pengurus ({settings.ORG_PHONE})</span>
              </a>
            </div>
          </div>
        )}
      </nav>

      {/* HERO SECTION */}
      {activeSection === 'home' && (
        <section className="bg-gradient-to-b from-sky-800 via-sky-900 to-slate-900 text-white py-20 px-4">
          <div className="max-w-5xl mx-auto text-center space-y-6">
            <span className="inline-flex items-center space-x-2 bg-sky-700/60 border border-sky-400/30 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider text-sky-200">
              <Droplets className="w-4 h-4 text-sky-300" />
              <span>Sistem Pelayanan Air Minum & Sanitasi Berbasis Masyarakat</span>
            </span>

            <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-tight">
              KPSPAM TIRTA LESTARI
            </h1>

            <p className="text-lg md:text-2xl text-sky-100 font-semibold max-w-3xl mx-auto">
              &ldquo;{settings.ORG_TAGLINE}&rdquo;
            </p>

            <p className="text-sm md:text-base text-sky-200 max-w-2xl mx-auto">
              Kalurahan Ngawu, Kapanewon Playen, Kabupaten Gunungkidul. Melayani kebutuhan air bersih
              untuk ratusan kepala keluarga secara adil, transparan, dan berkelanjutan.
            </p>

            <div className="pt-4 flex flex-wrap justify-center gap-4">
              <button
                onClick={() => setActiveSection('tariffs')}
                className="bg-sky-500 hover:bg-sky-400 text-slate-900 px-6 py-3.5 rounded-2xl font-black text-base shadow-lg transition cursor-pointer"
              >
                Informasi Pelayanan & Tarif
              </button>

              <button
                onClick={() => setActiveSection('transparency')}
                className="bg-white/10 hover:bg-white/20 text-white border-2 border-white/30 px-6 py-3.5 rounded-2xl font-black text-base shadow-lg transition cursor-pointer"
              >
                Transparansi Keuangan
              </button>

              <button
                onClick={() => setActiveSection('complaint')}
                className="bg-amber-500 hover:bg-amber-400 text-slate-900 px-6 py-3.5 rounded-2xl font-black text-base shadow-lg transition cursor-pointer"
              >
                Pengaduan Warga
              </button>
            </div>
          </div>
        </section>
      )}

      {/* MAIN CONTENT AREA */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex-1 space-y-12">
        {/* SECTION: PROFIL KPSPAM */}
        {(activeSection === 'home' || activeSection === 'profile') && (
          <section className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
            <div className="max-w-3xl">
              <h2 className="text-2xl font-black text-slate-900">
                Profil Singkat KPSPAM Tirta Lestari
              </h2>
              <p className="text-slate-600 text-sm mt-2 leading-relaxed">
                Kelompok Pengelola Sarana Prasarana Air Minum dan Sanitasi (KPSPAM) Tirta Lestari
                merupakan lembaga pengelola mandiri yang didirikan oleh warga Kalurahan Ngawu. Kami
                mengelola sumur dalam submersible, bak penampungan tandon menara, jaringan transmisi
                pipa HDPE, serta meteran rumah warga guna menjamin pasokan air bersih bagi seluruh warga.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
              <div className="p-5 bg-sky-50 rounded-2xl border border-sky-100">
                <span className="text-xs font-extrabold uppercase text-sky-800 tracking-wider block">
                  Cakupan Wilayah
                </span>
                <span className="text-lg font-black text-slate-900 mt-1 block">
                  Kalurahan Ngawu
                </span>
                <span className="text-xs text-slate-600 mt-1 block">
                  Dusun Ngawu, Dusun Melikan, Dusun Playen Kulon
                </span>
              </div>

              <div className="p-5 bg-emerald-50 rounded-2xl border border-emerald-100">
                <span className="text-xs font-extrabold uppercase text-emerald-800 tracking-wider block">
                  Kapasitas Pasokan
                </span>
                <span className="text-lg font-black text-slate-900 mt-1 block">
                  10.000 Liter Tandon
                </span>
                <span className="text-xs text-slate-600 mt-1 block">
                  Pompa Submersible 3 HP dengan debit 1.8 L/detik
                </span>
              </div>

              <div className="p-5 bg-indigo-50 rounded-2xl border border-indigo-100">
                <span className="text-xs font-extrabold uppercase text-indigo-800 tracking-wider block">
                  Loket Pelayanan
                </span>
                <span className="text-lg font-black text-slate-900 mt-1 block">
                  Buka Setiap Hari Kerja
                </span>
                <span className="text-xs text-slate-600 mt-1 block">{settings.ORG_HOURS}</span>
              </div>
            </div>
          </section>
        )}

        {/* SECTION: STRUKTUR TARIF PROGRESIF PER BLOK */}
        {(activeSection === 'home' || activeSection === 'tariffs') && (
          <section className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
            <div className="max-w-3xl">
              <span className="text-xs font-extrabold uppercase tracking-wider text-sky-700 bg-sky-50 px-2.5 py-1 rounded">
                Ketetapan Tarif Air Bersih
              </span>
              <h2 className="text-2xl font-black text-slate-900 mt-2">
                Struktur Tarif Progresif Per Blok
              </h2>
              <p className="text-slate-600 text-sm mt-1 leading-relaxed">
                KPSPAM Tirta Lestari menggunakan sistem <strong>tarif progresif berjenjang</strong>{' '}
                agar warga berhemat air dan berkeadilan:
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {tariffs.map((t) => (
                <div
                  key={t.tariff_id}
                  className="p-5 rounded-2xl border-2 border-slate-200 bg-slate-50 flex flex-col justify-between"
                >
                  <div>
                    <span className="text-xs font-bold text-slate-500 uppercase block">
                      {t.name}
                    </span>
                    <span className="text-2xl font-black text-sky-800 font-mono mt-1 block">
                      Rp {t.rate_per_m3.toLocaleString('id-ID')}
                      <span className="text-xs font-normal text-slate-500"> / m³</span>
                    </span>
                    <span className="text-xs text-slate-600 mt-2 block font-medium">
                      Rentang: {t.minimum_usage} s/d {t.maximum_usage === -1 ? 'Seterusnya' : `${t.maximum_usage} m³`}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400 mt-3 pt-2 border-t border-slate-200 block italic">
                    {t.notes}
                  </span>
                </div>
              ))}
            </div>

            {/* Beban Bulanan & Promo Baru */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="p-4 bg-sky-50 rounded-2xl border border-sky-200 flex items-start space-x-3">
                <Info className="w-5 h-5 text-sky-700 shrink-0 mt-0.5" />
                <div className="text-xs">
                  <strong className="text-sm font-bold text-sky-900 block">
                    Beban Tetap Bulanan: Rp {settings.MONTHLY_FIXED_FEE.toLocaleString('id-ID')} / bulan
                  </strong>
                  <span className="text-sky-800">
                    Untuk pemeliharaan rutin jaringan pipa, listrik gardu tandon, dan administrasi operasional.
                  </span>
                </div>
              </div>

              <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 flex items-start space-x-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
                <div className="text-xs">
                  <strong className="text-sm font-bold text-emerald-900 block">
                    Sambungan Baru: Gratis 10 m³ Bulan Pertama
                  </strong>
                  <span className="text-emerald-800">
                    Pelanggan baru mendapatkan potongan pemakaian air hingga 10 m³ di bulan aktivasi sambungan.
                  </span>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* SECTION: TRANSPARANSI KEUANGAN PUBLIK (AGREGAT SAJA) */}
        {(activeSection === 'home' || activeSection === 'transparency') && (
          <section className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded">
                  Keterbukaan Informasi Publik
                </span>
                <h2 className="text-2xl font-black text-slate-900 mt-2">
                  Transparansi Keuangan & Operasional KPSPAM
                </h2>
                <p className="text-slate-500 text-sm mt-1">
                  Masyarakat dapat memantau secara terbuka penerimaan iuran rekening air, biaya listrik,
                  dan saldo kas desa tanpa membuka data pribadi pelanggan.
                </p>
              </div>

              <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-xl">
                Periode: Oktober 2026
              </span>
            </div>

            {/* 4 Cards Ringkasan Publik */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200">
                <span className="text-xs font-bold text-slate-500 uppercase block">Saldo Awal Kas</span>
                <span className="text-xl font-black text-slate-800 font-mono mt-1 block">
                  Rp 8.500.000
                </span>
              </div>

              <div className="p-5 bg-emerald-50 rounded-2xl border border-emerald-200">
                <span className="text-xs font-bold text-emerald-800 uppercase block">
                  Pemasukan Iuran & Sambungan
                </span>
                <span className="text-xl font-black text-emerald-700 font-mono mt-1 block">
                  Rp {totalIncome.toLocaleString('id-ID')}
                </span>
              </div>

              <div className="p-5 bg-rose-50 rounded-2xl border border-rose-200">
                <span className="text-xs font-bold text-rose-800 uppercase block">
                  Pengeluaran Operasional & Listrik
                </span>
                <span className="text-xl font-black text-rose-700 font-mono mt-1 block">
                  Rp {totalExpense.toLocaleString('id-ID')}
                </span>
              </div>

              <div className="p-5 bg-sky-50 rounded-2xl border border-sky-300">
                <span className="text-xs font-bold text-sky-800 uppercase block">
                  Saldo Bersih Kas
                </span>
                <span className="text-xl font-black text-sky-900 font-mono mt-1 block">
                  Rp {netBalance.toLocaleString('id-ID')}
                </span>
              </div>
            </div>

            {/* Statistik Pelanggan & Pengaduan Warga */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-center">
                <span className="text-xs font-bold text-slate-500 uppercase block">Pelanggan Aktif</span>
                <span className="text-2xl font-black text-slate-900 mt-1 block">
                  {activeCustomerCount} Kepala Keluarga
                </span>
              </div>

              <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 text-center">
                <span className="text-xs font-bold text-emerald-800 uppercase block">
                  Kepatuhan Pembayaran Bulan Ini
                </span>
                <span className="text-2xl font-black text-emerald-700 mt-1 block">
                  {paidCount} Lunas ({unpaidCount} Belum Bayar)
                </span>
              </div>

              <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 text-center">
                <span className="text-xs font-bold text-amber-800 uppercase block">
                  Layanan Pengaduan Warga
                </span>
                <span className="text-2xl font-black text-amber-800 mt-1 block">
                  {resolvedComplaints} Selesai dari {totalComplaints} Aduan
                </span>
              </div>
            </div>

            {/* Kegiatan Pemeliharaan Terakhir */}
            <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200">
              <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center space-x-2">
                <Clock className="w-4 h-4 text-sky-600" />
                <span>Catatan Pemeliharaan Jaringan Terbaru:</span>
              </h3>
              <div className="space-y-2 text-xs">
                {maintenance.slice(0, 3).map((m) => (
                  <div key={m.maintenance_id} className="flex justify-between py-1 border-b border-slate-200">
                    <span className="text-slate-700">
                      &bull; <strong>{m.date}:</strong> {m.asset_or_network} &mdash; {m.issue} ({m.action})
                    </span>
                    <span className="font-bold text-emerald-700 font-mono whitespace-nowrap">
                      Status: {m.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* SECTION: FORM PENGADUAN WARGA */}
        {(activeSection === 'home' || activeSection === 'complaint') && (
          <section className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
            <div className="max-w-3xl">
              <span className="text-xs font-extrabold uppercase tracking-wider text-amber-700 bg-amber-50 px-2.5 py-1 rounded">
                Layanan Cepat Tanggap
              </span>
              <h2 className="text-2xl font-black text-slate-900 mt-2">
                Formulir Pengaduan Masyarakat
              </h2>
              <p className="text-slate-600 text-sm mt-1 leading-relaxed">
                Laporkan kebocoran pipa, air mengecil/mati, kendala meteran, atau keluhan tagihan.
                Setiap laporan akan mendapatkan Nomor Tiket resmi untuk dipantau secara real-time.
              </p>
            </div>

            {submittedTicket ? (
              <div className="p-6 bg-emerald-50 border-2 border-emerald-400 rounded-2xl text-center space-y-3">
                <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
                <h3 className="text-xl font-black text-emerald-900">Pengaduan Berhasil Diterima!</h3>
                <p className="text-emerald-700 text-sm">
                  Laporan Anda telah tercatat dan segera ditangani oleh tim lapangan KPSPAM Tirta Lestari.
                </p>
                <div className="p-4 bg-white rounded-xl border border-emerald-300 max-w-sm mx-auto">
                  <span className="text-xs font-bold text-slate-500 block uppercase">Nomor Tiket Anda:</span>
                  <span className="text-2xl font-black font-mono text-emerald-800 tracking-wider block mt-1">
                    {submittedTicket}
                  </span>
                </div>
                <div className="flex justify-center gap-3 pt-2">
                  <button
                    onClick={() => {
                      if (submittedTicket) {
                        navigator.clipboard.writeText(submittedTicket);
                        setIsCopied(true);
                        setTimeout(() => setIsCopied(false), 3000);
                      }
                    }}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 cursor-pointer"
                  >
                    <Copy className="w-4 h-4" />
                    <span>{isCopied ? 'Tersalin!' : 'Salin Nomor Tiket'}</span>
                  </button>

                  <button
                    onClick={() => {
                      setTrackTicketNumber(submittedTicket);
                      setActiveSection('tracking');
                    }}
                    className="bg-sky-600 hover:bg-sky-700 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 cursor-pointer"
                  >
                    <Search className="w-4 h-4" />
                    <span>Pantau Status Pengaduan</span>
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmitComplaint} className="space-y-4 max-w-2xl">
                {complaintError && (
                  <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-semibold flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
                    <span>{complaintError}</span>
                  </div>
                )}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Nama Lengkap Pelapor <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Nama Bapak/Ibu..."
                    value={complainantName}
                    onChange={(e) => setComplainantName(e.target.value)}
                    className="w-full p-3 border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Nomor WhatsApp Pelapor <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: 081234567890"
                      value={complainantPhone}
                      onChange={(e) => setComplainantPhone(e.target.value)}
                      className="w-full p-3 border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      ID Pelanggan (Jika Sudah Terdaftar)
                    </label>
                    <input
                      type="text"
                      placeholder="Contoh: TL-0001"
                      value={complainantId}
                      onChange={(e) => setComplainantId(e.target.value)}
                      className="w-full p-3 border border-slate-300 rounded-xl font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Jenis / Kategori Pengaduan
                    </label>
                    <select
                      value={complainantCategory}
                      onChange={(e) => setComplainantCategory(e.target.value as Complaint['category'])}
                      className="w-full p-3 border border-slate-300 rounded-xl font-bold text-slate-800 focus:outline-none"
                    >
                      <option value="AIR TIDAK MENGALIR">AIR TIDAK MENGALIR</option>
                      <option value="KEBOCORAN">PIPA BOCOR</option>
                      <option value="METER AIR">METERAN RUSAK / BURAM</option>
                      <option value="TAGIHAN">PERTANYAAN TAGIHAN</option>
                      <option value="SAMBUNGAN RUMAH">SAMBUNGAN BARU</option>
                      <option value="KUALITAS AIR">KUALITAS AIR KERUH</option>
                      <option value="LAINNYA">LAINNYA</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Alamat / Patokan Lokasi Gangguan
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: Depan pos ronda RT 02 Dusun Ngawu"
                      value={complainantAddress}
                      onChange={(e) => setComplainantAddress(e.target.value)}
                      className="w-full p-3 border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Jelaskan Kendala Secara Rinci <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    rows={3}
                    required
                    placeholder="Tuliskan kendala yang dihadapi..."
                    value={complainantDescription}
                    onChange={(e) => setComplainantDescription(e.target.value)}
                    className="w-full p-3 border border-slate-300 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  ></textarea>
                </div>

                <button
                  type="submit"
                  className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-black px-8 py-3.5 rounded-2xl shadow-md transition cursor-pointer flex items-center space-x-2 text-base"
                >
                  <Send className="w-5 h-5" />
                  <span>Kirim Laporan Pengaduan</span>
                </button>
              </form>
            )}
          </section>
        )}

        {/* SECTION: TRACKING STATUS PENGADUAN (DUAL VERIFIKASI) */}
        {(activeSection === 'home' || activeSection === 'tracking') && (
          <section className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
            <div className="max-w-3xl">
              <span className="text-xs font-extrabold uppercase tracking-wider text-sky-700 bg-sky-50 px-2.5 py-1 rounded">
                Pelacakan Real-Time
              </span>
              <h2 className="text-2xl font-black text-slate-900 mt-2">
                Cek Status & Perkembangan Pengaduan
              </h2>
              <p className="text-slate-600 text-sm mt-1 leading-relaxed">
                Untuk keamanan privasi, masukkan <strong>Nomor Tiket</strong> dan{' '}
                <strong>Nomor WhatsApp</strong> yang digunakan saat pendaftaran aduan.
              </p>
            </div>

            <form onSubmit={handleTrackComplaint} className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-2xl">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Nomor Tiket
                </label>
                <input
                  type="text"
                  required
                  placeholder="PGD-TL-..."
                  value={trackTicketNumber}
                  onChange={(e) => setTrackTicketNumber(e.target.value)}
                  className="w-full p-3 border border-slate-300 rounded-xl font-mono font-bold text-slate-900 uppercase"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Nomor WhatsApp
                </label>
                <input
                  type="text"
                  required
                  placeholder="08xxxxxxxxxx"
                  value={trackPhone}
                  onChange={(e) => setTrackPhone(e.target.value)}
                  className="w-full p-3 border border-slate-300 rounded-xl text-slate-900"
                />
              </div>

              <div className="flex items-end">
                <button
                  type="submit"
                  className="w-full bg-sky-600 hover:bg-sky-700 text-white p-3 rounded-xl font-bold flex items-center justify-center space-x-1 shadow-md transition cursor-pointer"
                >
                  <Search className="w-4 h-4" />
                  <span>Lacak Tiket</span>
                </button>
              </div>
            </form>

            {trackError && (
              <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-sm font-semibold max-w-2xl">
                {trackError}
              </div>
            )}

            {trackResult && (
              <div className="p-6 bg-slate-50 border border-slate-200 rounded-3xl max-w-2xl space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                  <div>
                    <span className="font-mono text-xs font-bold text-sky-800 bg-sky-100 px-2 py-0.5 rounded">
                      {trackResult.ticket_number}
                    </span>
                    <h3 className="text-base font-extrabold text-slate-900 mt-1">
                      Kategori: {trackResult.category}
                    </h3>
                  </div>
                  <span
                    className={`text-xs font-bold px-3 py-1 rounded-full ${
                      trackResult.status === 'SELESAI'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800 animate-pulse'
                    }`}
                  >
                    {trackResult.status}
                  </span>
                </div>

                <div className="text-xs text-slate-700 space-y-1">
                  <div>
                    <strong>Lokasi Gangguan:</strong> {trackResult.address_location}
                  </div>
                  <div>
                    <strong>Keluhan:</strong> &ldquo;{trackResult.description}&rdquo;
                  </div>
                  <div>
                    <strong>Catatan Petugas Lapangan:</strong> {trackResult.public_note || '-'}
                  </div>
                </div>

                {/* Timeline */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
                    Perjalanan Status Penanganan:
                  </h4>
                  <div className="border-l-2 border-sky-400 ml-2 pl-4 space-y-3">
                    {trackTimeline.map((item) => (
                      <div key={item.history_id} className="relative text-xs">
                        <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-sky-600"></div>
                        <span className="font-extrabold text-slate-900 block">{item.new_status}</span>
                        <span className="text-slate-600 block">{item.note}</span>
                        <span className="text-[10px] text-slate-400 block mt-0.5">{item.created_at}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </section>
        )}

        {/* SECTION: KONTAK & HOTLINE LAYANAN */}
        <section className="bg-gradient-to-r from-sky-900 to-slate-900 text-white p-8 rounded-3xl space-y-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="space-y-2">
              <h2 className="text-2xl font-black">Butuh Bantuan Layanan Air?</h2>
              <p className="text-sky-200 text-sm max-w-xl">
                Hubungi pengurus KPSPAM Tirta Lestari atau kunjungi langsung kantor sekretariat kami di
                Kalurahan Ngawu.
              </p>
              <div className="text-xs text-sky-300 space-y-1 pt-1">
                <div>Alamat: {settings.ORG_ADDRESS}</div>
                <div>Jam Operasional: {settings.ORG_HOURS}</div>
              </div>
            </div>

            <a
              href={WhatsAppService.generateWhatsAppUrl(
                settings.ORG_PHONE,
                'Halo pengurus KPSPAM Tirta Lestari, saya warga Kalurahan Ngawu ingin berkonsultasi...'
              )}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black px-6 py-4 rounded-2xl flex items-center justify-center space-x-2 shadow-lg transition cursor-pointer self-start md:self-auto text-base"
            >
              <Phone className="w-5 h-5" />
              <span>Chat WhatsApp Pengurus</span>
            </a>
          </div>
        </section>
      </main>

      {/* PUBLIC FOOTER */}
      <footer className="bg-slate-950 text-slate-400 py-8 pb-24 lg:pb-8 border-t border-slate-800 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <strong className="text-slate-200 block text-sm">KPSPAM TIRTA LESTARI</strong>
            <span>Kalurahan Ngawu, Kapanewon Playen, Kabupaten Gunungkidul</span>
          </div>

          <div className="flex items-center space-x-4">
            <button
              type="button"
              onClick={() => setIsLoginModalOpen(true)}
              className="hover:text-white transition cursor-pointer"
            >
              Login Pengurus
            </button>
            <span>&bull;</span>
            <span>SIM-TIRTA LESTARI v1.0.0</span>
          </div>
        </div>
      </footer>

      {/* CITIZEN MOBILE BOTTOM NAV BAR (Thumb-friendly on smartphones) */}
      <nav
        aria-label="Navigasi Warga Ponsel"
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-[0_-4px_16px_rgba(0,0,0,0.06)] px-2 py-1.5 flex items-center justify-around select-none"
      >
        {[
          { id: 'home', label: 'Beranda', icon: <Home className="w-5 h-5" /> },
          { id: 'tariffs', label: 'Tarif Air', icon: <Droplets className="w-5 h-5" /> },
          { id: 'announcements', label: 'Pengumuman', icon: <Megaphone className="w-5 h-5" /> },
          { id: 'complaint', label: 'Aduan', icon: <MessageSquareWarning className="w-5 h-5" /> },
          { id: 'tracking', label: 'Cek Status', icon: <Search className="w-5 h-5" /> },
        ].map((tab) => {
          const isActive = activeSection === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveSection(tab.id);
                setIsMobileNavOpen(false);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className={`flex-1 min-h-[46px] py-1 px-1 flex flex-col items-center justify-center rounded-xl transition-all cursor-pointer active:scale-95 ${
                isActive ? 'text-sky-700 font-extrabold' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <div
                className={`p-1 rounded-xl transition-colors ${
                  isActive ? 'bg-sky-100 text-sky-700' : 'text-slate-500'
                }`}
              >
                {tab.icon}
              </div>
              <span className="text-[10px] leading-tight tracking-tight mt-0.5 truncate max-w-[62px]">
                {tab.label}
              </span>
            </button>
          );
        })}
      </nav>

      {/* LOGIN PENGURUS MODAL */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onLoginSuccess={(user) => {
          setIsLoginModalOpen(false);
          onGoToAdmin(user);
        }}
      />
    </div>
  );
};
