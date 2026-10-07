// SIM-TIRTA LESTARI Data Storage Service
// Kalurahan Ngawu, Kapanewon Playen, Kabupaten Gunungkidul

import {
  AppSettings,
  User,
  RoleDefinition,
  Customer,
  Connection,
  MeterReading,
  TariffTier,
  Bill,
  Payment,
  Receipt,
  CashIn,
  CashOut,
  BankLedger,
  Asset,
  Maintenance,
  Complaint,
  ComplaintHistory,
  Announcement,
  AuditLogEntry,
  BackupLogEntry,
} from '../types';

export const DEFAULT_SETTINGS: AppSettings = {
  ORG_NAME: 'KPSPAM TIRTA LESTARI',
  ORG_TAGLINE: 'Melayani Air Bersih, Transparan, dan Berkelanjutan',
  ORG_VILLAGE: 'Kalurahan Ngawu',
  ORG_DISTRICT: 'Kapanewon Playen',
  ORG_REGENCY: 'Kabupaten Gunungkidul',
  ORG_ADDRESS: 'Jl. Ngawu - Playen Km. 1, Kalurahan Ngawu, Playen, Gunungkidul, D.I. Yogyakarta 55861',
  ORG_PHONE: '081234567890',
  ORG_EMAIL: 'kpspam.tirtalestari.ngawu@gmail.com',
  ORG_LOGO_URL: '',
  ORG_HOURS: 'Senin - Sabtu: 08.00 - 15.00 WIB',

  MONTHLY_FIXED_FEE: 10000,
  PAYMENT_DUE_DAY: 28,
  LATE_FEE_PER_MONTH: 5000,

  CONNECTION_FEE: 600000,
  CONNECTION_INSTALLMENTS: 2,
  CONNECTION_PAYMENT_MAX_MONTHS: 3,

  FIRST_MONTH_FREE_ENABLED: true,
  FIRST_MONTH_FREE_LIMIT: 10,

  CUSTOMER_PREFIX: 'TL-',
  BILL_PREFIX: 'INV-TL-',
  PAYMENT_PREFIX: 'PAY-TL-',
  RECEIPT_PREFIX: 'KWT-TL-',
  COMPLAINT_PREFIX: 'PGD-TL-',

  PUBLIC_TRANSPARENCY_ENABLED: true,
  MAINTENANCE_MODE: false,

  WA_TEMPLATE_REMINDER: `Yth. Bapak/Ibu {{nama}},

Kami dari KPSPAM Tirta Lestari mengingatkan bahwa tagihan rekening air periode {{periode}} sebesar {{total}} masih belum tercatat pembayarannya.

ID Pelanggan: {{customer_id}}
Pemakaian: {{pemakaian}} m³
Batas Waktu: Tanggal {{due_day}} bulan ini.
Total Tagihan: {{total}}

Pembayaran dapat dilakukan melalui loket kantor KPSPAM atau transfer.
Terima kasih.

KPSPAM Tirta Lestari
Kalurahan Ngawu, Playen`,

  WA_TEMPLATE_ARREARS: `Yth. Bapak/Ibu {{nama}},

Berdasarkan administrasi KPSPAM Tirta Lestari, terdapat tunggakan rekening air sebanyak {{jumlah_bulan}} bulan dengan rincian:
- Pokok Tagihan: {{pokok}}
- Denda Keterlambatan: {{denda}}
- Total Tunggakan: {{total}}

Mohon dapat segera dilakukan penyelesaian pembayaran di loket KPSPAM Tirta Lestari.

Terima kasih atas kerja samanya.
KPSPAM Tirta Lestari`,

  WA_TEMPLATE_PAYMENT: `Terima kasih Bapak/Ibu {{nama}}.

Pembayaran rekening air periode {{periode}} sebesar {{jumlah_bayar}} telah kami terima pada tanggal {{tanggal_bayar}}.

Nomor Kwitansi: {{nomor_kwitansi}}
Metode Pembayaran: {{metode_bayar}}
Petugas: {{petugas}}
Kode Verifikasi: {{kode_verifikasi}}

Status: LUNAS

Terima kasih atas partisipasi Anda mendukung kelancaran distribusi air bersih.
KPSPAM Tirta Lestari`,

  WA_TEMPLATE_COMPLAINT: `Yth. Bapak/Ibu {{nama}},

Update status pengaduan Anda dengan nomor tiket {{ticket_number}}:

Status Terbaru: {{status}}
Kategori: {{kategori}}
Petugas: {{petugas}}
Catatan: {{catatan}}

Anda dapat memantau status secara langsung di portal publik KPSPAM Tirta Lestari.
Terima kasih.
KPSPAM Tirta Lestari`,

  BACKUP_RETENTION: 30,
  APP_VERSION: 'v1.0.0',
};

export const INITIAL_TARIFFS: TariffTier[] = [
  {
    tariff_id: 'TRF-01',
    name: 'Blok 1 (Pemakaian 1 - 10 m³)',
    minimum_usage: 1,
    maximum_usage: 10,
    rate_per_m3: 2500,
    effective_from: '2026-01-01',
    status: 'ACTIVE',
    notes: 'Tarif dasar kebutuhan pokok air bersih',
  },
  {
    tariff_id: 'TRF-02',
    name: 'Blok 2 (Pemakaian 11 - 20 m³)',
    minimum_usage: 11,
    maximum_usage: 20,
    rate_per_m3: 3000,
    effective_from: '2026-01-01',
    status: 'ACTIVE',
    notes: 'Tarif pemakaian sedang',
  },
  {
    tariff_id: 'TRF-03',
    name: 'Blok 3 (Pemakaian 21 - 30 m³)',
    minimum_usage: 21,
    maximum_usage: 30,
    rate_per_m3: 4000, // Configurable per instructions
    effective_from: '2026-01-01',
    status: 'ACTIVE',
    notes: 'Ditetapkan Rp 4.000/m³ (dapat disesuaikan melalui menu Tarif)',
  },
  {
    tariff_id: 'TRF-04',
    name: 'Blok 4 (Pemakaian di atas 30 m³)',
    minimum_usage: 31,
    maximum_usage: -1, // Unlimited
    rate_per_m3: 5000,
    effective_from: '2026-01-01',
    status: 'ACTIVE',
    notes: 'Tarif progresif pemakaian tinggi',
  },
];

export const INITIAL_ROLES: RoleDefinition[] = [
  {
    id: 'ADMIN',
    name: 'Administrator (Super Admin)',
    description: 'Akses penuh ke seluruh 23 modul sistem, konfigurasi tarif, kelola pengguna & hak akses.',
    badge_color: 'bg-purple-100 text-purple-800 border-purple-200',
    is_system: true,
    permissions: [
      'dashboard',
      'customers',
      'meters',
      'bills',
      'payments',
      'receipts',
      'arrears',
      'complaints',
      'maintenance',
      'cashin',
      'cashout',
      'bank',
      'reports',
      'assets',
      'announcements',
      'transparency',
      'tariffs',
      'users',
      'settings',
      'audit',
      'health',
      'tests',
      'gasexport',
    ],
  },
  {
    id: 'PENGURUS',
    name: 'Badan Pengelola (Ketua / Bendahara)',
    description: 'Akses administrasi pelanggan, kasir, follow-up tunggakan, arus kas masuk/keluar, bank, dan pelaporan keuangan.',
    badge_color: 'bg-sky-100 text-sky-800 border-sky-200',
    is_system: true,
    permissions: [
      'dashboard',
      'customers',
      'meters',
      'bills',
      'payments',
      'receipts',
      'arrears',
      'complaints',
      'maintenance',
      'cashin',
      'cashout',
      'bank',
      'reports',
      'assets',
      'announcements',
      'transparency',
      'tests',
      'gasexport',
    ],
  },
  {
    id: 'PETUGAS',
    name: 'Petugas Lapangan / Catat Meter',
    description: 'Akses pencatatan angka meter pelanggan bulanan, penanganan tiket aduan warga, dan pemeliharaan pipa.',
    badge_color: 'bg-amber-100 text-amber-800 border-amber-200',
    is_system: true,
    permissions: ['dashboard', 'meters', 'complaints', 'maintenance', 'transparency'],
  },
  {
    id: 'KASIR',
    name: 'Kasir Loket Pembayaran',
    description: 'Khusus staf loket kantor: menerima pembayaran rekening air, mencetak kwitansi, dan memeriksa data tagihan.',
    badge_color: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    is_system: false,
    permissions: ['dashboard', 'customers', 'bills', 'payments', 'receipts', 'arrears', 'transparency'],
  },
];

export const INITIAL_USERS: User[] = [
  {
    user_id: 'USR-01',
    email: 'SewinduP@gmail.com',
    name: 'Sewindu (Super Admin)',
    role: 'ADMIN',
    status: 'ACTIVE',
    phone: '081234567890',
    password: 'admin123',
    created_at: '2026-01-01 08:00:00',
  },
  {
    user_id: 'USR-02',
    email: 'pengurus@tirtalestari.id',
    name: 'Pak H. Sugiyanto (Ketua KPSPAM)',
    role: 'PENGURUS',
    status: 'ACTIVE',
    phone: '081398765432',
    password: 'pengurus123',
    created_at: '2026-01-01 08:00:00',
  },
  {
    user_id: 'USR-03',
    email: 'petugas@tirtalestari.id',
    name: 'Mas Joko (Petugas Meter & Lapangan)',
    role: 'PETUGAS',
    status: 'ACTIVE',
    phone: '085712345678',
    password: 'petugas123',
    created_at: '2026-01-01 08:00:00',
  },
];

export const INITIAL_CUSTOMERS: Customer[] = [
  {
    customer_id: 'TL-0001',
    connection_id: 'CON-0001',
    customer_name: 'Bpk. Suhardi',
    phone: '081328001122',
    address: 'RT 02 RW 01 Dusun Ngawu',
    dusun: 'Ngawu',
    rt: '02',
    rw: '01',
    meter_number: 'MTR-1001',
    join_date: '2025-01-15',
    status: 'ACTIVE',
    notes: 'Sambungan lama',
    created_at: '2025-01-15 09:00:00',
    created_by: 'Sewindu',
    updated_at: '2026-09-01 10:00:00',
    updated_by: 'Sewindu',
  },
  {
    customer_id: 'TL-0002',
    connection_id: 'CON-0002',
    customer_name: 'Ibu Warsinah',
    phone: '081578334455',
    address: 'RT 03 RW 01 Dusun Ngawu',
    dusun: 'Ngawu',
    rt: '03',
    rw: '01',
    meter_number: 'MTR-1002',
    join_date: '2025-02-10',
    status: 'ACTIVE',
    notes: 'Lancar bayar',
    created_at: '2025-02-10 10:00:00',
    created_by: 'Sewindu',
    updated_at: '2026-09-01 10:00:00',
    updated_by: 'Sewindu',
  },
  {
    customer_id: 'TL-0003',
    connection_id: 'CON-0003',
    customer_name: 'Bpk. Tri Santoso',
    phone: '087839112233',
    address: 'RT 01 RW 02 Dusun Ngawu',
    dusun: 'Ngawu',
    rt: '01',
    rw: '02',
    meter_number: 'MTR-1003',
    join_date: '2025-03-20',
    status: 'ACTIVE',
    notes: 'Menunggak 2 bulan',
    created_at: '2025-03-20 11:00:00',
    created_by: 'Sewindu',
    updated_at: '2026-09-01 10:00:00',
    updated_by: 'Sewindu',
  },
  {
    customer_id: 'TL-0004',
    connection_id: 'CON-0004',
    customer_name: 'Bpk. Supardi',
    phone: '085228445566',
    address: 'RT 04 RW 02 Dusun Melikan',
    dusun: 'Melikan',
    rt: '04',
    rw: '02',
    meter_number: 'MTR-1004',
    join_date: '2025-05-12',
    status: 'ACTIVE',
    notes: 'Menunggak 3 bulan',
    created_at: '2025-05-12 08:30:00',
    created_by: 'Sewindu',
    updated_at: '2026-09-01 10:00:00',
    updated_by: 'Sewindu',
  },
  {
    customer_id: 'TL-0005',
    connection_id: 'CON-0005',
    customer_name: 'Ibu Siti Aminah',
    phone: '081229778899',
    address: 'RT 02 RW 03 Dusun Ngawu',
    dusun: 'Ngawu',
    rt: '02',
    rw: '03',
    meter_number: 'MTR-1005',
    join_date: '2025-06-01',
    status: 'ACTIVE',
    notes: 'Keluarga berkebutuhan',
    created_at: '2025-06-01 09:00:00',
    created_by: 'Sewindu',
    updated_at: '2026-09-01 10:00:00',
    updated_by: 'Sewindu',
  },
  {
    customer_id: 'TL-0006',
    connection_id: 'CON-0006',
    customer_name: 'Bpk. Gunawan Wibowo',
    phone: '081804112244',
    address: 'RT 01 RW 01 Dusun Playen Kulon',
    dusun: 'Playen Kulon',
    rt: '01',
    rw: '01',
    meter_number: 'MTR-1006',
    join_date: '2025-08-15',
    status: 'ACTIVE',
    notes: 'Pelanggan aktif',
    created_at: '2025-08-15 13:00:00',
    created_by: 'Sewindu',
    updated_at: '2026-09-01 10:00:00',
    updated_by: 'Sewindu',
  },
  {
    customer_id: 'TL-0007',
    connection_id: 'CON-0007',
    customer_name: 'Ibu Martuti',
    phone: '081392667788',
    address: 'RT 03 RW 03 Dusun Melikan',
    dusun: 'Melikan',
    rt: '03',
    rw: '03',
    meter_number: 'MTR-1007',
    join_date: '2026-09-10', // Baru bulan lalu
    status: 'ACTIVE',
    notes: 'Sambungan baru, promo gratis 10 m3 pertama',
    created_at: '2026-09-10 11:00:00',
    created_by: 'Sewindu',
    updated_at: '2026-10-01 08:00:00',
    updated_by: 'Sewindu',
  },
  {
    customer_id: 'TL-0008',
    connection_id: 'CON-0008',
    customer_name: 'Bpk. Bambang Sutrisno',
    phone: '085643119900',
    address: 'RT 02 RW 02 Dusun Ngawu',
    dusun: 'Ngawu',
    rt: '02',
    rw: '02',
    meter_number: 'MTR-1008',
    join_date: '2026-09-25', // Pelanggan baru bulan ini
    status: 'ACTIVE',
    notes: 'Baru pasang, cicilan 1 lunas',
    created_at: '2026-09-25 14:00:00',
    created_by: 'Sewindu',
    updated_at: '2026-09-25 14:00:00',
    updated_by: 'Sewindu',
  },
  {
    customer_id: 'TL-0009',
    connection_id: 'CON-0009',
    customer_name: 'Bpk. Agus Riyanto',
    phone: '081290334411',
    address: 'RT 05 RW 01 Dusun Ngawu',
    dusun: 'Ngawu',
    rt: '05',
    rw: '01',
    meter_number: 'MTR-1009',
    join_date: '2025-04-10',
    status: 'INACTIVE',
    notes: 'Pindah domisili luar kota, meter disegel sementara',
    created_at: '2025-04-10 10:00:00',
    created_by: 'Sewindu',
    updated_at: '2026-08-01 10:00:00',
    updated_by: 'Sewindu',
  },
  {
    customer_id: 'TL-0010',
    connection_id: 'CON-0010',
    customer_name: 'Ibu Rukmini',
    phone: '081705663322',
    address: 'RT 01 RW 03 Dusun Ngawu',
    dusun: 'Ngawu',
    rt: '01',
    rw: '03',
    meter_number: 'MTR-1010',
    join_date: '2025-07-20',
    status: 'ACTIVE',
    notes: 'Kondisi meter normal',
    created_at: '2025-07-20 09:00:00',
    created_by: 'Sewindu',
    updated_at: '2026-09-01 10:00:00',
    updated_by: 'Sewindu',
  },
];

export const INITIAL_CONNECTIONS: Connection[] = [
  {
    connection_id: 'CON-0001',
    customer_id: 'TL-0001',
    connection_fee: 600000,
    paid_amount: 600000,
    remaining_amount: 0,
    installment_number: 1,
    due_date: '2025-02-15',
    status: 'LUNAS',
    created_at: '2025-01-15 09:00:00',
    updated_at: '2025-01-15 09:00:00',
  },
  {
    connection_id: 'CON-0007',
    customer_id: 'TL-0007',
    connection_fee: 600000,
    paid_amount: 600000,
    remaining_amount: 0,
    installment_number: 1,
    due_date: '2026-10-10',
    status: 'LUNAS',
    created_at: '2026-09-10 11:00:00',
    updated_at: '2026-09-10 11:00:00',
  },
  {
    connection_id: 'CON-0008',
    customer_id: 'TL-0008',
    connection_fee: 600000,
    paid_amount: 300000,
    remaining_amount: 300000,
    installment_number: 1,
    due_date: '2026-11-25',
    status: 'SEBAGIAN',
    created_at: '2026-09-25 14:00:00',
    updated_at: '2026-09-25 14:00:00',
  },
];

export const INITIAL_READINGS: MeterReading[] = [
  // Periode 2026-09 (Bulan lalu)
  {
    reading_id: 'MR-202609-0001',
    period: '2026-09',
    customer_id: 'TL-0001',
    previous_reading: 120,
    current_reading: 135,
    usage_m3: 15,
    reading_date: '2026-09-25',
    officer: 'Mas Joko',
    notes: 'Lancar',
    created_at: '2026-09-25 10:00:00',
  },
  {
    reading_id: 'MR-202609-0002',
    period: '2026-09',
    customer_id: 'TL-0002',
    previous_reading: 88,
    current_reading: 97,
    usage_m3: 9,
    reading_date: '2026-09-25',
    officer: 'Mas Joko',
    notes: 'Normal',
    created_at: '2026-09-25 10:15:00',
  },
  {
    reading_id: 'MR-202609-0003',
    period: '2026-09',
    customer_id: 'TL-0003',
    previous_reading: 210,
    current_reading: 232,
    usage_m3: 22,
    reading_date: '2026-09-25',
    officer: 'Mas Joko',
    notes: 'Pemakaian naik',
    created_at: '2026-09-25 10:30:00',
  },
  {
    reading_id: 'MR-202609-0004',
    period: '2026-09',
    customer_id: 'TL-0004',
    previous_reading: 160,
    current_reading: 178,
    usage_m3: 18,
    reading_date: '2026-09-25',
    officer: 'Mas Joko',
    notes: 'Pemilik tidak di rumah saat catat',
    created_at: '2026-09-25 10:45:00',
  },
  {
    reading_id: 'MR-202609-0005',
    period: '2026-09',
    customer_id: 'TL-0005',
    previous_reading: 75,
    current_reading: 87,
    usage_m3: 12,
    reading_date: '2026-09-25',
    officer: 'Mas Joko',
    notes: 'Normal',
    created_at: '2026-09-25 11:00:00',
  },
  {
    reading_id: 'MR-202609-0006',
    period: '2026-09',
    customer_id: 'TL-0006',
    previous_reading: 140,
    current_reading: 165,
    usage_m3: 25,
    reading_date: '2026-09-25',
    officer: 'Mas Joko',
    notes: 'Warung makan',
    created_at: '2026-09-25 11:15:00',
  },
  {
    reading_id: 'MR-202609-0007',
    period: '2026-09',
    customer_id: 'TL-0007',
    previous_reading: 0,
    current_reading: 14,
    usage_m3: 14, // Bulan pertama: 10 m3 gratis, bayar 4 m3 x 2500 = 10.000 + 10.000 beban = 20.000
    reading_date: '2026-09-25',
    officer: 'Mas Joko',
    notes: 'Bulan pertama',
    created_at: '2026-09-25 11:30:00',
  },
  // Periode 2026-10 (Bulan berjalan - beberapa sudah dicatat)
  {
    reading_id: 'MR-202610-0001',
    period: '2026-10',
    customer_id: 'TL-0001',
    previous_reading: 135,
    current_reading: 153,
    usage_m3: 18,
    reading_date: '2026-10-04',
    officer: 'Mas Joko',
    notes: 'Catat rutin',
    created_at: '2026-10-04 09:00:00',
  },
  {
    reading_id: 'MR-202610-0002',
    period: '2026-10',
    customer_id: 'TL-0002',
    previous_reading: 97,
    current_reading: 105,
    usage_m3: 8,
    reading_date: '2026-10-04',
    officer: 'Mas Joko',
    notes: 'Pemakaian hemat',
    created_at: '2026-10-04 09:30:00',
  },
];

export const INITIAL_BILLS: Bill[] = [
  // TL-0001: Periode 2026-09 (Sudah Lunas)
  {
    bill_id: 'BIL-202609-0001',
    bill_number: 'INV-TL-2026-09-0001',
    customer_id: 'TL-0001',
    period: '2026-09',
    previous_meter: 120,
    current_meter: 135,
    usage_m3: 15,
    water_charge: 40000, // 10 x 2500 (25.000) + 5 x 3000 (15.000)
    fixed_fee: 10000,
    arrears: 0,
    late_fee: 0,
    other_charge: 0,
    discount: 0,
    total_bill: 50000,
    status: 'PAID',
    created_at: '2026-09-26 08:00:00',
    due_date: '2026-09-28',
    paid_at: '2026-09-27 10:15:00',
  },
  // TL-0002: Periode 2026-09 (Sudah Lunas)
  {
    bill_id: 'BIL-202609-0002',
    bill_number: 'INV-TL-2026-09-0002',
    customer_id: 'TL-0002',
    period: '2026-09',
    previous_meter: 88,
    current_meter: 97,
    usage_m3: 9,
    water_charge: 22500, // 9 x 2500
    fixed_fee: 10000,
    arrears: 0,
    late_fee: 0,
    other_charge: 0,
    discount: 0,
    total_bill: 32500,
    status: 'PAID',
    created_at: '2026-09-26 08:00:00',
    due_date: '2026-09-28',
    paid_at: '2026-09-28 09:00:00',
  },
  // TL-0003: Periode 2026-08 (Belum bayar / Menunggak 2 bulan dengan 2026-09)
  {
    bill_id: 'BIL-202608-0003',
    bill_number: 'INV-TL-2026-08-0003',
    customer_id: 'TL-0003',
    period: '2026-08',
    previous_meter: 190,
    current_meter: 210,
    usage_m3: 20,
    water_charge: 55000, // 10*2500 + 10*3000
    fixed_fee: 10000,
    arrears: 0,
    late_fee: 10000, // 2 bulan lewat tgl 28 = 2 x 5000
    other_charge: 0,
    discount: 0,
    total_bill: 75000,
    status: 'OVERDUE',
    created_at: '2026-08-26 08:00:00',
    due_date: '2026-08-28',
  },
  {
    bill_id: 'BIL-202609-0003',
    bill_number: 'INV-TL-2026-09-0003',
    customer_id: 'TL-0003',
    period: '2026-09',
    previous_meter: 210,
    current_meter: 232,
    usage_m3: 22,
    water_charge: 63000, // 10*2500 + 10*3000 + 2*4000
    fixed_fee: 10000,
    arrears: 65000, // pokok bulan lalu
    late_fee: 5000, // lewat tgl 28 Sep
    other_charge: 0,
    discount: 0,
    total_bill: 143000,
    status: 'OVERDUE',
    created_at: '2026-09-26 08:00:00',
    due_date: '2026-09-28',
  },
  // TL-0004: Periode 2026-07, 2026-08, 2026-09 (Tunggakan 3 bulan)
  {
    bill_id: 'BIL-202607-0004',
    bill_number: 'INV-TL-2026-07-0004',
    customer_id: 'TL-0004',
    period: '2026-07',
    previous_meter: 125,
    current_meter: 142,
    usage_m3: 17,
    water_charge: 46000, // 10*2500 + 7*3000
    fixed_fee: 10000,
    arrears: 0,
    late_fee: 15000, // 3 bulan lewat = 3 x 5000
    other_charge: 0,
    discount: 0,
    total_bill: 71000,
    status: 'OVERDUE',
    created_at: '2026-07-26 08:00:00',
    due_date: '2026-07-28',
  },
  // TL-0007: Promo Bulan Pertama (10 m3 gratis)
  {
    bill_id: 'BIL-202609-0007',
    bill_number: 'INV-TL-2026-09-0007',
    customer_id: 'TL-0007',
    period: '2026-09',
    previous_meter: 0,
    current_meter: 14,
    usage_m3: 14,
    water_charge: 10000, // 10 m3 free, 4 m3 bayar @ 2500 = 10.000
    fixed_fee: 10000,
    arrears: 0,
    late_fee: 0,
    other_charge: 0,
    discount: 25000, // Potongan 10 m3 gratis
    total_bill: 20000,
    status: 'UNPAID',
    created_at: '2026-09-26 08:00:00',
    due_date: '2026-09-28',
  },
  // TL-0001: Periode 2026-10 (Bulan berjalan, UNPAID)
  {
    bill_id: 'BIL-202610-0001',
    bill_number: 'INV-TL-2026-10-0001',
    customer_id: 'TL-0001',
    period: '2026-10',
    previous_meter: 135,
    current_meter: 153,
    usage_m3: 18,
    water_charge: 49000, // 10*2500 + 8*3000
    fixed_fee: 10000,
    arrears: 0,
    late_fee: 0,
    other_charge: 0,
    discount: 0,
    total_bill: 59000,
    status: 'UNPAID',
    created_at: '2026-10-04 10:00:00',
    due_date: '2026-10-28',
  },
  // TL-0002: Periode 2026-10 (Bulan berjalan, UNPAID)
  {
    bill_id: 'BIL-202610-0002',
    bill_number: 'INV-TL-2026-10-0002',
    customer_id: 'TL-0002',
    period: '2026-10',
    previous_meter: 97,
    current_meter: 105,
    usage_m3: 8,
    water_charge: 20000, // 8*2500
    fixed_fee: 10000,
    arrears: 0,
    late_fee: 0,
    other_charge: 0,
    discount: 0,
    total_bill: 30000,
    status: 'UNPAID',
    created_at: '2026-10-04 10:00:00',
    due_date: '2026-10-28',
  },
];

export const INITIAL_PAYMENTS: Payment[] = [
  {
    payment_id: 'PAY-TL-202609-0001',
    payment_number: 'PAY-TL-202609-0001',
    receipt_number: 'KWT-TL-202609-0001',
    bill_id: 'BIL-202609-0001',
    customer_id: 'TL-0001',
    period: '2026-09',
    amount_paid: 50000,
    payment_method: 'Tunai',
    payment_date: '2026-09-27 10:15:00',
    officer: 'Pak H. Sugiyanto',
    status: 'SUCCESS',
    verification_code: 'TL-VRF-98214',
    created_at: '2026-09-27 10:15:00',
  },
  {
    payment_id: 'PAY-TL-202609-0002',
    payment_number: 'PAY-TL-202609-0002',
    receipt_number: 'KWT-TL-202609-0002',
    bill_id: 'BIL-202609-0002',
    customer_id: 'TL-0002',
    period: '2026-09',
    amount_paid: 32500,
    payment_method: 'Tunai',
    payment_date: '2026-09-28 09:00:00',
    officer: 'Pak H. Sugiyanto',
    status: 'SUCCESS',
    verification_code: 'TL-VRF-44109',
    created_at: '2026-09-28 09:00:00',
  },
];

export const INITIAL_RECEIPTS: Receipt[] = [
  {
    receipt_id: 'RCT-202609-0001',
    receipt_number: 'KWT-TL-202609-0001',
    payment_id: 'PAY-TL-202609-0001',
    bill_id: 'BIL-202609-0001',
    customer_id: 'TL-0001',
    period: '2026-09',
    previous_meter: 120,
    current_meter: 135,
    usage_m3: 15,
    water_charge: 40000,
    fixed_fee: 10000,
    arrears: 0,
    late_fee: 0,
    other_charge: 0,
    discount: 0,
    total_amount: 50000,
    payment_method: 'Tunai',
    payment_date: '2026-09-27 10:15:00',
    officer: 'Pak H. Sugiyanto',
    verification_code: 'TL-VRF-98214',
    created_at: '2026-09-27 10:15:00',
  },
  {
    receipt_id: 'RCT-202609-0002',
    receipt_number: 'KWT-TL-202609-0002',
    payment_id: 'PAY-TL-202609-0002',
    bill_id: 'BIL-202609-0002',
    customer_id: 'TL-0002',
    period: '2026-09',
    previous_meter: 88,
    current_meter: 97,
    usage_m3: 9,
    water_charge: 22500,
    fixed_fee: 10000,
    arrears: 0,
    late_fee: 0,
    other_charge: 0,
    discount: 0,
    total_amount: 32500,
    payment_method: 'Tunai',
    payment_date: '2026-09-28 09:00:00',
    officer: 'Pak H. Sugiyanto',
    verification_code: 'TL-VRF-44109',
    created_at: '2026-09-28 09:00:00',
  },
];

export const INITIAL_CASH_IN: CashIn[] = [
  {
    transaction_id: 'CIN-202609-0001',
    date: '2026-09-27 10:15:00',
    category: 'REKENING AIR',
    reference_number: 'KWT-TL-202609-0001',
    customer_id: 'TL-0001',
    description: 'Pembayaran Rekening Air Bpk. Suhardi Periode 2026-09',
    amount: 50000,
    payment_method: 'Tunai',
    created_by: 'Pak H. Sugiyanto',
    created_at: '2026-09-27 10:15:00',
  },
  {
    transaction_id: 'CIN-202609-0002',
    date: '2026-09-28 09:00:00',
    category: 'REKENING AIR',
    reference_number: 'KWT-TL-202609-0002',
    customer_id: 'TL-0002',
    description: 'Pembayaran Rekening Air Ibu Warsinah Periode 2026-09',
    amount: 32500,
    payment_method: 'Tunai',
    created_by: 'Pak H. Sugiyanto',
    created_at: '2026-09-28 09:00:00',
  },
  {
    transaction_id: 'CIN-202609-0003',
    date: '2026-09-10 11:00:00',
    category: 'SAMBUNGAN BARU',
    reference_number: 'CON-0007',
    customer_id: 'TL-0007',
    description: 'Pelunasan Biaya Sambungan Baru Ibu Martuti',
    amount: 600000,
    payment_method: 'Transfer',
    created_by: 'Sewindu',
    created_at: '2026-09-10 11:00:00',
  },
  {
    transaction_id: 'CIN-202609-0004',
    date: '2026-09-25 14:00:00',
    category: 'SAMBUNGAN BARU',
    reference_number: 'CON-0008',
    customer_id: 'TL-0008',
    description: 'Cicilan 1 Biaya Sambungan Baru Bpk. Bambang Sutrisno',
    amount: 300000,
    payment_method: 'Tunai',
    created_by: 'Sewindu',
    created_at: '2026-09-25 14:00:00',
  },
];

export const INITIAL_CASH_OUT: CashOut[] = [
  {
    transaction_id: 'COUT-202609-0001',
    date: '2026-09-20',
    category: 'LISTRIK',
    description: 'Pembayaran Tagihan Listrik PLN Gardu Pompa Induk Ngawu',
    amount: 450000,
    recipient: 'PLN Persero',
    proof_number: 'PLN-882910-SEP',
    requested_by: 'Pak H. Sugiyanto',
    approved_by: 'Sewindu',
    created_by: 'Pak H. Sugiyanto',
    created_at: '2026-09-20 11:00:00',
  },
  {
    transaction_id: 'COUT-202609-0002',
    date: '2026-09-22',
    category: 'PERAWATAN',
    description: 'Penggantian Stop Kran & Pipa HDPE 1 Inch Bocor RT 02 Ngawu',
    amount: 175000,
    recipient: 'Toko Besi Berkah Playen',
    proof_number: 'NOTA-TBB-492',
    requested_by: 'Mas Joko',
    approved_by: 'Pak H. Sugiyanto',
    created_by: 'Mas Joko',
    created_at: '2026-09-22 15:30:00',
  },
  {
    transaction_id: 'COUT-202609-0003',
    date: '2026-09-30',
    category: 'HONOR',
    description: 'Honor Petugas Lapangan Catat Meter & Perawatan Bulan September',
    amount: 300000,
    recipient: 'Mas Joko (Petugas)',
    proof_number: 'HNR-202609-JK',
    requested_by: 'Pak H. Sugiyanto',
    approved_by: 'Sewindu',
    created_by: 'Pak H. Sugiyanto',
    created_at: '2026-09-30 16:00:00',
  },
];

export const INITIAL_BANK_LEDGER: BankLedger[] = [
  {
    entry_id: 'BNK-001',
    date: '2026-09-01',
    type: 'CREDIT',
    reference: 'SALDO-AWAL-SEP',
    description: 'Saldo Awal Rekening Bank BPD DIY KPSPAM Tirta Lestari',
    debit: 0,
    credit: 8500000,
    balance: 8500000,
    created_at: '2026-09-01 08:00:00',
  },
  {
    entry_id: 'BNK-002',
    date: '2026-09-10',
    type: 'CREDIT',
    reference: 'CON-0007',
    description: 'Transfer Biaya Sambungan Baru Ibu Martuti',
    debit: 0,
    credit: 600000,
    balance: 9100000,
    created_at: '2026-09-10 11:30:00',
  },
  {
    entry_id: 'BNK-003',
    date: '2026-09-20',
    type: 'DEBIT',
    reference: 'COUT-202609-0001',
    description: 'Autodebet Listrik PLN Pompa Induk',
    debit: 450000,
    credit: 0,
    balance: 8650000,
    created_at: '2026-09-20 11:05:00',
  },
];

export const INITIAL_ASSETS: Asset[] = [
  {
    asset_id: 'AST-001',
    asset_code: 'PMP-SUB-01',
    asset_name: 'Pompa Submersible Franklin 3 HP',
    category: 'Pompa',
    purchase_date: '2023-08-10',
    purchase_value: 12500000,
    location: 'Sumur Dalam RT 01 Ngawu',
    condition: 'BAIK',
    status: 'AKTIF',
    notes: 'Kondisi stabil, debit 1.8 liter/detik',
  },
  {
    asset_id: 'AST-002',
    asset_code: 'TDN-5000-01',
    asset_name: 'Tandon Air Profil Tank 5.000 Liter (2 Unit)',
    category: 'Tandon',
    purchase_date: '2023-08-15',
    purchase_value: 9000000,
    location: 'Menara Tandon Dusun Ngawu',
    condition: 'BAIK',
    status: 'AKTIF',
    notes: 'Tandon penampungan utama',
  },
  {
    asset_id: 'AST-003',
    asset_code: 'MTR-IND-01',
    asset_name: 'Meter Induk Distribusi 2 Inch',
    category: 'Meter Induk',
    purchase_date: '2023-08-20',
    purchase_value: 2200000,
    location: 'Pipa Keluar Menara Tandon',
    condition: 'BAIK',
    status: 'AKTIF',
    notes: 'Kalibrasi tahunan normal',
  },
  {
    asset_id: 'AST-004',
    asset_code: 'PPA-HDPE-63',
    asset_name: 'Jaringan Pipa Utama HDPE 63mm (1.200 meter)',
    category: 'Pipa Utama',
    purchase_date: '2023-09-01',
    purchase_value: 18000000,
    location: 'Jalur Ngawu - Melikan',
    condition: 'BAIK',
    status: 'AKTIF',
    notes: 'Pipa transmisi utama desa',
  },
];

export const INITIAL_MAINTENANCE: Maintenance[] = [
  {
    maintenance_id: 'MNT-202609-001',
    date: '2026-09-22',
    asset_or_network: 'Jaringan Pipa RT 02 Dusun Ngawu',
    location: 'Depan rumah Bpk. Suhardi',
    issue: 'Kebocoran sambungan nepel pipa HDPE 1 inch',
    action: 'Pemotongan pipa bocor, penyambungan baru dengan socket compression HDPE',
    cost: 175000,
    technician: 'Mas Joko & Bpk. Sugiyanto',
    status: 'SELESAI',
    notes: 'Selesai dalam 3 jam, pasokan air kembali normal',
  },
  {
    maintenance_id: 'MNT-202610-001',
    date: '2026-10-02',
    asset_or_network: 'Pompa Submersible Franklin 3 HP',
    location: 'Sumur Dalam RT 01 Ngawu',
    issue: 'Pemeriksaan rutin berkala & pembersihan saringan intake pompa',
    action: 'Pengecekan amperemeter panel listrik dan visual kabel pompa',
    cost: 50000,
    technician: 'Mas Joko',
    status: 'SELESAI',
    notes: 'Ampere normal di 8.2 A, tidak ada getaran berlebih',
  },
];

export const INITIAL_COMPLAINTS: Complaint[] = [
  {
    complaint_id: 'PGD-TL-202609-0001',
    ticket_number: 'PGD-TL-202609-0001',
    customer_name: 'Ibu Warsinah',
    customer_id: 'TL-0002',
    phone: '081578334455',
    category: 'KEBOCORAN',
    address_location: 'RT 03 RW 01 Dusun Ngawu (dekat gardu siskamling)',
    description: 'Ada rembesan air cukup deras di tepi jalan cor dekat rumah kami.',
    status: 'SELESAI',
    assigned_officer: 'Mas Joko',
    public_note: 'Pipa bocor telah diperbaiki dan diganti klem baru.',
    created_at: '2026-09-21 14:20:00',
    updated_at: '2026-09-22 16:00:00',
  },
  {
    complaint_id: 'PGD-TL-202610-0001',
    ticket_number: 'PGD-TL-202610-0001',
    customer_name: 'Bpk. Tri Santoso',
    customer_id: 'TL-0003',
    phone: '087839112233',
    category: 'AIR TIDAK MENGALIR',
    address_location: 'RT 01 RW 02 Dusun Ngawu',
    description: 'Air kran rumah mengecil sejak kemarin sore, hari ini tidak mengalir.',
    status: 'DALAM PENANGANAN',
    assigned_officer: 'Mas Joko',
    public_note: 'Petugas sedang menelusuri kran pembagi blok RT 01 yang tersumbat.',
    created_at: '2026-10-04 07:45:00',
    updated_at: '2026-10-04 11:30:00',
  },
];

export const INITIAL_COMPLAINT_HISTORY: ComplaintHistory[] = [
  {
    history_id: 'CH-001',
    complaint_id: 'PGD-TL-202609-0001',
    old_status: 'DITERIMA',
    new_status: 'TERVERIFIKASI',
    note: 'Laporan diverifikasi melalui koordinasi RT setempat.',
    officer: 'Pak H. Sugiyanto',
    created_at: '2026-09-21 15:00:00',
    created_by: 'Pak H. Sugiyanto',
  },
  {
    history_id: 'CH-002',
    complaint_id: 'PGD-TL-202609-0001',
    old_status: 'TERVERIFIKASI',
    new_status: 'DALAM PENANGANAN',
    note: 'Petugas meluncur ke lokasi membawa perlengkapan.',
    officer: 'Mas Joko',
    created_at: '2026-09-22 09:00:00',
    created_by: 'Mas Joko',
  },
  {
    history_id: 'CH-003',
    complaint_id: 'PGD-TL-202609-0001',
    old_status: 'DALAM PENANGANAN',
    new_status: 'SELESAI',
    note: 'Perbaikan tuntas, kebocoran teratasi.',
    officer: 'Mas Joko',
    created_at: '2026-09-22 16:00:00',
    created_by: 'Mas Joko',
  },
  {
    history_id: 'CH-004',
    complaint_id: 'PGD-TL-202610-0001',
    old_status: 'DITERIMA',
    new_status: 'DALAM PENANGANAN',
    note: 'Petugas sedang memeriksa gate valve blok RT 01.',
    officer: 'Mas Joko',
    created_at: '2026-10-04 11:30:00',
    created_by: 'Mas Joko',
  },
];

export const INITIAL_ANNOUNCEMENTS: Announcement[] = [
  {
    announcement_id: 'ANN-001',
    title: 'Jadwal Pembayaran Rekening Air Bulan Oktober 2026',
    content: 'Diberitahukan kepada seluruh warga pelanggan KPSPAM Tirta Lestari bahwa loket pembayaran rekening air dibuka mulai tanggal 1 s/d 28 Oktober 2026. Mohon menyelesaikan pembayaran sebelum tanggal 28 untuk menghindari denda keterlambatan.',
    category: 'PENGUMUMAN',
    start_date: '2026-10-01',
    end_date: '2026-10-28',
    status: 'PUBLISHED',
    affected_area: 'Semua Dusun di Kalurahan Ngawu',
    is_urgent_banner: false,
    created_by: 'Sewindu',
    created_at: '2026-10-01 08:00:00',
  },
  {
    announcement_id: 'ANN-002',
    title: 'Perbaikan Pipa Jaringan Dusun Ngawu RT 01-02',
    content: 'Sedang dilakukan perbaikan gate valve di jaringan utama distribusi Dusun Ngawu RT 01 dan 02. Debit air mungkin mengecil sementara waktu. Estimasi selesai hari ini pukul 16.00 WIB.',
    category: 'GANGGUAN',
    start_date: '2026-10-04',
    end_date: '2026-10-05',
    status: 'PUBLISHED',
    affected_area: 'Dusun Ngawu RT 01 dan RT 02',
    is_urgent_banner: true,
    created_by: 'Mas Joko',
    created_at: '2026-10-04 08:30:00',
  },
];

export const INITIAL_AUDIT_LOGS: AuditLogEntry[] = [
  {
    log_id: 'LOG-001',
    timestamp: '2026-09-01 08:00:00',
    user: 'Sewindu (Super Admin)',
    role: 'ADMIN',
    action: 'SYSTEM SETUP',
    module: 'SETUP',
    record_id: 'INIT',
    new_value_summary: 'Sistem SIM-TIRTA LESTARI diinisialisasi untuk Kalurahan Ngawu.',
  },
  {
    log_id: 'LOG-002',
    timestamp: '2026-09-27 10:15:00',
    user: 'Pak H. Sugiyanto',
    role: 'PENGURUS',
    action: 'PAYMENT',
    module: 'PAYMENT',
    record_id: 'PAY-TL-202609-0001',
    new_value_summary: 'Pembayaran Rekening Bpk. Suhardi Rp 50.000 Lunas.',
  },
  {
    log_id: 'LOG-003',
    timestamp: '2026-09-28 09:00:00',
    user: 'Pak H. Sugiyanto',
    role: 'PENGURUS',
    action: 'PAYMENT',
    module: 'PAYMENT',
    record_id: 'PAY-TL-202609-0002',
    new_value_summary: 'Pembayaran Rekening Ibu Warsinah Rp 32.500 Lunas.',
  },
  {
    log_id: 'LOG-004',
    timestamp: '2026-10-04 09:00:00',
    user: 'Mas Joko',
    role: 'PETUGAS',
    action: 'METER INPUT',
    module: 'METER',
    record_id: 'MR-202610-0001',
    new_value_summary: 'Pencatatan meter TL-0001 periode 2026-10: 153 m3 (pakai 18 m3).',
  },
];

export const INITIAL_BACKUP_LOGS: BackupLogEntry[] = [
  {
    backup_id: 'BAK-20261001-001',
    backup_name: 'BACKUP_SIM_TIRTA_2026-10-01',
    file_url: 'https://drive.google.com/drive/folders/SIM_TIRTA_LESTARI_BACKUP',
    timestamp: '2026-10-01 02:00:00',
    size_kb: 420,
    status: 'SUCCESS',
    records_count: 148,
    initiated_by: 'Time-driven Trigger (Daily Auto Backup)',
  },
];

// In-Memory & LocalStorage Persistence Manager
const STORAGE_PREFIX = 'SIM_TIRTA_';

export class AppStorage {
  private static getItem<T>(key: string, defaultValue: T): T {
    try {
      const data = localStorage.getItem(STORAGE_PREFIX + key);
      return data ? JSON.parse(data) : defaultValue;
    } catch {
      return defaultValue;
    }
  }

  private static setItem<T>(key: string, value: T): void {
    try {
      localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value));
    } catch (e) {
      console.error('Storage error for ' + key, e);
    }
  }

  public static initialize(): void {
    if (!localStorage.getItem(STORAGE_PREFIX + 'INITIALIZED')) {
      this.resetToDefaults();
    }
  }

  public static resetToDefaults(): void {
    this.setSettings(DEFAULT_SETTINGS);
    this.setTariffs(INITIAL_TARIFFS);
    this.setRoles(INITIAL_ROLES);
    this.setUsers(INITIAL_USERS);
    this.setCustomers(INITIAL_CUSTOMERS);
    this.setConnections(INITIAL_CONNECTIONS);
    this.setReadings(INITIAL_READINGS);
    this.setBills(INITIAL_BILLS);
    this.setPayments(INITIAL_PAYMENTS);
    this.setReceipts(INITIAL_RECEIPTS);
    this.setCashIn(INITIAL_CASH_IN);
    this.setCashOut(INITIAL_CASH_OUT);
    this.setBankLedger(INITIAL_BANK_LEDGER);
    this.setAssets(INITIAL_ASSETS);
    this.setMaintenance(INITIAL_MAINTENANCE);
    this.setComplaints(INITIAL_COMPLAINTS);
    this.setComplaintHistory(INITIAL_COMPLAINT_HISTORY);
    this.setAnnouncements(INITIAL_ANNOUNCEMENTS);
    this.setAuditLogs(INITIAL_AUDIT_LOGS);
    this.setBackupLogs(INITIAL_BACKUP_LOGS);

    localStorage.setItem(STORAGE_PREFIX + 'INITIALIZED', 'true');
  }

  // Getters & Setters
  public static getRoles(): RoleDefinition[] {
    return this.getItem<RoleDefinition[]>('ROLES', INITIAL_ROLES);
  }
  public static setRoles(roles: RoleDefinition[]): void {
    this.setItem('ROLES', roles);
  }
  public static getRoleById(roleId: string): RoleDefinition | undefined {
    return this.getRoles().find((r) => r.id === roleId);
  }
  public static hasPermission(roleId: string, moduleId: string): boolean {
    if (roleId === 'ADMIN') return true; // Super admin always has access
    const role = this.getRoleById(roleId);
    if (!role) return false;
    return role.permissions.includes(moduleId);
  }

  public static getSettings(): AppSettings {
    return this.getItem<AppSettings>('SETTINGS', DEFAULT_SETTINGS);
  }
  public static setSettings(settings: AppSettings): void {
    this.setItem('SETTINGS', settings);
  }

  public static getTariffs(): TariffTier[] {
    return this.getItem<TariffTier[]>('TARIFFS', INITIAL_TARIFFS);
  }
  public static setTariffs(tariffs: TariffTier[]): void {
    this.setItem('TARIFFS', tariffs);
  }

  public static getUsers(): User[] {
    return this.getItem<User[]>('USERS', INITIAL_USERS);
  }
  public static setUsers(users: User[]): void {
    this.setItem('USERS', users);
  }

  public static getActiveSession(): User | null {
    return this.getItem<User | null>('ACTIVE_SESSION', INITIAL_USERS[0]);
  }
  public static setActiveSession(user: User | null): void {
    this.setItem('ACTIVE_SESSION', user);
  }

  public static getCustomers(): Customer[] {
    return this.getItem<Customer[]>('CUSTOMERS', INITIAL_CUSTOMERS);
  }
  public static setCustomers(customers: Customer[]): void {
    this.setItem('CUSTOMERS', customers);
  }

  public static getConnections(): Connection[] {
    return this.getItem<Connection[]>('CONNECTIONS', INITIAL_CONNECTIONS);
  }
  public static setConnections(connections: Connection[]): void {
    this.setItem('CONNECTIONS', connections);
  }

  public static getReadings(): MeterReading[] {
    return this.getItem<MeterReading[]>('METER_READINGS', INITIAL_READINGS);
  }
  public static setReadings(readings: MeterReading[]): void {
    this.setItem('METER_READINGS', readings);
  }

  public static getBills(): Bill[] {
    return this.getItem<Bill[]>('BILLS', INITIAL_BILLS);
  }
  public static setBills(bills: Bill[]): void {
    this.setItem('BILLS', bills);
  }

  public static getPayments(): Payment[] {
    return this.getItem<Payment[]>('PAYMENTS', INITIAL_PAYMENTS);
  }
  public static setPayments(payments: Payment[]): void {
    this.setItem('PAYMENTS', payments);
  }

  public static getReceipts(): Receipt[] {
    return this.getItem<Receipt[]>('RECEIPTS', INITIAL_RECEIPTS);
  }
  public static setReceipts(receipts: Receipt[]): void {
    this.setItem('RECEIPTS', receipts);
  }

  public static getCashIn(): CashIn[] {
    return this.getItem<CashIn[]>('CASH_IN', INITIAL_CASH_IN);
  }
  public static setCashIn(cashIn: CashIn[]): void {
    this.setItem('CASH_IN', cashIn);
  }

  public static getCashOut(): CashOut[] {
    return this.getItem<CashOut[]>('CASH_OUT', INITIAL_CASH_OUT);
  }
  public static setCashOut(cashOut: CashOut[]): void {
    this.setItem('CASH_OUT', cashOut);
  }

  public static getBankLedger(): BankLedger[] {
    return this.getItem<BankLedger[]>('BANK_LEDGER', INITIAL_BANK_LEDGER);
  }
  public static setBankLedger(ledger: BankLedger[]): void {
    this.setItem('BANK_LEDGER', ledger);
  }

  public static getAssets(): Asset[] {
    return this.getItem<Asset[]>('ASSETS', INITIAL_ASSETS);
  }
  public static setAssets(assets: Asset[]): void {
    this.setItem('ASSETS', assets);
  }

  public static getMaintenance(): Maintenance[] {
    return this.getItem<Maintenance[]>('MAINTENANCE', INITIAL_MAINTENANCE);
  }
  public static setMaintenance(maintenance: Maintenance[]): void {
    this.setItem('MAINTENANCE', maintenance);
  }

  public static getComplaints(): Complaint[] {
    return this.getItem<Complaint[]>('COMPLAINTS', INITIAL_COMPLAINTS);
  }
  public static setComplaints(complaints: Complaint[]): void {
    this.setItem('COMPLAINTS', complaints);
  }

  public static getComplaintHistory(): ComplaintHistory[] {
    return this.getItem<ComplaintHistory[]>('COMPLAINT_HISTORY', INITIAL_COMPLAINT_HISTORY);
  }
  public static setComplaintHistory(history: ComplaintHistory[]): void {
    this.setItem('COMPLAINT_HISTORY', history);
  }

  public static getAnnouncements(): Announcement[] {
    return this.getItem<Announcement[]>('ANNOUNCEMENTS', INITIAL_ANNOUNCEMENTS);
  }
  public static setAnnouncements(announcements: Announcement[]): void {
    this.setItem('ANNOUNCEMENTS', announcements);
  }

  public static getAuditLogs(): AuditLogEntry[] {
    return this.getItem<AuditLogEntry[]>('AUDIT_LOG', INITIAL_AUDIT_LOGS);
  }
  public static setAuditLogs(logs: AuditLogEntry[]): void {
    this.setItem('AUDIT_LOG', logs);
  }

  public static getBackupLogs(): BackupLogEntry[] {
    return this.getItem<BackupLogEntry[]>('BACKUP_LOG', INITIAL_BACKUP_LOGS);
  }
  public static setBackupLogs(logs: BackupLogEntry[]): void {
    this.setItem('BACKUP_LOG', logs);
  }

  // Export full snapshot for backup or Google Sheets sync
  public static exportFullDatabase(): Record<string, unknown> {
    return {
      SETTINGS: this.getSettings(),
      TARIFFS: this.getTariffs(),
      ROLES: this.getRoles(),
      USERS: this.getUsers(),
      CUSTOMERS: this.getCustomers(),
      CONNECTIONS: this.getConnections(),
      METER_READINGS: this.getReadings(),
      BILLS: this.getBills(),
      PAYMENTS: this.getPayments(),
      RECEIPTS: this.getReceipts(),
      CASH_IN: this.getCashIn(),
      CASH_OUT: this.getCashOut(),
      BANK_LEDGER: this.getBankLedger(),
      ASSETS: this.getAssets(),
      MAINTENANCE: this.getMaintenance(),
      COMPLAINTS: this.getComplaints(),
      COMPLAINT_HISTORY: this.getComplaintHistory(),
      ANNOUNCEMENTS: this.getAnnouncements(),
      AUDIT_LOG: this.getAuditLogs(),
      BACKUP_LOG: this.getBackupLogs(),
      timestamp: new Date().toISOString(),
    };
  }
}
