import crypto from 'crypto';

/**
 * =============================================================================
 *  CAMPUS BASKET — CENTRALIZED ID GENERATION SERVICE
 * =============================================================================
 *
 *  STANDARD FORMAT:  CB-{PREFIX}-{YEAR}-{6-CHAR-HEX}
 *
 *  Examples:
 *    CB-ORD-2026-A1B2C3   →  Campus Basket Order
 *    CB-LAU-2026-D4E5F6   →  Laundry Order
 *    CB-PAY-2026-7890AB   →  Payment Record
 *    CB-REF-2026-CD1234   →  Refund
 *    CB-SET-2026-5678EF   →  Provider Settlement
 *    CB-COD-2026-9ABCDE   →  COD Collection
 *    CB-RCP-2026-F01234   →  Receipt
 *    CB-LED-2026-567890   →  Financial Ledger Entry
 *    CB-TKT-2026-ABCDEF   →  Support Ticket
 *    CB-WDR-2026-123456   →  Delivery Boy Withdrawal
 *    CB-RCN-2026-789ABC   →  Payment Reconciliation Log
 *    CB-WHK-2026-DEF012   →  Razorpay Webhook Log
 *    CB-CAN-2026-345678   →  Cancellation Request
 *    CB-RET-2026-9ABCDE   →  Return Request
 *
 *  Rules:
 *  1. Always prefixed with "CB-"
 *  2. Type code is always 3 uppercase letters
 *  3. Year is the current 4-digit year
 *  4. Suffix is 6 uppercase hex characters (crypto.randomBytes — collision-safe)
 *  5. Never auto-increment sequential counters (no race conditions at scale)
 *  6. Human-readable and copy-friendly
 *
 * =============================================================================
 */

export type IdPrefix =
  | 'ORD'  // Order (food, produce, stationery, essentials)
  | 'LAU'  // Laundry Order
  | 'PAY'  // Payment Record
  | 'REF'  // Refund
  | 'SET'  // Provider Settlement
  | 'COD'  // COD Collection (delivery)
  | 'LCO'  // Laundry COD Collection
  | 'RCP'  // Receipt
  | 'LED'  // Financial Ledger Entry
  | 'TKT'  // Support Ticket
  | 'WDR'  // Delivery Boy Withdrawal
  | 'RCN'  // Payment Reconciliation Log
  | 'WHK'  // Razorpay Webhook Log
  | 'CAN'  // Cancellation Request
  | 'RET'  // Return Request
  | 'CPN'  // Coupon Usage
  | 'ADJ'  // Admin Adjustment / Earnings
  | 'AUD'  // Audit Event;

export class IdGeneratorService {
  /**
   * Generates a unique Campus Basket ID in the standard format:
   *   CB-{PREFIX}-{YEAR}-{6HEX}
   *
   * The 6-character hex suffix provides 16^6 = 16,777,216 combinations
   * per prefix per year — collision-safe for Campus Basket scale.
   */
  static generate(prefix: IdPrefix): string {
    const year = new Date().getFullYear();
    const suffix = crypto.randomBytes(3).toString('hex').toUpperCase();
    return `CB-${prefix}-${year}-${suffix}`;
  }

  /**
   * Batch-generate multiple IDs of the same type.
   * Guaranteed unique within the batch.
   */
  static generateBatch(prefix: IdPrefix, count: number): string[] {
    const ids = new Set<string>();
    while (ids.size < count) {
      ids.add(this.generate(prefix));
    }
    return Array.from(ids);
  }

  /**
   * Validates whether a string matches the CB standard ID format.
   */
  static isValid(id: string): boolean {
    return /^CB-[A-Z]{2,3}-\d{4}-[0-9A-F]{6}$/.test(id);
  }

  /**
   * Extracts the prefix type from a CB standard ID.
   * Returns null if the ID is not in the standard format.
   */
  static extractPrefix(id: string): string | null {
    const match = id.match(/^CB-([A-Z]{2,3})-\d{4}-[0-9A-F]{6}$/);
    return match ? match[1] : null;
  }

  /**
   * Extracts the year from a CB standard ID.
   * Returns null if the ID is not in the standard format.
   */
  static extractYear(id: string): number | null {
    const match = id.match(/^CB-[A-Z]{2,3}-(\d{4})-[0-9A-F]{6}$/);
    return match ? parseInt(match[1]) : null;
  }

  // ─── Convenience Wrappers ────────────────────────────────────────────────

  static orderId(): string       { return this.generate('ORD'); }
  static laundryId(): string     { return this.generate('LAU'); }
  static paymentId(): string     { return this.generate('PAY'); }
  static refundId(): string      { return this.generate('REF'); }
  static settlementId(): string  { return this.generate('SET'); }
  static codId(): string         { return this.generate('COD'); }
  static laundryCodId(): string  { return this.generate('LCO'); }
  static receiptId(): string     { return this.generate('RCP'); }
  static ledgerId(): string      { return this.generate('LED'); }
  static ticketId(): string      { return this.generate('TKT'); }
  static withdrawalId(): string  { return this.generate('WDR'); }
  static reconciliationId(): string { return this.generate('RCN'); }
  static webhookLogId(): string  { return this.generate('WHK'); }
  static cancellationId(): string { return this.generate('CAN'); }
  static returnId(): string      { return this.generate('RET'); }
  static adjustmentId(): string  { return this.generate('ADJ'); }
  static auditId(): string       { return this.generate('AUD'); }
}
