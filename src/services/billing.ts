// SIM-TIRTA LESTARI Billing & Tariff Engine
// Kalurahan Ngawu, Kapanewon Playen, Kabupaten Gunungkidul

import { TariffTier, Bill, Payment, Receipt, Customer } from '../types';
import { AppStorage } from './storage';
import { AuditLogger } from './audit';

export interface TariffCalculationResult {
  waterCharge: number;
  breakdown: {
    tierName: string;
    usageInTier: number;
    rate: number;
    subtotal: number;
  }[];
  isFirstMonthPromoApplied: boolean;
  freeUsageM3: number;
  billableUsageM3: number;
  discountAmount: number;
}

export class BillingEngine {
  private static paymentLock = false;

  /**
   * Hitung tarif air progresif per blok:
   * Blok 1: 1 - 10 m³
   * Blok 2: 11 - 20 m³
   * Blok 3: 21 - 30 m³
   * Blok 4: > 30 m³
   */
  public static calculateProgressiveTariff(
    rawUsageM3: number,
    tariffs: TariffTier[],
    isFirstMonthCustomer: boolean = false,
    freeLimit: number = 10
  ): TariffCalculationResult {
    let billableUsage = Math.max(0, Math.round(rawUsageM3));
    let isFirstMonthPromoApplied = false;
    let freeUsageM3 = 0;
    let discountAmount = 0;

    // Aturan bulan pertama: gratis maks 10 m3
    if (isFirstMonthCustomer && billableUsage > 0) {
      isFirstMonthPromoApplied = true;
      freeUsageM3 = Math.min(billableUsage, freeLimit);
      billableUsage = Math.max(0, billableUsage - freeUsageM3);
      // Nilai potongan (10 m3 pertama di tarif blok 1)
      discountAmount = freeUsageM3 * (tariffs.find(t => t.minimum_usage === 1)?.rate_per_m3 || 2500);
    }

    const breakdown: TariffCalculationResult['breakdown'] = [];
    let waterCharge = 0;
    let remainingUsage = billableUsage;

    // Urutkan tarif berdasarkan minimum_usage
    const sortedTariffs = [...tariffs]
      .filter(t => t.status === 'ACTIVE')
      .sort((a, b) => a.minimum_usage - b.minimum_usage);

    if (sortedTariffs.length === 0) {
      throw new Error('Tarif aktif belum dikonfigurasi. Hubungi Administrator.');
    }

    for (const tier of sortedTariffs) {
      if (remainingUsage <= 0) break;

      const tierCapacity = tier.maximum_usage === -1 
        ? Infinity 
        : (tier.maximum_usage - tier.minimum_usage + 1);

      const usageInThisTier = Math.min(remainingUsage, tierCapacity);

      if (usageInThisTier > 0) {
        const subtotal = usageInThisTier * tier.rate_per_m3;
        waterCharge += subtotal;
        breakdown.push({
          tierName: tier.name,
          usageInTier: usageInThisTier,
          rate: tier.rate_per_m3,
          subtotal,
        });
        remainingUsage -= usageInThisTier;
      }
    }

    // Jika ada pemakaian sisa yang belum tercakup di tarif
    if (remainingUsage > 0) {
      throw new Error('Tarif untuk rentang pemakaian ini belum dikonfigurasi lengkap. Hubungi Administrator.');
    }

    return {
      waterCharge,
      breakdown,
      isFirstMonthPromoApplied,
      freeUsageM3,
      billableUsageM3: billableUsage,
      discountAmount,
    };
  }

  /**
   * Cek apakah pelanggan memenuhi syarat bulan pertama gratis
   */
  public static isFirstMonthCustomer(customer: Customer, billingPeriod: string): boolean {
    const settings = AppStorage.getSettings();
    if (!settings.FIRST_MONTH_FREE_ENABLED) return false;

    // Format join_date YYYY-MM-DD
    const joinMonth = customer.join_date.substring(0, 7); // e.g. "2026-09"
    return joinMonth === billingPeriod;
  }

  /**
   * Hitung denda keterlambatan (Rp 5.000 / bulan keterlambatan setelah tanggal 28)
   */
  public static calculateLateFee(
    billPeriod: string, // YYYY-MM
    targetDate: Date = new Date(),
    dueDay: number = 28,
    lateFeePerMonth: number = 5000
  ): number {
    const [yearStr, monthStr] = billPeriod.split('-');
    const billYear = parseInt(yearStr, 10);
    const billMonth = parseInt(monthStr, 10); // 1-12

    // Tanggal jatuh tempo tagihan tersebut
    const dueDate = new Date(billYear, billMonth - 1, dueDay, 23, 59, 59);

    if (targetDate <= dueDate) {
      return 0; // Belum lewat batas pembayaran
    }

    // Hitung berapa bulan selisih setelah tanggal jatuh tempo
    const currentYear = targetDate.getFullYear();
    const currentMonth = targetDate.getMonth() + 1;

    let monthsLate = (currentYear - billYear) * 12 + (currentMonth - billMonth);
    // Jika masih di bulan yang sama namun lewat tgl 28
    if (monthsLate === 0 && targetDate > dueDate) {
      monthsLate = 1;
    }

    return Math.max(0, monthsLate * lateFeePerMonth);
  }

  /**
   * Generate Nomor Tagihan Unik: INV-TL-YYYY-MM-XXXX
   */
  public static generateBillNumber(period: string, bills: Bill[]): string {
    const settings = AppStorage.getSettings();
    const prefix = `${settings.BILL_PREFIX}${period}-`;
    const count = bills.filter(b => b.bill_number.startsWith(prefix)).length + 1;
    return `${prefix}${String(count).padStart(4, '0')}`;
  }

  /**
   * Generate Nomor Pembayaran: PAY-TL-YYYYMM-XXXX
   */
  public static generatePaymentNumber(payments: Payment[]): string {
    const settings = AppStorage.getSettings();
    const now = new Date();
    const yyyymm = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
    const prefix = `${settings.PAYMENT_PREFIX}${yyyymm}-`;
    const count = payments.filter(p => p.payment_number.startsWith(prefix)).length + 1;
    return `${prefix}${String(count).padStart(4, '0')}`;
  }

  /**
   * Generate Nomor Kwitansi: KWT-TL-YYYYMM-XXXX
   */
  public static generateReceiptNumber(receipts: Receipt[]): string {
    const settings = AppStorage.getSettings();
    const now = new Date();
    const yyyymm = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
    const prefix = `${settings.RECEIPT_PREFIX}${yyyymm}-`;
    const count = receipts.filter(r => r.receipt_number.startsWith(prefix)).length + 1;
    return `${prefix}${String(count).padStart(4, '0')}`;
  }

  /**
   * Generate Verification Code Kwitansi
   */
  public static generateVerificationCode(): string {
    const rand = Math.floor(10000 + Math.random() * 90000);
    return `TL-VRF-${rand}`;
  }

  /**
   * Proses Pembayaran Tagihan dengan Proteksi Lock Mutex
   */
  public static async processPayment(params: {
    billId: string;
    amountPaid: number;
    paymentMethod: 'Tunai' | 'Transfer Bank' | 'Lainnya';
    officer: string;
    userRole: string;
    notes?: string;
  }): Promise<{ success: boolean; message: string; receipt?: Receipt; payment?: Payment }> {
    // Lock guard to prevent double submit
    if (this.paymentLock) {
      return {
        success: false,
        message: 'Transaksi sedang diproses. Mohon jangan menekan tombol berulang kali.',
      };
    }

    this.paymentLock = true;

    try {
      const bills = AppStorage.getBills();
      const billIndex = bills.findIndex(b => b.bill_id === params.billId);

      if (billIndex === -1) {
        return { success: false, message: 'Tagihan tidak ditemukan dalam database.' };
      }

      const bill = bills[billIndex];

      if (bill.status === 'PAID') {
        return { success: false, message: 'Tagihan ini sudah lunas sebelumnya.' };
      }

      if (params.amountPaid < bill.total_bill) {
        return {
          success: false,
          message: `Nominal pembayaran (Rp ${params.amountPaid.toLocaleString('id-ID')}) kurang dari total tagihan (Rp ${bill.total_bill.toLocaleString('id-ID')}).`,
        };
      }

      const customers = AppStorage.getCustomers();
      const customer = customers.find(c => c.customer_id === bill.customer_id);

      if (!customer) {
        return { success: false, message: 'Data pelanggan terkait tidak ditemukan.' };
      }

      const payments = AppStorage.getPayments();
      const receipts = AppStorage.getReceipts();
      const cashIns = AppStorage.getCashIn();

      const paymentNumber = this.generatePaymentNumber(payments);
      const receiptNumber = this.generateReceiptNumber(receipts);
      const verificationCode = this.generateVerificationCode();
      const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);

      // 1. Simpan Payment
      const newPayment: Payment = {
        payment_id: `PAY-${Date.now()}`,
        payment_number: paymentNumber,
        receipt_number: receiptNumber,
        bill_id: bill.bill_id,
        customer_id: bill.customer_id,
        period: bill.period,
        amount_paid: params.amountPaid,
        payment_method: params.paymentMethod,
        payment_date: nowStr,
        officer: params.officer,
        status: 'SUCCESS',
        verification_code: verificationCode,
        notes: params.notes,
        created_at: nowStr,
      };

      // 2. Update Bill Status
      bills[billIndex] = {
        ...bill,
        status: 'PAID',
        paid_at: nowStr,
      };

      // 3. Simpan Kwitansi
      const newReceipt: Receipt = {
        receipt_id: `RCT-${Date.now()}`,
        receipt_number: receiptNumber,
        payment_id: newPayment.payment_id,
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
        payment_method: params.paymentMethod,
        payment_date: nowStr,
        officer: params.officer,
        verification_code: verificationCode,
        created_at: nowStr,
      };

      // 4. Tambah Kas Masuk Otomatis
      const newCashIn = {
        transaction_id: `CIN-${Date.now()}`,
        date: nowStr,
        category: 'REKENING AIR' as const,
        reference_number: receiptNumber,
        customer_id: bill.customer_id,
        description: `Pembayaran Rekening Air ${customer.customer_name} (${customer.customer_id}) Periode ${bill.period}`,
        amount: params.amountPaid,
        payment_method: (params.paymentMethod === 'Transfer Bank' ? 'Transfer' : 'Tunai') as 'Tunai' | 'Transfer' | 'Lainnya',
        created_by: params.officer,
        created_at: nowStr,
      };

      // Commit to storage
      AppStorage.setBills(bills);
      AppStorage.setPayments([newPayment, ...payments]);
      AppStorage.setReceipts([newReceipt, ...receipts]);
      AppStorage.setCashIn([newCashIn, ...cashIns]);

      // Catat Audit Log
      AuditLogger.log({
        user: params.officer,
        role: params.userRole,
        action: 'PAYMENT',
        module: 'PAYMENT',
        record_id: paymentNumber,
        new_value_summary: `Pembayaran ${customer.customer_name} (${bill.customer_id}) periode ${bill.period} Rp ${params.amountPaid.toLocaleString('id-ID')} lunas. Kwitansi: ${receiptNumber}`,
      });

      return {
        success: true,
        message: 'Pembayaran berhasil diproses dan kwitansi telah dibuat.',
        receipt: newReceipt,
        payment: newPayment,
      };
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Terjadi kesalahan sistem';
      return {
        success: false,
        message: `Gagal memproses pembayaran: ${errorMsg}`,
      };
    } finally {
      this.paymentLock = false;
    }
  }

  /**
   * Pembatalan Transaksi Pembayaran (Void with Reason)
   */
  public static cancelPayment(params: {
    paymentId: string;
    cancelReason: string;
    cancelledBy: string;
    userRole: string;
  }): { success: boolean; message: string } {
    if (!params.cancelReason || params.cancelReason.trim().length < 5) {
      return { success: false, message: 'Alasan pembatalan wajib diisi minimal 5 karakter.' };
    }

    const payments = AppStorage.getPayments();
    const pIdx = payments.findIndex(p => p.payment_id === params.paymentId);

    if (pIdx === -1) {
      return { success: false, message: 'Data pembayaran tidak ditemukan.' };
    }

    const payment = payments[pIdx];
    if (payment.status === 'CANCELLED') {
      return { success: false, message: 'Pembayaran ini sudah pernah dibatalkan.' };
    }

    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);

    // Update payment to CANCELLED
    payments[pIdx] = {
      ...payment,
      status: 'CANCELLED',
      cancelled_at: nowStr,
      cancelled_by: params.cancelledBy,
      cancel_reason: params.cancelReason,
    };

    // Revert bill status back to UNPAID
    const bills = AppStorage.getBills();
    const bIdx = bills.findIndex(b => b.bill_id === payment.bill_id);
    if (bIdx !== -1) {
      bills[bIdx] = {
        ...bills[bIdx],
        status: 'UNPAID',
        paid_at: undefined,
      };
      AppStorage.setBills(bills);
    }

    // Catat Kas Keluar / Koreksi Kas
    const cashOuts = AppStorage.getCashOut();
    cashOuts.unshift({
      transaction_id: `COUT-VOID-${Date.now()}`,
      date: nowStr,
      category: 'ADMINISTRASI',
      description: `KOREKSI PEMBATALAN: Pembayaran ${payment.payment_number} (${payment.customer_id}). Alasan: ${params.cancelReason}`,
      amount: payment.amount_paid,
      recipient: `Koreksi Kas (${params.cancelledBy})`,
      proof_number: payment.receipt_number,
      requested_by: params.cancelledBy,
      approved_by: 'Super Admin',
      created_by: params.cancelledBy,
      created_at: nowStr,
    });

    AppStorage.setPayments(payments);
    AppStorage.setCashOut(cashOuts);

    AuditLogger.log({
      user: params.cancelledBy,
      role: params.userRole,
      action: 'CANCEL PAYMENT',
      module: 'PAYMENT',
      record_id: payment.payment_number,
      old_value_summary: `Pembayaran Lunas Rp ${payment.amount_paid.toLocaleString('id-ID')}`,
      new_value_summary: `DIBATALKAN oleh ${params.cancelledBy}. Alasan: ${params.cancelReason}`,
    });

    return {
      success: true,
      message: `Pembayaran ${payment.payment_number} berhasil dibatalkan. Tagihan dikembalikan ke status BELUM BAYAR.`,
    };
  }
}
