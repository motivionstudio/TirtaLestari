// SIM-TIRTA LESTARI WhatsApp Service
// Kalurahan Ngawu, Kapanewon Playen, Kabupaten Gunungkidul

import { AppStorage } from './storage';

export class WhatsAppService {
  /**
   * Normalisasi nomor HP/WhatsApp ke format internasional Indonesia 628xxxx
   * Contoh:
   * 081234567890 -> 6281234567890
   * 6281234567890 -> 6281234567890
   * +62 812-3456-7890 -> 6281234567890
   * 81234567890 -> 6281234567890
   */
  public static normalizePhoneNumber(phone: string): string {
    if (!phone) return '';

    // Buang semua karakter non-angka
    let cleaned = phone.replace(/\D/g, '');

    // Awalan 08xxx -> ubah 0 jadi 62
    if (cleaned.startsWith('0')) {
      cleaned = '62' + cleaned.substring(1);
    } else if (cleaned.startsWith('8')) {
      cleaned = '62' + cleaned;
    }

    return cleaned;
  }

  /**
   * Format mata uang Rupiah
   */
  public static formatRupiah(amount: number): string {
    return 'Rp ' + Number(amount || 0).toLocaleString('id-ID');
  }

  /**
   * Buat URL Click-to-Chat WhatsApp
   */
  public static generateWhatsAppUrl(phone: string, message: string): string {
    const normalized = this.normalizePhoneNumber(phone);
    const encoded = encodeURIComponent(message);
    return `https://wa.me/${normalized}?text=${encoded}`;
  }

  /**
   * Template A: Pengingat Tagihan Rutin
   */
  public static getReminderMessage(params: {
    customerName: string;
    customerId: string;
    period: string;
    usageM3: number;
    totalAmount: number;
    dueDay?: number;
  }): string {
    const settings = AppStorage.getSettings();
    let template = settings.WA_TEMPLATE_REMINDER;

    const replacements: Record<string, string> = {
      '{{nama}}': params.customerName,
      '{{customer_id}}': params.customerId,
      '{{periode}}': params.period,
      '{{pemakaian}}': String(params.usageM3),
      '{{total}}': this.formatRupiah(params.totalAmount),
      '{{due_day}}': String(params.dueDay || settings.PAYMENT_DUE_DAY),
    };

    for (const [key, val] of Object.entries(replacements)) {
      template = template.replaceAll(key, val);
    }

    return template;
  }

  /**
   * Template B: Pemberitahuan Tunggakan
   */
  public static getArrearsMessage(params: {
    customerName: string;
    customerId: string;
    monthCount: number;
    principalAmount: number;
    lateFee: number;
    totalAmount: number;
  }): string {
    const settings = AppStorage.getSettings();
    let template = settings.WA_TEMPLATE_ARREARS;

    const replacements: Record<string, string> = {
      '{{nama}}': params.customerName,
      '{{customer_id}}': params.customerId,
      '{{jumlah_bulan}}': String(params.monthCount),
      '{{pokok}}': this.formatRupiah(params.principalAmount),
      '{{denda}}': this.formatRupiah(params.lateFee),
      '{{total}}': this.formatRupiah(params.totalAmount),
    };

    for (const [key, val] of Object.entries(replacements)) {
      template = template.replaceAll(key, val);
    }

    return template;
  }

  /**
   * Template C: Konfirmasi Pembayaran Berhasil & Kwitansi
   */
  public static getPaymentSuccessMessage(params: {
    customerName: string;
    period: string;
    amountPaid: number;
    receiptNumber: string;
    paymentMethod: string;
    paymentDate: string;
    officer: string;
    verificationCode: string;
  }): string {
    const settings = AppStorage.getSettings();
    let template = settings.WA_TEMPLATE_PAYMENT;

    const replacements: Record<string, string> = {
      '{{nama}}': params.customerName,
      '{{periode}}': params.period,
      '{{jumlah_bayar}}': this.formatRupiah(params.amountPaid),
      '{{nomor_kwitansi}}': params.receiptNumber,
      '{{metode_bayar}}': params.paymentMethod,
      '{{tanggal_bayar}}': params.paymentDate,
      '{{petugas}}': params.officer,
      '{{kode_verifikasi}}': params.verificationCode,
    };

    for (const [key, val] of Object.entries(replacements)) {
      template = template.replaceAll(key, val);
    }

    return template;
  }

  /**
   * Template D: Update Status Pengaduan
   */
  public static getComplaintUpdateMessage(params: {
    customerName: string;
    ticketNumber: string;
    status: string;
    category: string;
    officer: string;
    note: string;
  }): string {
    const settings = AppStorage.getSettings();
    let template = settings.WA_TEMPLATE_COMPLAINT;

    const replacements: Record<string, string> = {
      '{{nama}}': params.customerName,
      '{{ticket_number}}': params.ticketNumber,
      '{{status}}': params.status,
      '{{kategori}}': params.category,
      '{{petugas}}': params.officer || 'Petugas Lapangan',
      '{{catatan}}': params.note || 'Tidak ada catatan tambahan.',
    };

    for (const [key, val] of Object.entries(replacements)) {
      template = template.replaceAll(key, val);
    }

    return template;
  }
}
