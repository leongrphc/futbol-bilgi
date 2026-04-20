import { createHash } from 'crypto';
import { IAP_PRODUCT_CONFIG, isIapProductId, type IapProductId } from './products';

export type IapPlatform = 'ios' | 'android';
export type IapVerificationStatus = 'verified' | 'rejected' | 'error';

export interface VerifyPurchaseInput {
  platform: IapPlatform;
  productId: IapProductId;
  transactionId?: string;
  receipt?: string;
  purchaseToken?: string;
}

export interface VerifyPurchaseResult {
  isValid: boolean;
  status: IapVerificationStatus;
  productId: IapProductId;
  transactionId: string;
  originalTransactionId: string | null;
  amountCents: number | null;
  currency: string | null;
  purchasedAt: string;
  expiresAt: string | null;
  rawResponse: Record<string, unknown>;
  receiptHash: string | null;
  purchaseTokenHash: string | null;
}

export function isIapPlatform(value: unknown): value is IapPlatform {
  return value === 'ios' || value === 'android';
}

export function hashValue(value: string | undefined) {
  if (!value) return null;
  return createHash('sha256').update(value).digest('hex');
}

export function isMockVerificationEnabled() {
  return process.env.NODE_ENV !== 'production';
}

function buildMockResult(input: VerifyPurchaseInput): VerifyPurchaseResult {
  return {
    isValid: true,
    status: 'verified',
    productId: input.productId,
    transactionId: input.transactionId ?? `${input.platform}-mock-${Date.now()}`,
    originalTransactionId: null,
    amountCents: null,
    currency: null,
    purchasedAt: new Date().toISOString(),
    expiresAt: null,
    rawResponse: {
      provider: 'mock',
      platform: input.platform,
      productId: input.productId,
    },
    receiptHash: hashValue(input.receipt),
    purchaseTokenHash: hashValue(input.purchaseToken),
  };
}

async function verifyIosPurchase(input: VerifyPurchaseInput): Promise<VerifyPurchaseResult> {
  if (!input.receipt) {
    return {
      isValid: false,
      status: 'rejected',
      productId: input.productId,
      transactionId: input.transactionId ?? 'ios-missing-receipt',
      originalTransactionId: null,
      amountCents: null,
      currency: null,
      purchasedAt: new Date().toISOString(),
      expiresAt: null,
      rawResponse: { provider: 'apple', reason: 'missing_receipt' },
      receiptHash: null,
      purchaseTokenHash: null,
    };
  }

  if (isMockVerificationEnabled() && input.receipt.startsWith('mock:')) {
    return buildMockResult(input);
  }

  return {
    isValid: false,
    status: 'error',
    productId: input.productId,
    transactionId: input.transactionId ?? 'ios-unconfigured',
    originalTransactionId: null,
    amountCents: null,
    currency: null,
    purchasedAt: new Date().toISOString(),
    expiresAt: null,
    rawResponse: { provider: 'apple', reason: 'verification_not_configured' },
    receiptHash: hashValue(input.receipt),
    purchaseTokenHash: null,
  };
}

async function verifyAndroidPurchase(input: VerifyPurchaseInput): Promise<VerifyPurchaseResult> {
  if (!input.purchaseToken) {
    return {
      isValid: false,
      status: 'rejected',
      productId: input.productId,
      transactionId: input.transactionId ?? 'android-missing-token',
      originalTransactionId: null,
      amountCents: null,
      currency: null,
      purchasedAt: new Date().toISOString(),
      expiresAt: null,
      rawResponse: { provider: 'google_play', reason: 'missing_purchase_token' },
      receiptHash: null,
      purchaseTokenHash: null,
    };
  }

  if (isMockVerificationEnabled() && input.purchaseToken.startsWith('mock:')) {
    return buildMockResult(input);
  }

  return {
    isValid: false,
    status: 'error',
    productId: input.productId,
    transactionId: input.transactionId ?? 'android-unconfigured',
    originalTransactionId: null,
    amountCents: null,
    currency: null,
    purchasedAt: new Date().toISOString(),
    expiresAt: null,
    rawResponse: { provider: 'google_play', reason: 'verification_not_configured' },
    receiptHash: null,
    purchaseTokenHash: hashValue(input.purchaseToken),
  };
}

export async function verifyPurchase(input: VerifyPurchaseInput): Promise<VerifyPurchaseResult> {
  if (!isIapPlatform(input.platform)) {
    throw new Error('Invalid platform');
  }

  if (!isIapProductId(input.productId) || !(input.productId in IAP_PRODUCT_CONFIG)) {
    throw new Error('Invalid product id');
  }

  if (input.platform === 'ios') {
    return verifyIosPurchase(input);
  }

  return verifyAndroidPurchase(input);
}
