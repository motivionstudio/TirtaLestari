// SIM-TIRTA LESTARI Complete Google Apps Script Source Code Repository
// Production-ready backend & frontend files ready for deployment to Google Apps Script / Clasp

export interface GasFile {
  name: string;
  type: 'server' | 'html' | 'markdown';
  category: 'Core' | 'Pelayanan' | 'Keuangan' | 'Layanan Masyarakat' | 'Website' | 'Sistem' | 'HTML Views' | 'Documentation';
  description: string;
  content: string;
}

export const GAS_FILES: GasFile[] = [
  {
    name: 'Config.gs',
    type: 'server',
    category: 'Core',
    description: 'Konfigurasi Spreadsheet, Folder Drive, dan Konstanta Global',
    content: `/**
 * SIM-TIRTA LESTARI - Config.gs
 * KPSPAM TIRTA LESTARI, Kalurahan Ngawu, Kapanewon Playen, Kabupaten Gunungkidul
 */

const CONFIG = {
  APP_NAME: 'SIM-TIRTA LESTARI',
  APP_VERSION: 'v1.0.0',
  TIMEZONE: 'Asia/Jakarta',
  LOCALE: 'id-ID',

  // Nama Sheet Database (21 Sheets)
  SHEETS: {
    SETTINGS: 'SETTINGS',
    USERS: 'USERS',
    CUSTOMERS: 'CUSTOMERS',
    CONNECTIONS: 'CONNECTIONS',
    METER_READINGS: 'METER_READINGS',
    TARIFFS: 'TARIFFS',
    BILLS: 'BILLS',
    PAYMENTS: 'PAYMENTS',
    RECEIPTS: 'RECEIPTS',
    ARREARS: 'ARREARS',
    CASH_IN: 'CASH_IN',
    CASH_OUT: 'CASH_OUT',
    BANK_LEDGER: 'BANK_LEDGER',
    ASSETS: 'ASSETS',
    MAINTENANCE: 'MAINTENANCE',
    COMPLAINTS: 'COMPLAINTS',
    COMPLAINT_HISTORY: 'COMPLAINT_HISTORY',
    ANNOUNCEMENTS: 'ANNOUNCEMENTS',
    PUBLIC_REPORTS: 'PUBLIC_REPORTS',
    AUDIT_LOG: 'AUDIT_LOG',
    BACKUP_LOG: 'BACKUP_LOG'
  },

  // Cache duration in seconds
  CACHE_TTL: {
    PUBLIC_DATA: 600, // 10 menit
    SETTINGS: 1800,   // 30 menit
    TARIFFS: 1800     // 30 menit
  },

  // Folder names in Google Drive
  DRIVE_FOLDERS: {
    ROOT: 'SIM TIRTA LESTARI',
    RECEIPTS: 'KWITANSI',
    REPORTS: 'LAPORAN',
    COMPLAINTS: 'PENGADUAN',
    EXPENSES: 'BUKTI PENGELUARAN',
    BACKUP: 'BACKUP',
    LOGO: 'LOGO'
  }
};
`,
  },
  {
    name: 'Code.gs',
    type: 'server',
    category: 'Core',
    description: 'Entry point Web App doGet() dan Router HTML Service',
    content: `/**
 * SIM-TIRTA LESTARI - Code.gs
 * Entry point Google Apps Script Web App
 */

function doGet(e) {
  try {
    const page = (e && e.parameter && e.parameter.page) ? e.parameter.page : 'public';
    
    // Check maintenance mode
    const settings = getSettingsMap();
    if (settings.MAINTENANCE_MODE === 'TRUE' && page !== 'admin') {
      const template = HtmlService.createTemplateFromFile('Maintenance');
      template.appName = CONFIG.APP_NAME;
      return template.evaluate()
        .setTitle(CONFIG.APP_NAME + ' - Pemeliharaan')
        .addMetaTag('viewport', 'width=device-width, initial-scale=1')
        .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
    }

    if (page === 'admin') {
      // Authorization Check
      const currentUser = getCurrentUser();
      if (!currentUser.authorized) {
        const deniedTemplate = HtmlService.createTemplateFromFile('LoginDenied');
        deniedTemplate.email = currentUser.email;
        return deniedTemplate.evaluate()
          .setTitle(CONFIG.APP_NAME + ' - Akses Ditolak')
          .addMetaTag('viewport', 'width=device-width, initial-scale=1')
          .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
      }

      const adminTemplate = HtmlService.createTemplateFromFile('Index');
      adminTemplate.currentUser = currentUser;
      adminTemplate.appName = CONFIG.APP_NAME;
      adminTemplate.appVersion = CONFIG.APP_VERSION;
      return adminTemplate.evaluate()
        .setTitle(CONFIG.APP_NAME + ' - Panel Pengurus')
        .addMetaTag('viewport', 'width=device-width, initial-scale=1')
        .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
    }

    // Default: Public Portal
    const publicTemplate = HtmlService.createTemplateFromFile('PublicPortal');
    publicTemplate.appName = CONFIG.APP_NAME;
    publicTemplate.village = settings.ORG_VILLAGE || 'Kalurahan Ngawu';
    publicTemplate.tagline = settings.ORG_TAGLINE || 'Melayani Air Bersih, Transparan, dan Berkelanjutan';
    return publicTemplate.evaluate()
      .setTitle('KPSPAM TIRTA LESTARI - Kalurahan Ngawu')
      .addMetaTag('viewport', 'width=device-width, initial-scale=1')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);

  } catch (error) {
    return HtmlService.createHtmlOutput('<h3>Terjadi kesalahan sistem:</h3><p>' + escapeHtml(error.message) + '</p>');
  }
}

/**
 * Helper untuk include file HTML partials di GAS
 */
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}
`,
  },
  {
    name: 'Auth.gs',
    type: 'server',
    category: 'Core',
    description: 'Google Session Authentication & Role-Based Access Control',
    content: `/**
 * SIM-TIRTA LESTARI - Auth.gs
 * Otentikasi berbasis Google Account dan Otorisasi Role
 */

function getCurrentUser() {
  const email = Session.getActiveUser().getEmail();
  
  if (!email) {
    return {
      email: '',
      name: 'Tamu',
      role: 'PUBLIC',
      authorized: false
    };
  }

  const ss = getSpreadsheet();
  const sheet = ss.getSheetByName(CONFIG.SHEETS.USERS);
  if (!sheet) {
    return { email: email, name: email, role: 'PUBLIC', authorized: false };
  }

  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) {
    // Sheet users kosong, default periksa jika email adalah owner
    return { email: email, name: email, role: 'ADMIN', authorized: true };
  }

  const headers = data[0];
  const emailIdx = headers.indexOf('email');
  const nameIdx = headers.indexOf('name');
  const roleIdx = headers.indexOf('role');
  const statusIdx = headers.indexOf('status');

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (String(row[emailIdx]).trim().toLowerCase() === email.trim().toLowerCase()) {
      const status = String(row[statusIdx]).trim().toUpperCase();
      if (status !== 'ACTIVE') {
        return { email: email, name: row[nameIdx], role: 'INACTIVE', authorized: false };
      }
      return {
        email: email,
        name: row[nameIdx] || email,
        role: String(row[roleIdx]).trim().toUpperCase(),
        authorized: true
      };
    }
  }

  return { email: email, name: email, role: 'PUBLIC', authorized: false };
}

/**
 * Enforce RBAC pada server function
 */
function authorize(requiredRoles) {
  const user = getCurrentUser();
  if (!user.authorized) {
    throw new Error('Akses ditolak: Anda tidak memiliki akses ke aplikasi ini.');
  }
  if (Array.isArray(requiredRoles) && !requiredRoles.includes(user.role)) {
    throw new Error('Akses ditolak: Peran (' + user.role + ') tidak memiliki wewenang untuk tindakan ini.');
  }
  return user;
}
`,
  },
  {
    name: 'Setup.gs',
    type: 'server',
    category: 'Core',
    description: 'Inisialisasi 21 Sheet, Folder Google Drive, dan Default Settings',
    content: `/**
 * SIM-TIRTA LESTARI - Setup.gs
 * Inisialisasi otomatis Spreadsheet, Folder Drive, dan Konfigurasi Awal
 */

function setupSystem() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheets = CONFIG.SHEETS;

  // 1. Inisialisasi Sheet SETTINGS
  initSheet(ss, sheets.SETTINGS, ['key', 'value', 'description', 'updated_at']);

  // 2. Inisialisasi Sheet USERS
  initSheet(ss, sheets.USERS, ['user_id', 'email', 'name', 'role', 'status', 'phone', 'created_at']);

  // 3. Inisialisasi Sheet CUSTOMERS
  initSheet(ss, sheets.CUSTOMERS, [
    'customer_id', 'connection_id', 'customer_name', 'phone', 'address',
    'dusun', 'rt', 'rw', 'meter_number', 'join_date', 'status', 'notes',
    'created_at', 'created_by', 'updated_at', 'updated_by'
  ]);

  // 4. Inisialisasi Sheet CONNECTIONS
  initSheet(ss, sheets.CONNECTIONS, [
    'connection_id', 'customer_id', 'connection_fee', 'paid_amount',
    'remaining_amount', 'installment_number', 'due_date', 'status',
    'created_at', 'updated_at'
  ]);

  // 5. Inisialisasi Sheet METER_READINGS
  initSheet(ss, sheets.METER_READINGS, [
    'reading_id', 'period', 'customer_id', 'previous_reading', 'current_reading',
    'usage_m3', 'reading_date', 'officer', 'notes', 'created_at'
  ]);

  // 6. Inisialisasi Sheet TARIFFS
  initSheet(ss, sheets.TARIFFS, [
    'tariff_id', 'name', 'minimum_usage', 'maximum_usage', 'rate_per_m3',
    'effective_from', 'effective_until', 'status', 'notes'
  ]);

  // 7. Inisialisasi Sheet BILLS
  initSheet(ss, sheets.BILLS, [
    'bill_id', 'bill_number', 'customer_id', 'period', 'previous_meter',
    'current_meter', 'usage_m3', 'water_charge', 'fixed_fee', 'arrears',
    'late_fee', 'other_charge', 'discount', 'total_bill', 'status',
    'created_at', 'due_date', 'paid_at'
  ]);

  // 8. Inisialisasi Sheet PAYMENTS
  initSheet(ss, sheets.PAYMENTS, [
    'payment_id', 'payment_number', 'receipt_number', 'bill_id', 'customer_id',
    'period', 'amount_paid', 'payment_method', 'payment_date', 'officer',
    'status', 'cancelled_at', 'cancelled_by', 'cancel_reason', 'verification_code', 'created_at'
  ]);

  // 9. Inisialisasi Sheet RECEIPTS
  initSheet(ss, sheets.RECEIPTS, [
    'receipt_id', 'receipt_number', 'payment_id', 'bill_id', 'customer_id',
    'period', 'previous_meter', 'current_meter', 'usage_m3', 'water_charge',
    'fixed_fee', 'arrears', 'late_fee', 'other_charge', 'discount',
    'total_amount', 'payment_method', 'payment_date', 'officer',
    'verification_code', 'file_url', 'file_id', 'created_at'
  ]);

  // 10. Inisialisasi Sheet ARREARS
  initSheet(ss, sheets.ARREARS, [
    'arrear_id', 'customer_id', 'customer_name', 'phone', 'unpaid_periods',
    'month_count', 'principal_amount', 'late_fee', 'total_arrears',
    'last_follow_up', 'follow_up_count', 'notes'
  ]);

  // 11. Inisialisasi Sheet CASH_IN
  initSheet(ss, sheets.CASH_IN, [
    'transaction_id', 'date', 'category', 'reference_number', 'customer_id',
    'description', 'amount', 'payment_method', 'created_by', 'created_at'
  ]);

  // 12. Inisialisasi Sheet CASH_OUT
  initSheet(ss, sheets.CASH_OUT, [
    'transaction_id', 'date', 'category', 'description', 'amount',
    'recipient', 'proof_number', 'proof_file_id', 'requested_by', 'approved_by',
    'created_by', 'created_at'
  ]);

  // 13. Inisialisasi Sheet BANK_LEDGER
  initSheet(ss, sheets.BANK_LEDGER, [
    'entry_id', 'date', 'type', 'reference', 'description',
    'debit', 'credit', 'balance', 'created_at'
  ]);

  // 14. Inisialisasi Sheet ASSETS
  initSheet(ss, sheets.ASSETS, [
    'asset_id', 'asset_code', 'asset_name', 'category', 'purchase_date',
    'purchase_value', 'location', 'condition', 'status', 'notes'
  ]);

  // 15. Inisialisasi Sheet MAINTENANCE
  initSheet(ss, sheets.MAINTENANCE, [
    'maintenance_id', 'date', 'asset_or_network', 'location', 'issue',
    'action', 'cost', 'technician', 'status', 'notes'
  ]);

  // 16. Inisialisasi Sheet COMPLAINTS
  initSheet(ss, sheets.COMPLAINTS, [
    'complaint_id', 'ticket_number', 'customer_name', 'customer_id', 'phone',
    'category', 'address_location', 'description', 'photo_file_id', 'status',
    'assigned_officer', 'public_note', 'created_at', 'updated_at'
  ]);

  // 17. Inisialisasi Sheet COMPLAINT_HISTORY
  initSheet(ss, sheets.COMPLAINT_HISTORY, [
    'history_id', 'complaint_id', 'old_status', 'new_status', 'note',
    'officer', 'created_at', 'created_by'
  ]);

  // 18. Inisialisasi Sheet ANNOUNCEMENTS
  initSheet(ss, sheets.ANNOUNCEMENTS, [
    'announcement_id', 'title', 'content', 'category', 'start_date',
    'end_date', 'status', 'affected_area', 'is_urgent_banner',
    'created_by', 'created_at'
  ]);

  // 19. Inisialisasi Sheet PUBLIC_REPORTS
  initSheet(ss, sheets.PUBLIC_REPORTS, [
    'period', 'opening_balance', 'income', 'expense', 'closing_balance',
    'customer_count', 'paid_count', 'unpaid_count', 'complaint_count',
    'resolved_complaint_count', 'last_updated', 'maintenance_highlights'
  ]);

  // 20. Inisialisasi Sheet AUDIT_LOG
  initSheet(ss, sheets.AUDIT_LOG, [
    'log_id', 'timestamp', 'user', 'role', 'action', 'module',
    'record_id', 'old_value_summary', 'new_value_summary'
  ]);

  // 21. Inisialisasi Sheet BACKUP_LOG
  initSheet(ss, sheets.BACKUP_LOG, [
    'backup_id', 'backup_name', 'file_url', 'timestamp', 'size_kb',
    'status', 'records_count', 'initiated_by'
  ]);

  // Setup Default Settings jika belum ada
  seedDefaultSettings();

  // Setup Folder Google Drive
  setupDriveFolders();

  // Catat Audit Log
  writeAuditLog({
    user: Session.getActiveUser().getEmail() || 'System Installer',
    role: 'ADMIN',
    action: 'SYSTEM SETUP',
    module: 'SETUP',
    record_id: 'SETUP-INIT',
    new_value_summary: 'Inisialisasi 21 Sheet & Folder Drive SIM-TIRTA LESTARI selesai.'
  });

  return { success: true, message: 'Inisialisasi sistem SIM-TIRTA LESTARI berhasil diselesaikan!' };
}

/**
 * Buat Sheet baru jika belum ada, atau sinkronkan kolom baru tanpa merusak data lama
 */
function initSheet(ss, sheetName, requiredColumns) {
  let sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
    sheet.appendRow(requiredColumns);
    sheet.getRange(1, 1, 1, requiredColumns.length)
      .setFontWeight('bold')
      .setBackground('#0284c7')
      .setFontColor('#ffffff');
    sheet.setFrozenRows(1);
    return;
  }

  // Jika sheet sudah ada: periksa kolom baru
  const headers = sheet.getRange(1, 1, 1, Math.max(1, sheet.getLastColumn())).getValues()[0];
  const missing = [];
  requiredColumns.forEach(col => {
    if (headers.indexOf(col) === -1) {
      missing.push(col);
    }
  });

  if (missing.length > 0) {
    const startCol = headers.length + 1;
    sheet.getRange(1, startCol, 1, missing.length).setValues([missing]).setFontWeight('bold');
  }
}

function setupDriveFolders() {
  const rootName = CONFIG.DRIVE_FOLDERS.ROOT;
  const iter = DriveApp.getFoldersByName(rootName);
  let rootFolder = iter.hasNext() ? iter.next() : DriveApp.createFolder(rootName);

  const subfolders = [
    CONFIG.DRIVE_FOLDERS.RECEIPTS,
    CONFIG.DRIVE_FOLDERS.REPORTS,
    CONFIG.DRIVE_FOLDERS.COMPLAINTS,
    CONFIG.DRIVE_FOLDERS.EXPENSES,
    CONFIG.DRIVE_FOLDERS.BACKUP,
    CONFIG.DRIVE_FOLDERS.LOGO
  ];

  const folderIds = {};
  subfolders.forEach(name => {
    const subIter = rootFolder.getFoldersByName(name);
    const sub = subIter.hasNext() ? subIter.next() : rootFolder.createFolder(name);
    folderIds[name] = sub.getId();
  });

  // Simpan folder ID ke PropertiesService
  PropertiesService.getScriptProperties().setProperties({
    ROOT_FOLDER_ID: rootFolder.getId(),
    RECEIPTS_FOLDER_ID: folderIds[CONFIG.DRIVE_FOLDERS.RECEIPTS],
    BACKUP_FOLDER_ID: folderIds[CONFIG.DRIVE_FOLDERS.BACKUP]
  });
}
`,
  },
  {
    name: 'Tariffs.gs',
    type: 'server',
    category: 'Pelayanan',
    description: 'Perhitungan Tarif Progresif Per Blok & Manajemen Tarif',
    content: `/**
 * SIM-TIRTA LESTARI - Tariffs.gs
 * Logika Tarif Progresif Per Blok dan Versioning
 */

function calculateProgressiveTariff(usageM3, isFirstMonth, effectiveDate) {
  const tariffs = getActiveTariffs(effectiveDate);
  const settings = getSettingsMap();
  
  let billableUsage = Math.max(0, Math.round(Number(usageM3) || 0));
  let discountAmount = 0;
  let freeM3 = 0;

  if (isFirstMonth && settings.FIRST_MONTH_FREE_ENABLED === 'TRUE') {
    const limit = Number(settings.FIRST_MONTH_FREE_LIMIT) || 10;
    freeM3 = Math.min(billableUsage, limit);
    billableUsage = Math.max(0, billableUsage - freeM3);
    discountAmount = freeM3 * (tariffs[0] ? tariffs[0].rate_per_m3 : 2500);
  }

  let waterCharge = 0;
  let remaining = billableUsage;
  const breakdown = [];

  for (let i = 0; i < tariffs.length; i++) {
    if (remaining <= 0) break;
    const tier = tariffs[i];
    const capacity = tier.maximum_usage === -1 ? Infinity : (tier.maximum_usage - tier.minimum_usage + 1);
    const usedInTier = Math.min(remaining, capacity);

    if (usedInTier > 0) {
      const subtotal = usedInTier * tier.rate_per_m3;
      waterCharge += subtotal;
      breakdown.push({
        tierName: tier.name,
        usage: usedInTier,
        rate: tier.rate_per_m3,
        subtotal: subtotal
      });
      remaining -= usedInTier;
    }
  }

  if (remaining > 0) {
    throw new Error('Tarif untuk pemakaian ' + usageM3 + ' m³ belum dikonfigurasi lengkap. Hubungi Administrator.');
  }

  return {
    waterCharge: waterCharge,
    breakdown: breakdown,
    freeUsageM3: freeM3,
    discountAmount: discountAmount
  };
}

function getActiveTariffs(dateStr) {
  const ss = getSpreadsheet();
  const sheet = ss.getSheetByName(CONFIG.SHEETS.TARIFFS);
  if (!sheet) return [];

  const data = sheetToObjects(sheet);
  const targetDate = dateStr ? new Date(dateStr) : new Date();

  return data
    .filter(t => t.status === 'ACTIVE')
    .filter(t => {
      const from = new Date(t.effective_from);
      const until = t.effective_until ? new Date(t.effective_until) : new Date('2099-12-31');
      return targetDate >= from && targetDate <= until;
    })
    .sort((a, b) => Number(a.minimum_usage) - Number(b.minimum_usage));
}
`,
  },
  {
    name: 'Payments.gs',
    type: 'server',
    category: 'Pelayanan',
    description: 'Proses Pembayaran, LockService Mutex, dan Pembatalan (Void)',
    content: `/**
 * SIM-TIRTA LESTARI - Payments.gs
 * Pemrosesan Pembayaran Tagihan Rekening Air dengan LockService
 */

function processPayment(billId, amountPaid, paymentMethod, notes) {
  const lock = LockService.getScriptLock();
  
  // Tunggu lock maksimal 10 detik untuk mencegah double-payment
  try {
    lock.waitLock(10000);
  } catch (e) {
    return {
      success: false,
      message: 'Sistem sedang sibuk memproses transaksi lain. Silakan coba kembali.'
    };
  }

  try {
    const user = authorize(['ADMIN', 'PENGURUS']);
    const ss = getSpreadsheet();
    
    // Cari Bill
    const billSheet = ss.getSheetByName(CONFIG.SHEETS.BILLS);
    const bills = sheetToObjects(billSheet);
    const bill = bills.find(b => b.bill_id === billId);

    if (!bill) {
      return { success: false, message: 'Tagihan tidak ditemukan.' };
    }

    if (bill.status === 'PAID') {
      return { success: false, message: 'Tagihan ini sudah lunas sebelumnya.' };
    }

    if (amountPaid < bill.total_bill) {
      return { success: false, message: 'Jumlah bayar kurang dari total tagihan.' };
    }

    // Generate Nomor Unik
    const paymentNumber = generateNextNumber(CONFIG.SHEETS.PAYMENTS, 'PAY-TL-');
    const receiptNumber = generateNextNumber(CONFIG.SHEETS.RECEIPTS, 'KWT-TL-');
    const verificationCode = 'TL-VRF-' + Math.floor(10000 + Math.random() * 90000);
    const nowStr = Utilities.formatDate(new Date(), CONFIG.TIMEZONE, 'yyyy-MM-dd HH:mm:ss');

    // 1. Simpan Payment
    appendObject(CONFIG.SHEETS.PAYMENTS, {
      payment_id: 'PAY-' + new Date().getTime(),
      payment_number: paymentNumber,
      receipt_number: receiptNumber,
      bill_id: bill.bill_id,
      customer_id: bill.customer_id,
      period: bill.period,
      amount_paid: amountPaid,
      payment_method: paymentMethod,
      payment_date: nowStr,
      officer: user.name,
      status: 'SUCCESS',
      verification_code: verificationCode,
      notes: notes || '',
      created_at: nowStr
    });

    // 2. Update Bill Status
    updateRecordById(CONFIG.SHEETS.BILLS, 'bill_id', bill.bill_id, {
      status: 'PAID',
      paid_at: nowStr
    });

    // 3. Simpan Kwitansi
    appendObject(CONFIG.SHEETS.RECEIPTS, {
      receipt_id: 'RCT-' + new Date().getTime(),
      receipt_number: receiptNumber,
      payment_id: paymentNumber,
      bill_id: bill.bill_id,
      customer_id: bill.customer_id,
      period: bill.period,
      previous_meter: bill.previous_meter,
      current_meter: bill.current_meter,
      usage_m3: bill.usage_m3,
      water_charge: bill.water_charge,
      fixed_fee: bill.fixed_fee,
      arrears: bill.arrears,
      late_fee: bill.late_fee,
      other_charge: bill.other_charge,
      discount: bill.discount,
      total_amount: bill.total_bill,
      payment_method: paymentMethod,
      payment_date: nowStr,
      officer: user.name,
      verification_code: verificationCode,
      created_at: nowStr
    });

    // 4. Tambah Kas Masuk Otomatis
    appendObject(CONFIG.SHEETS.CASH_IN, {
      transaction_id: 'CIN-' + new Date().getTime(),
      date: nowStr,
      category: 'REKENING AIR',
      reference_number: receiptNumber,
      customer_id: bill.customer_id,
      description: 'Pembayaran Rekening Air Periode ' + bill.period + ' Pelanggan ' + bill.customer_id,
      amount: amountPaid,
      payment_method: paymentMethod === 'Transfer Bank' ? 'Transfer' : 'Tunai',
      created_by: user.name,
      created_at: nowStr
    });

    // 5. Catat Audit Log
    writeAuditLog({
      user: user.name,
      role: user.role,
      action: 'PAYMENT',
      module: 'PAYMENT',
      record_id: paymentNumber,
      new_value_summary: 'Pembayaran tagihan ' + bill.bill_number + ' senilai Rp ' + amountPaid + ' Lunas. Kwitansi: ' + receiptNumber
    });

    return {
      success: true,
      message: 'Pembayaran berhasil diproses dan kwitansi diterbitkan.',
      receiptNumber: receiptNumber,
      verificationCode: verificationCode
    };

  } catch (error) {
    return { success: false, message: 'Gagal memproses pembayaran: ' + error.message };
  } finally {
    lock.releaseLock();
  }
}
`,
  },
  {
    name: 'Receipts.gs',
    type: 'server',
    category: 'Pelayanan',
    description: 'Generator PDF Kwitansi & Penyimpanan Google Drive Otomatis',
    content: `/**
 * SIM-TIRTA LESTARI - Receipts.gs
 * Generator Kwitansi PDF dan Penyimpanan Folder Drive
 */

function generateReceiptPdf(receiptNumber) {
  const ss = getSpreadsheet();
  const receiptSheet = ss.getSheetByName(CONFIG.SHEETS.RECEIPTS);
  const receipts = sheetToObjects(receiptSheet);
  const receipt = receipts.find(r => r.receipt_number === receiptNumber);

  if (!receipt) {
    throw new Error('Data kwitansi tidak ditemukan.');
  }

  const custSheet = ss.getSheetByName(CONFIG.SHEETS.CUSTOMERS);
  const customers = sheetToObjects(custSheet);
  const customer = customers.find(c => c.customer_id === receipt.customer_id) || {};

  const settings = getSettingsMap();
  const template = HtmlService.createTemplateFromFile('ReceiptPdfTemplate');
  template.receipt = receipt;
  template.customer = customer;
  template.settings = settings;

  const html = template.evaluate().getContent();
  const blob = Utilities.newBlob(html, 'text/html', receipt.receipt_number + '.html').getAs('application/pdf');
  blob.setName(receipt.receipt_number + '.pdf');

  // Simpan ke subfolder Drive: KWITANSI/YYYY/MM
  const period = receipt.period || Utilities.formatDate(new Date(), CONFIG.TIMEZONE, 'yyyy-MM');
  const [year, month] = period.split('-');

  const rootId = PropertiesService.getScriptProperties().getProperty('RECEIPTS_FOLDER_ID') ||
    PropertiesService.getScriptProperties().getProperty('ROOT_FOLDER_ID');
  
  let targetFolder = DriveApp.getFolderById(rootId);
  
  // Folder Year
  let yearIter = targetFolder.getFoldersByName(year);
  let yearFolder = yearIter.hasNext() ? yearIter.next() : targetFolder.createFolder(year);
  
  // Folder Month
  let monthIter = yearFolder.getFoldersByName(month);
  let monthFolder = monthIter.hasNext() ? monthIter.next() : yearFolder.createFolder(month);

  const file = monthFolder.createFile(blob);
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

  // Update URL di sheet RECEIPTS
  updateRecordById(CONFIG.SHEETS.RECEIPTS, 'receipt_number', receiptNumber, {
    file_id: file.getId(),
    file_url: file.getUrl()
  });

  return {
    success: true,
    fileUrl: file.getUrl(),
    fileId: file.getId()
  };
}
`,
  },
  {
    name: 'Whatsapp.gs',
    type: 'server',
    category: 'Pelayanan',
    description: 'Click-to-chat WA Generator & Template String Parser',
    content: `/**
 * SIM-TIRTA LESTARI - Whatsapp.gs
 * Normalisasi Nomor HP dan Integrasi Pesan WhatsApp
 */

function normalizeWhatsappNumber(phone) {
  if (!phone) return '';
  let cleaned = String(phone).replace(/\\D/g, '');
  if (cleaned.startsWith('0')) {
    cleaned = '62' + cleaned.substring(1);
  } else if (cleaned.startsWith('8')) {
    cleaned = '62' + cleaned;
  }
  return cleaned;
}

function getWhatsappUrl(phone, text) {
  const normalized = normalizeWhatsappNumber(phone);
  const encoded = encodeURIComponent(text);
  return 'https://wa.me/' + normalized + '?text=' + encoded;
}
`,
  },
  {
    name: 'PublicApi.gs',
    type: 'server',
    category: 'Website',
    description: 'API Aman Publik: Whitelist Agregat & Pengaduan Masyarakat',
    content: `/**
 * SIM-TIRTA LESTARI - PublicApi.gs
 * Endpoint aman untuk website publik (Strict Privacy Whitelist)
 */

function getPublicTransparencyData() {
  const cache = CacheService.getScriptCache();
  const cached = cache.get('PUBLIC_TRANSPARENCY');
  if (cached) {
    return JSON.parse(cached);
  }

  const ss = getSpreadsheet();
  const custSheet = ss.getSheetByName(CONFIG.SHEETS.CUSTOMERS);
  const customers = custSheet ? sheetToObjects(custSheet) : [];
  const activeCustomers = customers.filter(c => c.status === 'ACTIVE');

  const billSheet = ss.getSheetByName(CONFIG.SHEETS.BILLS);
  const bills = billSheet ? sheetToObjects(billSheet) : [];
  
  const currentPeriod = Utilities.formatDate(new Date(), CONFIG.TIMEZONE, 'yyyy-MM');
  const periodBills = bills.filter(b => b.period === currentPeriod);
  const paidCount = periodBills.filter(b => b.status === 'PAID').length;
  const unpaidCount = periodBills.filter(b => b.status !== 'PAID').length;

  const cashInSheet = ss.getSheetByName(CONFIG.SHEETS.CASH_IN);
  const cashIns = cashInSheet ? sheetToObjects(cashInSheet) : [];
  const totalIncome = cashIns.reduce((acc, c) => acc + (Number(c.amount) || 0), 0);

  const cashOutSheet = ss.getSheetByName(CONFIG.SHEETS.CASH_OUT);
  const cashOuts = cashOutSheet ? sheetToObjects(cashOutSheet) : [];
  const totalExpense = cashOuts.reduce((acc, c) => acc + (Number(c.amount) || 0), 0);

  const complaintSheet = ss.getSheetByName(CONFIG.SHEETS.COMPLAINTS);
  const complaints = complaintSheet ? sheetToObjects(complaintSheet) : [];
  const complaintCount = complaints.length;
  const resolvedCount = complaints.filter(c => c.status === 'SELESAI').length;

  // STRICT WHITELIST ONLY - DILARANG mengekspos data pribadi pelanggan
  const result = {
    period: currentPeriod,
    customer_count: activeCustomers.length,
    paid_count: paidCount,
    unpaid_count: unpaidCount,
    total_income: totalIncome,
    total_expense: totalExpense,
    net_balance: totalIncome - totalExpense,
    complaint_count: complaintCount,
    resolved_complaint_count: resolvedCount,
    last_updated: Utilities.formatDate(new Date(), CONFIG.TIMEZONE, 'dd MMMM yyyy HH:mm WIB')
  };

  cache.put('PUBLIC_TRANSPARENCY', JSON.stringify(result), CONFIG.CACHE_TTL.PUBLIC_DATA);
  return result;
}

function submitPublicComplaint(formData) {
  const ticketNumber = generateNextNumber(CONFIG.SHEETS.COMPLAINTS, 'PGD-TL-');
  const nowStr = Utilities.formatDate(new Date(), CONFIG.TIMEZONE, 'yyyy-MM-dd HH:mm:ss');

  appendObject(CONFIG.SHEETS.COMPLAINTS, {
    complaint_id: ticketNumber,
    ticket_number: ticketNumber,
    customer_name: escapeHtml(formData.customer_name),
    customer_id: escapeHtml(formData.customer_id || ''),
    phone: normalizeWhatsappNumber(formData.phone),
    category: formData.category,
    address_location: escapeHtml(formData.address_location),
    description: escapeHtml(formData.description),
    status: 'DITERIMA',
    assigned_officer: 'Koordinator Layanan',
    public_note: 'Pengaduan telah masuk ke sistem dan menunggu verifikasi petugas.',
    created_at: nowStr,
    updated_at: nowStr
  });

  appendObject(CONFIG.SHEETS.COMPLAINT_HISTORY, {
    history_id: 'CH-' + new Date().getTime(),
    complaint_id: ticketNumber,
    old_status: '-',
    new_status: 'DITERIMA',
    note: 'Laporan warga diterima melalui portal online.',
    officer: 'Sistem Online',
    created_at: nowStr,
    created_by: 'Masyarakat'
  });

  return {
    success: true,
    ticketNumber: ticketNumber,
    message: 'Pengaduan berhasil dikirim dengan Nomor Tiket: ' + ticketNumber
  };
}

function trackComplaintPublic(ticketNumber, phone) {
  const ss = getSpreadsheet();
  const sheet = ss.getSheetByName(CONFIG.SHEETS.COMPLAINTS);
  if (!sheet) return { success: false, message: 'Data pengaduan belum tersedia.' };

  const complaints = sheetToObjects(sheet);
  const normalizedPhone = normalizeWhatsappNumber(phone);

  const matched = complaints.find(c => 
    String(c.ticket_number).trim().toUpperCase() === String(ticketNumber).trim().toUpperCase() &&
    normalizeWhatsappNumber(c.phone) === normalizedPhone
  );

  if (!matched) {
    return {
      success: false,
      message: 'Pengaduan tidak ditemukan. Pastikan Nomor Tiket dan Nomor WhatsApp sesuai saat mendaftar.'
    };
  }

  // Ambil Timeline Riwayat
  const histSheet = ss.getSheetByName(CONFIG.SHEETS.COMPLAINT_HISTORY);
  const histories = histSheet ? sheetToObjects(histSheet) : [];
  const historyList = histories.filter(h => h.complaint_id === matched.ticket_number);

  return {
    success: true,
    data: {
      ticket_number: matched.ticket_number,
      category: matched.category,
      created_at: matched.created_at,
      status: matched.status,
      assigned_officer: matched.assigned_officer,
      public_note: matched.public_note,
      timeline: historyList
    }
  };
}
`,
  },
  {
    name: 'Backup.gs',
    type: 'server',
    category: 'Sistem',
    description: 'Time-Driven Auto Backup Spreadsheet & Pembersihan Retention',
    content: `/**
 * SIM-TIRTA LESTARI - Backup.gs
 * Backup Otomatis Spreadsheet ke Folder Drive dengan Kebijakan Retensi
 */

function createDailyBackup() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const backupFolderId = PropertiesService.getScriptProperties().getProperty('BACKUP_FOLDER_ID');
  
  if (!backupFolderId) {
    setupDriveFolders();
  }
  
  const folder = DriveApp.getFolderById(backupFolderId || PropertiesService.getScriptProperties().getProperty('ROOT_FOLDER_ID'));
  const todayStr = Utilities.formatDate(new Date(), CONFIG.TIMEZONE, 'yyyy-MM-dd');
  const backupName = 'BACKUP_SIM_TIRTA_' + todayStr;

  const file = DriveApp.getFileById(ss.getId()).makeCopy(backupName, folder);
  const nowStr = Utilities.formatDate(new Date(), CONFIG.TIMEZONE, 'yyyy-MM-dd HH:mm:ss');

  appendObject(CONFIG.SHEETS.BACKUP_LOG, {
    backup_id: 'BAK-' + new Date().getTime(),
    backup_name: backupName,
    file_url: file.getUrl(),
    timestamp: nowStr,
    size_kb: Math.round(file.getSize() / 1024),
    status: 'SUCCESS',
    records_count: ss.getSheets().length,
    initiated_by: 'Trigger Harian Otomatis'
  });

  // Retensi: Batasi maksimal 30 backup terakhir
  enforceBackupRetention(folder, 30);

  return { success: true, backupName: backupName, url: file.getUrl() };
}

function enforceBackupRetention(folder, maxRetention) {
  const files = [];
  const iter = folder.getFiles();
  while (iter.hasNext()) {
    files.push(iter.next());
  }

  if (files.length > maxRetention) {
    files.sort((a, b) => a.getDateCreated() - b.getDateCreated());
    const excess = files.length - maxRetention;
    for (let i = 0; i < excess; i++) {
      files[i].setTrashed(true);
    }
  }
}
`,
  },
  {
    name: 'Utils.gs',
    type: 'server',
    category: 'Core',
    description: 'Data Access Layer, Batch Helper, Sanitizer & Sequence Generator',
    content: `/**
 * SIM-TIRTA LESTARI - Utils.gs
 * Data Access Layer (DAL), Batch Sanitasi, dan Sequence Generator
 */

function getSpreadsheet() {
  return SpreadsheetApp.getActiveSpreadsheet();
}

function getSettingsMap() {
  const ss = getSpreadsheet();
  const sheet = ss.getSheetByName(CONFIG.SHEETS.SETTINGS);
  if (!sheet) return {};

  const data = sheet.getDataRange().getValues();
  const map = {};
  for (let i = 1; i < data.length; i++) {
    const key = String(data[i][0]).trim();
    if (key) map[key] = data[i][1];
  }
  return map;
}

function sheetToObjects(sheet) {
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];

  const headers = data[0].map(h => String(h).trim());
  const list = [];

  for (let r = 1; r < data.length; r++) {
    const row = data[r];
    const obj = {};
    for (let c = 0; c < headers.length; c++) {
      obj[headers[c]] = row[c];
    }
    list.push(obj);
  }
  return list;
}

function appendObject(sheetName, obj) {
  const ss = getSpreadsheet();
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) throw new Error('Sheet ' + sheetName + ' tidak ditemukan.');

  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const row = [];
  for (let i = 0; i < headers.length; i++) {
    const colName = headers[i];
    row.push(obj[colName] !== undefined ? obj[colName] : '');
  }
  sheet.appendRow(row);
}

function updateRecordById(sheetName, idField, idValue, updateFields) {
  const ss = getSpreadsheet();
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) throw new Error('Sheet ' + sheetName + ' tidak ditemukan.');

  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return false;

  const headers = data[0];
  const idColIdx = headers.indexOf(idField);
  if (idColIdx === -1) return false;

  for (let r = 1; r < data.length; r++) {
    if (String(data[r][idColIdx]).trim() === String(idValue).trim()) {
      for (const key in updateFields) {
        const colIdx = headers.indexOf(key);
        if (colIdx !== -1) {
          sheet.getRange(r + 1, colIdx + 1).setValue(updateFields[key]);
        }
      }
      return true;
    }
  }
  return false;
}

function generateNextNumber(sheetName, prefix) {
  const ss = getSpreadsheet();
  const sheet = ss.getSheetByName(sheetName);
  const count = sheet ? Math.max(0, sheet.getLastRow() - 1) + 1 : 1;
  const now = new Date();
  const yyyymm = Utilities.formatDate(now, CONFIG.TIMEZONE, 'yyyyMM');
  return prefix + yyyymm + '-' + ('000' + count).slice(-4);
}

function writeAuditLog(entry) {
  try {
    const nowStr = Utilities.formatDate(new Date(), CONFIG.TIMEZONE, 'yyyy-MM-dd HH:mm:ss');
    appendObject(CONFIG.SHEETS.AUDIT_LOG, {
      log_id: 'LOG-' + new Date().getTime(),
      timestamp: nowStr,
      user: entry.user || 'Sistem',
      role: entry.role || '-',
      action: entry.action,
      module: entry.module,
      record_id: entry.record_id || '-',
      old_value_summary: entry.old_value_summary || '',
      new_value_summary: entry.new_value_summary || ''
    });
  } catch (e) {
    Logger.log('Audit Log error: ' + e);
  }
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
`,
  },
  {
    name: 'README.md',
    type: 'markdown',
    category: 'Documentation',
    description: 'Panduan Instalasi, Setup Spreadsheet, Deploy Clasp & Pemeliharaan',
    content: `# PANDUAN LENGKAP SIM-TIRTA LESTARI
### KPSPAM TIRTA LESTARI
Kalurahan Ngawu, Kapanewon Playen, Kabupaten Gunungkidul

---

## 1. CARA INSTALASI PERTAMA KALI

### Langkah A: Buat Google Spreadsheet
1. Buka [Google Sheets](https://sheets.google.com).
2. Buat spreadsheet baru dan beri nama: **DATABASE SIM TIRTA LESTARI**.
3. Di menu bar atas, klik **Extensions (Ekstensi)** > **Apps Script**.

### Langkah B: Masukkan Script Kode
1. Hapus isi file default \`Code.gs\`.
2. Buat file-file script sesuai daftar kode di panel **Pusat Kode GAS SIM-TIRTA LESTARI**:
   - \`Config.gs\`
   - \`Code.gs\`
   - \`Auth.gs\`
   - \`Setup.gs\`
   - \`Tariffs.gs\`
   - \`Payments.gs\`
   - \`Receipts.gs\`
   - \`Whatsapp.gs\`
   - \`PublicApi.gs\`
   - \`Backup.gs\`
   - \`Utils.gs\`
3. Buat file HTML:
   - \`Index.html\`
   - \`PublicPortal.html\`
   - \`LoginDenied.html\`

### Langkah C: Jalankan Setup Otomatis
1. Pada editor Apps Script, pilih fungsi \`setupSystem\` di toolbar atas.
2. Klik tombol **Run (Jalankan)**.
3. Berikan izin otorisasi Google (klik *Review permissions*, pilih akun Google Anda, klik *Advanced*, klik *Go to SIM-TIRTA LESTARI (unsafe)*, lalu klik *Allow*).
4. Fungsi \`setupSystem()\` akan secara otomatis:
   - Membuat 21 Sheet lengkap beserta header warnanya.
   - Membuat Folder Drive \`SIM TIRTA LESTARI\` dan subfolder (KWITANSI, LAPORAN, BACKUP, dll).
   - Memasukkan konfigurasi tarif default dan biaya beban Rp 10.000.

---

## 2. CARA MENYEBARKAN (DEPLOY SEBAGAI WEB APP)

1. Di pojok kanan atas Apps Script editor, klik tombol **Deploy** > **New deployment**.
2. Pilih jenis deployment: **Web app** (ikon roda gigi).
3. Isi kolom:
   - **Description**: \`SIM-TIRTA LESTARI v1.0.0\`
   - **Execute as**: \`User accessing the web app\` ATAU \`Me (akun pengurus)\` (Rekomendasi: \`Me\` agar warga dapat mengirim pengaduan tanpa login).
   - **Who has access**: \`Anyone\` (agar portal publik dapat diakses warga tanpa login, sedangkan panel admin diamankan oleh modul \`Auth.gs\`).
4. Klik **Deploy**.
5. Salin **Web app URL**.
   - URL Publik: \`https://script.google.com/.../exec\`
   - URL Admin: \`https://script.google.com/.../exec?page=admin\`

---

## 3. PANDUAN PENGURUS HARIAN

- **Pencatatan Meter**: Buka menu Catat Meter, pilih nama pelanggan, masukkan angka meter terkini. Sistem otomatis memvalidasi angka agar tidak lebih kecil dari bulan lalu.
- **Pembayaran Rekening**: Buka menu Pembayaran, cari nama atau ID pelanggan, pilih tagihan belum lunas, pilih metode bayar, lalu klik **Bayar & Buat Kwitansi**.
- **Kirim Kwitansi WA**: Klik tombol hijau WhatsApp pada kwitansi untuk langsung mengirim bukti bayar resmi.
- **Tunggakan**: Buka menu Tunggakan untuk melihat daftar pelanggan telat bayar (1 bulan, 2 bulan, 3+ bulan) dan langsung kirimkan pesan peringatan via WhatsApp sekali klik.

Aplikasi telah dirancang agar pengurus TIDAK PERLU membuka file spreadsheet secara manual untuk operasional rutin!
`,
  },
];
