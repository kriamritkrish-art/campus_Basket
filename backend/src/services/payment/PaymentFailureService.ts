/**
 * ============================================================================
 * CAMPUS BASKET — PAYMENT FAILURE REASON & ACCOUNT CLASSIFICATION SERVICE
 * ============================================================================
 *
 * Provides authoritative classification of payment failures across Razorpay
 * responses, ensuring:
 * 1. Dedicated tracking of "BANK/ACCOUNT DETAILS REQUIRED" / "FAILED_ACCOUNT_DETAILS"
 *    WITHOUT misattributing general payment failures.
 * 2. Strict separation between Payment Account failures and Refund Account details.
 * 3. Student-safe humanized error messages (no raw technical jargon).
 * 4. Detection of potential debit / timeout scenarios requiring reconciliation.
 */

export type CanonicalFailureReason =
  | 'N/A'
  | 'INSUFFICIENT FUNDS'
  | 'BANK/ACCOUNT DETAILS REQUIRED'
  | 'PAYMENT DECLINED'
  | 'PAYMENT CANCELLED'
  | 'PAYMENT TIMEOUT'
  | 'RISK/SECURITY DECLINE'
  | 'RAZORPAY ERROR'
  | 'NETWORK/TECHNICAL ERROR'
  | 'UNKNOWN';

export interface FailureClassificationResult {
  canonicalReason: CanonicalFailureReason;
  failureCode: string;
  rawDescription: string;
  isAccountDetailsIssue: boolean;
  potentialDebitReview: boolean;
  studentFriendlyMessage: string;
  nextExpectedState: string;
}

export class PaymentFailureService {
  /**
   * Categorizes any raw Razorpay or gateway failure payload into the canonical
   * Campus Basket failure reason taxonomy.
   */
  public static classifyFailure(params: {
    errorDescription?: string | null;
    errorCode?: string | null;
    errorReason?: string | null;
    errorSource?: string | null;
    errorStep?: string | null;
  }): FailureClassificationResult {
    const desc = (params.errorDescription || '').trim();
    const code = (params.errorCode || '').trim();
    const reason = (params.errorReason || '').trim();
    const source = (params.errorSource || '').trim().toLowerCase();
    const step = (params.errorStep || '').trim().toLowerCase();

    const combinedText = `${desc} ${code} ${reason} ${source} ${step}`.toLowerCase();

    // 1. BANK / ACCOUNT DETAILS REQUIRED (Missing, invalid, unlinked, or rejected account details)
    // Only applied when verified to be related to bank/account/vpa details
    const accountDetailPatterns = [
      'bank_account_not_active',
      'beneficiary_bank_offline',
      'account_validation_failed',
      'vpa_not_found',
      'invalid_vpa',
      'account_details_missing',
      'account_inactive',
      'invalid_account_details',
      'account details required',
      'account details are missing',
      'invalid bank details',
      'invalid upi id',
      'invalid vpa',
      'vpa not registered',
      'bank account not linked',
      'account frozen',
      'no active account'
    ];

    const isAccountDetailsIssue = accountDetailPatterns.some((pattern) =>
      combinedText.includes(pattern)
    );

    if (isAccountDetailsIssue) {
      return {
        canonicalReason: 'BANK/ACCOUNT DETAILS REQUIRED',
        failureCode: code || reason || 'FAILED_ACCOUNT_DETAILS',
        rawDescription: desc || 'Payment account or bank details are missing, invalid, or inactive',
        isAccountDetailsIssue: true,
        potentialDebitReview: false,
        studentFriendlyMessage:
          'Payment could not be completed because the required payment account details are missing or invalid.',
        nextExpectedState: 'FAILED → RETRY PAYMENT (CHECK ACCOUNT DETAILS)'
      };
    }

    // 2. INSUFFICIENT FUNDS
    const insufficientFundsPatterns = [
      'insufficient_funds',
      'insufficient funds',
      'low balance',
      'not enough balance',
      'balance low'
    ];
    if (insufficientFundsPatterns.some((p) => combinedText.includes(p))) {
      return {
        canonicalReason: 'INSUFFICIENT FUNDS',
        failureCode: code || reason || 'INSUFFICIENT_FUNDS',
        rawDescription: desc || 'Account has insufficient funds to complete transaction',
        isAccountDetailsIssue: false,
        potentialDebitReview: false,
        studentFriendlyMessage:
          'Payment could not be completed due to insufficient balance. Please check your account and try again.',
        nextExpectedState: 'FAILED → RETRY PAYMENT'
      };
    }

    // 3. PAYMENT CANCELLED BY USER
    const cancelledPatterns = [
      'payment_cancelled',
      'cancelled by customer',
      'cancelled by user',
      'user cancelled',
      'window closed',
      'dismissed'
    ];
    if (cancelledPatterns.some((p) => combinedText.includes(p))) {
      return {
        canonicalReason: 'PAYMENT CANCELLED',
        failureCode: code || reason || 'PAYMENT_CANCELLED',
        rawDescription: desc || 'Payment cancelled by user',
        isAccountDetailsIssue: false,
        potentialDebitReview: false,
        studentFriendlyMessage: 'Payment was cancelled. You can retry now or switch to Cash on Delivery.',
        nextExpectedState: 'FAILED → RETRY PAYMENT'
      };
    }

    // 4. PAYMENT TIMEOUT (Potential money debit scenario!)
    const timeoutPatterns = [
      'payment_timed_out',
      'gateway_timeout',
      'timed out',
      'timeout',
      'request timed out',
      'bank response timeout'
    ];
    if (timeoutPatterns.some((p) => combinedText.includes(p))) {
      return {
        canonicalReason: 'PAYMENT TIMEOUT',
        failureCode: code || reason || 'PAYMENT_TIMEOUT',
        rawDescription: desc || 'Payment gateway or bank timed out during transaction',
        isAccountDetailsIssue: false,
        potentialDebitReview: true, // IMPORTANT: money might have left student bank!
        studentFriendlyMessage:
          'Your payment is being verified. Please do not make another payment until the current payment status is confirmed.',
        nextExpectedState: 'RECONCILIATION_REQUIRED → RECHECK VIA RAZORPAY'
      };
    }

    // 5. RISK / SECURITY DECLINE
    const riskPatterns = [
      'risk_declined',
      'suspected_fraud',
      'risk check failed',
      'security decline',
      'blocked by risk rules'
    ];
    if (riskPatterns.some((p) => combinedText.includes(p))) {
      return {
        canonicalReason: 'RISK/SECURITY DECLINE',
        failureCode: code || reason || 'RISK_DECLINED',
        rawDescription: desc || 'Transaction flagged by automated bank/gateway security filters',
        isAccountDetailsIssue: false,
        potentialDebitReview: false,
        studentFriendlyMessage:
          'Payment was flagged by the bank security filter. Please use an alternate payment method.',
        nextExpectedState: 'FAILED → USE ALTERNATE METHOD'
      };
    }

    // 6. PAYMENT DECLINED BY BANK
    const declinedPatterns = [
      'payment_declined',
      'declined by bank',
      'issuer decline',
      'transaction declined',
      'do not honor'
    ];
    if (declinedPatterns.some((p) => combinedText.includes(p))) {
      return {
        canonicalReason: 'PAYMENT DECLINED',
        failureCode: code || reason || 'PAYMENT_DECLINED',
        rawDescription: desc || 'Payment declined by issuing bank',
        isAccountDetailsIssue: false,
        potentialDebitReview: false,
        studentFriendlyMessage:
          'Payment was declined by your bank. Please check your bank card/UPI permissions or try another method.',
        nextExpectedState: 'FAILED → RETRY PAYMENT'
      };
    }

    // 7. NETWORK / TECHNICAL ERROR
    const networkPatterns = [
      'network error',
      'connection error',
      'econnreset',
      'etimedout',
      'network failure',
      'disconnected'
    ];
    if (networkPatterns.some((p) => combinedText.includes(p))) {
      return {
        canonicalReason: 'NETWORK/TECHNICAL ERROR',
        failureCode: code || reason || 'NETWORK_ERROR',
        rawDescription: desc || 'Network drop or connectivity error during payment',
        isAccountDetailsIssue: false,
        potentialDebitReview: true,
        studentFriendlyMessage:
          'A network error occurred. If money was deducted, it will be automatically verified or reversed.',
        nextExpectedState: 'RECONCILIATION_REQUIRED → AUTO VERIFY'
      };
    }

    // 8. RAZORPAY GATEWAY ERROR
    const gatewayPatterns = [
      'gateway_error',
      'server_error',
      'razorpay error',
      '500',
      '502',
      '503',
      '504'
    ];
    if (gatewayPatterns.some((p) => combinedText.includes(p))) {
      return {
        canonicalReason: 'RAZORPAY ERROR',
        failureCode: code || reason || 'GATEWAY_ERROR',
        rawDescription: desc || 'Payment gateway internal error',
        isAccountDetailsIssue: false,
        potentialDebitReview: true,
        studentFriendlyMessage:
          'Payment gateway encountered a temporary error. Please wait while we verify transaction status.',
        nextExpectedState: 'RECONCILIATION_REQUIRED → RECHECK VIA RAZORPAY'
      };
    }

    // 9. UNKNOWN / GENERIC FALLBACK
    return {
      canonicalReason: desc || code ? 'UNKNOWN' : 'N/A',
      failureCode: code || reason || 'UNKNOWN_ERROR',
      rawDescription: desc || (code ? `Error code: ${code}` : 'Transaction unsuccessful'),
      isAccountDetailsIssue: false,
      potentialDebitReview: false,
      studentFriendlyMessage: 'Payment could not be completed. Please check your payment details and try again.',
      nextExpectedState: 'FAILED → RETRY PAYMENT'
    };
  }
}
