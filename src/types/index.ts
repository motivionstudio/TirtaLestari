// SIM-TIRTA LESTARI Type Definitions
// Kalurahan Ngawu, Kapanewon Playen, Kabupaten Gunungkidul

export type UserRole = string;

export interface RoleDefinition {
  id: string;
  name: string;
  description: string;
  badge_color: string;
  is_system?: boolean;
  permissions: string[]; // array of accessible module IDs
}

export interface User {
  user_id: string;
  email: string;
  name: string;
  role: string;
  status: 'ACTIVE' | 'INACTIVE';
  phone?: string;
  password?: string;
  created_at: string;
}

export interface Customer {
  customer_id: string; // e.g. TL-0001
  connection_id: string; // e.g. CON-0001
  customer_name: string;
  phone: string;
  address: string;
  dusun: string; // e.g. Ngawu, Melikan, etc.
  rt: string;
  rw: string;
  meter_number: string;
  join_date: string;
  status: 'ACTIVE' | 'INACTIVE' | 'TEMP_SUSPENDED';
  notes?: string;
  created_at: string;
  created_by: string;
  updated_at: string;
  updated_by: string;
}

export interface Connection {
  connection_id: string;
  customer_id: string;
  connection_fee: number; // default 600000
  paid_amount: number;
  remaining_amount: number;
  installment_number: number; // max 2
  due_date: string;
  status: 'BELUM LUNAS' | 'SEBAGIAN' | 'LUNAS';
  created_at: string;
  updated_at: string;
}

export interface MeterReading {
  reading_id: string;
  period: string; // YYYY-MM
  customer_id: string;
  previous_reading: number;
  current_reading: number;
  usage_m3: number;
  reading_date: string;
  officer: string;
  notes?: string;
  created_at: string;
}

export interface TariffTier {
  tariff_id: string;
  name: string;
  minimum_usage: number; // e.g. 1
  maximum_usage: number; // e.g. 10 (or -1 for unlimited)
  rate_per_m3: number; // e.g. 2500
  effective_from: string; // YYYY-MM-DD
  effective_until?: string; // YYYY-MM-DD
  status: 'ACTIVE' | 'INACTIVE';
  notes?: string;
}

export interface Bill {
  bill_id: string;
  bill_number: string; // INV-TL-YYYY-MM-XXXX
  customer_id: string;
  period: string; // YYYY-MM
  previous_meter: number;
  current_meter: number;
  usage_m3: number;
  water_charge: number;
  fixed_fee: number; // e.g. 10000
  arrears: number; // previous unpaid total
  late_fee: number; // denda keterlambatan (Rp 5.000/month overdue)
  other_charge: number;
  discount: number;
  total_bill: number;
  status: 'DRAFT' | 'UNPAID' | 'PARTIAL' | 'PAID' | 'OVERDUE' | 'CANCELLED';
  created_at: string;
  due_date: string;
  paid_at?: string;
}

export interface Payment {
  payment_id: string;
  payment_number: string; // PAY-TL-YYYYMM-XXXX
  receipt_number: string; // KWT-TL-YYYYMM-XXXX
  bill_id: string;
  customer_id: string;
  period: string;
  amount_paid: number;
  payment_method: 'Tunai' | 'Transfer Bank' | 'Lainnya';
  payment_date: string;
  officer: string;
  status: 'SUCCESS' | 'CANCELLED';
  cancelled_at?: string;
  cancelled_by?: string;
  cancel_reason?: string;
  notes?: string;
  verification_code: string;
  created_at: string;
}

export interface Receipt {
  receipt_id: string;
  receipt_number: string; // KWT-TL-YYYYMM-XXXX
  payment_id: string;
  bill_id: string;
  customer_id: string;
  period: string;
  previous_meter: number;
  current_meter: number;
  usage_m3: number;
  water_charge: number;
  fixed_fee: number;
  arrears: number;
  late_fee: number;
  other_charge: number;
  discount: number;
  total_amount: number;
  payment_method: string;
  payment_date: string;
  officer: string;
  verification_code: string;
  file_url?: string;
  file_id?: string;
  created_at: string;
}

export interface Arrear {
  arrear_id: string;
  customer_id: string;
  customer_name: string;
  phone: string;
  unpaid_periods: string[]; // ['2026-08', '2026-09']
  month_count: number;
  principal_amount: number;
  late_fee: number;
  total_arrears: number;
  last_follow_up?: string;
  follow_up_count: number;
  notes?: string;
}

export interface CashIn {
  transaction_id: string;
  date: string;
  category: 'REKENING AIR' | 'DENDA' | 'SAMBUNGAN BARU' | 'LAINNYA';
  reference_number: string; // Receipt or payment number
  customer_id?: string;
  description: string;
  amount: number;
  payment_method: 'Tunai' | 'Transfer' | 'Lainnya';
  created_by: string;
  created_at: string;
}

export interface CashOut {
  transaction_id: string;
  date: string;
  category: 'LISTRIK' | 'PERAWATAN' | 'PIPA' | 'POMPA' | 'HONOR' | 'ADMINISTRASI' | 'OPERASIONAL' | 'LAINNYA';
  description: string;
  amount: number;
  recipient: string;
  proof_number: string;
  proof_file_name?: string;
  requested_by: string;
  approved_by: string;
  created_by: string;
  created_at: string;
}

export interface BankLedger {
  entry_id: string;
  date: string;
  type: 'DEBIT' | 'CREDIT';
  reference: string;
  description: string;
  debit: number;
  credit: number;
  balance: number;
  created_at: string;
}

export interface Asset {
  asset_id: string;
  asset_code: string;
  asset_name: string;
  category: 'Pompa' | 'Tandon' | 'Meter Induk' | 'Pipa Utama' | 'Peralatan Teknis' | 'Lainnya';
  purchase_date: string;
  purchase_value: number;
  location: string;
  condition: 'BAIK' | 'RUSAK RINGAN' | 'RUSAK BERAT';
  status: 'AKTIF' | 'PERBAIKAN' | 'AFKIR';
  notes?: string;
}

export interface Maintenance {
  maintenance_id: string;
  date: string;
  asset_or_network: string;
  location: string;
  issue: string;
  action: string;
  cost: number;
  technician: string;
  status: 'DILAPORKAN' | 'DIJADWALKAN' | 'DIPROSES' | 'SELESAI';
  notes?: string;
}

export interface Complaint {
  complaint_id: string; // PGD-TL-YYYYMM-XXXX
  ticket_number: string; // same as complaint_id
  customer_name: string;
  customer_id?: string;
  phone: string;
  category: 'AIR TIDAK MENGALIR' | 'KEBOCORAN' | 'METER AIR' | 'TAGIHAN' | 'SAMBUNGAN RUMAH' | 'KUALITAS AIR' | 'LAINNYA';
  address_location: string;
  description: string;
  photo_note?: string;
  status: 'DITERIMA' | 'TERVERIFIKASI' | 'DIJADWALKAN' | 'DALAM PENANGANAN' | 'SELESAI' | 'DITUTUP' | 'TIDAK DAPAT DIPROSES';
  assigned_officer?: string;
  public_note?: string;
  created_at: string;
  updated_at: string;
}

export interface ComplaintHistory {
  history_id: string;
  complaint_id: string;
  old_status: string;
  new_status: string;
  note: string;
  officer: string;
  created_at: string;
  created_by: string;
}

export interface Announcement {
  announcement_id: string;
  title: string;
  content: string;
  category: 'GANGGUAN' | 'PEMELIHARAAN' | 'PENGUMUMAN' | 'RAPAT' | 'UMUM';
  start_date: string;
  end_date: string;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  affected_area?: string;
  is_urgent_banner?: boolean;
  created_by: string;
  created_at: string;
}

export interface PublicTransparencyReport {
  period: string; // YYYY-MM
  opening_balance: number;
  income: number;
  expense: number;
  closing_balance: number;
  customer_count: number;
  paid_count: number;
  unpaid_count: number;
  complaint_count: number;
  resolved_complaint_count: number;
  last_updated: string;
  maintenance_highlights: string[];
}

export interface AuditLogEntry {
  log_id: string;
  timestamp: string;
  user: string;
  role: string;
  action: 'LOGIN' | 'CREATE CUSTOMER' | 'UPDATE CUSTOMER' | 'DEACTIVATE CUSTOMER' | 'METER INPUT' | 'GENERATE BILL' | 'PAYMENT' | 'CANCEL PAYMENT' | 'CREATE EXPENSE' | 'UPDATE COMPLAINT' | 'CHANGE TARIFF' | 'CHANGE SETTINGS' | 'BACKUP' | 'SYSTEM SETUP';
  module: string;
  record_id: string;
  old_value_summary?: string;
  new_value_summary?: string;
}

export interface BackupLogEntry {
  backup_id: string;
  backup_name: string;
  file_url: string;
  timestamp: string;
  size_kb: number;
  status: 'SUCCESS' | 'FAILED';
  records_count: number;
  initiated_by: string;
}

export interface AppSettings {
  ORG_NAME: string;
  ORG_TAGLINE: string;
  ORG_VILLAGE: string; // Kalurahan Ngawu
  ORG_DISTRICT: string; // Kapanewon Playen
  ORG_REGENCY: string; // Kabupaten Gunungkidul
  ORG_ADDRESS: string;
  ORG_PHONE: string;
  ORG_EMAIL: string;
  ORG_LOGO_URL: string;
  ORG_HOURS: string;

  MONTHLY_FIXED_FEE: number; // 10000
  PAYMENT_DUE_DAY: number; // 28
  LATE_FEE_PER_MONTH: number; // 5000

  CONNECTION_FEE: number; // 600000
  CONNECTION_INSTALLMENTS: number; // 2
  CONNECTION_PAYMENT_MAX_MONTHS: number; // 3

  FIRST_MONTH_FREE_ENABLED: boolean; // true
  FIRST_MONTH_FREE_LIMIT: number; // 10

  CUSTOMER_PREFIX: string; // TL-
  BILL_PREFIX: string; // INV-TL-
  PAYMENT_PREFIX: string; // PAY-TL-
  RECEIPT_PREFIX: string; // KWT-TL-
  COMPLAINT_PREFIX: string; // PGD-TL-

  PUBLIC_TRANSPARENCY_ENABLED: boolean;
  MAINTENANCE_MODE: boolean;

  WA_TEMPLATE_REMINDER: string;
  WA_TEMPLATE_ARREARS: string;
  WA_TEMPLATE_PAYMENT: string;
  WA_TEMPLATE_COMPLAINT: string;

  BACKUP_RETENTION: number; // 30
  APP_VERSION: string; // v1.0.0
}
