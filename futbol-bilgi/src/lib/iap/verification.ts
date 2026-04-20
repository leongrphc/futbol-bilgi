import { createHash } from 'crypto';
import { isIapProductId, type IapProductId } from './products';
import { getIapProvider } from './providers/factory';
import { getIapConfig } from './config';

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
  return getIapConfig().mock.enabled;
}

export async function verifyPurchase(input: VerifyPurchaseInput): Promise<VerifyPurchaseResult> {
  if (!isIapPlatform(input.platform)) {
    throw new Error('Invalid platform');
  }

  if (!isIapProductId(input.productId)) {
    throw new Error('Invalid product id');
  }

  const provider = getIapProvider(input.platform, input);
  return provider.verify(input);
}
